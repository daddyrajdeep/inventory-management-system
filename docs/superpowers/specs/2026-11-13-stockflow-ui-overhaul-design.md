# StockFlow UI Overhaul — Rebased Design Spec (v2)

**Date:** 2026-11-13 · **Branch:** `redesign-v3` · **Status:** approved direction, pending spec review
**Supersedes:** the external `enhance ui/` pack (16 phases), which was written against the pre-remediation codebase.

## 1. Why this exists

The external pack's *concept* (a stock ledger, not a SaaS marketing site) is sound, but ~40% of its work is already shipped on `main`, several of its pre-locked decisions contradict shipped behavior, and two of its technical choices are outdated. This spec keeps the ledger discipline, replaces the palette/type with deliberate non-default choices, drops completed work, and resolves every conflict in favor of what is actually in the code.

## 2. Design direction — "The Counting House"

Derived from what the product is: a shop's stock ledger, used all day. Every visual choice traces to physical stock + money + movements, never to a trend.

**Anti-slop mandate (hard rule).** None of the documented AI-default choices may appear: no Inter/Roboto/Geist/Space Grotesk/Plus Jakarta/DM Sans/Manrope/Outfit/Fraunces; no purple/indigo, no emerald/teal brand accent, no cream+terracotta, no acid-green, no neon-on-black; no gradients, glow blobs, glassmorphism, dot grids; no centered-hero + three-identical-cards; no `rounded-2xl`+`shadow-lg`+`backdrop-blur` stack; no fade-up-on-everything; no "Elevate/Supercharge" copy; no emoji icons; no fake stats.

**Palette: monochrome ink + status-only color.** Brand chrome is ink on warm paper. Color is reserved strictly for stock/order status.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--paper` | `#F6F4EE` | `#14130F` | app background |
| `--surface` | `#FFFDF8` | `#1D1B16` | cards, tables, inputs |
| `--ink` | `#1C1B18` | `#ECE9E1` | primary text; primary buttons (bg) |
| `--ink-soft` | `#5C584E` | `#A6A196` | secondary text (≥4.5:1 on surface) |
| `--line` | `#E4E1D8` | `#2C2921` | hairlines, borders |
| `--on-ink` | `#F6F4EE` | `#14130F` | text on ink buttons |
| `--ok` / `--ok-soft` | `#2F6B3A` / `#E7F0E4` | `#8FC79A` / `#1B2A1B` | in stock / received |
| `--low` / `--low-soft` | `#8A5A12` / `#F6ECD8` | `#D9B36A` / `#2A2213` | low stock / draft / overdue |
| `--out` / `--out-soft` | `#A33A2A` / `#F6E4DF` | `#E0917F` / `#2C1A15` | out of stock / destructive / cancelled |
| `--info` / `--info-soft` | `#33566B` / `#E4ECF1` | `#9DBBD0` / `#16222B` | ordered / in-transit |
| `--focus` | `#1C1B18` | `#ECE9E1` | 2px ring, 2px offset |

Primary button = ink bg / on-ink text. Links and active nav = ink with a 2px left bar or underline (no color). Focus ring = ink. Shadows only on floating layers (modal/drawer/popover/toast): `0 1px 2px rgba(20,19,15,.06), 0 12px 32px -12px rgba(20,19,15,.18)` (dark: stronger black). Radius by role: `8px` buttons/inputs, `10px` cards/tables, `14px` overlays, `999px` badges.

**Typography.** IBM Plex Sans (400/500/600/700) for all UI; IBM Plex Mono (400/500) only for SKU, invoice/order numbers, and ledger quantities. Self-hosted woff2 (latin) via `@fontsource` devDeps copied to `client/public/fonts/`; zero external font requests; `font-display: swap`. Tabular numerals on every number. Scale: meta 12/16·500, table 13/20·400 (header 12/16·600), body 14/22·400, lead 16/26·400, h3 18/24·600, h2 22/28·600, h1 28/34·600, display 36/40·600 (dashboard numbers only). Sentence case everywhere; uppercase only on the RECEIVED stamp and on data identifiers.

**Motion.** Tokens `--dur-1:120ms`, `--dur-2:200ms`, `--dur-3:320ms`, `--ease:cubic-bezier(.4,0,.2,1)`, `--ease-spring:cubic-bezier(.34,1.56,.64,1)` (stamp only). One orchestrated entrance per page (rise 320ms, 35ms stagger, max 8, mount only). Two signature moments: `animateNumber` quantity tick (rAF, instant under reduced motion) and the `Stamp` (scale 1.6→1 + fade, 240ms spring, once). Route transitions use React 19.3's native `<ViewTransition>` around the Outlet (see §5). `prefers-reduced-motion` kills all transforms; only ≤120ms opacity remains.

## 3. Component kit — `client/src/components/ui/`

Dependency-free React + CSS. Existing shared components (`Modal`, `FormField`, `Badge`, `DataTable`, `PageHeader`) are rewritten to this system but keep their export names and prop shapes so pages don't break mid-migration. New primitives: Button (primary=ink/secondary/ghost/danger, sm 32 / md 38, loading locks width), IconButton (36×36, mandatory aria-label), Card, StatCard (no default delta — fake trends impossible; optional real spark), DataTable (sticky header, 44px rows, skeleton loading, row enter/exit, numeric right-aligned tabular, mono columns, sortable with `aria-sort`), Drawer (right, min(480px,100vw), full a11y contract), Input/Select/Textarea/NumberStepper, EmptyState, Skeleton, Tabs (underline, arrow-key), SearchInput (+`useDebounced`), Pagination (windowed, clamps), ConfirmDialog (names the thing + exact verb), CopyButton, Kbd, Toast (react-hot-toast restyled). A `/ui-kit` dev route (gated `import.meta.env.DEV`) renders every component in every state, both themes — the kit's living documentation and the QA surface.

