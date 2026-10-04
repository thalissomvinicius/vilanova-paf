# PAF VNA web interface

## Source of truth

`src/ui/design.css` owns the look of every web page: the admin panel
(`/admin/*`), the logins, the producer and technician portals, the field team
page (`/campo`) and the public area form (`/analise-de-area`). `main.jsx` adds
`pa-ui` to `body` at startup and every rule is scoped to it. The separately
packaged Expo app (`paf-app`) is not covered yet.

The earlier stylesheets (`styles.css`, `redesign.css`, `experience.css`,
`access.css`, `ui/system.css`, `operations.css`, `land.css`) are imported
inside the `legacy` cascade layer through `ui/legacy.css`,
`operations/operations.layer.css` and `land/land.layer.css`. Unlayered rules
in `design.css` always win over them, whatever their specificity, so new work
never has to out-specify old selectors. Old token names (`--app-*`, `--ink`,
`--line`...) are remapped to the new palette inside `.pa-ui`. When a legacy
rule is fully superseded, delete it instead of overriding it again. Do not add
another global theme file.

## Identity

- White working surface (`--pa-bg`), light neutral `#F6F7F5` only for table
  headers, hover and segmented controls. Hairline borders `#E5E8E3`.
- Green `#1D5E36`: navigation rail (with white text), login photo panel, links
  and selected states.
- PAF orange, darkened to `#CF4A0E` for readable white text: primary action
  buttons (save, register, enter, continue). Keep it off large surfaces.
- Semantic colors only for state: ok, warning, critical, info.
- Instrument Sans for interface text and Bricolage Grotesque for headings and
  figures, both self-hosted through `@fontsource-variable` (the CSP allows
  fonts only from the app's own origin).
- Login fields and buttons keep 56px touch targets.
- The PAF symbol sits beside the product name at the top of the rail.

## Composition

Navigation is grouped by work area in `ui/Workspace.jsx` (`NAV_GROUPS`):
Painel; Produtores (Produtores, Análise de áreas, Documentos); Campo (Visitas,
Relatórios, Coletas de campo, Pendências); Frota (Abastecimento); Equipe
(Cadastros, Acessos). Routes and the navigation callback are unchanged.

- 981px and wider: fixed green rail plus the work column.
- 761–980px: the rail opens as a drawer from "Abrir menu" in the header.
- 760px and narrower: a bottom tab bar (`WorkspaceTabs`) with one tab per area
  and "Menu" for the full drawer. Operation tables turn into stacked cards and
  dialogs open as bottom sheets.

The overview opens with "Precisa da sua atenção", built only from real counts
(overdue deadlines, area analyses waiting for a decision, identity conflicts),
followed by one KPI strip, the producer stage bar (each stage links to the
filtered producer list through `?stage=`), the analysis queue, field agenda,
activity chart and team.

Frame only what is a separate object: tables, list groups, metric strips and
dialogs, with a 12px radius and no shadow. Page sections stay unframed. Use 8px
controls. Shadows are reserved for floating layers (drawer, dialog, toast).

## Operational components

Existing Metric, Field, SelectFilter, Modal and step-form behavior is preserved.
Filters remain above results; tables own their horizontal scrolling. Dialogs
retain bounded height, internal scrolling, Escape handling and focus restoration.
Buttons keep visible labels or icon titles; keyboard focus remains visible.
Do not add decorative notifications, fake chart data or nonfunctional search.

## Validation and boundaries

`workspace-design.spec.js` checks all admin routes at 390, 768, 1024 and
1440px, including producer and technician dialogs and mobile navigation.
`experience.spec.js` checks the overview and the rail brand at several sizes.
`access-design.spec.js` covers the logins. Existing field access, land review
and operational tests remain authoritative.

Area analysis adds an organization-scoped analyst registry behind the protected
API and exact summary counts independent of table pagination. Only administrators
can configure analyst names; coordinators can select an analyst and assign a
technician without administering identities. App technicians come from active
profiles, and additional reviewer names do not create login accounts. Existing
review names remain available for historical records even after deactivation.
The public consultation keeps the saved reviewer name; technician assignment
is internal. The separately packaged Android project is unchanged.

`land-team.spec.js` verifies the summary, configuration modal, analyst selection,
technician assignment and focus restoration at 320, 390, 768 and 1440px.
The service-worker shell version is advanced when this design is published.
