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

`user` = `{ id, name, email, role, isActive, settings }` (never includes the password).
Roles: `admin`, `manager`, `staff`.

Status codes: 200 ok, 201 created, 400 bad input, 401 not logged in or bad token,
403 not allowed for your role, 404 not found, 409 already exists, 429 too many login attempts.

## Status: planned (fill in when each module is built)

| Module | Routes | Who can use |
|---|---|---|
| Categories | `GET/POST /categories`, `PUT/DELETE /categories/:id` | read: all, write: admin, manager |
| Suppliers | `GET/POST /suppliers`, `PUT/DELETE /suppliers/:id` | read: all, write: admin, manager |
| Products | `GET/POST /products`, `GET/PUT/DELETE /products/:id` | read: all, write: admin, manager |
| Stock | `POST /stock/in`, `POST /stock/out`, `POST /stock/adjust`, `GET /stock/movements` | all roles |
| Purchase orders | `GET/POST /purchase-orders`, `PATCH /purchase-orders/:id/receive` | admin, manager |
| Sales | `GET/POST /sales`, `GET /sales/:id` | all roles |
| Expenses | `GET/POST /expenses`, `DELETE /expenses/:id` | admin, manager |
| Reports | `GET /reports/summary`, `/reports/top-products`, `/reports/sales-by-day` | admin, manager |
| Alerts | `GET /alerts`, `PATCH /alerts/:id/read` | all roles |
