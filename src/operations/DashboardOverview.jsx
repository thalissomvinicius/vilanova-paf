import React, { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  RefreshCw,
  ShieldCheck,
  Sprout,
  Users,
} from "lucide-react";
import "./dashboard.css";

const number = (value) => Number(value || 0).toLocaleString("pt-BR");
const stages = {
  INTERNALIZAR: ["A internalizar", "#aebbb2"],
  INTERNALIZADO: ["Internalizado", "#729b81"],
  APROVADO: ["Aprovado", "#8eae4c"],
  PLANTADO: ["Plantado", "#255b3e"],
  CANCELADO: ["Cancelado", "#cf795e"],
  SEM_ETAPA: ["Sem etapa", "#dbe0d9"],
};
const dateLabel = (value) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
const initials = (name) =>
  String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

function SectionTitle({ id, eyebrow, title, children }) {
  return (
    <div className="pa-section-head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={id}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Empty({ icon: Icon, title, children, href, action }) {
  return (
    <div className="pa-overview-empty">
      <Icon size={24} aria-hidden="true" />
      <strong>{title}</strong>
      {children && <p>{children}</p>}
      {href && (
        <a className="ops-link" href={href}>
          {action}
          <ArrowRight size={15} />
        </a>
      )}
    </div>
  );
}

export function PortfolioChart({ pipeline }) {
  const rows = pipeline.filter((item) => Number(item.total) > 0);
  const total = rows.reduce((sum, item) => sum + Number(item.total), 0);
  let offset = 0;
  if (!total)
    return (
      <Empty
        icon={Users}
        title="Nenhum produtor nas etapas"
        href="/admin/produtores"
        action="Ver produtores"
      />
    );
  return (
    <div className="pa-portfolio">
      <div
        className="pa-portfolio-donut"
        role="img"
        aria-label={`${number(total)} produtores distribuídos por etapa. Valores na lista ao lado.`}
      >
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <circle
            cx="100"
            cy="100"
            r="78"
            fill="none"
            stroke="#edf0eb"
            strokeWidth="18"
          />
          {rows.map((item) => {
            const part = (Number(item.total) / total) * 100;
            const start = offset;
            offset += part;
            return (
              <circle
                key={item.status}
                cx="100"
                cy="100"
                r="78"
                fill="none"
                stroke={stages[item.status]?.[1] || "#aebbb2"}
                strokeWidth="18"
                pathLength="100"
                strokeDasharray={`${Math.max(0, part - Math.min(0.8, part * 0.12))} ${100 - Math.max(0, part - Math.min(0.8, part * 0.12))}`}
                strokeDashoffset={-start}
                transform="rotate(-90 100 100)"
              />
            );
          })}
        </svg>
        <div>
          <strong>{number(total)}</strong>
          <span>produtores</span>
        </div>
      </div>
      <div className="pa-portfolio-legend">
        {rows.map((item) => (
          <a
            key={item.status}
            href={
              item.status === "SEM_ETAPA"
                ? "/admin/produtores"
                : `/admin/produtores?stage=${encodeURIComponent(item.status)}`
            }
          >
            <span
              className="pa-stage-dot"
              style={{ background: stages[item.status]?.[1] || "#aebbb2" }}
            />
            <span>{stages[item.status]?.[0] || item.status}</span>
            <strong>{number(item.total)}</strong>
            <small>{Math.round((Number(item.total) / total) * 100)}%</small>
            <ChevronRight size={14} aria-hidden="true" />
          </a>
        ))}
      </div>
    </div>
  );
}

export function ActivityChart({ activity, days }) {
  const [activeDay, setActiveDay] = useState(0);
  const focusDay = Math.min(activeDay, Math.max(0, activity.length - 1));
  const max = Math.max(
    1,
    ...activity.map((item) => Number(item.requests) + Number(item.visits)),
  );
  const requests = activity.reduce(
    (sum, item) => sum + Number(item.requests || 0),
    0,
  );
  const visits = activity.reduce(
    (sum, item) => sum + Number(item.visits || 0),
    0,
  );
  if (!requests && !visits)
    return (
      <Empty icon={CalendarDays} title="Sem movimento no período">
        Cadastros recebidos e visitas realizadas aparecerão aqui.
      </Empty>
    );
  return (
    <div className="pa-activity-visual">
      <div className="pa-activity-totals">
        <span>
          <i />
          <strong>{number(requests)}</strong> cadastros
        </span>
        <span>
          <i />
          <strong>{number(visits)}</strong> visitas realizadas
        </span>
      </div>
      <div className="pa-activity-plot">
        <div className="pa-chart-scale" aria-hidden="true">
          <span>{max}</span>
          <span>{Math.round(max / 2)}</span>
          <span>0</span>
        </div>
        <div
          className="pa-chart-bars"
          data-density={activity.length > 45 ? "dense" : undefined}
          role="group"
          aria-label={`Movimento nos últimos ${days} dias`}
        >
          {activity.map((item, index) => {
            const total = Number(item.requests) + Number(item.visits);
            const label = `${dateLabel(item.day)}: ${number(item.requests)} cadastros, ${number(item.visits)} visitas`;
            return (
              <div
                className="pa-chart-day"
                key={item.day}
                role="img"
                tabIndex={index === focusDay ? 0 : -1}
                aria-label={label}
                onFocus={() => setActiveDay(index)}
                onKeyDown={(event) => {
                  const next = {
                    ArrowLeft: Math.max(0, index - 1),
                    ArrowRight: Math.min(activity.length - 1, index + 1),
                    Home: 0,
                    End: activity.length - 1,
                  }[event.key];
                  if (next === undefined) return;
                  event.preventDefault();
                  event.currentTarget.parentElement.children[next]?.focus();
                }}
              >
                <span className="pa-chart-tooltip" aria-hidden="true">
                  {label}
                </span>
                <div
                  className="pa-chart-stack"
                  style={{ height: `${(total / max) * 100}%` }}
                >
                  <i style={{ flex: Number(item.visits) }} />
                  <i style={{ flex: Number(item.requests) }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="pa-chart-dates" aria-hidden="true">
        <span>{dateLabel(activity[0].day)}</span>
        <span>{dateLabel(activity[Math.floor(activity.length / 2)].day)}</span>
        <span>{dateLabel(activity.at(-1).day)}</span>
      </div>
    </div>
  );
}

export function DashboardOverview({
  data,
  directories,
  filters,
  onPeriod,
  onRefresh,
  loading,
  canManageRecords,
  children,
}) {
  const counts = data?.counts || {};
  const metrics = [
    {
      title: "Produtores na base",
      value: counts.producers,
      detail: `${number(counts.area)} ha cadastrados`,
      href: "/admin/produtores",
      icon: Users,
      tone: "forest",
    },
    {
      title: "Análises em andamento",
      value: counts.requests,
      detail: "Aguardando parecer",
      href: "/admin/analises-areas",
      icon: Sprout,
      tone: "orange",
    },
    {
      title: "Visitas programadas",
      value: counts.visits,
      detail: `${number(counts.completedVisits)} realizadas no período`,
      href: "/admin/visitas",
      icon: CalendarDays,
      tone: "green",
    },
    {
      title: "Prazos vencidos",
      value: counts.overdue,
      detail: "Análises e pendências em aberto",
      href: "/admin/analises-areas",
      icon: Clock3,
      tone: Number(counts.overdue) ? "alert" : "neutral",
    },
  ];
  const attention = [
    Number(counts.overdue) > 0 && {
      tone: "crit",
      icon: Clock3,
      title: `${number(counts.overdue)} ${Number(counts.overdue) === 1 ? "prazo vencido" : "prazos vencidos"}`,
      detail: "Análises e pendências em aberto.",
      href: "/admin/analises-areas",
      action: "Ver prazos",
    },
    Number(counts.requests) > 0 && {
      tone: "warn",
      icon: Sprout,
      title: `${number(counts.requests)} ${Number(counts.requests) === 1 ? "análise aguarda" : "análises aguardam"} parecer`,
      detail: "Solicitações sem decisão da equipe.",
      href: "/admin/analises-areas",
      action: "Ver análises",
    },
    canManageRecords &&
      data?.conflicts > 0 && {
        tone: "info",
        icon: ShieldCheck,
        title: `${number(data.conflicts)} ${data.conflicts === 1 ? "cadastro para" : "cadastros para"} conferir`,
        detail: "Divergência na identificação do produtor.",
        href: "/admin/produtores?view=conflicts",
        action: "Conferir cadastros",
      },
  ].filter(Boolean);

  return (
    <div className="ops-workspace ops-dashboard pa-dashboard">
      <div className="pa-overview-heading">
        <div>
          <p className="eyebrow">GESTÃO DA AGRICULTURA FAMILIAR</p>
          <h2>Panorama da operação</h2>
          <p className="pa-overview-date">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <a className="primary-button" href="/admin/analises-areas">
          <Sprout size={17} />
          Analisar áreas
          <ArrowUpRight size={16} />
        </a>
      </div>
      <div className="pa-filterbar">
        <div className="pa-period-filter">
          <span>Período do histórico</span>
          <div className="pa-segmented" role="group" aria-label="Período">
            {["7", "30", "90"].map((days) => (
              <button
                key={days}
                type="button"
                aria-pressed={filters.days === days}
                onClick={() => onPeriod(days)}
              >
                {days} dias
              </button>
            ))}
          </div>
        </div>
        <div className="pa-filter-selects">{children}</div>
        <button
          className="ops-icon"
          type="button"
          title="Atualizar dados"
          aria-label="Atualizar dados"
          disabled={loading}
          onClick={onRefresh}
        >
          <RefreshCw size={18} className={loading ? "spin" : ""} />
        </button>
      </div>
      <div
        className="ops-metrics pa-kpis"
        aria-label="Indicadores da operação"
        aria-busy={loading}
      >
        {metrics.map((metric) => (
          <a
            key={metric.title}
            href={metric.href}
            className={`executive-kpi ops-metric pa-kpi-${metric.tone}`}
          >
            <span className="pa-kpi-label">{metric.title}</span>
            <span className="pa-kpi-icon">
              <metric.icon size={20} aria-hidden="true" />
            </span>
            <strong>{number(metric.value)}</strong>
            <div className="pa-kpi-bottom">
              <small>{metric.detail}</small>
              <ArrowUpRight size={16} aria-hidden="true" />
            </div>
          </a>
        ))}
      </div>
      <div className="pa-overview-grid">
        <section
          className="pa-section pa-portfolio-section"
          aria-labelledby="pa-stages"
        >
          <SectionTitle
            id="pa-stages"
            eyebrow="CARTEIRA PAF"
            title="Etapas dos produtores"
          >
            <a className="ops-link" href="/admin/produtores">
              Ver base
              <ArrowRight size={15} />
            </a>
          </SectionTitle>
          <PortfolioChart pipeline={data.pipeline || []} />
        </section>
        <section
          className="pa-section pa-attention-section"
          aria-labelledby="pa-attention"
        >
          <SectionTitle
            id="pa-attention"
            eyebrow="PRIORIDADES"
            title="Precisa da sua atenção"
          >
            {attention.length > 0 && (
              <span className="pa-count">{attention.length}</span>
            )}
          </SectionTitle>
          {attention.length ? (
            <div className="pa-priorities">
              {attention.map((item) => (
                <a
                  className={`pa-priority pa-priority-${item.tone}`}
                  key={item.title}
                  href={item.href}
                  aria-label={`${item.title}. ${item.action}`}
                >
                  <span className="pa-priority-icon">
                    <item.icon size={18} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </div>
                  <ChevronRight size={16} />
                </a>
              ))}
            </div>
          ) : (
            <Empty icon={CheckCircle2} title="Tudo em dia">
              Nenhum prazo vencido ou solicitação aguardando parecer.
            </Empty>
          )}
        </section>
        <section
          className="pa-section pa-activity-section"
          aria-labelledby="pa-activity"
        >
          <SectionTitle
            id="pa-activity"
            eyebrow="MOVIMENTO"
            title="Cadastros e visitas"
          >
            <span>Últimos {filters.days} dias</span>
          </SectionTitle>
          <ActivityChart activity={data.activity || []} days={filters.days} />
        </section>
        <section
          className="pa-section pa-agenda-section"
          aria-labelledby="pa-agenda"
        >
          <SectionTitle
            id="pa-agenda"
            eyebrow="EM CAMPO"
            title="Próximas visitas"
          >
            <a className="ops-link" href="/admin/visitas">
              Ver agenda
              <ArrowRight size={15} />
            </a>
          </SectionTitle>
          {!data.agenda?.length ? (
            <Empty
              icon={CalendarDays}
              title="Nenhuma visita programada"
              href="/admin/visitas"
              action="Abrir agenda"
            />
          ) : (
            <div className="pa-agenda-list">
              {data.agenda.map((visit) => (
                <a
                  key={visit.id}
                  href={`/admin/produtores?producer=${visit.produtor_id}`}
                >
                  <span className="pa-agenda-date">
                    {visit.inicio_em ? (
                      <>
                        <b>{new Date(visit.inicio_em).getDate()}</b>
                        <small>
                          {new Date(visit.inicio_em)
                            .toLocaleDateString("pt-BR", { month: "short" })
                            .replace(".", "")}
                        </small>
                      </>
                    ) : (
                      <CalendarDays size={20} />
                    )}
                  </span>
                  <div>
                    <strong>{visit.nome}</strong>
                    <small>{visit.titulo}</small>
                    {visit.inicio_em && (
                      <time dateTime={visit.inicio_em}>
                        {new Date(visit.inicio_em).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    )}
                  </div>
                  <ChevronRight size={16} />
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
      <section
        className="pa-section pa-queue-section"
        aria-labelledby="pa-queue"
      >
        <SectionTitle
          id="pa-queue"
          eyebrow="ACOMPANHAMENTO"
          title="Fila de análise"
        >
          <a className="ops-link" href="/admin/analises-areas">
            Ver todas
            <ArrowRight size={16} />
          </a>
        </SectionTitle>
        {!data.queue?.length ? (
          <Empty icon={CheckCircle2} title="Nenhuma solicitação na fila">
            Novos cadastros e análises em andamento aparecerão aqui.
          </Empty>
        ) : (
          <div className="ops-table-scroll">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Solicitante</th>
                  <th>Responsável</th>
                  <th>Prazo</th>
                  <th>Próxima ação</th>
                  <th>
                    <span className="sr-only">Abrir</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.queue.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <strong>{request.full_name}</strong>
                      <small>
                        {request.protocol} · {request.municipality}
                      </small>
                    </td>
                    <td data-label="Responsável">
                      {directories?.team?.find(
                        (member) => member.id === request.assigned_to,
                      )?.nome || <span className="ops-muted">A definir</span>}
                    </td>
                    <td data-label="Prazo">
                      {request.due_date
                        ? request.due_date.split("-").reverse().join("/")
                        : "Sem prazo"}
                    </td>
                    <td data-label="Próxima ação">
                      {request.next_action || "Definir próximo passo"}
                    </td>
                    <td>
                      <a
                        href={`/admin/analises-areas?request=${request.id}`}
                        className="ops-icon"
                        aria-label={`Abrir análise de ${request.full_name}`}
                        title="Abrir análise"
                      >
                        <ArrowUpRight size={18} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="pa-section pa-team-section" aria-labelledby="pa-team">
        <SectionTitle
          id="pa-team"
          eyebrow="QUEM FAZ ACONTECER"
          title="Equipe técnica"
        >
          <span>Demandas em aberto</span>
        </SectionTitle>
        {!data.team?.length ? (
          <Empty
            icon={Users}
            title="Nenhum integrante encontrado"
            href={canManageRecords ? "/admin/logins" : undefined}
            action="Gerenciar acessos"
          />
        ) : (
          <div className="pa-team-roster">
            {data.team.map((member) => (
              <div key={member.id}>
                <span className="ops-avatar">{initials(member.nome)}</span>
                <div>
                  <strong>{member.nome}</strong>
                  <small>
                    {member.papel === "tecnico"
                      ? "Técnico de campo"
                      : member.papel}
                  </small>
                </div>
                <span>
                  <b>{number(member.requests)}</b> análises <span>·</span>{" "}
                  <b>{number(member.visits)}</b> visitas
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
