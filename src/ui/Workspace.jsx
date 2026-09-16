import React from "react";

export function DeveloperFooter() {
  return <footer className="developer-footer" role="contentinfo" aria-label="Créditos de desenvolvimento">
    <span>Desenvolvido por <strong>Vinicius Dev</strong></span>
  </footer>;
}

const groups = [
  { label: "Visão geral", ids: ["dashboard", "land"] },
  { label: "Operação em campo", ids: ["producers", "reports", "field", "visits", "tasks", "documents", "fuel"] },
  { label: "Administração", ids: ["registrations", "logins"] }
];

export function WorkspaceNavigation({ items, activeId, onNavigate }) {
  return <nav className="side-nav" aria-label="Navegação">
    {groups.map(group => <div className="nav-group" key={group.label}>
      <p className="sidebar-section-label">{group.label}</p>
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
