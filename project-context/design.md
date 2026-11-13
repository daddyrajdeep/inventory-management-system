# Design system — The Counting House

Source of truth for StockFlow UI. Direction: a shop's stock ledger, not a SaaS marketing site.
Full rationale: `docs/superpowers/specs/2026-11-13-stockflow-ui-overhaul-design.md`.

## Laws
- Monochrome ink on warm paper. Color is reserved for stock/order status only.
- No purple/indigo, no emerald brand accent, no gradients, glow, glass, dot grids.
- No AI-default fonts (Inter/Roboto/Geist/Space Grotesk/Plus Jakarta/DM Sans/Manrope/Outfit/Fraunces).
- Tabular numerals on every number; mono only for SKU/invoice/order numbers and ledger quantities.
- Sentence case; uppercase only on the RECEIVED stamp and data identifiers.
- Every number from the API; zero is valid (`??`, never `||`); designed empty/error/no-permission states.
- Kit components only; no bespoke page CSS.

## Tokens (client/src/index.css)
Light / Dark: paper `#F6F4EE`/`#14130F`, surface `#FFFDF8`/`#1D1B16`, ink `#1C1B18`/`#ECE9E1`,
ink-soft `#5C584E`/`#A6A196`, line `#E4E1D8`/`#2C2921`, on-ink `#F6F4EE`/`#14130F`.
Status: ok `#2F6B3A`/`#8FC79A`, low `#8A5A12`/`#D9B36A`, out `#A33A2A`/`#E0917F`, info `#33566B`/`#9DBBD0` (each with a `-soft` tint).
Utilities: `bg-paper bg-surface text-ink text-ink-soft border-line text-ok bg-low-soft …`.
Radius: sm 8 (buttons/inputs), md 10 (cards/tables), lg 14 (overlays), full (badges).
Motion: `--dur-1/2/3` = 120/200/320ms, `--ease`, `--ease-spring` (stamp only). `.rise` entrance, `.num`, `.mono`, `.skeleton`.
Dark mode: `.dark` class on `<html>` + `@custom-variant dark`; `@theme inline` maps tokens (verified to flip at runtime).

## Type
IBM Plex Sans (400/500/600/700) UI; IBM Plex Mono (400/500) identifiers. Self-hosted woff2 in `public/fonts/`.
Scale: meta 12, table 13, body 14, lead 16, h3 18, h2 22, h1 28, display 36.

## Kit (client/src/components/ui/)
Button, IconButton, Badge, Card, StatCard (no default delta), DataTable (sortable, skeleton, mono/num cols),
Modal, Drawer, ConfirmDialog, FormField, Input, Select, Textarea, NumberStepper, EmptyState, Skeleton,
Tabs, SearchInput (+useDebounced), Pagination, CopyButton, Kbd, Stamp, PageHeader.
Shared `components/{Badge,DataTable,Modal,FormField,PageHeader}` re-export the kit (legacy tone names aliased).
Living documentation: `/ui-kit` (DEV only).

## Motion signatures
`animateNumber(el, from, to)` quantity tick (utils/motion.js); `Stamp` RECEIVED (spring, once). Both instant under reduced motion.
Route transitions: React 19 `<ViewTransition>` around the Outlet (P1).
