# Memory — rolling handoff

Updated: 2026-11-12

## State
- Audit reports (Telo3/XENO, 2026-11-12) fully worked through: all P0, most P1, part of P2, plus report 08 docs.
- All 10 pages call the real API; no fabricated numbers remain (grep canaries clean).
- Real-time alerts via Socket.IO (`server/src/socket.js`): JWT + isActive + tokenVersion handshake, emits only after transaction commit; alerts auto-resolve on restock.
- Password change bumps `User.tokenVersion` and returns a fresh token; old tokens 401.
- Settings sync: `PUT /auth/settings`; PreferencesProvider sits inside AuthProvider (main.jsx).
- Passwords: 8+ chars, letter + number (server `utils/passwordRule.js`, client `utils/password.js`). Existing shorter passwords still log in.
- Seed writes opening-stock + per-sale movements and deducts stock; refuses production without `--force`. Syntax-checked, NOT executed (DB already has products).
- CSV exports use `utils/csv.js` (formula neutralization).
- Docs current: `docs/API.md` (all routes + socket events), README, `project-context/tasks.md`.

## Verification done
- Client: eslint clean, vite build passes; browser-tested every page as admin and staff.
- Live write tests (all cleaned up afterwards): PO create/place/double-receive, stock in/out/adjust, category/supplier/user CRUD, 409 guards, alert raise/auto-resolve, settings round-trip across re-login, token invalidation.
- Server `npm test` NOT run: no `TEST_MONGO_URI` in server/.env (needs Atlas DB with "test" in the name).

## Decisions
- Staff dashboard: no /reports calls; inventory + recent sales only, with a note. Reports stay admin/manager.
- Users page: no delete (server has none) — activate/deactivate instead; role-only edit.
- Socket transport: emit-after-commit (not change streams).
- `enhance ui/` report folder is OFF LIMITS until the user says otherwise; UI consolidation (UI-01) deliberately deferred to that phase.

## Blockers / gaps
- Server test suite unrun (see above). Add tests for /users, /auth/*, settings.
- UI design consolidation (4 visual styles) pending the enhance-ui phase.
- Vestigial `Product.rating`/`image`; no barcode input; no audit-log page; Inter font not loaded; reduced-motion missing in Sales/Suppliers CSS.
- Nothing committed yet (large working tree; 9 dead-file deletions staged).
- PO counter advanced to 0005 by tests (0003/0004 deleted).

## Next step
Awaiting the user's instructions for the `enhance ui` folder (reports at `C:\Users\reshm\Downloads\report\reports_extracted\reports\enhance ui\`).
