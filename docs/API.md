# API Routes

Base URL (local): `http://localhost:5000/api`

All errors return JSON: `{ "message": "what went wrong" }` (validation errors also include `errors: [{ field, message }]`).
Protected routes need the header `Authorization: Bearer <token>` (the token comes from login).
Every response uses `id` (not `_id`). Lists are returned as plain arrays.
Roles: `admin`, `manager`, `staff`.

Status codes: 200 ok, 201 created, 400 bad input, 401 not logged in or bad token,
403 not allowed for your role, 404 not found, 409 already exists / in use, 429 too many login attempts.

## Auth and users

| Method | Route | Who | Body | Returns |
|---|---|---|---|---|
| GET | `/health` | anyone | | `{ status: "ok", time }` |
| POST | `/auth/login` | anyone (rate limited: 20 / 15 min / IP) | `{ email, password }` | `{ token, user }` |
| GET | `/auth/me` | any logged-in user | | `{ user }` |
| PUT | `/auth/profile` | any logged-in user | `{ name, email }` | `{ user }` |
| PUT | `/auth/settings` | any logged-in user | `{ notifications?, darkMode?, language? }` (`en`/`hi`/`bn`) | `{ settings }` |
| PUT | `/auth/password` | any logged-in user | `{ currentPassword, newPassword }` | `{ message, token }` — old tokens stop working; use the new token |
| GET | `/users` | admin | | `[user]` |
| POST | `/users` | admin | `{ name, email, password, role }` | `user` (201) |
| PATCH | `/users/:id/role` | admin | `{ role }` | `user` (cannot change your own) |
| PATCH | `/users/:id/active` | admin | `{ isActive }` | `user` (cannot deactivate yourself) |

Passwords: at least 8 characters with a letter and a number.
`user` = `{ id, name, email, role, isActive, settings, createdAt }` (never includes the password).

## Catalogue

| Method | Route | Who | Notes |
|---|---|---|---|
| GET | `/categories` | all roles | each row includes `productCount` (active products only) |
| POST | `/categories` | admin, manager | `{ name, description? }`; duplicate name (any case) → 409 |
| PUT | `/categories/:id` | admin, manager | `{ name, description? }` |
| DELETE | `/categories/:id` | admin, manager | 409 while products use it |
| GET | `/suppliers?search=&active=true` | all roles | inactive suppliers are included unless `active=true` |
| GET | `/suppliers/:id` | all roles | |
| POST | `/suppliers` | admin, manager | `{ name, contactPerson?, email?, phone?, address?, isActive? }` |
| PUT | `/suppliers/:id` | admin, manager | same fields, all optional |
| DELETE | `/suppliers/:id` | admin, manager | 409 while products/POs use it — deactivate instead |
| GET | `/products?search=&category=&supplier=&status=&includeInactive=true` | all roles | `status`: `low` / `out` / `ok`; `search` matches name, SKU, barcode |
| GET | `/products/:id` | all roles | |
| POST | `/products` | admin, manager | `{ name, sku, price, costPrice?, reorderLevel?, category?, supplier?, isActive? }`; category/supplier accept an id or a name (names auto-create) |
| PUT | `/products/:id` | admin, manager | same fields; `quantity` cannot be set here — use the stock routes |
| DELETE | `/products/:id` | admin | 409 when the product has stock/sales/PO history — set `isActive: false` instead |

`product` includes `stockStatus` (`ok` / `low` / `out`), `categoryId`, `supplierId`.

## Stock

| Method | Route | Who | Body / query |
|---|---|---|---|
| GET | `/stock` | all roles | current quantities of active products |
| GET | `/stock/movements?product=&type=` | all roles | newest first; `type`: `IN` / `OUT` / `ADJUST` |
| POST | `/stock/in` | all roles | `{ product, quantity, reason? }` |
| POST | `/stock/out` | all roles | `{ product, quantity, reason? }` — never goes below zero |
| POST | `/stock/adjust` | admin, manager | `{ product, newQty, reason }` — sets the exact count |

