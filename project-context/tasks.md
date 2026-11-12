# Module status

Single place to track what is built, wired and tested. Update a row when you finish work.
(Owners also appear as `// OWNER:` comments in the code.)

| Module | Backend | Frontend wired | Tests | Notes |
|---|---|---|---|---|
| Auth | done | done | login only | password change invalidates old tokens; settings sync via `PUT /auth/settings` |
| Users | done | done | none yet | admin-only; role change + activate/deactivate (no delete) |
| Categories | done | done | done | CSV import creates rows one by one |
| Suppliers | done | done | done | `isActive` toggle; delete blocked while in use |
| Products | done | done | done | deactivate + "show inactive" filter; delete is admin-only |
| Stock | done | done | done + `npm run check:stock` | one transactional write path (`stockService.js`) |
| Purchase Orders | done | done | done | receive is atomic; double-receive returns 400 |
| Sales | done | done | done | payment method shown (no paid/pending concept) |
| Expenses | done | done | done | date editable; no payment status |
| Reports | done | done | done | admin/manager only; staff see a reduced dashboard |
| Alerts | done | done (real-time) | done | Socket.IO push after commit; auto-resolve on restock |
| Audit log | done | no UI page | done | admin-only API; user/login actions audited |

## Known remaining work

- Run `npm test` against a throwaway Atlas DB (`TEST_MONGO_URI`, name must contain "test") — transactions need a replica set.
- Add tests for `/users`, `/auth/profile`, `/auth/password`, `/auth/settings`.
- UI design consolidation: four visual styles across pages (see audit report 06); migrate onto the shared components.
- Audit log has no frontend page yet.
- `Product.rating` / `Product.image` are vestigial schema fields; barcode has no form input.
- Deployment (Vercel client + Render server); `trust proxy` is already set for Render.
