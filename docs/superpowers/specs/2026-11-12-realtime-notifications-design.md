# Real-time notifications (Socket.IO) — design

**Date:** 2026-11-12 · **Status:** approved

## Goal
The alert bell updates instantly in every open tab when an alert is created or read, replacing 30-second polling.

## Server
- `server/src/socket.js` attaches Socket.IO to the HTTP server created in `server.js`.
  - Handshake: `auth.token` is verified as a JWT and the user is reloaded; inactive users are rejected (same rule as `protect`).
  - Each socket joins room `alerts` (alerts are shared by all users) and `user:<id>`.
  - A socket is disconnected when its JWT expires, and when an admin deactivates the user.
  - Emitters are no-ops when Socket.IO is not attached (tests, CLI scripts).
- Origin rule shared with Express via `server/src/config/cors.js` (behavior unchanged).
- Alerts are emitted **after commit only**: `runInTransaction` collects alerts created on the session and emits once the transaction commits. The list is reset on each retry, and a rolled-back transaction emits nothing.
- `alertController` emits after mark-read / mark-all-read.

## Events (server → client)
| Event | Payload |
|---|---|
| `alert:new` | `{ alerts: Alert[], count }` — same shape as `GET /api/alerts` |
| `alert:read` | `{ ids: string[] \| null, count }` — `null` means all |

## Client
- `client/src/services/socket.js` derives the socket URL from `VITE_API_URL` (strips `/api`).
- `AlertBell` connects when a user is logged in and notifications are on, and disconnects on logout or when notifications are turned off. It refetches the count on each (re)connect, shows a toast for each new alert, and merges alerts into the open list.
- ORDER_RECEIVED alerts open `/orders` (admin/manager); others open `/inventory`.

## Out of scope
- Auto-resolving alerts on restock (BUG-15, first half).
- Alerts created by separate processes (`seed`, `demo:alerts`) are not pushed; they appear on the next reconnect or when the bell is opened.
- Wiring Inventory/Purchase Orders to the real API (INT-01/02) — until then those pages produce no real alerts.

## Testing
Run the server and client, log in on two tabs, then trigger a threshold crossing via `POST /api/stock/out`. Both bells update without a refresh; marking an alert read in one tab updates the other. `npm run lint` (client) passes for touched files.