## 4. Already shipped — DO NOT redo

Five page wirings (Inventory/PO/Categories/Suppliers/Users), `utils/csv.js`, `utils/password.js`, dead-file deletes, dark-mode `@custom-variant`, NotFound theme fix, alert auto-resolve + socket push, FormField `useId` + Modal focus-trap/scroll-lock, distinct nav icons, settings server-sync, 8+char password policy, token invalidation on password change, topbar search → Products. These are preserved; phases restyle them, never re-wire or regress them.

## 5. Conflict resolutions (shipped behavior wins)

| Original pack said | This spec does |
|---|---|
| 30s alert polling | Keep Socket.IO real-time (`alert:new`/`alert:read`); bell refetches count on (re)connect |
| Preferences device-local only; remove language; no sync | Keep `PUT /auth/settings` sync; keep honest caption; language selector removed (no i18n) |
| Password min 6 | Keep 8+ with letter+number (`utils/password.js`); strength meter is guidance only |
| "Other devices stay signed in" note | "Other devices will need to sign in again." (token invalidation is live) |
| Hand-rolled `document.startViewTransition` in MainLayout | React 19.3 `<ViewTransition>` around Outlet; do not also set `viewTransition` on Links (mixing breaks it) |
| `@theme inline` token mapping | Use it, but **Gate 0** builds and asserts a `.dark` override actually changes a utility's computed color before any page work |
| "Never ask, never push, never pause" | Approval-gated phases; commit per phase on `redesign-v3`; push only on user instruction |

## 6. Phase plan (rebased, ~10 phases)

Each phase: read current files → implement fully → lint changed files → browser-verify the phase's flows (both themes, 1440 + 390, keyboard, reduced-motion) → commit on `redesign-v3`. Build runs at Gates 0, 5, 9. No phase starts until the prior one's checks pass.

- **P0 Foundation.** Tokens, fonts, kit, motion, `/ui-kit`. **Gate 0:** `npm run build` + a computed-style assertion that `.dark` flips a token utility (resolves the `@theme inline` question with evidence). Acceptance: every existing route renders, no console errors; dark toggle themes the whole app; kit screenshots both themes.
- **P1 App shell.** Sidebar groups + persisted collapse rail; topbar breadcrumb + ⌘K command palette (real product search via `getProducts`, role-gated actions) + UserMenu; offline banner; `<ViewTransition>` route wrapper; remove page-level breadcrumbs. Acceptance: ⌘K from every page, staff sees no admin items, collapse persists, offline banner toggles.
- **P2 Login.** Split-panel ledger-cover motif (aria-hidden illustration), kit form, server-exact errors, DEV-only demo hint with CopyButton. Acceptance: real login, wrong/deactivated/429 messages verbatim, demo hint absent from prod bundle.
- **P3 Inventory.** Restyle on kit: summary strip, URL-synced tabs, stock dialog with live `prev → new` preview + quantity tick, movement ledger with reference links. (Service already real.) Acceptance: stock in/out/adjust persist + tick; staff no Adjust; history filters survive refresh.
- **P4 Purchase Orders.** Restyle: status tabs with counts, detail drawer with RECEIVED stamp + lifecycle stepper, create drawer line editor. (Service already real.) Acceptance: create→place→receive adds stock once; double-receive 400; stamp animates once.
- **P5 Products.** Restyle: server-side filters in URL, table/grid toggle, product drawer with real mini-history, 409→"Deactivate instead". **Gate 5:** build. Acceptance: manager no delete; admin 409 deactivation works; `?product=` deep link.
- **P6 Sales.** Restyle: POS multi-line cart, invoice drawer with snapshot line items, real analytics (admin/manager), payment-method badges. Acceptance: low-stock sellable; multi-line one invoice; no "Pending"; CSV inert for `=1+1`.
- **P7 Dashboard.** Restyle: asymmetric layout, range tabs in URL, real KPIs with null-safe deltas, stock-health bar, latest-movements ledger strip, role-aware (staff: no reports calls). Acceptance: every number matches API; empty period shows zeros; staff zero 403s.
- **P8 CRUD pages.** Categories, Suppliers, Expenses, Users, Settings restyled on kit; keep all shipped behavior (real CRUD, isActive toggles, settings sync, password rule). Acceptance: mutations persist; 409s actionable; settings round-trip; no fake stats.
- **P9 Alerts + quality floor + QA.** AlertBell restyle + AlertCenter drawer (keep socket); cross-cutting sweep: skip-link, focus-to-main on route change, sortable tables, route-level code splitting (lazy recharts/pages), contrast + touch-target + reduced-motion audit, copy pass, canary grep. **Gate 9:** build + lint + canary grep + bundle delta. Writes `QA-RESULTS.md`.

## 7. Verification strategy

- DB mode is available (seeded Atlas). Browser checks run headless via the available browser tooling; screenshots to `docs/enhance-ui/qa-shots/`.
- A check that cannot run is logged NOT-RUN with a reason, never PASS.
- Canary grep across `client/src`: `153731|105352|48379|1,248|28596|Chandra|Asmita|demoExtras|initialUsers|defaultTopProducts|delay\(|Oops|100% Fulfilled|Live from MongoDB|Pending` → zero.
- No new runtime dependencies (fontsource devDeps only). Server untouched except the already-shipped alert auto-resolve.

## 8. Deliverables

The restyled app on `redesign-v3`; this spec; a per-phase execution log; `QA-RESULTS.md`; `project-context/design.md` (the token/kit source of truth) and updated `memory.md`. Commits per phase; push only when the user asks.
