import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sprout,
  Users,
  Settings2,
  UserRoundCheck,
  X,
} from "lucide-react";
import { PARA_MUNICIPALITIES } from "../../supabase/functions/paf-api/land-reference.mjs";
import { validCpf } from "../../supabase/functions/paf-api/land-domain.mjs";
import "./operations.layer.css";
import { AssignTechnician, LandTeamSettings, ReviewerSelect } from '../land/LandTeam';

const root = "/api/operations";
const labels = {
  INTERNALIZAR: "A internalizar",
  INTERNALIZADO: "Internalizado",
  APROVADO: "Aprovado",
  PLANTADO: "Plantado",
  CANCELADO: "Cancelado",
  SEM_ETAPA: "Sem etapa",
  agendado: "Programada",
  realizado: "Realizada",
  cancelado: "Cancelada",
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};
const fmt = (n) => Number(n || 0).toLocaleString("pt-BR");
const datetime = (value) =>
  value
    ? new Date(value).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "Sem prazo";
const apiWrite = (api, path, values, method = "POST") =>
  api(`${root}/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
function useResource(api, path, refreshMs = 30000) {
  const [state, setState] = useState({ data: null, error: "", loading: true });
  const sequence = useRef(0);
  const load = useCallback(
    async (quiet = false) => {
      const id = ++sequence.current;
      if (!quiet) setState((s) => ({ ...s, loading: true }));
      try {
        const data = await api(path);
        if (id === sequence.current)
          setState({ data, error: "", loading: false });
      } catch (e) {
        if (id === sequence.current)
          setState((s) => ({ ...s, error: e.message, loading: false }));
      }
    },
    [api, path],
  );
  useEffect(() => {
    const delay = setTimeout(() => load(), 220);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, refreshMs);
    return () => {
      clearTimeout(delay);
      clearInterval(timer);
      sequence.current++;
    };
  }, [load, refreshMs]);
  return { ...state, load };
}
function ErrorMessage({ children }) {
  return children ? (
    <div className="ops-error" role="alert">
      {children}
    </div>
  ) : null;
}
function Loading() {
  return (
    <div className="ops-empty" role="status">
      <Loader2 size={22} className="spin" /> Carregando operação...
    </div>
  );
}
function Empty({ title, children, icon: Icon = ClipboardList }) {
  return (
    <div className="ops-empty">
      <Icon size={28} />
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}
function State({ value }) {
  return (
    <span className={`ops-state ops-state-${value}`}>
      {labels[value] || value || "Sem etapa"}
    </span>
  );
}
function Toolbar({ children, loading, onRefresh }) {
  return (
    <div className="ops-toolbar">
      {children}
      <button
        className="ops-icon"
        title="Atualizar dados"
        aria-label="Atualizar dados"
        disabled={loading}
        onClick={() => onRefresh()}
      >
        <RefreshCw size={18} className={loading ? "spin" : ""} />
      </button>
    </div>
  );
}
function DirectoryFilters({ directories, value, onChange }) {
  return (
    <>
      <label>
        Município
        <select
          value={value.municipality || ""}
          onChange={(e) => onChange({ ...value, municipality: e.target.value })}
        >
          <option value="">Todos os municípios</option>
          {(directories?.municipalities || []).map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <label>
        Responsável
        <select
          value={value.responsible || ""}
          onChange={(e) => onChange({ ...value, responsible: e.target.value })}
        >
          <option value="">Toda a equipe</option>
          {(directories?.team || []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
function Title({ eyebrow, title, detail, children }) {
  return (
    <div className="ops-section-title">
      <div>
        {eyebrow && <span className="ops-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </div>
      {children}
    </div>
  );
}

export function ActivityOperations({ api, kind }) {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    responsible: "",
    page: 1,
  });
  const [creating, setCreating] = useState(false);
  const [producerSearch, setProducerSearch] = useState("");
  const [selectionPage, setSelectionPage] = useState(1);
  const [selectedProducer, setSelectedProducer] = useState(null);
  const [editor, setEditor] = useState(null);
  const [error, setError] = useState("");
  const resource = useResource(
    api,
    `${root}/${kind === "visit" ? "visits" : "tasks"}?${new URLSearchParams(filters)}`,
  );
  const directories = useResource(api, `${root}/directories`, 60000);
  const choices = useResource(
    api,
    `${root}/producers?${new URLSearchParams({ search: producerSearch, page: selectionPage })}`,
    60000,
  );
  useEffect(() => {
    setCreating(false);
    setEditor(null);
    setSelectedProducer(null);
    setFilters({ search: "", status: "", responsible: "", page: 1 });
  }, [kind]);
  async function open(record, producerId) {
    setError("");
    try {
      if (!producerId && record) {
        setEditor({ record, properties: [] });
        setSelectedProducer(null);
        return;
      }
      const dossier = await api(`${root}/producers/${producerId}`);
      setEditor({
        record: record || { produtor_id: producerId },
        properties: dossier.properties || [],
      });
      setSelectedProducer(dossier.producer);
      setCreating(false);
    } catch (e) {
      setError(e.message);
    }
  }
  const update = (patch) => setFilters((f) => ({ ...f, ...patch, page: 1 }));
  const statuses =
    kind === "visit"
      ? ["agendado", "realizado", "cancelado"]
      : ["pendente", "em_andamento", "concluida", "cancelada"];
  const total = resource.data?.total || 0;
  const pages = Math.max(1, Math.ceil(total / 25));
  return (
    <section className="ops-workspace">
      <Title
        eyebrow="ACOMPANHAMENTO TÉCNICO"
        title={kind === "visit" ? "Agenda de visitas" : "Pendências da equipe"}
        detail={`${fmt(total)} registros`}
      >
        <button
          className="primary-button"
          onClick={() => {
            setCreating(!creating);
            setError("");
          }}
        >
          <Plus size={17} />
          {kind === "visit" ? "Programar visita" : "Cadastrar pendência"}
        </button>
      </Title>
      <ErrorMessage>{error}</ErrorMessage>
      {creating && (
        <section className="ops-section">
          <Title title="Selecione o produtor">
            <button className="ghost-button" onClick={() => setCreating(false)}>
              Cancelar
            </button>
          </Title>
          <label>
            Buscar produtor por nome ou CPF
            <input
              value={producerSearch}
              onChange={(e) => {
                setProducerSearch(e.target.value);
                setSelectionPage(1);
              }}
              placeholder="Nome ou CPF"
            />
          </label>
          <ErrorMessage>{choices.error}</ErrorMessage>
          {choices.loading ? (
            <Loading />
          ) : (
            <div className="ops-record-list">
              {(choices.data?.producers || []).map((p) => (
                <button
                  className="ops-case-row"
                  key={p.id}
                  onClick={() => open(null, p.id)}
                >
                  <span>
                    <strong>{p.nome}</strong>
                    <small>{p.municipality || "Município não informado"}</small>
                  </span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          )}
          {!choices.loading && !choices.data?.producers?.length && (
            <Empty title="Nenhum produtor encontrado" />
          )}
          <div className="ops-actions">
            <button
              className="ghost-button"
              disabled={selectionPage <= 1}
              onClick={() => setSelectionPage((p) => p - 1)}
            >
              Anterior
            </button>
            <span>Página {selectionPage}</span>
            <button
              className="ghost-button"
              disabled={selectionPage * 25 >= (choices.data?.total || 0)}
              onClick={() => setSelectionPage((p) => p + 1)}
            >
              Próxima
            </button>
          </div>
        </section>
      )}
      <Toolbar loading={resource.loading} onRefresh={resource.load}>
        <label className="ops-search">
          Buscar registros
          <div>
            <Search size={17} />
            <input
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              placeholder="Produtor, CPF ou assunto"
            />
          </div>
        </label>
        <label>
          Situação
          <select
            value={filters.status}
            onChange={(e) => update({ status: e.target.value })}
          >
            <option value="">Todas as situações</option>
            {statuses.map((s) => (
              <option value={s} key={s}>
                {labels[s] || "Cancelada"}
              </option>
            ))}
          </select>
        </label>
        <label>
          Responsável
          <select
            value={filters.responsible}
            onChange={(e) => update({ responsible: e.target.value })}
          >
            <option value="">Toda a equipe</option>
            {(directories.data?.team || []).map((t) => (
              <option value={t.id} key={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </label>
      </Toolbar>
      <ErrorMessage>{resource.error || directories.error}</ErrorMessage>
      {resource.loading ? (
        <Loading />
      ) : !resource.data?.records?.length ? (
        <Empty title="Nenhum registro encontrado" />
      ) : (
        <div className="ops-record-list">
          {resource.data.records.map((r) => (
            <article className="ops-record" key={r.id}>
              <div>
                {r.produtor_id ? <a
                  className="ops-link"
                  href={`/admin/produtores?producer=${r.produtor_id}`}
                >
                  {r.producer_name}
                </a> : <strong>Equipe PAF</strong>}
                <h3>{r.titulo}</h3>
                <p>{r.descricao}</p>
                <small>
                  {datetime(r.inicio_em || r.prazo_em)} ·{" "}
                  {r.responsible_name || "Sem responsável"}
                </small>
              </div>
              <State value={r.status} />
              <button
                className="ops-icon"
                title="Editar registro"
                aria-label={`Editar ${r.titulo}`}
                onClick={() => open(r, r.produtor_id)}
              >
                <Pencil size={17} />
              </button>
            </article>
          ))}
        </div>
      )}
      <div className="ops-actions">
        <button
          className="ghost-button"
          disabled={filters.page <= 1}
          onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
        >
          Anterior
        </button>
        <span>
          Página {filters.page} de {pages}
        </span>
        <button
          className="ghost-button"
          disabled={filters.page >= pages}
          onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
        >
          Próxima
        </button>
      </div>
      {editor && (
        <RecordEditor
          {...editor}
          kind={kind}
          api={api}
          directories={directories.data}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            resource.load();
          }}
        />
      )}
      {editor && selectedProducer && (
        <span className="sr-only">
          Produtor selecionado: {selectedProducer.nome}
        </span>
      )}
    </section>
  );
}

const PERIODS = [
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
];
const STAGE_ORDER = ["INTERNALIZAR", "INTERNALIZADO", "APROVADO", "PLANTADO"];
const shortMonth = (value) =>
  new Date(value)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
const initialsOf = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("");

function AttentionItem({ tone, icon: Icon, title, detail, href, action }) {
  return (
    <a className={`pa-alert pa-alert-${tone}`} href={href}>
      <span className="pa-alert-icon">
        <Icon size={18} />
      </span>
      <span className="pa-alert-copy">
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <span className="pa-alert-action">
        {action} <ChevronRight size={16} />
      </span>
    </a>
  );
}

export function OperationsDashboard({ api, canManageRecords = true }) {
  const [filters, setFilters] = useState({
    days: "30",
    municipality: "",
    responsible: "",
  });
  const dirs = useResource(api, `${root}/directories`, 120000);
  const resource = useResource(
    api,
    `${root}/overview?${new URLSearchParams(filters)}`,
  );
  const d = resource.data,
    c = d?.counts || {};
  const metrics = [
    {
      title: "Produtores na base",
      value: c.producers,
      detail: `${fmt(c.area)} ha cadastrados`,
      href: "/admin/produtores",
    },
    {
      title: "Análises em andamento",
      value: c.requests,
      detail: "Aguardando parecer",
      href: "/admin/analises-areas",
    },
    {
      title: "Visitas programadas",
      value: c.visits,
      detail: `${fmt(c.completedVisits)} realizadas no período`,
      href: "/admin/visitas",
    },
    {
      title: "Prazos vencidos",
      value: c.overdue,
      detail: "Análises e pendências em aberto",
      href: "/admin/analises-areas",
      alert: Number(c.overdue) > 0,
    },
  ];
  const attention = [
    Number(c.overdue) > 0 && {
      tone: "crit",
      icon: Clock3,
      title: `${fmt(c.overdue)} ${Number(c.overdue) === 1 ? "prazo vencido" : "prazos vencidos"}`,
      detail: "Análises e pendências em aberto passaram da data combinada.",
      href: "/admin/analises-areas",
      action: "Ver prazos",
    },
    Number(c.requests) > 0 && {
      tone: "warn",
      icon: Sprout,
      title: `${fmt(c.requests)} ${Number(c.requests) === 1 ? "análise de área aguarda" : "análises de área aguardam"} parecer`,
      detail: "Solicitações recebidas que ainda não tiveram decisão.",
      href: "/admin/analises-areas",
      action: "Dar parecer",
    },
    canManageRecords &&
      d?.conflicts > 0 && {
        tone: "info",
        icon: ShieldCheck,
        title: `${fmt(d.conflicts)} ${d.conflicts === 1 ? "identidade precisa" : "identidades precisam"} de conferência`,
        detail: "CPF correspondente, mas nomes diferentes entre as bases.",
        href: "/admin/produtores?view=conflicts",
        action: "Conferir",
      },
  ].filter(Boolean);
  const pipeline = d?.pipeline || [];
  const pipelineTotal = pipeline.reduce((sum, p) => sum + Number(p.total), 0);
  const maxActivity = Math.max(
    1,
    ...(d?.activity || []).map((a) => Number(a.visits) + Number(a.requests)),
  );
  return (
    <div className="ops-workspace ops-dashboard pa-dashboard">
      <div className="pa-filterbar">
        <div className="pa-segmented" role="group" aria-label="Período">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              aria-pressed={filters.days === p.value}
              onClick={() => setFilters({ ...filters, days: p.value })}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="pa-filter-selects">
          <DirectoryFilters
            directories={dirs.data}
            value={filters}
            onChange={setFilters}
          />
        </div>
        <button
          className="ops-icon"
          type="button"
          title="Atualizar dados"
          aria-label="Atualizar dados"
          disabled={resource.loading}
          onClick={() => resource.load()}
        >
          <RefreshCw size={18} className={resource.loading ? "spin" : ""} />
        </button>
      </div>
      <ErrorMessage>{resource.error || dirs.error}</ErrorMessage>
      {!d && resource.loading ? (
        <Loading />
      ) : (
        d && (
          <>
            <section className="pa-section" aria-labelledby="pa-attention">
              <div className="pa-section-head">
                <h2 id="pa-attention">Precisa da sua atenção</h2>
                {attention.length > 0 && (
                  <span>
                    {attention.length} {attention.length === 1 ? "item" : "itens"}
                  </span>
                )}
              </div>
              {attention.length ? (
                <div className="pa-inbox">
                  {attention.map((item) => (
                    <AttentionItem key={item.title} {...item} />
                  ))}
                </div>
              ) : (
                <p className="pa-all-clear">
                  <CheckCircle2 size={18} /> Nada pendente agora. Prazos,
                  análises e conferências estão em dia.
                </p>
              )}
            </section>

            <div className="ops-metrics pa-kpis">
              {metrics.map((m) => (
                <a
                  className={`executive-kpi ops-metric ${m.alert ? "is-alert" : ""}`}
                  href={m.href}
                  key={m.title}
                >
                  <span className="pa-kpi-label">{m.title}</span>
                  <strong>{fmt(m.value)}</strong>
                  <small>{m.detail}</small>
                </a>
              ))}
            </div>

            <section className="pa-section" aria-labelledby="pa-stages">
              <div className="pa-section-head">
                <h2 id="pa-stages">Etapas dos produtores</h2>
                <span>{fmt(pipelineTotal)} produtores · toque para filtrar</span>
              </div>
              {pipelineTotal ? (
                <div className="pa-pipeline">
                  <div className="pa-pipeline-bar" aria-hidden="true">
                    {pipeline.map((p) => (
                      <i
                        key={p.status}
                        className={`pa-stage-${p.status}`}
                        style={{ flexGrow: Number(p.total) }}
                      />
                    ))}
                  </div>
                  <div className="pa-pipeline-legend">
                    {pipeline.map((p) => {
                      const step = STAGE_ORDER.indexOf(p.status);
                      return (
                        <a
                          key={p.status}
                          href={
                            STAGE_ORDER.includes(p.status) || p.status === "CANCELADO"
                              ? `/admin/produtores?stage=${p.status}`
                              : "/admin/produtores"
                          }
                        >
                          <span className="pa-legend-key">
                            <i className={`pa-stage-${p.status}`} />
                            {labels[p.status] || p.status}
                          </span>
                          <strong>{fmt(p.total)}</strong>
                          <small>
                            {step >= 0 ? `Etapa ${step + 1} de 4` : "Fora do fluxo"}
                          </small>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Empty title="Nenhum produtor nas etapas" icon={Users} />
              )}
            </section>

            <section className="pa-section" aria-labelledby="pa-queue">
              <div className="pa-section-head">
                <h2 id="pa-queue">Fila de análise</h2>
                <a className="ops-link" href="/admin/analises-areas">
                  Ver todas <ArrowRight size={16} />
                </a>
              </div>
              {!d.queue?.length ? (
                <Empty title="Nenhuma solicitação na fila" icon={CheckCircle2}>
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
                      {d.queue.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.full_name}</strong>
                            <small>
                              {r.protocol} · {r.municipality}
                            </small>
                          </td>
                          <td>
                            {dirs.data?.team?.find(
                              (t) => t.id === r.assigned_to,
                            )?.nome || (
                              <span className="ops-muted">A definir</span>
                            )}
                          </td>
                          <td>
                            {r.due_date
                              ? r.due_date.split("-").reverse().join("/")
                              : "Sem prazo"}
                          </td>
                          <td>{r.next_action || "Definir próximo passo"}</td>
                          <td>
                            <a
                              href={`/admin/analises-areas?request=${r.id}`}
                              className="ops-icon"
                              aria-label={`Abrir análise de ${r.full_name}`}
                              title="Abrir análise"
                            >
                              <ChevronRight size={20} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="ops-two-columns pa-columns">
              <section className="pa-section" aria-labelledby="pa-agenda">
                <div className="pa-section-head">
                  <h2 id="pa-agenda">Agenda de campo</h2>
                  <a className="ops-link" href="/admin/visitas">
                    Ver agenda <ArrowRight size={16} />
                  </a>
                </div>
                {!d.agenda?.length ? (
                  <Empty title="Nenhuma visita programada" icon={CalendarDays} />
                ) : (
                  <div className="ops-agenda pa-list">
                    {d.agenda.map((v) => (
                      <a
                        key={v.id}
                        href={`/admin/produtores?producer=${v.produtor_id}`}
                      >
                        <span className="ops-date-block">
                          {v.inicio_em ? (
                            <>
                              <b>{new Date(v.inicio_em).getDate()}</b>
                              <small>{shortMonth(v.inicio_em)}</small>
                            </>
                          ) : (
                            <CalendarDays size={20} />
                          )}
                        </span>
                        <div>
                          <strong>{v.nome}</strong>
                          <small>
                            {v.titulo} · {datetime(v.inicio_em)}
                          </small>
                        </div>
                        <ChevronRight size={17} />
                      </a>
                    ))}
                  </div>
                )}
              </section>
              <section className="pa-section" aria-labelledby="pa-activity">
                <div className="pa-section-head">
                  <h2 id="pa-activity">Cadastros e visitas</h2>
                  <div className="ops-chart-legend">
                    <span>
                      <i />
                      Cadastros
                    </span>
                    <span>
                      <i />
                      Visitas realizadas
                    </span>
                  </div>
                </div>
                {d.activity?.some((a) => a.visits || a.requests) ? (
                  <div className="pa-chart">
                    <div
                      className="ops-activity-chart"
                      role="img"
                      aria-label={`${filters.days} dias de cadastros e visitas realizadas`}
                    >
                      {d.activity.map((a) => (
                        <div
                          key={a.day}
                          title={`${a.day.split("-").reverse().join("/")}: ${a.requests} cadastros e ${a.visits} visitas`}
                        >
                          <div
                            className="ops-stack"
                            style={{
                              height: `${((Number(a.requests) + Number(a.visits)) / maxActivity) * 100}%`,
                            }}
                          >
                            <i style={{ flex: Number(a.requests) }} />
                            <i style={{ flex: Number(a.visits) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Empty
                    title="Sem movimento no período"
                    icon={CalendarDays}
                  >
                    Cadastros e visitas concluídas formarão este histórico.
                  </Empty>
                )}
              </section>
            </div>

            <section className="pa-section" aria-labelledby="pa-team">
              <div className="pa-section-head">
                <h2 id="pa-team">Equipe técnica</h2>
                <span>Trabalho no período</span>
              </div>
              {!d.team?.length ? (
                <Empty title="Cadastre a equipe em Acessos" icon={Users} />
              ) : (
                <div className="ops-team pa-team">
                  {d.team.map((t) => (
                    <div key={t.id}>
                      <span className="ops-avatar">{initialsOf(t.nome)}</span>
                      <div>
                        <strong>{t.nome}</strong>
                        <small>{t.papel}</small>
                      </div>
                      <span>
                        <b>{fmt(t.requests)}</b> análises ·{" "}
                        <b>{fmt(t.visits)}</b> visitas
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )
      )}
    </div>
  );
}

export function ProducerOperations({ api, canManageRecords = true }) {
  const [id, setId] = useState(() =>
    new URLSearchParams(location.search).get("producer"),
  );
  const [conflicts, setConflicts] = useState(
    () => new URLSearchParams(location.search).get("view") === "conflicts",
  );
  const [filters, setFilters] = useState({
    search: "",
    page: "1",
    municipality: "",
    status: new URLSearchParams(location.search).get("stage") || "",
    responsible: "",
  });
  const [editor, setEditor] = useState(null);
  const dirs = useResource(api, `${root}/directories`, 120000);
  const resource = useResource(
    api,
    `${root}/producers?${new URLSearchParams(filters)}`,
  );
  const open = (next) => {
    setId(next);
    const url = new URL(location.href);
    next
      ? url.searchParams.set("producer", next)
      : url.searchParams.delete("producer");
    history.replaceState(null, "", url);
  };
  if (id)
    return (
      <ProducerDossier
        id={id}
        api={api}
        directories={dirs.data}
        canManageRecords={canManageRecords}
        onBack={() => open(null)}
      />
    );
  if (conflicts && canManageRecords)
    return (
      <IdentityConflicts
        api={api}
        onBack={() => {
          setConflicts(false);
          history.replaceState(null, "", location.pathname);
          resource.load();
        }}
      />
    );
  return (
    <div className="ops-workspace">
      <Title
        title="Produtores e propriedades"
        detail="Cadastro unificado com o aplicativo PAF VNA."
      >
        {canManageRecords && <button
          className="primary-button"
          onClick={() => setEditor({ kind: "producer", record: {} })}
        >
          <Plus size={18} />
          Cadastrar produtor
        </button>}
      </Title>
      <Toolbar loading={resource.loading} onRefresh={resource.load}>
        <label className="ops-search">
          Buscar produtor
          <div>
            <Search size={18} />
            <input
              placeholder="Nome, CPF ou telefone"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value, page: "1" })
              }
            />
          </div>
        </label>
        <DirectoryFilters
          directories={dirs.data}
          value={filters}
          onChange={(f) => setFilters({ ...f, page: "1" })}
        />
        <label>
          Etapa
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value, page: "1" })
            }
          >
            <option value="">Todas as etapas</option>
            {[
              "INTERNALIZAR",
              "INTERNALIZADO",
              "APROVADO",
              "PLANTADO",
              "CANCELADO",
            ].map((s) => (
              <option value={s} key={s}>
                {labels[s]}
              </option>
            ))}
          </select>
        </label>
      </Toolbar>
      <ErrorMessage>{resource.error || dirs.error}</ErrorMessage>
      {!resource.data && resource.loading ? (
        <Loading />
      ) : resource.data?.producers?.length ? (
        <div className="ops-table-scroll">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Produtor</th>
                <th>Telefone</th>
                <th>Município</th>
                <th>Propriedades</th>
                <th>Etapa</th>
                <th>
                  <span className="sr-only">Abrir ficha</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {resource.data.producers.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.nome}</strong>
                    <small>{p.cpf || "Documento não informado"}</small>
                  </td>
                  <td>{p.telefone || "Não informado"}</td>
                  <td>{p.municipality || "A cadastrar"}</td>
                  <td>{fmt(p.properties)}<span className="pa-cell-unit"> {Number(p.properties) === 1 ? "propriedade" : "propriedades"}</span></td>
                  <td>
                    <State value={p.process_status} />
                  </td>
                  <td>
                    <button className="ops-link" onClick={() => open(p.id)}>
                      Abrir ficha <ChevronRight size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !resource.loading &&
        !resource.error && (
          <Empty title="Nenhum produtor encontrado" icon={Users}>
            Ajuste os filtros ou faça um novo cadastro.
          </Empty>
        )
      )}
      <div className="ops-pagination">
        <span>
          {fmt(resource.data?.total)} produtores · Página {filters.page} de{" "}
          {Math.max(1, Math.ceil((resource.data?.total || 0) / 25))}
        </span>
        <div>
          <button
            className="ops-icon"
            aria-label="Página anterior"
            disabled={Number(filters.page) <= 1 || resource.loading}
            onClick={() =>
              setFilters({ ...filters, page: String(Number(filters.page) - 1) })
            }
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="ops-icon"
            aria-label="Próxima página"
            disabled={
              Number(filters.page) * 25 >= (resource.data?.total || 0) ||
              resource.loading
            }
            onClick={() =>
              setFilters({ ...filters, page: String(Number(filters.page) + 1) })
            }
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      {editor && (
        <RecordEditor
          {...editor}
          api={api}
          directories={dirs.data}
          onClose={() => setEditor(null)}
          onSaved={(record) => {
            setEditor(null);
            resource.load();
            open(record.id);
          }}
        />
      )}
    </div>
  );
}

function ProducerDossier({ id, api, directories, onBack, canManageRecords = true }) {
  const resource = useResource(api, `${root}/producers/${id}`),
    [tab, setTab] = useState("overview"),
    [editor, setEditor] = useState(null),
    [search, setSearch] = useState("");
  const d = resource.data,
    p = d?.producer;
  const person = (id) =>
    directories?.team?.find((t) => t.id === id)?.nome || "A definir";
  const filtered = (rows) =>
    (rows || []).filter((r) =>
      JSON.stringify([r.nome, r.titulo, r.descricao, r.municipio, r.status])
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  return (
    <div className="ops-workspace">
      <button className="ops-link" onClick={onBack}>
        <ArrowLeft size={17} />
        Voltar aos produtores
      </button>
      <ErrorMessage>{resource.error}</ErrorMessage>
      {!d ? (
        <Loading />
      ) : (
        <>
          <div className="ops-dossier-heading">
            <span className="ops-person-avatar">
              {p.nome
                ?.split(" ")
                .slice(0, 2)
                .map((s) => s[0])
                .join("")}
            </span>
            <div>
              <span className="ops-eyebrow">FICHA DO PRODUTOR</span>
              <h2>{p.nome}</h2>
              <p>
                {p.cpf || "CPF a conferir"} ·{" "}
                {p.telefone || "Telefone a cadastrar"}
              </p>
            </div>
            {canManageRecords && <button
              className="icon-text-button"
              onClick={() => setEditor({ kind: "producer", record: p })}
            >
              <Pencil size={17} />
              Editar cadastro
            </button>}
          </div>
          <div
            className="ops-tabs"
            role="tablist"
            aria-label="Ficha do produtor"
          >
            {[
              ["overview", "Resumo"],
              ["properties", "Propriedades"],
              ["visits", "Visitas"],
              ["tasks", "Pendências"],
              ["documents", "Documentos"],
            ].map(([key, title]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                aria-controls={`ops-${key}`}
                id={`ops-tab-${key}`}
                onClick={() => {
                  setTab(key);
                  setSearch("");
                }}
              >
                {title}
                {key !== "overview" && <span>{d[key]?.length || 0}</span>}
              </button>
            ))}
          </div>
          <section
            id={`ops-${tab}`}
            role="tabpanel"
            aria-labelledby={`ops-tab-${tab}`}
            className="ops-dossier-section"
          >
            {tab === "overview" ? (
              <>
                <div className="ops-dossier-summary">
                  <div>
                    <strong>{d.properties?.length || 0}</strong>
                    <span>Propriedades</span>
                  </div>
                  <div>
                    <strong>
                      {d.visits?.filter((v) => v.status === "agendado")
                        .length || 0}
                    </strong>
                    <span>Visitas programadas</span>
                  </div>
                  <div>
                    <strong>
                      {d.tasks?.filter(
                        (t) => !["concluida", "cancelada"].includes(t.status),
                      ).length || 0}
                    </strong>
                    <span>Pendências abertas</span>
                  </div>
                  <div>
                    <strong>{d.requests?.length || 0}</strong>
                    <span>Análises vinculadas</span>
                  </div>
                </div>
                <div className="ops-two-columns">
                  <div>
                    <Title title="Dados do produtor" />
                    <dl className="ops-data">
                      {[
                        ["Telefone", p.telefone],
                        ["E-mail", p.email],
                        [
                          "Nascimento",
                          p.data_nascimento?.split("-").reverse().join("/"),
                        ],
                        ["Endereço", p.endereco],
                        ["Observações", p.observacoes],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value || "Não informado"}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div>
                    <Title title="Análises e acompanhamento" />
                    {!d.requests?.length ? (
                      <Empty title="Nenhuma análise vinculada" icon={Sprout} />
                    ) : (
                      d.requests.map((r) => (
                        <a
                          className="ops-case-row"
                          href={`/admin/analises-areas?request=${r.id}`}
                          key={r.id}
                        >
                          <div>
                            <strong>{r.protocol}</strong>
                            <p>{r.next_action || r.comment}</p>
                            <small>
                              Responsável: {person(r.assigned_to)} · Prazo:{" "}
                              {r.due_date?.split("-").reverse().join("/") ||
                                "A definir"}
                            </small>
                          </div>
                          <ChevronRight size={18} />
                        </a>
                      ))
                    )}
                    {(d.assignments || []).length > 0 && (
                      <p className="ops-muted">
                        Equipe vinculada:{" "}
                        {d.assignments
                          .map((a) => person(a.tecnico_id))
                          .join(", ")}
                      </p>
                    )}
                    <div className="ops-actions">
                      <button
                        className="primary-button"
                        onClick={() =>
                          setEditor({
                            kind: "visit",
                            record: { produtor_id: id },
                          })
                        }
                      >
                        <CalendarDays size={17} />
                        Programar visita
                      </button>
                      <button
                        className="icon-text-button"
                        onClick={() =>
                          setEditor({
                            kind: "task",
                            record: { produtor_id: id },
                          })
                        }
                      >
                        <Plus size={17} />
                        Criar pendência
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="ops-toolbar">
                  <label className="ops-search">
                    Buscar nesta ficha
                    <div>
                      <Search size={17} />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Nome, assunto ou situação"
                      />
                    </div>
                  </label>
                  {tab !== "documents" && (tab !== "properties" || canManageRecords) && (
                    <button
                      className="primary-button"
                      onClick={() =>
                        setEditor({
                          kind: {
                            properties: "property",
                            visits: "visit",
                            tasks: "task",
                          }[tab],
                          record: { produtor_id: id },
                        })
                      }
                    >
                      <Plus size={17} />
                      {tab === "properties"
                        ? "Cadastrar propriedade"
                        : tab === "visits"
                          ? "Programar visita"
                          : "Criar pendência"}
                    </button>
                  )}
                </div>
                {!filtered(d[tab]).length ? (
                  <Empty
                    title={
                      search
                        ? "Nenhum resultado encontrado"
                        : "Nenhum registro nesta seção"
                    }
                  />
                ) : tab === "properties" ? (
                  <div className="ops-property-grid">
                    {filtered(d.properties).map((pr) => (
                      <article key={pr.id} className="ops-property">
                        <div className="ops-property-heading">
                          <MapPin size={22} />
                          <button
                            className="ops-icon"
                            title="Editar propriedade"
                            disabled={!canManageRecords}
                            aria-label={`Editar ${pr.nome}`}
                            onClick={() =>
                              setEditor({ kind: "property", record: pr })
                            }
                          >
                            <Pencil size={17} />
                          </button>
                        </div>
                        <h3>{pr.nome}</h3>
                        <p>
                          {pr.municipio || "Município a cadastrar"} ·{" "}
                          {pr.comunidade_fonte || "Comunidade a cadastrar"}
                        </p>
                        <strong>
                          {fmt(pr.area_hectares)} <small>ha</small>
                        </strong>
                        <dl>
                          <div>
                            <dt>CAR</dt>
                            <dd>{pr.car || "Não informado"}</dd>
                          </div>
                          <div>
                            <dt>CAF</dt>
                            <dd>{pr.caf || "Não informado"}</dd>
                          </div>
                        </dl>
                        {pr.latitude != null && pr.longitude != null && (
                          <a
                            className="ops-link"
                            href={`https://www.google.com/maps?q=${pr.latitude},${pr.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Ver localização <ExternalLink size={16} />
                          </a>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="ops-record-list">
                    {filtered(d[tab]).map((r) => (
                      <article key={r.id}>
                        <span className="ops-record-icon">
                          {tab === "visits" ? (
                            <CalendarDays size={21} />
                          ) : tab === "documents" ? (
                            <FileText size={21} />
                          ) : (
                            <ClipboardList size={21} />
                          )}
                        </span>
                        <div>
                          <h3>{r.titulo || r.title}</h3>
                          <p>{r.descricao || r.category}</p>
                          <small>
                            {datetime(
                              r.inicio_em || r.prazo_em || r.created_at,
                            )}
                            {r.responsavel_id &&
                              ` · ${person(r.responsavel_id)}`}
                          </small>
                        </div>
                        <State value={r.status} />
                        {tab !== "documents" && (
                          <button
                            className="ops-icon"
                            aria-label={`Editar ${r.titulo}`}
                            title="Editar registro"
                            onClick={() =>
                              setEditor({
                                kind: tab === "visits" ? "visit" : "task",
                                record: r,
                              })
                            }
                          >
                            <Pencil size={17} />
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
          {editor && (
            <RecordEditor
              {...editor}
              api={api}
              properties={d.properties}
              directories={directories}
              onClose={() => setEditor(null)}
              onSaved={() => {
                setEditor(null);
                resource.load();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

const schemas = {
  producer: [
    ["nome", "Nome completo", "text", true],
    ["cpf", "CPF", "text", true],
    ["telefone", "Telefone com DDD", "tel", true],
    ["email", "E-mail", "email"],
    ["data_nascimento", "Data de nascimento", "date"],
    ["endereco", "Endereço", "text"],
    ["observacoes", "Observações", "textarea"],
  ],
  property: [
    ["nome", "Nome da propriedade", "text", true],
    ["municipio", "Município", "municipality", true],
    ["comunidade_fonte", "Comunidade", "text", true],
    ["area_hectares", "Área total (ha)", "number", true],
    ["endereco_rural", "Endereço rural", "text"],
    ["car", "Número do CAR", "text"],
    ["caf", "Número do CAF", "text"],
    ["latitude", "Latitude", "number"],
    ["longitude", "Longitude", "number"],
    ["observacoes", "Observações", "textarea"],
  ],
  visit: [
    ["titulo", "Assunto da visita", "text", true],
    ["responsavel_id", "Técnico responsável", "team", true],
    ["propriedade_id", "Propriedade", "property"],
    ["inicio_em", "Data e horário", "datetime-local", true],
    ["local", "Local de encontro", "text"],
    ["status", "Situação", "visitStatus", true],
    ["descricao", "Registro e orientações", "textarea"],
  ],
  task: [
    ["titulo", "Assunto da pendência", "text", true],
    ["responsavel_id", "Responsável", "team"],
    ["propriedade_id", "Propriedade", "property"],
    ["prazo_em", "Prazo", "datetime-local"],
    ["prioridade", "Prioridade", "priority", true],
    ["status", "Situação", "taskStatus", true],
    ["descricao", "Descrição e resolução", "textarea"],
  ],
};
function localTimestamp(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function RecordEditor({
  kind,
  record,
  api,
  properties = [],
  directories,
  onClose,
  onSaved,
}) {
  const [values, setValues] = useState(() => ({
    ...record,
    status:
      record.status ||
      (kind === "visit"
        ? "agendado"
        : kind === "task"
          ? "pendente"
          : undefined),
    prioridade: record.prioridade || "media",
    inicio_em: localTimestamp(record.inicio_em),
    prazo_em: localTimestamp(record.prazo_em),
  }));
  const [step, setStep] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const dialog = useRef(null),
    form = useRef(null),
    locked = useRef(false);
  const requestKey = useRef(crypto.randomUUID());
  const fields = schemas[kind],
    split = kind === "property" ? 4 : 3,
    steps = [fields.slice(0, split), fields.slice(split)],
    titles = {
      producer: "produtor",
      property: "propriedade",
      visit: "visita",
      task: "pendência",
    };
  useEffect(() => {
    dialog.current.showModal();
    return () => dialog.current?.close();
  }, []);
  useEffect(() => {
    form.current?.querySelector("input,select,textarea")?.focus();
  }, [step]);
  const close = () => {
    if (!busy) onClose();
  };
  async function save(e) {
    e.preventDefault();
    if (locked.current) return;
    setError("");
    if (kind === "producer" && step === 0 && !validCpf(values.cpf)) {
      setError("Confira o CPF. Os dígitos verificadores não correspondem.");
      return;
    }
    if (step === 0) {
      setStep(1);
      return;
    }
    locked.current = true;
    setBusy(true);
    try {
      const payload = { ...values, clientRequestId: requestKey.current };
      for (const field of ["inicio_em", "prazo_em"])
        if (payload[field])
          payload[field] = new Date(payload[field]).toISOString();
      const result = await apiWrite(
        api,
        `${kind}${record.id ? `/${record.id}` : ""}`,
        payload,
        record.id ? "PATCH" : "POST",
      );
      onSaved(result.record);
    } catch (e) {
      setError(e.message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  const choices = (type) =>
    ({
      municipality: PARA_MUNICIPALITIES.map((n) => [n, n]),
      team: (directories?.team || []).map((t) => [t.id, t.nome]),
      property: properties.map((p) => [p.id, p.nome]),
      visitStatus: ["agendado", "realizado", "cancelado"].map((s) => [
        s,
        labels[s],
      ]),
      taskStatus: ["pendente", "em_andamento", "concluida", "cancelada"].map(
        (s) => [s, labels[s]],
      ),
      priority: [
        ["baixa", "Baixa"],
        ["media", "Normal"],
        ["alta", "Alta"],
        ["urgente", "Urgente"],
      ],
    })[type];
  return (
    <dialog
      ref={dialog}
      className="ops-dialog"
      aria-labelledby="ops-editor-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <form ref={form} onSubmit={save}>
        <header>
          <div>
            <span className="ops-eyebrow">
              {step === 0 ? "DADOS PRINCIPAIS" : "DETALHES E CONFERÊNCIA"} ·
              ETAPA {step + 1} DE 2
            </span>
            <h2 id="ops-editor-title">
              {record.id ? "Editar" : "Cadastrar"} {titles[kind]}
            </h2>
          </div>
          <button
            className="ops-icon"
            type="button"
            title="Fechar"
            aria-label="Fechar formulário"
            onClick={close}
            disabled={busy}
          >
            <X size={20} />
          </button>
        </header>
        <div className="ops-dialog-body">
          <div className="ops-step-track">
            <i style={{ width: step === 0 ? "50%" : "100%" }} />
          </div>
          <div className="ops-form-fields">
            {steps[step].map(([name, label, type, required]) => (
              <label
                key={name}
                className={type === "textarea" ? "ops-field-full" : ""}
              >
                {label}
                {required ? " *" : ""}
                {choices(type) ? (
                  <select
                    required={required}
                    value={values[name] || ""}
                    onChange={(e) =>
                      setValues({ ...values, [name]: e.target.value })
                    }
                  >
                    <option value="">Selecione</option>
                    {choices(type).map(([v, l]) => (
                      <option value={v} key={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                ) : type === "textarea" ? (
                  <textarea
                    rows={4}
                    maxLength={3000}
                    value={values[name] || ""}
                    onChange={(e) =>
                      setValues({ ...values, [name]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    type={type}
                    required={required}
                    step={type === "number" ? "any" : undefined}
                    maxLength={
                      name === "cpf" ? 14 : name === "telefone" ? 20 : 300
                    }
                    value={values[name] ?? ""}
                    onChange={(e) =>
                      setValues({ ...values, [name]: e.target.value })
                    }
                    autoComplete="off"
                  />
                )}
              </label>
            ))}
          </div>
          <ErrorMessage>{error}</ErrorMessage>
        </div>
        <footer>
          <button
            className="icon-text-button"
            type="button"
            onClick={() => (step ? setStep(0) : close())}
            disabled={busy}
          >
            <ArrowLeft size={17} />
            {step ? "Voltar" : "Cancelar"}
          </button>
          <button className="primary-button" disabled={busy}>
            {busy ? (
              <Loader2 className="spin" size={18} />
            ) : step ? (
              <Check size={18} />
            ) : (
              <ArrowRight size={18} />
            )}{" "}
            {busy ? "Salvando..." : step ? "Salvar cadastro" : "Continuar"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}

function IdentityConflicts({ api, onBack }) {
  const resource = useResource(api, `${root}/conflicts`, 120000),
    [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  async function link(c) {
    if (
      !window.confirm(
        `Confirma que ${c.legacy.name} e ${c.producer.nome} representam a MESMA pessoa? Confira os documentos antes de continuar.`,
      )
    )
      return;
    setBusy(c.producer.id);
    try {
      await apiWrite(api, "link", {
        legacy_id: c.legacy.id,
        producer_id: c.producer.id,
        confirmation: "VINCULAR",
      });
      resource.load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="ops-workspace">
      <button className="ops-link" onClick={onBack}>
        <ArrowLeft size={17} />
        Voltar aos produtores
      </button>
      <Title
        title="Conferência de identidades"
        detail="Nenhum cadastro foi apagado. Confirme a identidade antes de vincular registros com nomes diferentes."
      />
      <ErrorMessage>{error || resource.error}</ErrorMessage>
      {resource.loading && !resource.data ? (
        <Loading />
      ) : !resource.data?.conflicts?.length ? (
        <Empty
          title="Nenhuma identidade pendente de conferência"
          icon={ShieldCheck}
        />
      ) : (
        resource.data.conflicts.map((c) => (
          <div className="ops-conflict" key={`${c.legacy.id}:${c.producer.id}`}>
            <div>
              <small>Cadastro do dashboard</small>
              <strong>{c.legacy.name}</strong>
              <span>
                {c.legacy.cpf_digits} · {c.legacy.phone || "Sem telefone"}
              </span>
            </div>
            <div>
              <small>Cadastro do aplicativo</small>
              <strong>{c.producer.nome}</strong>
              <span>
                {c.producer.cpf} · {c.producer.telefone || "Sem telefone"}
              </span>
            </div>
            <button
              disabled={Boolean(busy)}
              className="icon-text-button"
              onClick={() => link(c)}
            >
              {busy === c.producer.id ? (
                <Loader2 size={17} className="spin" />
              ) : (
                <ShieldCheck size={17} />
              )}
              Confirmar mesma pessoa
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export function CaseWorkspace({ id, api, onBack, onSaved, canManageRecords = true }) {
  const settings = useResource(api, '/api/land/admin/settings', 120000);
  const [configuring, setConfiguring] = useState(false), [assigning, setAssigning] = useState(false);
  const resource = useResource(api, `/api/land/admin/requests/${id}`, 120000),
    dirs = useResource(api, `${root}/directories`, 120000);
  const [snapshot, setSnapshot] = useState(null),
    [draft, setDraft] = useState(null),
    [tab, setTab] = useState("analysis"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [deleting, setDeleting] = useState(false),
    [confirmation, setConfirmation] = useState("");
  const locked = useRef(false);
  function adopt(r) {
    setSnapshot(r);
    setDraft({
      ...r,
      checklist:
        typeof r.checklist === "string"
          ? JSON.parse(r.checklist)
          : r.checklist || {},
    });
  }
  useEffect(() => {
    if (resource.data && !snapshot) adopt(resource.data.request);
  }, [resource.data, snapshot]);
  const dossier = useResource(
    api,
    snapshot?.producer_id
      ? `${root}/producers/${snapshot.producer_id}`
      : `${root}/directories`,
    120000,
  );
  async function action(path, body, method = "POST") {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, version: snapshot.version }),
      });
      if (result.deleted) {
        onSaved();
        onBack();
        return;
      }
      adopt(result.request);
      resource.load(true);
      onSaved();
      setNotice("Alteração salva.");
      return true;
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      locked.current = false;
    }
  }
  if (!snapshot)
    return (
      <div className="ops-workspace">
        <button className="ops-link" onClick={onBack}>
          <ArrowLeft size={17} />
          Voltar às solicitações
        </button>
        <ErrorMessage>{resource.error}</ErrorMessage>
        {!resource.error && <Loading />}
      </div>
    );
  const r = snapshot,
    update = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  return (
    <div className="ops-workspace ops-case-workspace">
      <button
        className="ops-link"
        onClick={() => {
          if (
            JSON.stringify(draft) !==
              JSON.stringify({
                ...r,
                checklist:
                  typeof r.checklist === "string"
                    ? JSON.parse(r.checklist)
                    : r.checklist || {},
              }) &&
            !window.confirm("Sair sem salvar as alterações?")
          )
            return;
          onBack();
        }}
        disabled={busy}
      >
        <ArrowLeft size={17} />
        Voltar às solicitações
      </button>
      <div className="ops-dossier-heading">
        <span className="ops-person-avatar">
          <Sprout size={27} />
        </span>
        <div>
          <span className="ops-eyebrow">
            {r.protocol} · {r.archived_at ? "ARQUIVADA" : "ANÁLISE DE ÁREA"}
          </span>
          <h2>{r.full_name}</h2>
          <p>
            {r.community} · {r.municipality} / PA
          </p>
        </div>
        {r.producer_id && (
          <a
            className="ops-link"
            href={`/admin/produtores?producer=${r.producer_id}`}
          >
            Ficha do produtor <ChevronRight size={17} />
          </a>
        )}
      </div>
      <div className="land-case-actions"><span className="land-muted">Técnico: {(dirs.data?.team || []).find(t => t.id === r.assigned_to)?.nome || 'A definir'}</span><button className="icon-text-button" disabled={busy || !dirs.data} onClick={() => {
        if (JSON.stringify(draft) !== JSON.stringify({ ...r, checklist: typeof r.checklist === 'string' ? JSON.parse(r.checklist) : r.checklist || {} }) && !window.confirm('A atribuição substituirá as alterações ainda não salvas nesta ficha. Continuar?')) return;
        setAssigning(true);
      }}><UserRoundCheck size={17} /> Definir técnico</button>{canManageRecords && <button className="icon-text-button" onClick={() => setConfiguring(true)}><Settings2 size={17} /> Configuração</button>}</div>
      {configuring && <LandTeamSettings api={api} onClose={() => setConfiguring(false)} onSaved={() => settings.load(true)} />}
      {assigning && <AssignTechnician team={dirs.data?.team || []} current={r.assigned_to} busy={busy} error={error} onClose={() => setAssigning(false)} onSave={assigned_to => action(`${root}/land/${id}/workflow`, { ...r, assigned_to, checklist: typeof r.checklist === 'string' ? JSON.parse(r.checklist) : r.checklist || {} })} />}
      <div className="ops-tabs" role="tablist" aria-label="Análise da área">
        {[
          ["data", "Cadastro"],
          ["analysis", "Parecer"],
          ["workflow", "Acompanhamento"],
          ["history", "Histórico"],
        ].map(([k, l]) => (
          <button
            key={k}
            role="tab"
            id={`case-tab-${k}`}
            aria-controls={`case-${k}`}
            aria-selected={tab === k}
            onClick={() => {
              setTab(k);
              setError("");
              setNotice("");
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <ErrorMessage>{error || dirs.error}</ErrorMessage>
      {notice && (
        <p className="ops-success" role="status">
          <CheckCircle2 size={17} />
          {notice}
        </p>
      )}
      <section
        id={`case-${tab}`}
        role="tabpanel"
        aria-labelledby={`case-tab-${tab}`}
        className="ops-dossier-section"
      >
        {tab === "analysis" && (
          <form
            className="ops-case-form"
            onSubmit={(e) => {
              e.preventDefault();
              action(
                `/api/land/admin/requests/${id}`,
                {
                  status: draft.status,
                  comment: draft.comment,
                  reviewerName: draft.reviewer_name,
                },
                "PATCH",
              );
            }}
          >
            <Title
              title="Parecer para o solicitante"
              detail="O resultado, o nome do analista e o parecer ficam disponíveis na consulta por protocolo."
            />
            <ReviewerSelect settings={settings.data} value={draft.reviewer_name} onChange={value => update('reviewer_name', value)} loading={!settings.data && !settings.error} error={settings.error} />
            <label>
              Resultado da análise
              <select
                value={draft.status}
                onChange={(e) => update("status", e.target.value)}
              >
                {[
                  ["EM_ANALISE", "Em análise"],
                  ["DADOS_INCONSISTENTES", "Dados inconsistentes"],
                  ["AREA_REPROVADA", "Área reprovada"],
                  ["POSSIVEL_FINANCIAMENTO", "Área possível de financiamento"],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Parecer para o solicitante
              <textarea
                required
                minLength={10}
                maxLength={2000}
                rows={5}
                value={draft.comment || ""}
                onChange={(e) => update("comment", e.target.value)}
              />
            </label>
            <p className="ops-muted">
              Informe o motivo e as orientações. Não inclua dados bancários nem
              informações de terceiros.
            </p>
            <button className="primary-button" disabled={busy}>
              <Check size={18} />
              {busy ? "Salvando..." : "Salvar parecer"}
            </button>
          </form>
        )}
        {tab === "workflow" && (
          <form
            className="ops-case-form ops-case-form-wide"
            onSubmit={(e) => {
              e.preventDefault();
              action(`${root}/land/${id}/workflow`, draft);
            }}
          >
            <Title
              title="Responsabilidade e próximos passos"
              detail="Informações internas da equipe. Não são publicadas para o solicitante."
            />
            {!r.producer_id ? (
              <div className="ops-attention">
                <Users size={21} />
                <span>
                  <strong>Cadastro sem ficha de produtor vinculada.</strong>
                  <small>
                    Vincule a identidade para programar visitas e pendências no
                    app.
                  </small>
                </span>
                <button
                  type="button"
                  className="icon-text-button"
                  disabled={busy || !canManageRecords}
                  onClick={() => action(`${root}/land/${id}/promote`, {})}
                >
                  <Plus size={17} />
                  Criar ou vincular ficha
                </button>
              </div>
            ) : (
              <p className="ops-success">
                <ShieldCheck size={18} />
                Ficha do produtor vinculada.
              </p>
            )}
            <div className="ops-form-fields">
              <label>
                Responsável
                <select
                  value={draft.assigned_to || ""}
                  onChange={(e) => update("assigned_to", e.target.value)}
                >
                  <option value="">A definir</option>
                  {(dirs.data?.team || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Prazo de análise
                <input
                  type="date"
                  value={draft.due_date || ""}
                  onChange={(e) => update("due_date", e.target.value)}
                />
              </label>
              {r.producer_id && (
                <label className="ops-field-full">
                  Propriedade analisada
                  <select
                    value={draft.property_id || ""}
                    onChange={(e) => update("property_id", e.target.value)}
                  >
                    <option value="">A cadastrar ou definir</option>
                    {(dossier.data?.properties || []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="ops-field-full">
                Próxima ação
                <input
                  maxLength={500}
                  value={draft.next_action || ""}
                  onChange={(e) => update("next_action", e.target.value)}
                  placeholder="Ex.: confirmar os documentos e agendar visita"
                />
              </label>
            </div>
            <fieldset className="ops-checklist">
              <legend>Conferência da equipe</legend>
              {[
                ["identity", "CPF e identidade conferidos"],
                ["contact", "Telefone e contato confirmados"],
                ["location", "Área e localização conferidas"],
                ["documents", "Documentação analisada"],
                ["field", "Verificação técnica em campo"],
                ["bank", "Consulta à instituição financeira registrada"],
              ].map(([k, l]) => (
                <label key={k}>
                  <input
                    type="checkbox"
                    checked={draft.checklist[k] === true}
                    onChange={(e) =>
                      update("checklist", {
                        ...draft.checklist,
                        [k]: e.target.checked,
                      })
                    }
                  />
                  {l}
                </label>
              ))}
            </fieldset>
            <label>
              Notas internas
              <textarea
                rows={4}
                maxLength={3000}
                value={draft.internal_note || ""}
                onChange={(e) => update("internal_note", e.target.value)}
              />
            </label>
            <div className="ops-actions">
              <button className="primary-button" disabled={busy}>
                <Check size={18} />
                Salvar acompanhamento
              </button>
              {r.producer_id && (
                <a
                  className="ops-link"
                  href={`/admin/produtores?producer=${r.producer_id}`}
                >
                  Programar visita na ficha <ArrowRight size={17} />
                </a>
              )}
            </div>
          </form>
        )}
        {tab === "data" && (
          <fieldset className="ops-readonly" disabled={!canManageRecords}>
            <Title
              title="Conferência e correção"
              detail={`Recebido em ${datetime(r.created_at)} · Versão ${r.version}`}
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                action(`${root}/land/${id}/correct`, {
                  fullName: draft.full_name,
                  cpf: draft.cpf,
                  phone: draft.phone,
                  birthDate: draft.birth_date,
                  municipality: draft.municipality,
                  community: draft.community,
                  isFederalSettlement: draft.is_federal_settlement,
                  motherName: draft.mother_name,
                  settlementName: draft.settlement_name,
                });
              }}
            >
              <div className="ops-form-fields">
                {[
                  ["full_name", "Nome completo", "text"],
                  ["cpf", "CPF", "text"],
                  ["phone", "Telefone com DDD", "tel"],
                  ["birth_date", "Data de nascimento", "date"],
                  ["community", "Comunidade", "text"],
                ].map(([k, l, t]) => (
                  <label key={k}>
                    {l}
                    <input
                      type={t}
                      required
                      value={draft[k] || ""}
                      onChange={(e) => update(k, e.target.value)}
                      maxLength={160}
                    />
                  </label>
                ))}
                <label>
                  Município
                  <select
                    value={draft.municipality}
                    onChange={(e) => update("municipality", e.target.value)}
                  >
                    {PARA_MUNICIPALITIES.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Assentamento federal (INCRA)
                  <select
                    value={String(draft.is_federal_settlement === true)}
                    onChange={(e) =>
                      update("is_federal_settlement", e.target.value === "true")
                    }
                  >
                    <option value="false">Não</option>
                    <option value="true">Sim</option>
                  </select>
                </label>
                {draft.is_federal_settlement && (
                  <>
                    {[
                      ["settlement_name", "Nome do assentamento"],
                      ["mother_name", "Nome completo da mãe"],
                    ].map(([k, l]) => (
                      <label key={k}>
                        {l}
                        <input
                          required
                          value={draft[k] || ""}
                          onChange={(e) => update(k, e.target.value)}
                          maxLength={160}
                        />
                      </label>
                    ))}
                  </>
                )}
              </div>
              <div className="ops-actions">
                <button className="primary-button" disabled={busy}>
                  <Check size={17} />
                  Salvar correção
                </button>
              </div>
            </form>
            <div className="ops-case-danger">
              <Title
                title="Gerenciar solicitação"
                detail="Arquivar mantém o protocolo consultável. Excluir remove o cadastro e o histórico público."
              />
              <div className="ops-actions">
                <button
                  className="icon-text-button"
                  disabled={busy || Boolean(r.archived_at)}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Arquivar esta solicitação? O protocolo continuará consultável.",
                      )
                    )
                      action(`${root}/land/${id}/archive`, {});
                  }}
                >
                  Arquivar solicitação
                </button>
                <button
                  className="icon-text-button"
                  disabled={busy}
                  onClick={() => setDeleting(!deleting)}
                >
                  Excluir solicitação
                </button>
              </div>
              {deleting && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (confirmation === "EXCLUIR")
                      action(
                        `/api/land/admin/requests/${id}`,
                        { confirmation, protocol: r.protocol },
                        "DELETE",
                      );
                  }}
                >
                  <label>
                    Digite EXCLUIR para confirmar
                    <input
                      required
                      pattern="EXCLUIR"
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                    />
                  </label>
                  <div className="ops-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={busy}
                      onClick={() => {
                        setDeleting(false);
                        setConfirmation("");
                      }}
                    >
                      Cancelar exclusão
                    </button>
                    <button
                      className="primary-button"
                      disabled={busy || confirmation !== "EXCLUIR"}
                    >
                      Excluir definitivamente
                    </button>
                  </div>
                </form>
              )}
            </div>
          </fieldset>
        )}
        {tab === "history" && (
          <>
            <Title title="Histórico dos pareceres" />
            <div className="ops-record-list">
              {(resource.data?.history || []).map((h, i) => (
                <article key={h.id || i}>
                  <CheckCircle2 size={21} />
                  <div>
                    <h3>{h.reviewer_name || h.actor}</h3>
                    <p>{h.comment}</p>
                    <small>{datetime(h.created_at)}</small>
                  </div>
                </article>
              ))}
              <article>
                <Sprout size={21} />
                <div>
                  <h3>Solicitação recebida</h3>
                  <small>{datetime(r.created_at)}</small>
                </div>
              </article>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
