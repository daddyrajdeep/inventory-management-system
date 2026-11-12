# API Routes

Base URL (local): `http://localhost:5000/api`

All errors return JSON: `{ "message": "what went wrong" }`.
Protected routes need the header `Authorization: Bearer <token>` (the token comes from login).

## Status: built

| Method | Route | Who | Body | Returns |
|---|---|---|---|---|
| GET | `/health` | anyone | | `{ status: "ok" }` |
| POST | `/auth/login` | anyone | `{ email, password }` | `{ token, user }` |
| GET | `/auth/me` | any logged-in user | | `{ user }` |
| PUT | `/auth/profile` | any logged-in user | `{ name, email }` | `{ user }` |
| PUT | `/auth/password` | any logged-in user | `{ currentPassword, newPassword }` | `{ message }` |
| GET | `/users` | admin | | `[user]` |
| POST | `/users` | admin | `{ name, email, password, role }` | `user` (201) |
| PATCH | `/users/:id/role` | admin | `{ role }` | `user` |
| PATCH | `/users/:id/active` | admin | `{ isActive }` | `user` |
| GET | `/alerts?unread=true&limit=20` | any logged-in user | | `[alert]` newest first (limit 1 to 100, default 20) |
| GET | `/alerts/unread-count` | any logged-in user | | `{ count }` |
| PATCH | `/alerts/read-all` | any logged-in user | | `{ updated }` |
| PATCH | `/alerts/:id/read` | any logged-in user | | `alert` |

`user` = `{ id, name, email, role, isActive, settings }` (never includes the password).
`alert` = `{ id, type, message, isRead, createdAt, product: { id, name, sku, quantity, reorderLevel } | null }`.
Alert types: `LOW_STOCK`, `OUT_OF_STOCK`, `ORDER_RECEIVED`. Alerts are created automatically by the stock helper and are shared: marking one as read marks it for everyone.
Roles: `admin`, `manager`, `staff`.

Status codes: 200 ok, 201 created, 400 bad input, 401 not logged in or bad token,
403 not allowed for your role, 404 not found, 409 already exists, 429 too many login attempts.

## Status: planned (the owner fills in the row when the module is built)

| Module | Owner | Routes | Who can use |
|---|---|---|---|
| Categories | Soham | `GET/POST /categories`, `PUT/DELETE /categories/:id` | read: all, write: admin, manager |
| Suppliers | Soham | `GET/POST /suppliers`, `PUT/DELETE /suppliers/:id` | read: all, write: admin, manager |
| Products | Rudra | `GET/POST /products`, `GET/PUT/DELETE /products/:id` | read: all, write: admin, manager |
| Purchase orders | Shilpa | `GET/POST /purchase-orders`, `GET /purchase-orders/:id`, `PATCH /purchase-orders/:id/cancel`, `PATCH /purchase-orders/:id/receive` | admin, manager |
| Stock | Brijesh | `POST /stock/in`, `POST /stock/out`, `POST /stock/adjust`, `GET /stock/movements` | all roles |
| Sales | Asmita | `GET/POST /sales`, `GET /sales/:id` | all roles |
| Expenses | Asmita | `GET/POST /expenses`, `DELETE /expenses/:id` | admin, manager |
| Reports | Chandra | `GET /reports/summary`, `/reports/top-products`, `/reports/sales-by-day`, `/reports/expense-by-category` | admin, manager |

Every response uses `id` (not `_id`). Lists are returned as plain arrays.
