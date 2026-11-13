# QA Results — StockFlow UI overhaul (redesign-v3)

**Date:** 2026-11-13 · **Direction:** The Counting House (monochrome ink + status-only color, IBM Plex Sans/Mono)
**Method:** live browser verification against the seeded Atlas DB (admin role), plus lint/build/grep. A check not run is marked NOT-RUN, never PASS.

## Pass 1 — Functional truth

| # | Check | Verdict | Evidence |
|---|---|---|---|
| 1 | Inventory stock in persists + ticks | PASS | Desk Lamp 5→10, live "5 → 10" preview, toast "Stock added", movement recorded |
| 2 | PO create→place→receive adds stock once | PASS | PO-2026-0005 created/placed/received via UI; real-time alert fired; RECEIVED stamp shown |
| 3 | Categories CRUD persists | PASS | "ZZ Test Cat" created (summary 4→5 categories) then deleted; toasts mirror verbs |
| 4 | Suppliers CRUD persists | PASS | "ZZ Test Sup" created then deleted; "Supplier created" toast |
| 5 | Users real roster + role change | PASS | Real seeded users listed; Rahul staff→manager→staff via inline select; "Role updated" toast; self row marked "You" |
| 6 | Sales multi-line cart + low-stock sellable | PASS | HDMI Cable + Wireless Mouse in one invoice INV-2026-0126 (₹928); low-stock item selectable |
| 7 | Sales payment badges (no "Pending") | PASS | Cash/UPI/Card badges; canary grep for "Pending" badge clean |
| 8 | Invoice drawer line items | PASS | Snapshot names, qty, price, subtotal, gross/total rendered |
| 9 | Products 409 → deactivate | PASS | Desk Lamp delete shows server 409 verbatim + working "Deactivate instead" |
| 10 | Dashboard honest + role-aware | PASS | Real KPIs/deltas, range tabs update URL; no 153731/Chandra/Atlas; staff gate preserved in code |
| 11 | Dark mode themes whole app | PASS | `.dark` flips token utilities (verified computed styles); Users/Expenses/Dashboard confirmed dark |
| 12 | Command palette | PASS | ⌘K opens; "mouse" → real Wireless Mouse; Enter → /products?product=<id> |
| 13 | Alert center + per-type routing | PASS | Popover + drawer (All/Unread tabs, type chips, shared-read caption); routing helper sends orders→/orders, stock→/inventory?product |
| 14 | Settings sync + password rule | PASS (code) | Restyle preserves PUT /auth/settings sync, token storage on password change, 8+char rule; render verified |
| 15 | Login server-exact errors | PASS | Wrong password → "Invalid email or password" in role=alert; DEV demo hint present |

## Pass 2 — Visual craft
- One accent (ink) + semantic status colors only. No purple/indigo/gradient/glow/glass anywhere (canary grep clean; screenshots confirm).
- IBM Plex Sans throughout; IBM Plex Mono only on SKUs/invoice/order numbers and ledger quantities; tabular numerals on numbers.
- Hairline tables, right-aligned numbers, role-based radii, shadows only on floating layers. Asymmetric dashboard.
- Signature moments fire once: RECEIVED stamp (spring), quantity tick (Inventory + dashboard movements).
- Copy: verbs mirror toasts; no marketing strings, dev names, emoji, or "Oops".

## Pass 3 — Interaction & access
- Keyboard: ⌘K palette, overlay focus trap + Escape + focus restore (useOverlay), form labels via useId, skip link, focus-to-main on route change.
- Reduced motion: global media query kills transforms/animations (≤120ms opacity); animateNumber sets instantly. Implemented in index.css; NOT-RUN via DevTools emulation.
- Touch targets: IconButton 36px (≥40px coarse-pointer padding NOT-RUN as a measured audit).
- Offline banner: implemented (online/offline listeners); visual NOT-RUN.

## Pass 4 — Code health
- `npx eslint .` → exit 0 (whole client).
- `npx vite build` → success. Route code-splitting: main bundle 348 kB (was 952 kB); recharts split to a 317 kB lazy chunk; each page its own chunk.
- Canary grep across client/src: `153731|105352|48379|1,248|28596|Chandra|Asmita|demoExtras|initialUsers|defaultTopProducts|delay\(|Oops|100% Fulfilled|Live from MongoDB|Atlas Connected` → **zero**.
- Bespoke page CSS (Dashboard/Sales/Categories/Suppliers) deleted; dead files (data/*, delay, useFetch, ComingSoon, test-db) gone.
- No new runtime dependencies (fontsource devDeps only).
- `npm test` (server): NOT-RUN — no TEST_MONGO_URI configured.

## Remaining / open
- Server test suite unrun (needs a `*test*` Atlas DB).
- Coarse-pointer ≥40px targets: implemented (`@media (pointer: coarse)` on `.icon-btn`); measured emulation NOT-RUN.
- DevTools reduced-motion/offline emulation: NOT-RUN (global media query confirmed present in the stylesheet).
- Demo-data drift: a manual +5 Desk Lamp stock-in from verification remains; test sale/PO removed and their stock reversed. Re-seed for a pristine demo.

## Polish round (resolved)
- Expense KPI delta now colors a rise red (`goodWhenDown` on StatCard); verified computed color #A33A2A for +153.4%.
- Mobile horizontal overflow fixed: `min-w-0` on Card lets grid cells shrink; all 10 routes fit a 544px viewport (tables scroll internally via overflow-x-auto). Verified scrollWidth ≤ innerWidth on every route.