All stock changes go through one transactional service (`server/src/services/stockService.js`):
quantity + movement history + threshold alerts commit together or not at all.
Crossing the reorder level creates a `LOW_STOCK` alert; hitting zero creates `OUT_OF_STOCK`;
restocking above the level marks those alerts read.

## Purchase orders (admin, manager)

| Method | Route | Body / query |
|---|---|---|
| GET | `/purchase-orders?status=` | `draft` / `ordered` / `received` / `cancelled` |
| GET | `/purchase-orders/:id` | |
| POST | `/purchase-orders` | `{ supplier, items: [{ product, quantity, unitCost }], expectedDate?, notes?, status? }` — inactive suppliers/products are rejected |
| PATCH | `/purchase-orders/:id/status` | `{ status: 'ordered' \| 'cancelled' }` (draft → ordered/cancelled, ordered → cancelled) |
| PATCH or POST | `/purchase-orders/:id/receive` | adds every item to stock in one transaction; a second receive fails with 400 |
| PATCH | `/purchase-orders/:id/cancel` | shorthand for status → cancelled |

Order numbers come from an atomic counter: `PO-YYYY-NNNN`.

## Sales (all roles)

| Method | Route | Body / query |
|---|---|---|
| GET | `/sales?from=&to=&search=&paymentMethod=&limit=` | dates `YYYY-MM-DD`; search matches invoice number and customer |
| GET | `/sales/:id` | full line items (name and price snapshots) |
| POST | `/sales` | `{ items: [{ product, quantity }], discount?, customerName?, paymentMethod? }` — prices always come from the database; all-or-nothing stock deduction |

`sale` includes `invoiceNumber` (`INV-YYYY-NNNN`), `totalAmount`, `itemCount`, `lineCount`, `paymentMethod` (`cash` / `upi` / `card`). There is no paid/pending status.

## Expenses (admin, manager)

| Method | Route | Body / query |
|---|---|---|
| GET | `/expenses?from=&to=&category=&search=` | `search` matches the title |
| POST | `/expenses` | `{ title, category, amount, date?, note? }` |
| PUT | `/expenses/:id` | same fields, all optional |
| DELETE | `/expenses/:id` | |

## Reports (admin, manager)

| Method | Route | Query |
|---|---|---|
| GET | `/reports/summary` | `days=30` or `from=&to=` — totals plus % change vs the previous period |
| GET | `/reports/top-products` | `limit=1..50`, `sortBy=revenue\|quantity`, date range |
| GET | `/reports/sales-by-day` | `days` or `from=&to=` — zero-filled day series |
| GET | `/reports/expense-by-category` | date range |

## Alerts (all roles)

| Method | Route | Returns |
|---|---|---|
| GET | `/alerts?unread=true&limit=20` | `[alert]` newest first (limit 1–100) |
| GET | `/alerts/unread-count` | `{ count }` |
| PATCH | `/alerts/read-all` | `{ updated }` |
| PATCH | `/alerts/:id/read` | `alert` |

`alert` = `{ id, type, message, isRead, createdAt, product: { id, name, sku, quantity, reorderLevel } | null }`.
Types: `LOW_STOCK`, `OUT_OF_STOCK`, `ORDER_RECEIVED`. Alerts are shared: marking one read marks it for everyone.

### Real-time (Socket.IO)

Connect to the server root (not `/api`) with `auth: { token }` — the same JWT as the REST API.
Inactive users and stale tokens are refused. Events pushed to every connected client:

| Event | Payload |
|---|---|
| `alert:new` | `{ alerts: [alert], count }` — after the transaction commits |
| `alert:read` | `{ ids: [id] \| null, count }` — `null` means all were marked read |

## Audit log (admin)

| Method | Route | Query |
|---|---|---|
| GET | `/audit-logs?entity=&entityId=&limit=` | who did what, newest first |

Audited: product/category/supplier/stock/sale/PO/expense changes, user create/role/active changes, logins and password changes.
