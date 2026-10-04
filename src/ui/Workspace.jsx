import React from "react";

export function DeveloperSignature() {
  return <span>Desenvolvido por <strong>Vinicius Dev</strong></span>;
}

export function DeveloperFooter() {
  return <footer className="developer-footer" role="contentinfo" aria-label="Créditos de desenvolvimento">
    <DeveloperSignature />
  </footer>;
}

// Four work areas instead of eleven loose items. The label of the first group is
// hidden: the overview stands on its own above the areas.
export const NAV_GROUPS = [
  { label: "", ids: ["dashboard"] },
  { label: "Produtores", ids: ["producers", "land", "documents"] },
  { label: "Campo", ids: ["visits", "reports", "field", "tasks"] },
  { label: "Frota", ids: ["fuel"] },
  { label: "Equipe", ids: ["registrations", "logins"] }
];

export function navGroupLabel(id) {
  return NAV_GROUPS.find(group => group.ids.includes(id))?.label || "";
}

export function WorkspaceNavigation({ items, activeId, onNavigate }) {
  return <nav className="side-nav" aria-label="Navegação">
    {NAV_GROUPS.filter(group => group.ids.some(id => items.some(item => item.id === id))).map(group => <div className="nav-group" key={group.label || "overview"}>
      {group.label && <p className="sidebar-section-label">{group.label}</p>}
      {group.ids.map(id => {
        const item = items.find(candidate => candidate.id === id);
        if (!item) return null;
        const Icon = item.icon;
        return <button key={id} className={`side-nav-item ${activeId === id ? "active" : ""}`}
          type="button" aria-current={activeId === id ? "page" : undefined} onClick={() => onNavigate(item)}>
          <Icon size={18} aria-hidden="true" /><span>{item.label}</span>
        </button>;
      })}
    </div>)}
  </nav>;
}

// Phone shortcuts: one tab per work area, plus the full menu.
const TAB_AREAS = [
  { label: "Painel", ids: ["dashboard"] },
  { label: "Produtores", ids: ["producers", "land", "documents"] },
  { label: "Campo", ids: ["visits", "reports", "field", "tasks"] },
  { label: "Frota", ids: ["fuel"] }
];

export function WorkspaceTabs({ items, activeId, onNavigate, onOpenMenu, menuIcon: MenuIcon }) {
  const tabs = TAB_AREAS
    .map(area => ({ ...area, target: area.ids.map(id => items.find(item => item.id === id)).find(Boolean) }))
    .filter(area => area.target);
  return <nav className="pa-tabs" aria-label="Atalhos">
    {tabs.map(area => {
      const Icon = area.target.icon;
      const current = area.ids.includes(activeId);
      return <button key={area.label} type="button" className="pa-tab" aria-current={current ? "page" : undefined}
        onClick={() => onNavigate(area.target)}>
        <Icon size={20} aria-hidden="true" /><span>{area.label}</span>
      </button>;
    })}
    <button type="button" className="pa-tab" aria-label="Abrir menu" onClick={onOpenMenu}>
      <MenuIcon size={20} aria-hidden="true" /><span>Menu</span>
    </button>
  </nav>;
}

export function SectionHeading({ eyebrow, title, children }) {
  return <div className="dashboard-card-heading">
    <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h3>{title}</h3></div>
    {children}
  </div>;
}

export function DashboardSkeleton() {
  return <section className="workspace-skeleton" role="status" aria-label="Carregando indicadores">
    <span className="sr-only">Carregando indicadores</span>
    <div className="skeleton-title" aria-hidden="true" />
    <div className="executive-kpi-grid" aria-hidden="true">
      {[0, 1, 2, 3].map(index => <div className="skeleton-metric" key={index}><i /><i /><i /></div>)}
    </div>
    <div className="skeleton-chart" aria-hidden="true" />
  </section>;
}
