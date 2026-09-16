# Vila Nova workspace interface

## Identity

The supplied Vila Nova brand manual is the source of truth. `src/ui/system.css`
owns the shared palette, local Poppins fonts, typography, spacing, controls and
responsive rules. Do not add a new global theme file for each visual iteration.

- Deep green `#1C3A31`: navigation, headings and accessible primary controls.
- Green `#569432` and lime `#86C63C`: charts, selected navigation and natural accents.
- Orange `#E74D0F`: limited emphasis, not large decorative surfaces.
- Sand `#F6F3EE`, white and neutral backgrounds; borders `#E3DED5`.
- Poppins 400/500/600/700, served locally with font-display swap.
- White logo uses the existing transparent official asset, without redrawing it.

## Composition

Navigation groups separate overview, field operations and administration.
`WorkspaceNavigation` preserves the existing routes and navigation callback.
`SectionHeading` shares chart headings; `DashboardSkeleton` handles initial loading.
The executive overview separates KPIs, producer status, recent activity,
territorial distribution, participation and operational follow-up.

Use unframed page sections and clear separators. Reserve white framed surfaces
for repeated metric items, tables and dialogs. Do not nest decorative cards.
Use 6px controls and 8px framed surfaces, restrained shadows and 180-220ms
interaction transitions. Respect prefers-reduced-motion.

## Operational components

Existing Metric, Field, SelectFilter, Modal and step-form behavior is preserved.
Filters remain above results; tables own their horizontal scrolling. Dialogs
retain bounded height, internal scrolling, Escape handling and focus restoration.
Buttons retain visible labels or icon titles; keyboard focus remains visible.
Do not add decorative notifications, fake chart data or nonfunctional search.

## Validation and boundaries

`workspace-design.spec.js` checks all 11 admin routes at 390, 768, 1024 and
1440px, including producer and technician dialogs and mobile navigation.
`access-design.spec.js` checks an empty username, errors, password visibility,
reduced motion and viewport fit down to 320x568.
Existing field access, land review and operational tests remain authoritative.

The legacy stylesheets still contain component-specific structural rules.
Their duplicated global token blocks and superseded shell/dashboard overlays
were removed; migrating every remaining rule should happen component by
component with the same tests. This redesign does not modify backend APIs,
authentication, database records or the separately packaged Android project.
