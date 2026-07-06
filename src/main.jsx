import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Boxes,
  CalendarDays,
  Check,
  ClipboardList,
  Copy,
  Download,
  Droplets,
  Eye,
  EyeOff,
  Factory,
  FileText,
  Filter,
  FlaskConical,
  Globe2,
  Handshake,
  KeyRound,
  Leaf,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  ScanLine,
  Search,
  Send,
  ShieldCheck,
  Sprout,
  TreePalm,
  Truck,
  UserCheck,
  UserRound,
  Users,
  X
} from "lucide-react";
import "./styles.css";

const AREA_STATUSES = [
  "Sem alteração",
  "Plantio em andamento",
  "Plantado",
  "Precisa de visita técnica",
  "Problema documental",
  "Área alterada",
  "Cancelado"
];

const STATUS_TONE = {
  INTERNALIZAR: "neutral",
  INTERNALIZADO: "info",
  APROVADO: "success",
  PLANTADO: "plantado",
  CANCELADO: "danger"
};

const REPORT_REVIEW_STATUSES = [
  "PENDENTE",
  "EM ANÁLISE",
  "VISITA PROGRAMADA",
  "CONCLUÍDO",
  "DEVOLVIDO"
];

const REVIEW_TONE = {
  PENDENTE: "pending",
  "EM ANÁLISE": "progress",
  "VISITA PROGRAMADA": "visit",
  CONCLUÍDO: "done",
  DEVOLVIDO: "returned"
};

const VISIT_STATUSES = [
  "PROGRAMADA",
  "EM CAMPO",
  "CONCLUÍDA",
  "REPROGRAMADA",
  "CANCELADA"
];

const VISIT_PRIORITIES = [
  "NORMAL",
  "ALTA",
  "CRÍTICA"
];

const VISIT_TONE = {
  PROGRAMADA: "visit",
  "EM CAMPO": "progress",
  CONCLUÍDA: "done",
  REPROGRAMADA: "pending",
  CANCELADA: "returned"
};

const VISIT_PRIORITY_TONE = {
  NORMAL: "normal",
  ALTA: "warning",
  CRÍTICA: "urgent"
};

const TASK_STATUSES = [
  "ABERTA",
  "EM ANDAMENTO",
  "BLOQUEADA",
  "CONCLUÍDA",
  "CANCELADA"
];

const TASK_TYPES = [
  "RELATÓRIO",
  "VISITA",
  "DOCUMENTO",
  "CONTATO",
  "CAMPO",
  "OUTRO"
];

const TASK_TONE = {
  ABERTA: "pending",
  "EM ANDAMENTO": "progress",
  BLOQUEADA: "visit",
  CONCLUÍDA: "done",
  CANCELADA: "returned"
};

const DOCUMENT_STATUSES = [
  "PENDENTE",
  "EM ANÁLISE",
  "VALIDADO",
  "REJEITADO",
  "VENCIDO"
];

const DOCUMENT_CATEGORIES = [
  "DOCUMENTO PESSOAL",
  "COMPROVANTE",
  "CONTRATO",
  "CAR",
  "FOTO DE CAMPO",
  "EVIDÊNCIA",
  "OUTRO"
];

const DOCUMENT_TONE = {
  PENDENTE: "pending",
  "EM ANÁLISE": "progress",
  VALIDADO: "done",
  REJEITADO: "returned",
  VENCIDO: "visit"
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Painel", path: "/admin/dashboard", icon: BarChart3 },
  { id: "producers", label: "Produtores", path: "/admin/produtores", icon: Users },
  { id: "registrations", label: "Cadastros", path: "/admin/cadastros", icon: Plus },
  { id: "logins", label: "Acessos", path: "/admin/acessos", icon: KeyRound },
  { id: "reports", label: "Relatórios", path: "/admin/relatorios", icon: ClipboardList },
  { id: "visits", label: "Visitas", path: "/admin/visitas", icon: UserCheck },
  { id: "tasks", label: "Pendências", path: "/admin/pendencias", icon: Check },
  { id: "documents", label: "Documentos", path: "/admin/documentos", icon: FileText }
];

const ADMIN_ROUTE_BY_PATH = {
  "/admin": "dashboard",
  "/admin/dashboard": "dashboard",
  "/admin/produtores": "producers",
  "/admin/cadastros": "registrations",
  "/admin/acessos": "logins",
  "/admin/logins": "logins",
  "/admin/relatorios": "reports",
  "/admin/visitas": "visits",
  "/admin/pendencias": "tasks",
  "/admin/documentos": "documents"
};

function getAdminViewFromPath(pathname = window.location.pathname) {
  return ADMIN_ROUTE_BY_PATH[pathname] || "dashboard";
}

const TABLE_PAGE_SIZE = 25;
const REPORT_PAGE_SIZE = 20;
const VISIT_PAGE_SIZE = 18;
const TASK_PAGE_SIZE = 18;
const DOCUMENT_PAGE_SIZE = 18;
const MAX_DOCUMENT_UPLOAD_BYTES = 6 * 1024 * 1024;

const BRAND_ASSETS = {
  vilaLogo: "/brand/logo-vilanova.png",
  vilaLogoOnDark: "/brand/logo-vilanova.png",
  pafLogo: "/brand/logo-paf-card.png",
  pafIcon: "/brand/paf-icon-card.png"
};

const INSTITUTIONAL_METRICS = [
  { value: "365+", label: "famílias produtoras acompanhadas" },
  { value: "24h", label: "relatórios digitais recebidos" },
  { value: "100%", label: "rastreabilidade no relacionamento PAF" },
  { value: "PA", label: "atuação conectada ao campo amazônico" }
];

const VALUE_CARDS = [
  {
    icon: Handshake,
    title: "Proximidade com o produtor",
    text: "Canais digitais simples para manter agricultores familiares, equipe técnica e gestão no mesmo fluxo de informação."
  },
  {
    icon: Leaf,
    title: "Produção responsável",
    text: "Acompanhamento de áreas, documentos e relatórios para apoiar regularidade, sustentabilidade e desenvolvimento local."
  },
  {
    icon: ScanLine,
    title: "Dados com rastreabilidade",
    text: "Cada produtor possui acesso próprio, histórico de envio e informações organizadas para análise da equipe."
  }
];

const CHAIN_STEPS = [
  {
    number: "01",
    title: "Agricultura familiar",
    icon: Sprout,
    text: "Valorização dos pequenos produtores e da origem rural como base da cadeia produtiva."
  },
  {
    number: "02",
    title: "Acompanhamento técnico",
    icon: UserCheck,
    text: "Relatórios, visitas e pendências organizados para reduzir ruído e acelerar decisões."
  },
  {
    number: "03",
    title: "Gestão e rastreio",
    icon: ClipboardList,
    text: "Dados padronizados para enxergar status, áreas, documentos e histórico do produtor."
  },
  {
    number: "04",
    title: "Desenvolvimento do campo",
    icon: TreePalm,
    text: "Tecnologia a serviço da produção rural, da confiança e da evolução sustentável."
  }
];

const PRODUCT_CARDS = [
  {
    icon: FileText,
    title: "Relatórios PAF",
    text: "Recebimento digital de informações do produtor, com filtro por status, agência, ano e acompanhamento técnico."
  },
  {
    icon: CalendarDays,
    title: "Visitas técnicas",
    text: "Organização de agenda, prioridade e encaminhamentos para aproximar equipe e campo."
  },
  {
    icon: ShieldCheck,
    title: "Documentos e governança",
    text: "Controle documental, anexos, validação e rastreabilidade para uma operação mais segura."
  },
  {
    icon: Boxes,
    title: "Gestão operacional",
    text: "Painéis, indicadores e pendências para dar escala ao cuidado com a base produtiva."
  }
];

const TESTIMONIALS = [
  {
    quote: "Com o PAF digital, o produtor sabe o que enviar e a equipe consegue acompanhar sem perder informação.",
    name: "Equipe técnica PAF",
    role: "Acompanhamento de campo"
  },
  {
    quote: "A tecnologia aproxima a empresa das famílias produtoras e dá mais clareza ao desenvolvimento da área.",
    name: "Coordenação operacional",
    role: "Gestão da agricultura familiar"
  },
  {
    quote: "O campo ganha voz, histórico e prioridade. Essa é a base para uma cadeia mais forte e responsável.",
    name: "Vila Nova Agroindustrial",
    role: "Cadeia produtiva"
  }
];

const PARTNER_GROUPS = [
  "Produtores familiares",
  "Equipe técnica de campo",
  "Gestão PAF",
  "Vila Nova Agroindustrial"
];

function App() {
  const path = window.location.pathname;

  if (path.startsWith("/produtor")) {
    return <ProducerPortal />;
  }

  return <AdminGate />;
}

function InstitutionalHome() {
  return (
    <div className="institutional-page">
      <header className="site-header">
        <a className="site-logo" href="/" aria-label="Vila Nova Agroindustrial">
          <img className="site-logo-image" src={BRAND_ASSETS.vilaLogo} alt="Vila Nova Agroindustrial" />
        </a>

        <nav className="site-nav" aria-label="Navegação institucional">
          <a href="#sobre">Sobre</a>
          <a href="#paf">PAF</a>
          <a href="#atuacao">Atuação</a>
          <a href="#resultados">Resultados</a>
          <a href="#contato">Contato</a>
        </nav>

        <div className="site-actions">
          <a className="site-link-button" href="/produtor">
            <UserRound size={17} />
            Portal PAF
          </a>
          <a className="site-primary-button" href="/admin">
            <LogIn size={17} />
            Sistema
          </a>
        </div>
      </header>

      <main>
        <section className="vn-hero">
          <img className="vn-hero-bg-image" src={BRAND_ASSETS.pafIcon} alt="" aria-hidden="true" />
          <div className="vn-hero-content">
            <img className="vn-hero-brand" src={BRAND_ASSETS.vilaLogoOnDark} alt="Vila Nova Agroindustrial" />
            <p className="vn-kicker">Agricultura familiar, tecnologia e desenvolvimento rural</p>
            <h1>Vila Nova Agroindustrial</h1>
            <p>
              Conectando famílias produtoras a uma cadeia agroindustrial mais forte, sustentável
              e rastreável, com proximidade no campo e tecnologia na gestão do PAF.
            </p>
            <div className="vn-hero-actions">
              <a className="site-primary-button large" href="/admin">
                Acessar sistema PAF
                <ArrowRight size={18} />
              </a>
              <a className="site-outline-button large" href="/produtor">
                Portal do produtor
              </a>
            </div>
            <div className="vn-hero-trust">
              <span><Leaf size={17} /> Produção responsável</span>
              <span><Handshake size={17} /> Relação próxima</span>
              <span><ScanLine size={17} /> Informação rastreável</span>
            </div>
          </div>

        </section>

        <section className="vn-section vn-about" id="sobre">
          <div className="vn-section-heading wide">
            <p className="vn-kicker">Vila Nova Agroindustrial</p>
            <h2>Tradição rural, gestão moderna e compromisso com quem produz.</h2>
            <p>
              Atuamos para fortalecer a base produtiva com comunicação clara, acompanhamento
              técnico e ferramentas digitais que dão visibilidade ao desenvolvimento do campo.
            </p>
          </div>

          <div className="vn-about-grid">
            <article className="vn-about-card featured">
              <img src={BRAND_ASSETS.vilaLogo} alt="Logo Vila Nova Agroindustrial" />
              <h3>Uma agroindústria próxima do produtor.</h3>
              <p>
                A marca Vila Nova une natureza, produção e responsabilidade socioambiental
                para construir uma cadeia rural mais organizada e sustentável.
              </p>
            </article>
            <article className="vn-about-card">
              <TreePalm size={26} />
              <h3>Origem no campo</h3>
              <p>Informações da área produtiva, status, documentos e relatórios reunidos em um só fluxo.</p>
            </article>
            <article className="vn-about-card">
              <Globe2 size={26} />
              <h3>Responsabilidade</h3>
              <p>Gestão que respeita território, família, produção e evolução sustentável da cadeia.</p>
            </article>
          </div>
        </section>

        <section className="vn-section vn-family" id="paf">
          <div className="vn-family-media">
            <img src={BRAND_ASSETS.pafLogo} alt="Logo PAF Agricultura Familiar" />
          </div>
          <div className="vn-family-content">
            <p className="vn-kicker">Agricultura familiar</p>
            <h2>O PAF aproxima a equipe técnica das famílias produtoras.</h2>
            <p>
              Cada produtor recebe acesso próprio para enviar relatórios, acompanhar retornos
              técnicos e manter sua relação com a empresa mais simples, rápida e transparente.
            </p>
            <div className="vn-family-list">
              <span><Check size={18} /> Login individual por produtor</span>
              <span><Check size={18} /> Histórico de relatórios e visitas</span>
              <span><Check size={18} /> Documentos e pendências centralizados</span>
            </div>
          </div>
        </section>

        <section className="vn-section vn-intro">
          <div className="vn-section-heading">
            <p className="vn-kicker">Benefícios do projeto</p>
            <h2>Confiança, proximidade e rastreabilidade para desenvolver o campo.</h2>
          </div>
          <div className="vn-value-grid">
            {VALUE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <article className="vn-value-card" key={card.title}>
                  <span>
                    <Icon size={24} />
                  </span>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="vn-section vn-chain" id="atuacao">
          <div className="vn-section-heading wide">
            <p className="vn-kicker">Áreas de atuação</p>
            <h2>Uma operação conectada para cuidar da base produtiva em escala.</h2>
            <p>
              Do contato com o produtor ao acompanhamento técnico, o PAF organiza os dados
              essenciais para que a equipe trabalhe com previsibilidade.
            </p>
          </div>

          <div className="vn-step-grid">
            {CHAIN_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <article className="vn-step-card" key={step.title}>
                  <div>
                    <span className="vn-step-number">{step.number}</span>
                    <Icon size={22} />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="vn-sustainability" id="resultados">
          <div>
            <p className="vn-kicker">Resultados e indicadores</p>
            <h2>Informação organizada para uma cadeia mais humana e eficiente.</h2>
            <p>
              A digitalização do PAF ajuda a reduzir retrabalho, melhorar o retorno técnico
              e transformar registros do campo em decisões mais rápidas.
            </p>
          </div>
          <div className="vn-hero-panel" aria-label="Indicadores operacionais">
            {INSTITUTIONAL_METRICS.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="vn-section vn-solutions">
          <div className="vn-section-heading">
            <p className="vn-kicker">Soluções do sistema</p>
            <h2>Ferramentas para acompanhar produtores, dados e decisões.</h2>
          </div>
          <div className="vn-product-grid">
            {PRODUCT_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <article className="vn-product-card" key={card.title}>
                  <Icon size={25} />
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  <a href="/admin">
                    Ver no sistema
                    <ArrowRight size={16} />
                  </a>
                </article>
              );
            })}
          </div>
        </section>

        <section className="vn-section vn-testimonials">
          <div className="vn-section-heading">
            <p className="vn-kicker">Vozes da operação</p>
            <h2>Um sistema pensado para quem vive o dia a dia do campo.</h2>
          </div>
          <div className="vn-testimonial-grid">
            {TESTIMONIALS.map((testimonial) => (
              <article className="vn-testimonial-card" key={testimonial.name}>
                <p>“{testimonial.quote}”</p>
                <strong>{testimonial.name}</strong>
                <span>{testimonial.role}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="vn-section vn-partners">
          <div className="vn-section-heading wide">
            <p className="vn-kicker">Rede de parceria</p>
            <h2>Produtor, equipe técnica e agroindústria trabalhando no mesmo ritmo.</h2>
            <p>
              A força do PAF está na conexão entre pessoas, informação confiável e decisões
              tomadas com responsabilidade.
            </p>
          </div>
          <div className="vn-partner-row">
            {PARTNER_GROUPS.map((partner) => (
              <span key={partner}>{partner}</span>
            ))}
          </div>
        </section>

        <section className="vn-section vn-contact" id="contato">
          <div className="vn-contact-card">
            <div>
              <p className="vn-kicker">Contato</p>
              <h2>Quer falar sobre o PAF ou acompanhar sua produção?</h2>
              <p>
                Envie uma mensagem para a equipe Vila Nova e aproxime sua produção
                de uma cadeia mais organizada, sustentável e conectada.
              </p>
              <div className="vn-contact-brand">
                <img src={BRAND_ASSETS.vilaLogo} alt="Vila Nova Agroindustrial" />
              </div>
            </div>

            <form className="vn-contact-form" onSubmit={(event) => event.preventDefault()}>
              <label>
                Nome
                <input placeholder="Seu nome" />
              </label>
              <label>
                Telefone ou e-mail
                <input placeholder="(00) 00000-0000" />
              </label>
              <label>
                Perfil
                <select defaultValue="">
                  <option value="" disabled>Selecione</option>
                  <option>Produtor familiar</option>
                  <option>Equipe técnica</option>
                  <option>Parceiro institucional</option>
                </select>
              </label>
              <label>
                Mensagem
                <textarea rows="4" placeholder="Como podemos ajudar?" />
              </label>
              <button className="site-primary-button" type="submit">
                Enviar interesse
                <ArrowRight size={17} />
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <img className="site-footer-logo" src={BRAND_ASSETS.vilaLogoOnDark} alt="Vila Nova Agroindustrial" />
          <p>Confiança, proximidade e desenvolvimento sustentável para a agricultura familiar.</p>
        </div>
        <nav aria-label="Rodapé">
          <a href="#sobre">Sobre</a>
          <a href="#paf">PAF</a>
          <a href="#contato">Contato</a>
          <a href="/produtor">Portal do produtor</a>
          <a href="/admin">Painel administrativo</a>
        </nav>
      </footer>
    </div>
  );
}

function AdminGate() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchJson("/api/auth/me")
      .then((data) => setUser(data.user?.role === "admin" ? data.user : null))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return <LoadingScreen label="Carregando painel" />;
  }

  if (!user) {
    return <AdminLogin onLogin={setUser} />;
  }

  return <AdminDashboard user={user} onLogout={() => setUser(null)} />;
}

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (username.trim().toUpperCase().startsWith("PAF-")) {
      setError("Esse login é de produtor. Use o Portal PAF para preencher relatórios.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchJson("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      onLogin(data.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen premium-login-screen">
      <section className="login-shell" aria-label="Acesso ao PAF System">
        <aside className="login-story">
          <div className="login-story-topline">
            <img className="login-company-logo" src={BRAND_ASSETS.vilaLogoOnDark} alt="Vila Nova Agroindustrial" />
            <span>PAF System</span>
          </div>

          <div className="login-story-copy">
            <p className="eyebrow">Agricultura familiar conectada</p>
            <h1>Gestão técnica do campo à análise.</h1>
            <p>
              Um ambiente seguro para acompanhar produtores, relatórios, visitas, documentos e indicadores em tempo real.
            </p>
          </div>

          <div className="login-story-card">
            <img className="login-paf-logo" src={BRAND_ASSETS.pafIcon} alt="PAF Agricultura Familiar" />
            <div>
              <strong>Programa de Agricultura Familiar</strong>
              <span>Cadeia produtiva organizada com tecnologia, proximidade e rastreabilidade.</span>
            </div>
          </div>

          <div className="login-benefit-grid">
            <span>
              <ShieldCheck size={16} />
              Acesso seguro
            </span>
            <span>
              <ScanLine size={16} />
              Rastreabilidade
            </span>
            <span>
              <Leaf size={16} />
              Sustentabilidade
            </span>
          </div>
        </aside>

        <section className="login-panel premium-login-panel">
          <div className="login-brand">
            <div className="brand-mark login-brand-mark">
              <img className="brand-mark-img" src={BRAND_ASSETS.pafIcon} alt="" />
            </div>
            <div>
              <p className="eyebrow">Equipe Vila Nova</p>
              <h1>Painel administrativo</h1>
              <p className="login-panel-text">Gerencie o PAF com clareza, segurança e controle operacional.</p>
            </div>
          </div>

          <form className="login-form" onSubmit={submit}>
            <Field label="Login">
              <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
            </Field>

            <Field label="Senha">
              <div className="input-with-button">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button type="button" title={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            {error && <p className="form-error">{error}</p>}

            <button className="primary-button wide" type="submit" disabled={loading}>
              {loading ? <Loader2 className="spin" size={18} /> : <LogIn size={18} />}
              Entrar
            </button>
            <a className="login-switch" href="/produtor">
              Sou produtor e quero preencher relatório
            </a>
          </form>
        </section>
      </section>
    </main>
  );
}

function AdminDashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState(() => getAdminViewFromPath());
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    agency: "",
    designer: "",
    year: "",
    reported: ""
  });
  const [reportFilters, setReportFilters] = useState({
    search: "",
    needsVisit: "",
    status: "",
    agency: "",
    reviewStatus: ""
  });
  const [visitFilters, setVisitFilters] = useState({
    search: "",
    status: "",
    priority: "",
    agency: "",
    technician: ""
  });
  const [taskFilters, setTaskFilters] = useState({
    search: "",
    status: "",
    priority: "",
    type: "",
    agency: "",
    assignee: ""
  });
  const [documentFilters, setDocumentFilters] = useState({
    search: "",
    status: "",
    category: "",
    agency: ""
  });
  const [options, setOptions] = useState({
    statuses: [],
    agencies: [],
    designers: [],
    years: [],
    technicians: []
  });
  const [producers, setProducers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [visits, setVisits] = useState([]);
  const [visitSummary, setVisitSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskSummary, setTaskSummary] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentSummary, setDocumentSummary] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [techniciansLoading, setTechniciansLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [liveAt, setLiveAt] = useState("");

  const query = useMemo(() => buildQuery(filters), [filters]);
  const reportQuery = useMemo(() => buildQuery(reportFilters), [reportFilters]);
  const visitQuery = useMemo(() => buildQuery(visitFilters), [visitFilters]);
  const taskQuery = useMemo(() => buildQuery(taskFilters), [taskFilters]);
  const documentQuery = useMemo(() => buildQuery(documentFilters), [documentFilters]);

  useEffect(() => {
    if (window.location.pathname === "/admin") {
      window.history.replaceState({ adminView: "dashboard" }, "", "/admin/dashboard");
    }

    function handlePopState() {
      setActiveView(getAdminViewFromPath());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    refreshOptions();
  }, []);

  useEffect(() => {
    refreshProducers();
  }, [query]);

  useEffect(() => {
    if (activeView === "reports") {
      refreshReports();
    }
  }, [activeView, reportQuery]);

  useEffect(() => {
    if (activeView === "visits") {
      refreshVisits();
    }
  }, [activeView, visitQuery]);

  useEffect(() => {
    if (activeView === "tasks") {
      refreshTasks();
    }
  }, [activeView, taskQuery]);

  useEffect(() => {
    if (activeView === "documents") {
      refreshDocuments();
    }
  }, [activeView, documentQuery]);

  useEffect(() => {
    if (activeView === "registrations") {
      refreshTechnicians();
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView !== "dashboard") return;

    refreshReports({ quiet: true });
    refreshVisits({ quiet: true });
    refreshTasks({ quiet: true });
    refreshDocuments({ quiet: true });
  }, [activeView]);

  useEffect(() => {
    const socket = io();

    socket.on("report:created", (event) => {
      setLiveAt(event.at);
      setToast(`Relatório recebido: ${event.producer.name}`);
      refreshProducers({ quiet: true });
      if (activeView === "reports") {
        refreshReports({ quiet: true });
      }
    });

    socket.on("producer:updated", (event) => {
      setLiveAt(event.at);
      refreshProducers({ quiet: true });
    });

    socket.on("technician:updated", (event) => {
      setLiveAt(event.at);
      setToast(`Cadastro técnico atualizado: ${event.technician.name}`);
      refreshOptions();
      if (activeView === "registrations") {
        refreshTechnicians({ quiet: true });
      }
    });

    socket.on("report:reviewed", (event) => {
      setLiveAt(event.at);
      setToast(`Análise atualizada: ${event.report.producerName}`);
      if (activeView === "reports") {
        refreshReports({ quiet: true });
      }
    });

    socket.on("visit:updated", (event) => {
      setLiveAt(event.at);
      setToast(`Visita atualizada: ${event.visit.producerName}`);
      if (activeView === "visits") {
        refreshVisits({ quiet: true });
      }
      if (activeView === "reports") {
        refreshReports({ quiet: true });
      }
    });

    socket.on("task:updated", (event) => {
      setLiveAt(event.at);
      setToast(`Pendência atualizada: ${event.task.title}`);
      if (activeView === "tasks") {
        refreshTasks({ quiet: true });
      }
    });

    socket.on("document:updated", (event) => {
      setLiveAt(event.at);
      setToast(`Documento atualizado: ${event.document.title}`);
      if (activeView === "documents") {
        refreshDocuments({ quiet: true });
      }
    });

    return () => socket.close();
  }, [activeView, query, reportQuery, visitQuery, taskQuery, documentQuery]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selected = producers.find((producer) => producer.id === selectedId) || producers[0] || null;
  const responseRate = summary?.responseRate ?? 0;
  const topAgency = firstEntry(summary?.agencies);
  const topDesigner = firstEntry(summary?.designers);

  function handleAuthError(error) {
    if (error?.status === 401 || error?.status === 403) {
      onLogout();
    }
  }

  function refreshOptions() {
    return fetchJson("/api/options").then(setOptions).catch(handleAuthError);
  }

  function refreshProducers({ quiet = false } = {}) {
    if (!quiet) setLoading(true);

    return fetchJson(`/api/producers${query ? `?${query}` : ""}`)
      .then((data) => {
        setProducers(data.producers);
        setSummary(data.summary);
        setSelectedId((current) =>
          data.producers.some((producer) => producer.id === current) ? current : data.producers[0]?.id || null
        );
      })
      .catch(handleAuthError)
      .finally(() => {
        if (!quiet) setLoading(false);
      });
  }

  function refreshTechnicians({ quiet = false } = {}) {
    if (!quiet) setTechniciansLoading(true);

    return fetchJson("/api/admin/technicians")
      .then((data) => {
        setTechnicians(data.technicians);
      })
      .catch(handleAuthError)
      .finally(() => {
        if (!quiet) setTechniciansLoading(false);
      });
  }

  function refreshReports({ quiet = false } = {}) {
    if (!quiet) setReportsLoading(true);

    return fetchJson(`/api/admin/reports${reportQuery ? `?${reportQuery}` : ""}`)
      .then((data) => {
        setReports(data.reports);
        setReportSummary(data.summary);
      })
      .catch(handleAuthError)
      .finally(() => {
        if (!quiet) setReportsLoading(false);
      });
  }

  function refreshVisits({ quiet = false } = {}) {
    if (!quiet) setVisitsLoading(true);

    return fetchJson(`/api/admin/visits${visitQuery ? `?${visitQuery}` : ""}`)
      .then((data) => {
        setVisits(data.visits);
        setVisitSummary(data.summary);
      })
      .catch(handleAuthError)
      .finally(() => {
        if (!quiet) setVisitsLoading(false);
      });
  }

  function refreshTasks({ quiet = false } = {}) {
    if (!quiet) setTasksLoading(true);

    return fetchJson(`/api/admin/tasks${taskQuery ? `?${taskQuery}` : ""}`)
      .then((data) => {
        setTasks(data.tasks);
        setTaskSummary(data.summary);
      })
      .catch(handleAuthError)
      .finally(() => {
        if (!quiet) setTasksLoading(false);
      });
  }

  function refreshDocuments({ quiet = false } = {}) {
    if (!quiet) setDocumentsLoading(true);

    return fetchJson(`/api/admin/documents${documentQuery ? `?${documentQuery}` : ""}`)
      .then((data) => {
        setDocuments(data.documents);
        setDocumentSummary(data.summary);
      })
      .catch(handleAuthError)
      .finally(() => {
        if (!quiet) setDocumentsLoading(false);
      });
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function updateReportFilter(key, value) {
    setReportFilters((current) => ({ ...current, [key]: value }));
  }

  function updateVisitFilter(key, value) {
    setVisitFilters((current) => ({ ...current, [key]: value }));
  }

  function updateTaskFilter(key, value) {
    setTaskFilters((current) => ({ ...current, [key]: value }));
  }

  function updateDocumentFilter(key, value) {
    setDocumentFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters({
      search: "",
      status: "",
      agency: "",
      designer: "",
      year: "",
      reported: ""
    });
  }

  function resetReportFilters() {
    setReportFilters({
      search: "",
      needsVisit: "",
      status: "",
      agency: "",
      reviewStatus: ""
    });
  }

  function resetVisitFilters() {
    setVisitFilters({
      search: "",
      status: "",
      priority: "",
      agency: "",
      technician: ""
    });
  }

  function resetTaskFilters() {
    setTaskFilters({
      search: "",
      status: "",
      priority: "",
      type: "",
      agency: "",
      assignee: ""
    });
  }

  function resetDocumentFilters() {
    setDocumentFilters({
      search: "",
      status: "",
      category: "",
      agency: ""
    });
  }

  function navigateAdmin(item) {
    if (window.location.pathname !== item.path) {
      window.history.pushState({ adminView: item.id }, "", item.path);
    }

    setActiveView(item.id);
  }

  async function logout() {
    await fetchJson("/api/auth/logout", { method: "POST" }).catch(() => null);
    onLogout();
  }

  async function copyProducerAccess(producer) {
    const message = buildCredentialMessage(producer);
    await navigator.clipboard.writeText(message);
    setToast("Login do produtor copiado.");
  }

  async function saveProducer(producerId, payload) {
    const data = await fetchJson(`/api/admin/producers/${producerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setProducers((current) => current.map((producer) => (producer.id === data.producer.id ? data.producer : producer)));
    setToast("Produtor atualizado.");
    refreshProducers({ quiet: true });
  }

  async function createProducerRegistration(payload) {
    const data = await fetchJson("/api/admin/producers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setProducers((current) => [data.producer, ...current.filter((producer) => producer.id !== data.producer.id)]);
    setSelectedId(data.producer.id);
    setToast("Produtor cadastrado com login gerado.");
    refreshProducers({ quiet: true });
    refreshOptions();
    return data.producer;
  }

  async function createTechnicianRegistration(payload) {
    const data = await fetchJson("/api/admin/technicians", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setTechnicians((current) => [data.technician, ...current.filter((technician) => technician.id !== data.technician.id)]);
    setToast("Técnico cadastrado.");
    refreshTechnicians({ quiet: true });
    refreshOptions();
    return data.technician;
  }

  async function saveTechnicianRegistration(technicianId, payload) {
    const data = await fetchJson(`/api/admin/technicians/${technicianId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setTechnicians((current) =>
      current.map((technician) => (technician.id === data.technician.id ? data.technician : technician))
    );
    setToast("Técnico atualizado.");
    refreshTechnicians({ quiet: true });
    refreshOptions();
    return data.technician;
  }

  async function saveReportReview(reportId, payload) {
    const data = await fetchJson(`/api/admin/reports/${reportId}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setReports((current) => current.map((report) => (report.id === data.report.id ? data.report : report)));
    setToast("Análise técnica salva.");
    refreshReports({ quiet: true });
  }

  async function createVisit(payload) {
    const data = await fetchJson("/api/admin/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setVisits((current) => [data.visit, ...current.filter((visit) => visit.id !== data.visit.id)]);
    setToast("Visita técnica programada.");
    refreshVisits({ quiet: true });
    refreshReports({ quiet: true });
    return data.visit;
  }

  async function saveVisit(visitId, payload) {
    const data = await fetchJson(`/api/admin/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setVisits((current) => current.map((visit) => (visit.id === data.visit.id ? data.visit : visit)));
    setToast("Visita técnica atualizada.");
    refreshVisits({ quiet: true });
    refreshReports({ quiet: true });
    return data.visit;
  }

  async function createTask(payload) {
    const data = await fetchJson("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setTasks((current) => [data.task, ...current.filter((task) => task.id !== data.task.id)]);
    setToast("Pendência criada.");
    refreshTasks({ quiet: true });
    return data.task;
  }

  async function saveTask(taskId, payload) {
    const data = await fetchJson(`/api/admin/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setTasks((current) => current.map((task) => (task.id === data.task.id ? data.task : task)));
    setToast("Pendência atualizada.");
    refreshTasks({ quiet: true });
    return data.task;
  }

  async function createDocument(payload) {
    const data = await fetchJson("/api/admin/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setDocuments((current) => [data.document, ...current.filter((document) => document.id !== data.document.id)]);
    setToast("Documento anexado.");
    refreshDocuments({ quiet: true });
    return data.document;
  }

  async function saveDocument(documentId, payload) {
    const data = await fetchJson(`/api/admin/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setDocuments((current) => current.map((document) => (document.id === data.document.id ? data.document : document)));
    setToast("Documento atualizado.");
    refreshDocuments({ quiet: true });
    return data.document;
  }

  function exportProducers({ credentials = false } = {}) {
    const headers = [
      "Nome",
      "CPF",
      "Endereco",
      "Agencia",
      "Area ha",
      "Status",
      "Ano plantio",
      "Projetista",
      "Ultimo relatorio",
      "Situacao area",
      "Precisa visita"
    ];

    if (credentials) {
      headers.push("Login produtor", "Codigo de acesso", "Link");
    }

    const lines = producers.map((producer) => {
      const row = [
        producer.name,
        producer.cpf,
        producer.address,
        producer.agency,
        formatArea(producer.areaHa),
        producer.processStatus,
        producer.plantingYear,
        producer.designer,
        formatDateTime(producer.lastReportAt),
        producer.latestReport?.areaStatus || "",
        producer.latestReport?.needsVisit ? "Sim" : "Nao"
      ];

      if (credentials) {
        row.push(producer.accessLogin, producer.accessCode, `${window.location.origin}/produtor`);
      }

      return row.map(csvCell).join(";");
    });

    downloadCsv(
      [headers.join(";"), ...lines].join("\n"),
      credentials
        ? `paf-logins-produtores-${new Date().toISOString().slice(0, 10)}.csv`
        : `paf-produtores-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }

  function exportReports() {
    const headers = [
      "Produtor",
      "CPF",
      "Agencia",
      "Data relatorio",
      "Recebido em",
      "Telefone",
      "Status",
      "Situacao area",
      "Area ha",
      "Ano plantio",
      "Cultura",
      "Data plantio",
      "Precisa visita",
      "Análise técnica",
      "Observação técnica",
      "Observacoes"
    ];

    const lines = reports.map((report) =>
      [
        report.producerName,
        report.producerCpf,
        report.producerAgency,
        report.reportDate,
        formatDateTime(report.createdAt),
        report.contactPhone,
        report.processStatus,
        report.areaStatus,
        formatArea(report.areaHa),
        report.plantingYear,
        report.crop,
        report.plantingDate,
        report.needsVisit ? "Sim" : "Nao",
        report.reviewStatus || "PENDENTE",
        report.technicalNote || "",
        report.notes
      ]
        .map(csvCell)
        .join(";")
    );

    downloadCsv([headers.join(";"), ...lines].join("\n"), `paf-relatorios-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function exportVisits() {
    const headers = [
      "Produtor",
      "CPF",
      "Agencia",
      "Data agendada",
      "Tecnico",
      "Status",
      "Prioridade",
      "Objetivo",
      "Resultado"
    ];

    const lines = visits.map((visit) =>
      [
        visit.producerName,
        visit.producerCpf,
        visit.producerAgency,
        visit.scheduledDate,
        visit.technician,
        visit.status,
        visit.priority,
        visit.objective,
        visit.resultNote
      ]
        .map(csvCell)
        .join(";")
    );

    downloadCsv([headers.join(";"), ...lines].join("\n"), `paf-visitas-tecnicas-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function exportTasks() {
    const headers = [
      "Título",
      "Tipo",
      "Status",
      "Prioridade",
      "Responsável",
      "Prazo",
      "Produtor",
      "Agência",
      "Observações"
    ];

    const lines = tasks.map((task) =>
      [
        task.title,
        task.type,
        task.status,
        task.priority,
        task.assignee,
        task.dueDate,
        task.producerName,
        task.producerAgency,
        task.notes
      ]
        .map(csvCell)
        .join(";")
    );

    downloadCsv([headers.join(";"), ...lines].join("\n"), `paf-pendencias-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function exportDocuments() {
    const headers = [
      "Título",
      "Categoria",
      "Status",
      "Produtor",
      "CPF",
      "Agência",
      "Arquivo",
      "Tamanho",
      "Enviado por",
      "Criado em",
      "Observações"
    ];

    const lines = documents.map((document) =>
      [
        document.title,
        document.category,
        document.status,
        document.producerName,
        document.producerCpf,
        document.producerAgency,
        document.fileName,
        document.fileSize,
        document.uploadedBy,
        formatDateTime(document.createdAt),
        document.notes
      ]
        .map(csvCell)
        .join(";")
    );

    downloadCsv([headers.join(";"), ...lines].join("\n"), `paf-documentos-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  const viewTitle = {
    dashboard: "Painel PAF 2026/2027",
    producers: "Produtores e áreas",
    registrations: "Cadastros",
    logins: "Acessos dos produtores",
    reports: "Triagem de relatórios",
    visits: "Visitas técnicas",
    tasks: "Pendências internas",
    documents: "Documentos e anexos"
  }[activeView];

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            <img className="brand-mark-img" src={BRAND_ASSETS.pafIcon} alt="" />
          </div>
          <div>
            <p className="eyebrow">PAF</p>
            <strong>Sistema</strong>
          </div>
        </div>

        <nav className="side-nav" aria-label="Navegação">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={`side-nav-item ${activeView === item.id ? "active" : ""}`}
                key={item.id}
                aria-current={activeView === item.id ? "page" : undefined}
                type="button"
                onClick={() => navigateAdmin(item)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span>{user.name}</span>
          <button className="icon-text-button dark" type="button" onClick={logout}>
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Gestão da agricultura familiar</p>
            <h1>{viewTitle}</h1>
          </div>

          <div className="header-actions">
            <span className={`live-pill ${liveAt ? "live-pill-on" : ""}`}>
              <span className="live-dot" />
              Ao vivo
            </span>
            {activeView === "reports" ? (
              <button className="icon-text-button" type="button" onClick={exportReports}>
                <Download size={18} />
                Relatórios
              </button>
            ) : activeView === "visits" ? (
              <button className="icon-text-button" type="button" onClick={exportVisits}>
                <Download size={18} />
                Visitas
              </button>
            ) : activeView === "tasks" ? (
              <button className="icon-text-button" type="button" onClick={exportTasks}>
                <Download size={18} />
                Pendências
              </button>
            ) : activeView === "documents" ? (
              <button className="icon-text-button" type="button" onClick={exportDocuments}>
                <Download size={18} />
                Documentos
              </button>
            ) : activeView === "registrations" ? null : (
              <>
                <button className="icon-text-button" type="button" onClick={() => exportProducers()}>
                  <Download size={18} />
                  Dados
                </button>
                <button className="icon-text-button" type="button" onClick={() => exportProducers({ credentials: true })}>
                  <KeyRound size={18} />
                  Logins
                </button>
              </>
            )}
            <button className="icon-text-button" type="button" onClick={() => {
              if (activeView === "reports") refreshReports();
              else if (activeView === "visits") refreshVisits();
              else if (activeView === "tasks") refreshTasks();
              else if (activeView === "documents") refreshDocuments();
              else if (activeView === "registrations") {
                refreshTechnicians();
                refreshProducers({ quiet: true });
                refreshOptions();
              }
              else refreshProducers();
              setToast("Painel atualizado.");
            }}>
              <RefreshCcw size={18} />
              Atualizar
            </button>
          </div>
        </header>

        {activeView === "dashboard" && (
          <ExecutiveDashboard
            documentSummary={documentSummary}
            documents={documents}
            onNavigate={(view) => {
              const item = NAV_ITEMS.find((navItem) => navItem.id === view);
              if (item) navigateAdmin(item);
            }}
            producers={producers}
            reports={reports}
            reportSummary={reportSummary}
            responseRate={responseRate}
            statuses={options.statuses}
            summary={summary}
            taskSummary={taskSummary}
            tasks={tasks}
            topAgency={topAgency}
            topDesigner={topDesigner}
            visitSummary={visitSummary}
            visits={visits}
          />
        )}

        {activeView === "producers" && (
          <>
            <ProducerFilters
              filters={filters}
              onChange={updateFilter}
              onReset={resetFilters}
              options={options}
            />
            <ProducerWorkspace
              loading={loading}
              producers={producers}
              selected={selected}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              copyProducerAccess={copyProducerAccess}
              saveProducer={saveProducer}
            />
          </>
        )}

        {activeView === "registrations" && (
          <RegistrationsWorkspace
            copyProducerAccess={copyProducerAccess}
            createProducer={createProducerRegistration}
            createTechnician={createTechnicianRegistration}
            loading={loading}
            options={options}
            producers={producers}
            saveTechnician={saveTechnicianRegistration}
            technicians={technicians}
            techniciansLoading={techniciansLoading}
          />
        )}

        {activeView === "logins" && (
          <>
            <ProducerFilters
              filters={filters}
              onChange={updateFilter}
              onReset={resetFilters}
              options={options}
              compact
            />
            <LoginWorkspace
              loading={loading}
              producers={producers}
              selected={selected}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              copyProducerAccess={copyProducerAccess}
            />
          </>
        )}

        {activeView === "reports" && (
          <ReportsWorkspace
            createVisit={createVisit}
            createTask={createTask}
            filters={reportFilters}
            loading={reportsLoading}
            onChange={updateReportFilter}
            onReset={resetReportFilters}
            onReviewSave={saveReportReview}
            options={options}
            reports={reports}
            summary={reportSummary}
          />
        )}

        {activeView === "visits" && (
          <VisitsWorkspace
            createTask={createTask}
            filters={visitFilters}
            loading={visitsLoading}
            onChange={updateVisitFilter}
            onReset={resetVisitFilters}
            onVisitSave={saveVisit}
            options={options}
            summary={visitSummary}
            visits={visits}
          />
        )}

        {activeView === "tasks" && (
          <TasksWorkspace
            filters={taskFilters}
            loading={tasksLoading}
            onChange={updateTaskFilter}
            onReset={resetTaskFilters}
            onTaskSave={saveTask}
            options={options}
            summary={taskSummary}
            tasks={tasks}
          />
        )}

        {activeView === "documents" && (
          <DocumentsWorkspace
            createDocument={createDocument}
            documents={documents}
            filters={documentFilters}
            loading={documentsLoading}
            onChange={updateDocumentFilter}
            onDocumentSave={saveDocument}
            onReset={resetDocumentFilters}
            options={options}
            producers={producers}
            summary={documentSummary}
          />
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function ExecutiveDashboard({
  documentSummary,
  documents,
  onNavigate,
  producers,
  reports,
  reportSummary,
  responseRate,
  statuses,
  summary,
  taskSummary,
  tasks,
  topAgency,
  topDesigner,
  visitSummary,
  visits
}) {
  const total = summary?.total ?? 0;
  const reported = summary?.reported ?? 0;
  const pending = summary?.pending ?? 0;
  const needsVisit = summary?.needsVisit ?? 0;
  const planted = summary?.planted ?? 0;
  const approved = summary?.approved ?? 0;
  const canceled = summary?.status?.CANCELADO ?? 0;
  const totalArea = summary?.totalArea ?? 0;
  const averageArea = totalArea / Math.max(total, 1);
  const productiveRate = total ? Math.round(((planted + approved) / total) * 100) : 0;
  const reportReviewPending = reportSummary?.byReviewStatus?.PENDENTE ?? 0;
  const reportsToday = reports.filter((report) => isToday(report.createdAt)).length;
  const statusEntries = statuses.map((status) => ({
    label: status,
    value: summary?.status?.[status] ?? 0,
    tone: STATUS_TONE[status] || "neutral"
  }));
  const maxStatus = Math.max(...statusEntries.map((entry) => entry.value), 1);
  const agencyEntries = sortedEntries(summary?.agencies).slice(0, 5);
  const designerEntries = sortedEntries(summary?.designers).slice(0, 4);
  const maxAgency = Math.max(...agencyEntries.map((entry) => entry.value), 1);
  const dailyReports = buildDailyReportSeries(reports, 7);
  const maxDaily = Math.max(...dailyReports.map((entry) => entry.value), 1);
  const recentReports = reports.slice(0, 4);
  const riskItems = [
    {
      label: "Sem relatório",
      value: pending,
      detail: `${responseRate}% de retorno`,
      icon: <ClipboardList size={18} />,
      tone: pending ? "warning" : "success",
      view: "producers"
    },
    {
      label: "Visitas abertas",
      value: visitSummary?.open ?? visits.length,
      detail: `${visitSummary?.urgent ?? 0} urgentes`,
      icon: <UserCheck size={18} />,
      tone: (visitSummary?.urgent ?? 0) ? "urgent" : "progress",
      view: "visits"
    },
    {
      label: "Pendências internas",
      value: taskSummary?.open ?? tasks.length,
      detail: `${taskSummary?.overdue ?? 0} vencidas`,
      icon: <Check size={18} />,
      tone: (taskSummary?.overdue ?? 0) ? "urgent" : "warning",
      view: "tasks"
    },
    {
      label: "Documentos",
      value: (documentSummary?.pending ?? 0) + (documentSummary?.analysis ?? 0),
      detail: `${documentSummary?.valid ?? 0} validados`,
      icon: <FileText size={18} />,
      tone: (documentSummary?.rejected ?? 0) ? "urgent" : "progress",
      view: "documents"
    }
  ];
  const flow = [
    { label: "Base", value: total, icon: <Users size={18} />, pct: 100 },
    { label: "Relatórios", value: reported, icon: <Send size={18} />, pct: clampPercent(reported, total) },
    {
      label: "Análise",
      value: Math.max((reportSummary?.total ?? 0) - reportReviewPending, 0),
      icon: <ScanLine size={18} />,
      pct: clampPercent(Math.max((reportSummary?.total ?? 0) - reportReviewPending, 0), Math.max(reportSummary?.total ?? 0, 1))
    },
    { label: "Visitas", value: visitSummary?.completed ?? 0, icon: <CalendarDays size={18} />, pct: clampPercent(visitSummary?.completed ?? 0, Math.max(visitSummary?.total ?? 0, 1)) },
    { label: "Produção", value: planted, icon: <Sprout size={18} />, pct: clampPercent(planted, total) }
  ];

  return (
    <section className="executive-dashboard" aria-label="Painel executivo PAF">
      <div className="executive-hero">
        <div className="executive-hero-copy">
          <p className="eyebrow">Visão executiva em tempo real</p>
          <h2>Indicadores do PAF para decisão rápida.</h2>
          <p>
            Acompanhe retorno dos produtores, evolução do campo, risco operacional e gargalos da equipe técnica em uma tela só.
          </p>
          <div className="executive-hero-actions">
            <button className="primary-button" type="button" onClick={() => onNavigate("reports")}>
              <ClipboardList size={17} />
              Ver relatórios
            </button>
            <button className="icon-text-button" type="button" onClick={() => onNavigate("visits")}>
              <CalendarDays size={17} />
              Agenda técnica
            </button>
          </div>
        </div>

        <div className="executive-ring-card">
          <div className="executive-ring" style={{ "--ring-angle": `${responseRate * 3.6}deg` }}>
            <strong>{responseRate}%</strong>
            <span>retorno</span>
          </div>
          <div>
            <strong>{reported}</strong>
            <span>relatórios recebidos</span>
          </div>
          <div>
            <strong>{pending}</strong>
            <span>produtores pendentes</span>
          </div>
        </div>
      </div>

      <section className="executive-kpi-grid">
        <ExecutiveKpi label="Produtores ativos" value={total} helper={`${formatArea(totalArea)} ha mapeados`} icon={<Users size={20} />} tone="green" />
        <ExecutiveKpi label="Recebidos hoje" value={reportsToday} helper={`${reportSummary?.total ?? reports.length} relatórios no total`} icon={<Activity size={20} />} tone="orange" />
        <ExecutiveKpi label="Visita técnica" value={needsVisit} helper={`${visitSummary?.scheduled ?? 0} programadas`} icon={<MapPin size={20} />} tone="sand" />
        <ExecutiveKpi label="Rendimento da base" value={`${productiveRate}%`} helper={`${planted + approved} entre plantados/aprovados`} icon={<TreePalm size={20} />} tone="earth" />
      </section>

      <section className="executive-chart-grid">
        <article className="dashboard-card status-chart-card">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">Pipeline PAF</p>
              <h3>Status dos produtores</h3>
            </div>
            <span>{total} cadastros</span>
          </div>
          <div className="status-bars">
            {statusEntries.map((entry, index) => (
              <div className="chart-bar-row" key={entry.label} style={{ "--bar": `${clampPercent(entry.value, maxStatus)}%`, "--delay": `${index * 80}ms` }}>
                <div>
                  <span className={`status-dot ${entry.tone}`} />
                  <strong>{entry.label}</strong>
                </div>
                <div className="chart-track"><span /></div>
                <em>{entry.value}</em>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-card agency-chart-card">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">Território</p>
              <h3>Agências com maior base</h3>
            </div>
            <MapPin size={20} />
          </div>
          <div className="agency-bars">
            {agencyEntries.map((entry, index) => (
              <div className="agency-row" key={entry.label} style={{ "--bar": `${clampPercent(entry.value, maxAgency)}%`, "--delay": `${index * 90}ms` }}>
                <strong>{entry.label}</strong>
                <div className="chart-track"><span /></div>
                <em>{entry.value}</em>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-card activity-chart-card">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">Movimento</p>
              <h3>Relatórios dos últimos 7 dias</h3>
            </div>
            <span>{reportsToday} hoje</span>
          </div>
          <div className="spark-bars" aria-label="Relatórios recebidos nos últimos 7 dias">
            {dailyReports.map((entry, index) => (
              <span key={entry.label} style={{ "--bar": `${Math.max(8, clampPercent(entry.value, maxDaily))}%`, "--delay": `${index * 70}ms` }}>
                <i>{entry.value}</i>
                <small>{entry.label}</small>
              </span>
            ))}
          </div>
        </article>

        <article className="dashboard-card flow-card">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">Operação integrada</p>
              <h3>Fluxo do campo à conclusão</h3>
            </div>
            <Truck size={20} />
          </div>
          <div className="flow-steps">
            {flow.map((step, index) => (
              <div className="flow-step" key={step.label} style={{ "--flow": `${step.pct}%`, "--delay": `${index * 90}ms` }}>
                <span>{step.icon}</span>
                <div>
                  <strong>{step.value}</strong>
                  <small>{step.label}</small>
                  <i><b /></i>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="executive-bottom-grid">
        <article className="dashboard-card attention-card">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">Atenção operacional</p>
              <h3>O que precisa de ação</h3>
            </div>
            <PriorityBadge priority={{ label: `${riskItems.reduce((sum, item) => sum + Number(item.value || 0), 0)} pontos`, tone: "warning" }} />
          </div>
          <div className="attention-grid">
            {riskItems.map((item) => (
              <button className={`attention-item ${item.tone}`} key={item.label} type="button" onClick={() => onNavigate(item.view)}>
                <span>{item.icon}</span>
                <strong>{item.value}</strong>
                <small>{item.label}</small>
                <em>{item.detail}</em>
              </button>
            ))}
          </div>
        </article>

        <article className="dashboard-card ranking-card">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">Equipe e base</p>
              <h3>Concentração principal</h3>
            </div>
            <Handshake size={20} />
          </div>
          <div className="ranking-split">
            <div>
              <span>Agência líder</span>
              <strong>{topAgency?.label || "-"}</strong>
              <small>{topAgency?.value || 0} produtores</small>
            </div>
            <div>
              <span>Projetista líder</span>
              <strong>{topDesigner?.label || "-"}</strong>
              <small>{topDesigner?.value || 0} produtores</small>
            </div>
          </div>
          <div className="designer-list">
            {designerEntries.map((entry) => (
              <span key={entry.label}>
                <b>{entry.label}</b>
                <em>{entry.value}</em>
              </span>
            ))}
          </div>
        </article>

        <article className="dashboard-card recent-card">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">Entradas recentes</p>
              <h3>Últimos relatórios</h3>
            </div>
            <button className="icon-text-button" type="button" onClick={() => onNavigate("reports")}>
              Abrir
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="recent-list">
            {recentReports.length ? recentReports.map((report) => (
              <button key={report.id} type="button" onClick={() => onNavigate("reports")}>
                <span><FileText size={17} /></span>
                <div>
                  <strong>{report.producerName}</strong>
                  <small>{formatDateTime(report.createdAt)} · {report.areaStatus || "Sem situação"}</small>
                </div>
                <ReviewBadge status={report.reviewStatus} />
              </button>
            )) : (
              <div className="recent-empty">
                <ClipboardList size={22} />
                <strong>Nenhum relatório recente</strong>
                <small>Assim que um produtor enviar, ele aparecerá aqui.</small>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="executive-numbers-strip" aria-label="Indicadores complementares">
        <span><strong>{formatArea(averageArea)} ha</strong> área média</span>
        <span><strong>{approved}</strong> aprovados</span>
        <span><strong>{planted}</strong> plantados</span>
        <span><strong>{canceled}</strong> cancelados</span>
        <span><strong>{documents.length}</strong> documentos</span>
      </section>
    </section>
  );
}

function ExecutiveKpi({ helper, icon, label, tone, value }) {
  return (
    <article className={`executive-kpi ${tone}`}>
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </article>
  );
}

function ProducerFilters({ compact = false, filters, onChange, onReset, options }) {
  return (
    <section className={`filters ${compact ? "filters-compact" : ""}`} aria-label="Filtros">
      <label className="search-field">
        <Search size={18} />
        <input
          value={filters.search}
          onChange={(event) => onChange("search", event.target.value)}
          placeholder="Buscar nome, CPF, login ou endereço"
        />
      </label>

      <SelectFilter icon={<Filter size={17} />} value={filters.status} onChange={(value) => onChange("status", value)}>
        <option value="">Todos os status</option>
        {options.statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </SelectFilter>

      <SelectFilter value={filters.agency} onChange={(value) => onChange("agency", value)}>
        <option value="">Todas as agências</option>
        {options.agencies.map((agency) => (
          <option key={agency} value={agency}>
            {agency}
          </option>
        ))}
      </SelectFilter>

      {!compact && (
        <>
          <SelectFilter value={filters.designer} onChange={(value) => onChange("designer", value)}>
            <option value="">Todos os projetistas</option>
            {options.designers.map((designer) => (
              <option key={designer} value={designer}>
                {designer}
              </option>
            ))}
          </SelectFilter>

          <SelectFilter value={filters.year} onChange={(value) => onChange("year", value)}>
            <option value="">Todos os anos</option>
            {options.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </SelectFilter>

          <SelectFilter value={filters.reported} onChange={(value) => onChange("reported", value)}>
            <option value="">Todos os relatórios</option>
            <option value="yes">Recebidos</option>
            <option value="no">Pendentes</option>
          </SelectFilter>
        </>
      )}

      <button className="ghost-button" type="button" onClick={onReset}>
        Limpar
      </button>
    </section>
  );
}

function ProducerWorkspace({ copyProducerAccess, loading, producers, saveProducer, selected, selectedId, setSelectedId }) {
  const [detailOpen, setDetailOpen] = useState(false);

  function openProducerDetail(producer) {
    if (!producer) return;
    setSelectedId(producer.id);
    setDetailOpen(true);
  }

  return (
    <div className="content-grid">
      <section className="table-shell" aria-label="Produtores">
        <div className="table-heading">
          <div>
            <h2>Produtores</h2>
            <p>{loading ? "Carregando..." : `${producers.length} registros encontrados`}</p>
          </div>
          <div className="table-heading-actions">
            {loading && <Loader2 className="spin" size={20} />}
            <button className="icon-text-button" type="button" disabled={!selected} onClick={() => openProducerDetail(selected)}>
              <Pencil size={17} />
              Editar cadastro
            </button>
          </div>
        </div>

        <ProducerTable
          producers={producers}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          copyProducerAccess={copyProducerAccess}
          onOpenDetail={openProducerDetail}
        />
      </section>

      <Modal
        eyebrow="Cadastro do produtor"
        open={detailOpen && !!selected}
        onClose={() => setDetailOpen(false)}
        title={selected?.name || "Produtor"}
      >
        <ProducerDetail
          producer={selected}
          copyProducerAccess={copyProducerAccess}
          saveProducer={saveProducer}
        />
      </Modal>
    </div>
  );
}

function ProducerTable({ copyProducerAccess, onOpenDetail, producers, selectedId, setSelectedId }) {
  const pagination = usePagedItems(producers, TABLE_PAGE_SIZE);

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produtor</th>
              <th>Login</th>
              <th>Agência</th>
              <th>Status</th>
              <th>Área</th>
              <th>Relatório</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {pagination.items.map((producer) => (
              <tr
                className={producer.id === selectedId ? "selected-row" : ""}
                key={producer.id}
                onClick={() => onOpenDetail(producer)}
              >
                <td>
                  <strong>{producer.name}</strong>
                  <span>{maskCpf(producer.cpf)} · {producer.plantingYear || "-"}</span>
                </td>
                <td>
                  <code>{producer.accessLogin}</code>
                </td>
                <td>{producer.agency || "Sem agência"}</td>
                <td>
                  <StatusBadge status={producer.processStatus} />
                </td>
                <td>{formatArea(producer.areaHa)} ha</td>
                <td>
                  {producer.lastReportAt ? (
                    <span className="report-ok">{formatDateTime(producer.lastReportAt)}</span>
                  ) : (
                    <span className="report-pending">Pendente</span>
                  )}
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      type="button"
                      title="Abrir cadastro"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedId(producer.id);
                        onOpenDetail(producer);
                      }}
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      title="Copiar login"
                      onClick={(event) => {
                        event.stopPropagation();
                        copyProducerAccess(producer);
                      }}
                    >
                      <Copy size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!pagination.items.length && (
              <tr>
                <td colSpan="7">
                  <span className="empty-row">Nenhum produtor encontrado.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls pagination={pagination} label="produtores" />
    </>
  );
}

function ProducerDetail({ copyProducerAccess, producer, saveProducer }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!producer) {
      setForm(null);
      return;
    }

    setForm({
      name: producer.name || "",
      cpf: producer.cpf || "",
      phone: producer.phone || "",
      address: producer.address || "",
      agency: producer.agency || "",
      areaHa: producer.areaHa || "",
      processStatus: producer.processStatus || "INTERNALIZAR",
      plantingYear: producer.plantingYear || "",
      designer: producer.designer || ""
    });
    setError("");
  }, [producer?.id]);

  if (!producer || !form) {
    return (
      <aside className="detail-panel" aria-label="Detalhes">
        <p>Nenhum produtor encontrado.</p>
      </aside>
    );
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await saveProducer(producer.id, form);
    } catch (requestError) {
      setError(requestError.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="detail-panel" aria-label="Detalhes">
      <div className="detail-header">
        <div>
          <p className="eyebrow">Selecionado</p>
          <h2>{producer.name}</h2>
        </div>
        <button className="icon-button" type="button" title="Copiar login" onClick={() => copyProducerAccess(producer)}>
          <Copy size={18} />
        </button>
      </div>

      <form className="detail-form" onSubmit={submit}>
        <Field label="Status">
          <select value={form.processStatus} onChange={(event) => updateField("processStatus", event.target.value)}>
            {Object.keys(STATUS_TONE).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Nome">
          <input value={form.name} onChange={(event) => updateField("name", event.target.value)} />
        </Field>

        <Field label="CPF">
          <input value={form.cpf} onChange={(event) => updateField("cpf", event.target.value)} />
        </Field>

        <Field label="Telefone">
          <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
        </Field>

        <Field label="Endereço">
          <input value={form.address} onChange={(event) => updateField("address", event.target.value)} />
        </Field>

        <div className="inline-grid">
          <Field label="Área">
            <input type="number" step="0.01" value={form.areaHa} onChange={(event) => updateField("areaHa", event.target.value)} />
          </Field>
          <Field label="Ano">
            <input type="number" value={form.plantingYear} onChange={(event) => updateField("plantingYear", event.target.value)} />
          </Field>
        </div>

        <Field label="Agência">
          <input value={form.agency} onChange={(event) => updateField("agency", event.target.value)} />
        </Field>

        <Field label="Projetista">
          <input value={form.designer} onChange={(event) => updateField("designer", event.target.value)} />
        </Field>

        {error && <p className="form-error">{error}</p>}

        <button className="primary-button wide" type="submit" disabled={saving}>
          {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
          Salvar
        </button>
      </form>

      <div className="detail-section">
        <h3>Login do produtor</h3>
        <div className="credential-line">
          <span>Usuário</span>
          <code>{producer.accessLogin}</code>
        </div>
        <div className="credential-line">
          <span>Código</span>
          <code>{producer.accessCode}</code>
        </div>
        <button className="primary-button wide" type="button" onClick={() => copyProducerAccess(producer)}>
          <Copy size={17} />
          Copiar mensagem
        </button>
      </div>

      <div className="detail-section">
        <h3>Último relatório</h3>
        {producer.latestReport ? (
          <>
            <p>
              <strong>{producer.latestReport.areaStatus || "Sem situação informada"}</strong>
            </p>
            <p>{producer.latestReport.notes || "Sem observações."}</p>
            <small>{formatDateTime(producer.latestReport.createdAt)}</small>
          </>
        ) : (
          <p>Nenhum relatório recebido.</p>
        )}
      </div>
    </aside>
  );
}

function emptyProducerRegistrationForm() {
  return {
    name: "",
    cpf: "",
    phone: "",
    agency: "",
    processStatus: "INTERNALIZAR",
    areaHa: "",
    plantingYear: "",
    designer: "",
    address: ""
  };
}

function emptyTechnicianForm() {
  return {
    name: "",
    phone: "",
    email: "",
    role: "Técnico de campo",
    region: "",
    active: true,
    notes: ""
  };
}

function RegistrationsWorkspace({
  copyProducerAccess,
  createProducer,
  createTechnician,
  loading,
  options,
  producers,
  saveTechnician,
  technicians,
  techniciansLoading
}) {
  const [search, setSearch] = useState("");
  const [producerModalOpen, setProducerModalOpen] = useState(false);
  const [technicianModalOpen, setTechnicianModalOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState(null);
  const normalizedSearch = normalizeForSearch(search);

  const filteredProducers = useMemo(() => {
    if (!normalizedSearch) return producers;
    return producers.filter((producer) =>
      [
        producer.name,
        producer.cpf,
        producer.phone,
        producer.agency,
        producer.designer,
        producer.accessLogin,
        producer.processStatus
      ]
        .some((value) => normalizeForSearch(value).includes(normalizedSearch))
    );
  }, [normalizedSearch, producers]);

  const filteredTechnicians = useMemo(() => {
    if (!normalizedSearch) return technicians;
    return technicians.filter((technician) =>
      [technician.name, technician.phone, technician.email, technician.role, technician.region]
        .some((value) => normalizeForSearch(value).includes(normalizedSearch))
    );
  }, [normalizedSearch, technicians]);

  const activeTechnicians = technicians.filter((technician) => technician.active).length;
  const recentProducers = filteredProducers.slice(0, 7);
  const shownTechnicians = filteredTechnicians.slice(0, 7);

  return (
    <section className="registration-workspace">
      <div className="registration-hero">
        <div>
          <p className="eyebrow">Base operacional PAF</p>
          <h2>Cadastros centralizados para campo, técnica e gestão.</h2>
          <p>
            Inclua produtores, gere credenciais de acesso e mantenha a equipe técnica organizada para visitas,
            relatórios e acompanhamento.
          </p>
        </div>
        <div className="registration-hero-actions">
          <button className="primary-button" type="button" onClick={() => setProducerModalOpen(true)}>
            <Plus size={18} />
            Novo produtor
          </button>
          <button className="icon-text-button" type="button" onClick={() => setTechnicianModalOpen(true)}>
            <UserCheck size={18} />
            Novo técnico
          </button>
        </div>
      </div>

      <div className="registration-metrics">
        <Metric label="Produtores na base" value={loading ? "..." : producers.length} icon={<Users size={20} />} />
        <Metric label="Técnicos ativos" value={techniciansLoading ? "..." : activeTechnicians} icon={<UserCheck size={20} />} />
        <Metric label="Agências" value={options.agencies.length} icon={<MapPin size={20} />} />
        <Metric label="Projetistas" value={options.designers.length} icon={<Pencil size={20} />} />
      </div>

      <section className="registration-search-row" aria-label="Busca dos cadastros">
        <label className="search-field compact-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar produtor, CPF, técnico, agência, telefone ou login"
          />
        </label>
        <button className="ghost-button" type="button" onClick={() => setSearch("")}>
          Limpar busca
        </button>
      </section>

      <div className="registration-directory-grid">
        <section className="registration-panel" aria-label="Produtores cadastrados">
          <div className="registration-panel-heading">
            <div>
              <p className="eyebrow">Produtores</p>
              <h3>Base de produtores</h3>
            </div>
            <button className="icon-text-button" type="button" onClick={() => setProducerModalOpen(true)}>
              <Plus size={17} />
              Cadastrar
            </button>
          </div>

          <div className="registration-list">
            {recentProducers.map((producer) => (
              <article className="registration-list-item" key={producer.id}>
                <span className="registration-avatar"><Users size={18} /></span>
                <div>
                  <strong>{producer.name}</strong>
                  <small>
                    {maskCpf(producer.cpf)} · {producer.agency || "Sem agência"} · {producer.accessLogin}
                  </small>
                </div>
                <StatusBadge status={producer.processStatus} />
                <button className="icon-button" type="button" title="Copiar login" onClick={() => copyProducerAccess(producer)}>
                  <Copy size={17} />
                </button>
              </article>
            ))}
            {!recentProducers.length && (
              <div className="registration-empty">
                <Users size={22} />
                <strong>Nenhum produtor encontrado</strong>
                <p>Cadastre um produtor ou ajuste a busca para localizar a base existente.</p>
              </div>
            )}
          </div>
        </section>

        <section className="registration-panel" aria-label="Técnicos cadastrados">
          <div className="registration-panel-heading">
            <div>
              <p className="eyebrow">Equipe técnica</p>
              <h3>Técnicos e responsáveis</h3>
            </div>
            <button className="icon-text-button" type="button" onClick={() => setTechnicianModalOpen(true)}>
              <Plus size={17} />
              Cadastrar
            </button>
          </div>

          <div className="registration-list">
            {shownTechnicians.map((technician) => (
              <article className={`registration-list-item technician ${technician.active ? "" : "muted"}`} key={technician.id}>
                <span className="registration-avatar"><UserRound size={18} /></span>
                <div>
                  <strong>{technician.name}</strong>
                  <small>
                    {technician.role || "Equipe técnica"} · {technician.region || "Sem região"} · {technician.phone || "Sem telefone"}
                  </small>
                </div>
                <span className={`review-badge ${technician.active ? "done" : "returned"}`}>
                  {technician.active ? "ATIVO" : "INATIVO"}
                </span>
                <button className="icon-button" type="button" title="Editar técnico" onClick={() => setEditingTechnician(technician)}>
                  <Pencil size={17} />
                </button>
              </article>
            ))}
            {!shownTechnicians.length && (
              <div className="registration-empty">
                <UserCheck size={22} />
                <strong>Nenhum técnico cadastrado</strong>
                <p>Inclua a equipe que acompanha visitas, pendências e relatórios de campo.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="registration-aux-panel" aria-label="Cadastros auxiliares">
        <div>
          <p className="eyebrow">Cadastros auxiliares</p>
          <h3>Dados que já alimentam filtros do sistema</h3>
          <p>
            Agências, projetistas e técnicos ativos aparecem nos filtros operacionais. Depois, essa camada pode ser
            vinculada a uma base corporativa.
          </p>
        </div>
        <div className="registration-chip-grid">
          <RegistrationChipGroup title="Agências" values={options.agencies} empty="Sem agências" />
          <RegistrationChipGroup title="Projetistas" values={options.designers} empty="Sem projetistas" />
          <RegistrationChipGroup title="Técnicos ativos" values={options.technicians || []} empty="Sem técnicos ativos" />
        </div>
      </section>

      <Modal
        eyebrow="Novo cadastro"
        open={producerModalOpen}
        onClose={() => setProducerModalOpen(false)}
        title="Cadastrar produtor"
        size="large"
      >
        <ProducerRegistrationForm
          copyProducerAccess={copyProducerAccess}
          createProducer={createProducer}
          onCancel={() => setProducerModalOpen(false)}
          options={options}
        />
      </Modal>

      <Modal
        eyebrow="Equipe técnica"
        open={technicianModalOpen}
        onClose={() => setTechnicianModalOpen(false)}
        title="Cadastrar técnico"
        size="large"
      >
        <TechnicianRegistrationForm
          onCancel={() => setTechnicianModalOpen(false)}
          onSubmit={createTechnician}
        />
      </Modal>

      <Modal
        eyebrow="Equipe técnica"
        open={!!editingTechnician}
        onClose={() => setEditingTechnician(null)}
        title={editingTechnician?.name || "Técnico"}
        size="large"
      >
        <TechnicianRegistrationForm
          initial={editingTechnician}
          mode="edit"
          onCancel={() => setEditingTechnician(null)}
          onSubmit={(payload) => saveTechnician(editingTechnician.id, payload)}
        />
      </Modal>
    </section>
  );
}

function RegistrationChipGroup({ empty, title, values }) {
  const shownValues = values.slice(0, 12);

  return (
    <div className="registration-chip-card">
      <strong>{title}</strong>
      <div>
        {shownValues.map((value) => (
          <span key={value}>{value}</span>
        ))}
        {!shownValues.length && <em>{empty}</em>}
      </div>
    </div>
  );
}

function ProducerRegistrationForm({ copyProducerAccess, createProducer, onCancel, options }) {
  const [form, setForm] = useState(() => emptyProducerRegistrationForm());
  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const producer = await createProducer(form);
      setCreated(producer);
      setForm(emptyProducerRegistrationForm());
    } catch (requestError) {
      setError(requestError.message || "Não foi possível cadastrar o produtor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="registration-form" onSubmit={submit}>
      <Field label="Nome do produtor">
        <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} />
      </Field>

      <Field label="CPF">
        <input value={form.cpf} onChange={(event) => updateField("cpf", event.target.value)} />
      </Field>

      <Field label="Telefone">
        <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
      </Field>

      <Field label="Agência">
        <input list="registration-agencies" value={form.agency} onChange={(event) => updateField("agency", event.target.value)} />
        <datalist id="registration-agencies">
          {options.agencies.map((agency) => <option key={agency} value={agency} />)}
        </datalist>
      </Field>

      <Field label="Status">
        <select value={form.processStatus} onChange={(event) => updateField("processStatus", event.target.value)}>
          {(options.statuses.length ? options.statuses : Object.keys(STATUS_TONE)).map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </Field>

      <div className="inline-grid">
        <Field label="Área (ha)">
          <input type="number" min="0" step="0.01" value={form.areaHa} onChange={(event) => updateField("areaHa", event.target.value)} />
        </Field>
        <Field label="Ano de plantio">
          <input type="number" value={form.plantingYear} onChange={(event) => updateField("plantingYear", event.target.value)} />
        </Field>
      </div>

      <Field label="Projetista">
        <input list="registration-designers" value={form.designer} onChange={(event) => updateField("designer", event.target.value)} />
        <datalist id="registration-designers">
          {options.designers.map((designer) => <option key={designer} value={designer} />)}
        </datalist>
      </Field>

      <Field label="Endereço / localização">
        <textarea rows="3" value={form.address} onChange={(event) => updateField("address", event.target.value)} />
      </Field>

      {created && (
        <div className="registration-success-card">
          <div>
            <p className="eyebrow">Login gerado</p>
            <strong>{created.name}</strong>
            <span>Envie este acesso para o produtor preencher relatórios no portal.</span>
          </div>
          <div className="credential-line">
            <span>Usuário</span>
            <code>{created.accessLogin}</code>
          </div>
          <div className="credential-line">
            <span>Código</span>
            <code>{created.accessCode}</code>
          </div>
          <button className="primary-button wide" type="button" onClick={() => copyProducerAccess(created)}>
            <Copy size={17} />
            Copiar mensagem
          </button>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button className="ghost-button" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
          Cadastrar produtor
        </button>
      </div>
    </form>
  );
}

function TechnicianRegistrationForm({ initial, mode = "create", onCancel, onSubmit }) {
  const [form, setForm] = useState(() => ({ ...emptyTechnicianForm(), ...(initial || {}) }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...emptyTechnicianForm(), ...(initial || {}) });
    setError("");
  }, [initial?.id]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSubmit(form);
      if (mode === "create") {
        setForm(emptyTechnicianForm());
      }
      onCancel?.();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível salvar o técnico.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="registration-form technician-form" onSubmit={submit}>
      <Field label="Nome do técnico">
        <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} />
      </Field>

      <Field label="Telefone">
        <input value={form.phone || ""} onChange={(event) => updateField("phone", event.target.value)} />
      </Field>

      <Field label="E-mail">
        <input type="email" value={form.email || ""} onChange={(event) => updateField("email", event.target.value)} />
      </Field>

      <Field label="Função">
        <input value={form.role || ""} onChange={(event) => updateField("role", event.target.value)} />
      </Field>

      <Field label="Região / agência">
        <input value={form.region || ""} onChange={(event) => updateField("region", event.target.value)} />
      </Field>

      <label className="checkbox-line registration-checkbox">
        <input
          type="checkbox"
          checked={Boolean(form.active)}
          onChange={(event) => updateField("active", event.target.checked)}
        />
        Técnico ativo no sistema
      </label>

      <Field label="Observações">
        <textarea rows="3" value={form.notes || ""} onChange={(event) => updateField("notes", event.target.value)} />
      </Field>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button className="ghost-button" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
          {mode === "edit" ? "Salvar técnico" : "Cadastrar técnico"}
        </button>
      </div>
    </form>
  );
}

function LoginWorkspace({ copyProducerAccess, loading, producers, selected, selectedId, setSelectedId }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const pagination = usePagedItems(producers, TABLE_PAGE_SIZE);

  return (
    <div className="content-grid">
      <section className="table-shell" aria-label="Logins">
        <div className="table-heading">
          <div>
            <h2>Logins</h2>
            <p>{loading ? "Carregando..." : `${producers.length} acessos encontrados`}</p>
          </div>
          <div className="table-heading-actions">
            {loading && <Loader2 className="spin" size={20} />}
            <button className="icon-text-button" type="button" disabled={!selected} onClick={() => setDetailOpen(true)}>
              <KeyRound size={17} />
              Abrir acesso
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produtor</th>
                <th>Usuário</th>
                <th>Código</th>
                <th>Agência</th>
                <th>Relatório</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {pagination.items.map((producer) => (
                <tr
                  className={producer.id === selectedId ? "selected-row" : ""}
                  key={producer.id}
                  onClick={() => {
                    setSelectedId(producer.id);
                    setDetailOpen(true);
                  }}
                >
                  <td>
                    <strong>{producer.name}</strong>
                    <span>{maskCpf(producer.cpf)}</span>
                  </td>
                  <td><code>{producer.accessLogin}</code></td>
                  <td><code>{producer.accessCode}</code></td>
                  <td>{producer.agency || "-"}</td>
                  <td>{producer.lastReportAt ? <span className="report-ok">{formatDateTime(producer.lastReportAt)}</span> : <span className="report-pending">Pendente</span>}</td>
                  <td>
                    <button
                      className="icon-button"
                      type="button"
                      title="Copiar login"
                      onClick={(event) => {
                        event.stopPropagation();
                        copyProducerAccess(producer);
                      }}
                    >
                      <Copy size={17} />
                    </button>
                  </td>
                </tr>
              ))}
              {!pagination.items.length && (
                <tr>
                  <td colSpan="6">
                    <span className="empty-row">Nenhum login encontrado.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls pagination={pagination} label="logins" />
      </section>

      <Modal
        eyebrow="Credencial do produtor"
        open={detailOpen && !!selected}
        onClose={() => setDetailOpen(false)}
        title={selected?.name || "Acesso"}
        size="small"
      >
        <aside className="detail-panel" aria-label="Credencial">
          {selected ? (
            <>
              <div className="detail-header">
                <div>
                  <p className="eyebrow">Acesso</p>
                  <h2>{selected.name}</h2>
                </div>
                <KeyRound size={22} />
              </div>
              <div className="detail-section no-border">
                <div className="credential-line">
                  <span>Usuário</span>
                  <code>{selected.accessLogin}</code>
                </div>
                <div className="credential-line">
                  <span>Código</span>
                  <code>{selected.accessCode}</code>
                </div>
                <button className="primary-button wide" type="button" onClick={() => copyProducerAccess(selected)}>
                  <Copy size={17} />
                  Copiar mensagem
                </button>
              </div>
            </>
          ) : (
            <p>Nenhum produtor encontrado.</p>
          )}
        </aside>
      </Modal>
    </div>
  );
}

function ReportsWorkspace({ createTask, createVisit, filters, loading, onChange, onReset, onReviewSave, options, reports, summary }) {
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const pagination = usePagedItems(reports, REPORT_PAGE_SIZE);
  const selectedReport = reports.find((report) => report.id === selectedReportId) || pagination.items[0] || reports[0] || null;
  const todayReports = reports.filter((report) => isToday(report.createdAt)).length;
  const priorityReports = reports.filter((report) => getReportPriority(report).tone !== "normal").length;
  const pendingReviews = summary?.byReviewStatus?.PENDENTE ?? reports.filter((report) => (report.reviewStatus || "PENDENTE") === "PENDENTE").length;

  useEffect(() => {
    setSelectedReportId((current) => {
      if (current && reports.some((report) => report.id === current)) return current;
      return reports[0]?.id || null;
    });
  }, [reports]);

  useEffect(() => {
    if (!pagination.items.length) return;
    if (!pagination.items.some((report) => report.id === selectedReportId)) {
      setSelectedReportId(pagination.items[0].id);
    }
  }, [pagination.page, reports]);

  return (
    <>
      <section className="overview-band report-summary-band">
        <Metric label="Relatórios" value={summary?.total ?? 0} icon={<FileText size={21} />} />
        <Metric label="Recebidos hoje" value={todayReports} icon={<CalendarDays size={21} />} />
        <Metric label="Pendentes" value={pendingReviews} icon={<ClipboardList size={21} />} />
        <Metric label="Prioridade" value={priorityReports} icon={<Activity size={21} />} />
      </section>

      <section className="filters report-filters" aria-label="Filtros de relatórios">
        <label className="search-field">
          <Search size={18} />
          <input value={filters.search} onChange={(event) => onChange("search", event.target.value)} placeholder="Buscar produtor, CPF ou observação" />
        </label>

        <SelectFilter value={filters.needsVisit} onChange={(value) => onChange("needsVisit", value)}>
          <option value="">Todas as visitas</option>
          <option value="yes">Precisa visita</option>
        </SelectFilter>

        <SelectFilter value={filters.status} onChange={(value) => onChange("status", value)}>
          <option value="">Todos os status</option>
          {options.statuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </SelectFilter>

        <SelectFilter value={filters.agency} onChange={(value) => onChange("agency", value)}>
          <option value="">Todas as agências</option>
          {options.agencies.map((agency) => (
            <option key={agency} value={agency}>{agency}</option>
          ))}
        </SelectFilter>

        <SelectFilter value={filters.reviewStatus} onChange={(value) => onChange("reviewStatus", value)}>
          <option value="">Todas as análises</option>
          {REPORT_REVIEW_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </SelectFilter>

        <button className="ghost-button" type="button" onClick={onReset}>
          Limpar
        </button>
      </section>

      <div className="reports-grid">
        <section className="table-shell" aria-label="Relatórios">
          <div className="table-heading">
            <div>
              <h2>Relatórios</h2>
              <p>{loading ? "Carregando..." : `${reports.length} registros encontrados`}</p>
            </div>
            <div className="table-heading-actions">
              {loading && <Loader2 className="spin" size={20} />}
              <button className="icon-text-button" type="button" disabled={!selectedReport} onClick={() => setDetailOpen(true)}>
                <Pencil size={17} />
                Abrir análise
              </button>
            </div>
          </div>

          <div className="table-wrap reports-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produtor</th>
                  <th>Recebido</th>
                  <th>Situação</th>
                  <th>Tratativa</th>
                  <th>Contato</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((report) => {
                  const priority = getReportPriority(report);
                  return (
                    <tr
                      className={report.id === selectedReport?.id ? "selected-row" : ""}
                      key={report.id}
                      onClick={() => {
                        setSelectedReportId(report.id);
                        setDetailOpen(true);
                      }}
                    >
                      <td>
                        <strong>{report.producerName}</strong>
                        <span>{maskCpf(report.producerCpf)} · {report.producerAgency || "-"}</span>
                      </td>
                      <td>
                        <strong>{formatDateTime(report.createdAt)}</strong>
                        <span>{formatDate(report.reportDate)}</span>
                      </td>
                      <td>{report.areaStatus || "-"}</td>
                      <td>
                        <div className="table-badge-stack">
                          <StatusBadge status={report.processStatus} />
                          <ReviewBadge status={report.reviewStatus} />
                          <PriorityBadge priority={priority} />
                        </div>
                      </td>
                      <td>{report.contactPhone || "-"}</td>
                    </tr>
                  );
                })}
                {!loading && pagination.items.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      <span className="empty-row">Nenhum relatório encontrado.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls pagination={pagination} label="relatórios" />
        </section>
      </div>

      <Modal
        eyebrow="Análise técnica"
        open={detailOpen && !!selectedReport}
        onClose={() => setDetailOpen(false)}
        title={selectedReport?.producerName || "Relatório"}
        size="xl"
      >
        <ReportDetailPanel createTask={createTask} createVisit={createVisit} onReviewSave={onReviewSave} report={selectedReport} />
      </Modal>
    </>
  );
}

function ReportDetailPanel({ createTask, createVisit, onReviewSave, report }) {
  const [copied, setCopied] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [creatingVisit, setCreatingVisit] = useState(false);
  const [visitSaved, setVisitSaved] = useState(false);
  const [visitError, setVisitError] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskSaved, setTaskSaved] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [reviewForm, setReviewForm] = useState({
    reviewStatus: "PENDENTE",
    technicalNote: ""
  });
  const [visitForm, setVisitForm] = useState({
    scheduledDate: "",
    technician: "",
    priority: "ALTA",
    objective: ""
  });
  const [taskForm, setTaskForm] = useState({
    title: "",
    assignee: "",
    dueDate: "",
    priority: "ALTA",
    notes: ""
  });

  useEffect(() => {
    setCopied(false);
    setReviewSaved(false);
    setReviewError("");
    setVisitSaved(false);
    setVisitError("");
    setTaskSaved(false);
    setTaskError("");
    setReviewForm({
      reviewStatus: report?.reviewStatus || "PENDENTE",
      technicalNote: report?.technicalNote || ""
    });
    setVisitForm({
      scheduledDate: "",
      technician: "",
      priority: report?.needsVisit ? "ALTA" : "NORMAL",
      objective: report ? `Verificar ${report.areaStatus || "situação informada"} - ${report.producerName}` : ""
    });
    setTaskForm({
      title: report ? `Tratar relatório de ${report.producerName}` : "",
      assignee: "",
      dueDate: "",
      priority: report?.needsVisit ? "ALTA" : "NORMAL",
      notes: report?.areaStatus ? `Situação informada: ${report.areaStatus}` : ""
    });
  }, [report?.id]);

  if (!report) {
    return (
      <aside className="detail-panel report-detail-panel" aria-label="Detalhe do relatório">
        <div className="empty-history">
          <FileText size={22} />
          <strong>Nenhum relatório selecionado</strong>
          <p>Selecione um registro na tabela para analisar os dados enviados pelo produtor.</p>
        </div>
      </aside>
    );
  }

  const priority = getReportPriority(report);

  async function copySummary() {
    await navigator.clipboard.writeText(buildReportTechnicalSummary(report));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  async function submitReview(event) {
    event.preventDefault();
    setSavingReview(true);
    setReviewSaved(false);
    setReviewError("");

    try {
      await onReviewSave(report.id, reviewForm);
      setReviewSaved(true);
      window.setTimeout(() => setReviewSaved(false), 2400);
    } catch (requestError) {
      setReviewError(requestError.message || "Não foi possível salvar a análise.");
    } finally {
      setSavingReview(false);
    }
  }

  async function submitVisit(event) {
    event.preventDefault();
    setCreatingVisit(true);
    setVisitSaved(false);
    setVisitError("");

    try {
      await createVisit({
        reportId: report.id,
        producerId: report.producerId,
        scheduledDate: visitForm.scheduledDate,
        technician: visitForm.technician,
        priority: visitForm.priority,
        objective: visitForm.objective,
        technicalNote: visitForm.scheduledDate
          ? `Visita técnica programada para ${formatDate(visitForm.scheduledDate)}. ${visitForm.objective}`
          : `Visita técnica programada. ${visitForm.objective}`
      });
      setVisitSaved(true);
      setReviewForm((current) => ({ ...current, reviewStatus: "VISITA PROGRAMADA" }));
      window.setTimeout(() => setVisitSaved(false), 2400);
    } catch (requestError) {
      setVisitError(requestError.message || "Não foi possível programar a visita.");
    } finally {
      setCreatingVisit(false);
    }
  }

  async function submitTask(event) {
    event.preventDefault();
    setCreatingTask(true);
    setTaskSaved(false);
    setTaskError("");

    try {
      await createTask({
        producerId: report.producerId,
        reportId: report.id,
        title: taskForm.title,
        type: "RELATÓRIO",
        priority: taskForm.priority,
        assignee: taskForm.assignee,
        dueDate: taskForm.dueDate,
        notes: taskForm.notes
      });
      setTaskSaved(true);
      window.setTimeout(() => setTaskSaved(false), 2400);
    } catch (requestError) {
      setTaskError(requestError.message || "Não foi possível criar a pendência.");
    } finally {
      setCreatingTask(false);
    }
  }

  return (
    <aside className="detail-panel report-detail-panel" aria-label="Detalhe do relatório">
      <div className="detail-header">
        <div>
          <p className="eyebrow">Relatório selecionado</p>
          <h2>{report.producerName}</h2>
        </div>
        <PriorityBadge priority={priority} />
      </div>

      <dl className="detail-list report-detail-list">
        <div>
          <dt>Recebido</dt>
          <dd>{formatDateTime(report.createdAt)}</dd>
        </div>
        <div>
          <dt>Telefone</dt>
          <dd>{report.contactPhone || "Não informado"}</dd>
        </div>
        <div>
          <dt>Agência</dt>
          <dd>{report.producerAgency || "-"}</dd>
        </div>
        <div>
          <dt>CPF</dt>
          <dd>{maskCpf(report.producerCpf)}</dd>
        </div>
      </dl>

      <div className="detail-section">
        <h3>Análise técnica</h3>
        <div className="report-detail-grid">
          <span>Situação: <strong>{report.areaStatus || "-"}</strong></span>
          <span>Status: <strong>{report.processStatus || "-"}</strong></span>
          <span>Área: <strong>{formatArea(report.areaHa)} ha</strong></span>
          <span>Plantio: <strong>{report.plantingYear || "-"}</strong></span>
          <span>Cultura: <strong>{report.crop || "-"}</strong></span>
          <span>Visita: <strong>{report.needsVisit ? "Solicitada" : "Não solicitada"}</strong></span>
        </div>
      </div>

      <div className="detail-section">
        <h3>Relato do produtor</h3>
        <p>{report.productionNote || "Sem andamento informado."}</p>
        <p>{report.notes || "Sem observações adicionais."}</p>
      </div>

      <form className="detail-section review-editor" onSubmit={submitReview}>
        <div className="review-editor-heading">
          <div>
            <h3>Análise da equipe técnica</h3>
            <p>Controle interno para acompanhar tratativa, visita e retorno ao produtor.</p>
          </div>
          <ReviewBadge status={reviewForm.reviewStatus} />
        </div>

        <Field label="Status da análise">
          <select
            value={reviewForm.reviewStatus}
            onChange={(event) => setReviewForm((current) => ({ ...current, reviewStatus: event.target.value }))}
          >
            {REPORT_REVIEW_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </Field>

        <Field label="Observação técnica">
          <textarea
            rows="4"
            value={reviewForm.technicalNote}
            onChange={(event) => setReviewForm((current) => ({ ...current, technicalNote: event.target.value }))}
            placeholder="Ex.: Validar documentação, programar visita, retornar ao produtor..."
          />
        </Field>

        {report.reviewedAt && (
          <p className="review-meta">
            Última análise: {formatDateTime(report.reviewedAt)} por {report.reviewedBy || "equipe técnica"}.
          </p>
        )}

        {reviewError && <p className="form-error">{reviewError}</p>}

        <button className="primary-button wide" type="submit" disabled={savingReview}>
          {savingReview ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
          {reviewSaved ? "Análise salva" : "Salvar análise"}
        </button>
      </form>

      <form className="detail-section visit-scheduler" onSubmit={submitVisit}>
        <div className="review-editor-heading">
          <div>
            <h3>Programar visita</h3>
            <p>Gera uma agenda técnica vinculada a este relatório.</p>
          </div>
          <VisitPriorityBadge priority={visitForm.priority} />
        </div>

        <Field label="Data da visita">
          <input
            type="date"
            value={visitForm.scheduledDate}
            onChange={(event) => setVisitForm((current) => ({ ...current, scheduledDate: event.target.value }))}
          />
        </Field>

        <div className="inline-grid">
          <Field label="Técnico responsável">
            <input
              value={visitForm.technician}
              onChange={(event) => setVisitForm((current) => ({ ...current, technician: event.target.value }))}
              placeholder="Nome do técnico"
            />
          </Field>

          <Field label="Prioridade">
            <select
              value={visitForm.priority}
              onChange={(event) => setVisitForm((current) => ({ ...current, priority: event.target.value }))}
            >
              {VISIT_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Objetivo da visita">
          <textarea
            rows="3"
            value={visitForm.objective}
            onChange={(event) => setVisitForm((current) => ({ ...current, objective: event.target.value }))}
          />
        </Field>

        {visitError && <p className="form-error">{visitError}</p>}

        <button className="primary-button wide" type="submit" disabled={creatingVisit}>
          {creatingVisit ? <Loader2 className="spin" size={17} /> : <CalendarDays size={17} />}
          {visitSaved ? "Visita programada" : "Programar visita"}
        </button>
      </form>

      <form className="detail-section task-creator" onSubmit={submitTask}>
        <div className="review-editor-heading">
          <div>
            <h3>Criar pendência</h3>
            <p>Registra uma tarefa interna para acompanhamento da equipe.</p>
          </div>
          <VisitPriorityBadge priority={taskForm.priority} />
        </div>

        <Field label="Título">
          <input
            value={taskForm.title}
            onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
            required
          />
        </Field>

        <div className="inline-grid">
          <Field label="Responsável">
            <input
              value={taskForm.assignee}
              onChange={(event) => setTaskForm((current) => ({ ...current, assignee: event.target.value }))}
              placeholder="Equipe ou técnico"
            />
          </Field>

          <Field label="Prazo">
            <input
              type="date"
              value={taskForm.dueDate}
              onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))}
            />
          </Field>
        </div>

        <Field label="Prioridade">
          <select
            value={taskForm.priority}
            onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))}
          >
            {VISIT_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </Field>

        <Field label="Observação">
          <textarea
            rows="3"
            value={taskForm.notes}
            onChange={(event) => setTaskForm((current) => ({ ...current, notes: event.target.value }))}
          />
        </Field>

        {taskError && <p className="form-error">{taskError}</p>}

        <button className="primary-button wide" type="submit" disabled={creatingTask}>
          {creatingTask ? <Loader2 className="spin" size={17} /> : <Check size={17} />}
          {taskSaved ? "Pendência criada" : "Criar pendência"}
        </button>
      </form>

      <div className="detail-section">
        <h3>Endereço informado</h3>
        <p>{report.address || "Não informado."}</p>
      </div>

      <button className="primary-button wide" type="button" onClick={copySummary}>
        <Copy size={17} />
        {copied ? "Resumo copiado" : "Copiar resumo técnico"}
      </button>
    </aside>
  );
}

function VisitsWorkspace({ createTask, filters, loading, onChange, onReset, onVisitSave, options, summary, visits }) {
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const pagination = usePagedItems(visits, VISIT_PAGE_SIZE);
  const selectedVisit = visits.find((visit) => visit.id === selectedVisitId) || pagination.items[0] || visits[0] || null;

  useEffect(() => {
    setSelectedVisitId((current) => {
      if (current && visits.some((visit) => visit.id === current)) return current;
      return visits[0]?.id || null;
    });
  }, [visits]);

  useEffect(() => {
    if (!pagination.items.length) return;
    if (!pagination.items.some((visit) => visit.id === selectedVisitId)) {
      setSelectedVisitId(pagination.items[0].id);
    }
  }, [pagination.page, visits]);

  return (
    <>
      <section className="overview-band report-summary-band">
        <Metric label="Visitas" value={summary?.total ?? 0} icon={<CalendarDays size={21} />} />
        <Metric label="Em aberto" value={summary?.open ?? 0} icon={<Activity size={21} />} />
        <Metric label="Programadas" value={summary?.scheduled ?? 0} icon={<ClipboardList size={21} />} />
        <Metric label="Alta prioridade" value={summary?.urgent ?? 0} icon={<UserCheck size={21} />} />
      </section>

      <section className="filters report-filters" aria-label="Filtros de visitas">
        <label className="search-field">
          <Search size={18} />
          <input
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
            placeholder="Buscar produtor, CPF, endereço ou objetivo"
          />
        </label>

        <SelectFilter value={filters.status} onChange={(value) => onChange("status", value)}>
          <option value="">Todos os status</option>
          {(options.visitStatuses || VISIT_STATUSES).map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </SelectFilter>

        <SelectFilter value={filters.priority} onChange={(value) => onChange("priority", value)}>
          <option value="">Todas as prioridades</option>
          {(options.visitPriorities || VISIT_PRIORITIES).map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </SelectFilter>

        <SelectFilter value={filters.agency} onChange={(value) => onChange("agency", value)}>
          <option value="">Todas as agências</option>
          {options.agencies.map((agency) => (
            <option key={agency} value={agency}>{agency}</option>
          ))}
        </SelectFilter>

        <label className="search-field compact-search">
          <Search size={18} />
          <input
            value={filters.technician}
            onChange={(event) => onChange("technician", event.target.value)}
            placeholder="Técnico responsável"
          />
        </label>

        <button className="ghost-button" type="button" onClick={onReset}>
          Limpar
        </button>
      </section>

      <div className="visits-grid">
        <section className="table-shell" aria-label="Visitas técnicas">
          <div className="table-heading">
            <div>
              <h2>Agenda técnica</h2>
              <p>{loading ? "Carregando..." : `${visits.length} visitas encontradas`}</p>
            </div>
            <div className="table-heading-actions">
              {loading && <Loader2 className="spin" size={20} />}
              <button className="icon-text-button" type="button" disabled={!selectedVisit} onClick={() => setDetailOpen(true)}>
                <Pencil size={17} />
                Abrir visita
              </button>
            </div>
          </div>

          <div className="table-wrap visits-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produtor</th>
                  <th>Agenda</th>
                  <th>Técnico</th>
                  <th>Status</th>
                  <th>Prioridade</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((visit) => (
                  <tr
                    className={visit.id === selectedVisit?.id ? "selected-row" : ""}
                    key={visit.id}
                    onClick={() => {
                      setSelectedVisitId(visit.id);
                      setDetailOpen(true);
                    }}
                  >
                    <td>
                      <strong>{visit.producerName}</strong>
                      <span>{maskCpf(visit.producerCpf)} · {visit.producerAgency || "-"}</span>
                    </td>
                    <td>
                      <strong>{visit.scheduledDate ? formatDate(visit.scheduledDate) : "Sem data"}</strong>
                      <span>{visit.reportAreaStatus || visit.objective || "-"}</span>
                    </td>
                    <td>{visit.technician || "Equipe técnica"}</td>
                    <td><VisitStatusBadge status={visit.status} /></td>
                    <td><VisitPriorityBadge priority={visit.priority} /></td>
                  </tr>
                ))}
                {!loading && pagination.items.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      <span className="empty-row">Nenhuma visita técnica encontrada.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls pagination={pagination} label="visitas" />
        </section>
      </div>

      <Modal
        eyebrow="Agenda técnica"
        open={detailOpen && !!selectedVisit}
        onClose={() => setDetailOpen(false)}
        title={selectedVisit?.producerName || "Visita"}
        size="xl"
      >
        <VisitDetailPanel createTask={createTask} onVisitSave={onVisitSave} visit={selectedVisit} />
      </Modal>
    </>
  );
}

function VisitDetailPanel({ createTask, onVisitSave, visit }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskSaved, setTaskSaved] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [form, setForm] = useState({
    status: "PROGRAMADA",
    priority: "NORMAL",
    scheduledDate: "",
    technician: "",
    objective: "",
    resultNote: ""
  });
  const [taskForm, setTaskForm] = useState({
    title: "",
    assignee: "",
    dueDate: "",
    priority: "NORMAL",
    notes: ""
  });

  useEffect(() => {
    setSaved(false);
    setError("");
    setTaskSaved(false);
    setTaskError("");
    setForm({
      status: visit?.status || "PROGRAMADA",
      priority: visit?.priority || "NORMAL",
      scheduledDate: visit?.scheduledDate || "",
      technician: visit?.technician || "",
      objective: visit?.objective || "",
      resultNote: visit?.resultNote || ""
    });
    setTaskForm({
      title: visit ? `Encaminhar visita de ${visit.producerName}` : "",
      assignee: visit?.technician || "",
      dueDate: visit?.scheduledDate || "",
      priority: visit?.priority || "NORMAL",
      notes: visit?.objective || ""
    });
  }, [visit?.id]);

  if (!visit) {
    return (
      <aside className="detail-panel visit-detail-panel" aria-label="Detalhe da visita">
        <div className="empty-history">
          <CalendarDays size={22} />
          <strong>Nenhuma visita selecionada</strong>
          <p>Programe uma visita a partir de um relatório ou selecione um registro da agenda técnica.</p>
        </div>
      </aside>
    );
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      await onVisitSave(visit.id, form);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2400);
    } catch (requestError) {
      setError(requestError.message || "Não foi possível salvar a visita.");
    } finally {
      setSaving(false);
    }
  }

  async function submitTask(event) {
    event.preventDefault();
    setCreatingTask(true);
    setTaskSaved(false);
    setTaskError("");

    try {
      await createTask({
        producerId: visit.producerId,
        reportId: visit.reportId,
        visitId: visit.id,
        title: taskForm.title,
        type: "VISITA",
        priority: taskForm.priority,
        assignee: taskForm.assignee,
        dueDate: taskForm.dueDate,
        notes: taskForm.notes
      });
      setTaskSaved(true);
      window.setTimeout(() => setTaskSaved(false), 2400);
    } catch (requestError) {
      setTaskError(requestError.message || "Não foi possível criar a pendência.");
    } finally {
      setCreatingTask(false);
    }
  }

  return (
    <aside className="detail-panel visit-detail-panel" aria-label="Detalhe da visita">
      <div className="detail-header">
        <div>
          <p className="eyebrow">Visita selecionada</p>
          <h2>{visit.producerName}</h2>
        </div>
        <VisitPriorityBadge priority={visit.priority} />
      </div>

      <dl className="detail-list report-detail-list">
        <div>
          <dt>Agendada</dt>
          <dd>{visit.scheduledDate ? formatDate(visit.scheduledDate) : "Sem data"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd><VisitStatusBadge status={visit.status} /></dd>
        </div>
        <div>
          <dt>Agência</dt>
          <dd>{visit.producerAgency || "-"}</dd>
        </div>
        <div>
          <dt>CPF</dt>
          <dd>{maskCpf(visit.producerCpf)}</dd>
        </div>
      </dl>

      <form className="detail-section visit-editor" onSubmit={submit}>
        <h3>Controle da visita</h3>

        <div className="inline-grid">
          <Field label="Status">
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              {VISIT_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </Field>

          <Field label="Prioridade">
            <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
              {VISIT_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Data agendada">
          <input
            type="date"
            value={form.scheduledDate}
            onChange={(event) => setForm((current) => ({ ...current, scheduledDate: event.target.value }))}
          />
        </Field>

        <Field label="Técnico responsável">
          <input
            value={form.technician}
            onChange={(event) => setForm((current) => ({ ...current, technician: event.target.value }))}
          />
        </Field>

        <Field label="Objetivo">
          <textarea
            rows="3"
            value={form.objective}
            onChange={(event) => setForm((current) => ({ ...current, objective: event.target.value }))}
          />
        </Field>

        <Field label="Resultado / encaminhamento">
          <textarea
            rows="4"
            value={form.resultNote}
            onChange={(event) => setForm((current) => ({ ...current, resultNote: event.target.value }))}
          />
        </Field>

        {visit.updatedAt && <p className="review-meta">Atualizada em {formatDateTime(visit.updatedAt)}.</p>}
        {error && <p className="form-error">{error}</p>}

        <button className="primary-button wide" type="submit" disabled={saving}>
          {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
          {saved ? "Visita salva" : "Salvar visita"}
        </button>
      </form>

      <form className="detail-section task-creator" onSubmit={submitTask}>
        <div className="review-editor-heading">
          <div>
            <h3>Criar pendência</h3>
            <p>Use para retorno, documento, contato ou conclusão pós-visita.</p>
          </div>
          <VisitPriorityBadge priority={taskForm.priority} />
        </div>

        <Field label="Título">
          <input
            value={taskForm.title}
            onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
            required
          />
        </Field>

        <div className="inline-grid">
          <Field label="Responsável">
            <input
              value={taskForm.assignee}
              onChange={(event) => setTaskForm((current) => ({ ...current, assignee: event.target.value }))}
            />
          </Field>

          <Field label="Prazo">
            <input
              type="date"
              value={taskForm.dueDate}
              onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))}
            />
          </Field>
        </div>

        <Field label="Prioridade">
          <select
            value={taskForm.priority}
            onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))}
          >
            {VISIT_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </Field>

        <Field label="Observação">
          <textarea
            rows="3"
            value={taskForm.notes}
            onChange={(event) => setTaskForm((current) => ({ ...current, notes: event.target.value }))}
          />
        </Field>

        {taskError && <p className="form-error">{taskError}</p>}

        <button className="primary-button wide" type="submit" disabled={creatingTask}>
          {creatingTask ? <Loader2 className="spin" size={17} /> : <Check size={17} />}
          {taskSaved ? "Pendência criada" : "Criar pendência"}
        </button>
      </form>

      <div className="detail-section">
        <h3>Local e contexto</h3>
        <p>{visit.producerAddress || "Endereço não informado."}</p>
        <p>{visit.objective || "Sem objetivo registrado."}</p>
      </div>
    </aside>
  );
}

function TasksWorkspace({ filters, loading, onChange, onReset, onTaskSave, options, summary, tasks }) {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const pagination = usePagedItems(tasks, TASK_PAGE_SIZE);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || pagination.items[0] || tasks[0] || null;

  useEffect(() => {
    setSelectedTaskId((current) => {
      if (current && tasks.some((task) => task.id === current)) return current;
      return tasks[0]?.id || null;
    });
  }, [tasks]);

  useEffect(() => {
    if (!pagination.items.length) return;
    if (!pagination.items.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(pagination.items[0].id);
    }
  }, [pagination.page, tasks]);

  return (
    <>
      <section className="overview-band report-summary-band">
        <Metric label="Pendências" value={summary?.total ?? 0} icon={<ClipboardList size={21} />} />
        <Metric label="Em aberto" value={summary?.open ?? 0} icon={<Activity size={21} />} />
        <Metric label="Atrasadas" value={summary?.overdue ?? 0} icon={<CalendarDays size={21} />} />
        <Metric label="Alta prioridade" value={summary?.urgent ?? 0} icon={<UserCheck size={21} />} />
      </section>

      <section className="filters report-filters" aria-label="Filtros de pendências">
        <label className="search-field">
          <Search size={18} />
          <input
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
            placeholder="Buscar título, produtor, CPF, responsável ou observação"
          />
        </label>

        <SelectFilter value={filters.status} onChange={(value) => onChange("status", value)}>
          <option value="">Todos os status</option>
          {(options.taskStatuses || TASK_STATUSES).map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </SelectFilter>

        <SelectFilter value={filters.priority} onChange={(value) => onChange("priority", value)}>
          <option value="">Todas as prioridades</option>
          {(options.visitPriorities || VISIT_PRIORITIES).map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </SelectFilter>

        <SelectFilter value={filters.type} onChange={(value) => onChange("type", value)}>
          <option value="">Todos os tipos</option>
          {(options.taskTypes || TASK_TYPES).map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </SelectFilter>

        <SelectFilter value={filters.agency} onChange={(value) => onChange("agency", value)}>
          <option value="">Todas as agências</option>
          {options.agencies.map((agency) => (
            <option key={agency} value={agency}>{agency}</option>
          ))}
        </SelectFilter>

        <label className="search-field compact-search">
          <Search size={18} />
          <input
            value={filters.assignee}
            onChange={(event) => onChange("assignee", event.target.value)}
            placeholder="Responsável"
          />
        </label>

        <button className="ghost-button" type="button" onClick={onReset}>
          Limpar
        </button>
      </section>

      <div className="tasks-grid">
        <section className="table-shell" aria-label="Pendências internas">
          <div className="table-heading">
            <div>
              <h2>Fila de trabalho</h2>
              <p>{loading ? "Carregando..." : `${tasks.length} pendências encontradas`}</p>
            </div>
            <div className="table-heading-actions">
              {loading && <Loader2 className="spin" size={20} />}
              <button className="icon-text-button" type="button" disabled={!selectedTask} onClick={() => setDetailOpen(true)}>
                <Pencil size={17} />
                Abrir pendência
              </button>
            </div>
          </div>

          <div className="table-wrap tasks-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pendência</th>
                  <th>Responsável</th>
                  <th>Prazo</th>
                  <th>Status</th>
                  <th>Prioridade</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((task) => (
                  <tr
                    className={task.id === selectedTask?.id ? "selected-row" : ""}
                    key={task.id}
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setDetailOpen(true);
                    }}
                  >
                    <td>
                      <strong>{task.title}</strong>
                      <span>{task.type} · {task.producerName || "Sem produtor vinculado"}</span>
                    </td>
                    <td>{task.assignee || "Equipe técnica"}</td>
                    <td>
                      <strong>{task.dueDate ? formatDate(task.dueDate) : "Sem prazo"}</strong>
                      <span>{task.producerAgency || "-"}</span>
                    </td>
                    <td><TaskStatusBadge status={task.status} /></td>
                    <td><VisitPriorityBadge priority={task.priority} /></td>
                  </tr>
                ))}
                {!loading && pagination.items.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      <span className="empty-row">Nenhuma pendência encontrada.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls pagination={pagination} label="pendências" />
        </section>
      </div>

      <Modal
        eyebrow="Pendência interna"
        open={detailOpen && !!selectedTask}
        onClose={() => setDetailOpen(false)}
        title={selectedTask?.title || "Pendência"}
        size="large"
      >
        <TaskDetailPanel onTaskSave={onTaskSave} task={selectedTask} />
      </Modal>
    </>
  );
}

function TaskDetailPanel({ onTaskSave, task }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    type: "OUTRO",
    status: "ABERTA",
    priority: "NORMAL",
    assignee: "",
    dueDate: "",
    notes: ""
  });

  useEffect(() => {
    setSaved(false);
    setError("");
    setForm({
      title: task?.title || "",
      type: task?.type || "OUTRO",
      status: task?.status || "ABERTA",
      priority: task?.priority || "NORMAL",
      assignee: task?.assignee || "",
      dueDate: task?.dueDate || "",
      notes: task?.notes || ""
    });
  }, [task?.id]);

  if (!task) {
    return (
      <aside className="detail-panel task-detail-panel" aria-label="Detalhe da pendência">
        <div className="empty-history">
          <ClipboardList size={22} />
          <strong>Nenhuma pendência selecionada</strong>
          <p>Crie uma pendência a partir de um relatório ou visita para organizar a fila da equipe.</p>
        </div>
      </aside>
    );
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      await onTaskSave(task.id, form);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2400);
    } catch (requestError) {
      setError(requestError.message || "Não foi possível salvar a pendência.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="detail-panel task-detail-panel" aria-label="Detalhe da pendência">
      <div className="detail-header">
        <div>
          <p className="eyebrow">Pendência selecionada</p>
          <h2>{task.title}</h2>
        </div>
        <VisitPriorityBadge priority={task.priority} />
      </div>

      <dl className="detail-list report-detail-list">
        <div>
          <dt>Produtor</dt>
          <dd>{task.producerName || "-"}</dd>
        </div>
        <div>
          <dt>Tipo</dt>
          <dd>{task.type}</dd>
        </div>
        <div>
          <dt>Prazo</dt>
          <dd>{task.dueDate ? formatDate(task.dueDate) : "Sem prazo"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd><TaskStatusBadge status={task.status} /></dd>
        </div>
      </dl>

      <form className="detail-section task-editor" onSubmit={submit}>
        <h3>Controle da pendência</h3>

        <Field label="Título">
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            required
          />
        </Field>

        <div className="inline-grid">
          <Field label="Tipo">
            <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
              {TASK_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="inline-grid">
          <Field label="Prioridade">
            <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
              {VISIT_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </Field>

          <Field label="Prazo">
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
            />
          </Field>
        </div>

        <Field label="Responsável">
          <input
            value={form.assignee}
            onChange={(event) => setForm((current) => ({ ...current, assignee: event.target.value }))}
          />
        </Field>

        <Field label="Observações">
          <textarea
            rows="4"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          />
        </Field>

        {task.updatedAt && <p className="review-meta">Atualizada em {formatDateTime(task.updatedAt)}.</p>}
        {error && <p className="form-error">{error}</p>}

        <button className="primary-button wide" type="submit" disabled={saving}>
          {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
          {saved ? "Pendência salva" : "Salvar pendência"}
        </button>
      </form>

      <div className="detail-section">
        <h3>Vínculos</h3>
        <div className="report-detail-grid">
          <span>Relatório: <strong>{task.reportId ? `#${task.reportId}` : "-"}</strong></span>
          <span>Visita: <strong>{task.visitId ? `#${task.visitId}` : "-"}</strong></span>
          <span>Agência: <strong>{task.producerAgency || "-"}</strong></span>
        </div>
      </div>
    </aside>
  );
}

function DocumentsWorkspace({ createDocument, documents, filters, loading, onChange, onDocumentSave, onReset, options, producers, summary }) {
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const pagination = usePagedItems(documents, DOCUMENT_PAGE_SIZE);
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) || pagination.items[0] || documents[0] || null;

  useEffect(() => {
    setSelectedDocumentId((current) => {
      if (current && documents.some((document) => document.id === current)) return current;
      return documents[0]?.id || null;
    });
  }, [documents]);

  useEffect(() => {
    if (!pagination.items.length) return;
    if (!pagination.items.some((document) => document.id === selectedDocumentId)) {
      setSelectedDocumentId(pagination.items[0].id);
    }
  }, [pagination.page, documents]);

  return (
    <>
      <section className="overview-band report-summary-band">
        <Metric label="Documentos" value={summary?.total ?? 0} icon={<FileText size={21} />} />
        <Metric label="Pendentes" value={summary?.pending ?? 0} icon={<ClipboardList size={21} />} />
        <Metric label="Validados" value={summary?.valid ?? 0} icon={<ShieldCheck size={21} />} />
        <Metric label="Atenção" value={summary?.rejected ?? 0} icon={<Activity size={21} />} />
      </section>

      <section className="filters report-filters" aria-label="Filtros de documentos">
        <label className="search-field">
          <Search size={18} />
          <input
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
            placeholder="Buscar documento, produtor, CPF, arquivo ou observação"
          />
        </label>

        <SelectFilter value={filters.status} onChange={(value) => onChange("status", value)}>
          <option value="">Todos os status</option>
          {(options.documentStatuses || DOCUMENT_STATUSES).map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </SelectFilter>

        <SelectFilter value={filters.category} onChange={(value) => onChange("category", value)}>
          <option value="">Todas as categorias</option>
          {(options.documentCategories || DOCUMENT_CATEGORIES).map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </SelectFilter>

        <SelectFilter value={filters.agency} onChange={(value) => onChange("agency", value)}>
          <option value="">Todas as agências</option>
          {options.agencies.map((agency) => (
            <option key={agency} value={agency}>{agency}</option>
          ))}
        </SelectFilter>

        <button className="ghost-button" type="button" onClick={onReset}>
          Limpar
        </button>
      </section>

      <div className="documents-grid">
        <section className="table-shell" aria-label="Documentos e anexos">
          <div className="table-heading">
            <div>
              <h2>Acervo documental</h2>
              <p>{loading ? "Carregando..." : `${documents.length} documentos encontrados`}</p>
            </div>
            <div className="table-heading-actions">
              {loading && <Loader2 className="spin" size={20} />}
              <button className="icon-text-button" type="button" onClick={() => setCreateOpen(true)}>
                <Plus size={17} />
                Novo anexo
              </button>
              <button className="icon-text-button" type="button" disabled={!selectedDocument} onClick={() => setDetailOpen(true)}>
                <Pencil size={17} />
                Editar documento
              </button>
            </div>
          </div>

          <div className="table-wrap documents-wrap">
            <table>
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Produtor</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th>Arquivo</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((document) => (
                  <tr
                    className={document.id === selectedDocument?.id ? "selected-row" : ""}
                    key={document.id}
                    onClick={() => {
                      setSelectedDocumentId(document.id);
                      setDetailOpen(true);
                    }}
                  >
                    <td>
                      <strong>{document.title}</strong>
                      <span>{formatDateTime(document.createdAt)}</span>
                    </td>
                    <td>
                      <strong>{document.producerName || "-"}</strong>
                      <span>{document.producerAgency || "-"}</span>
                    </td>
                    <td>{document.category || "OUTRO"}</td>
                    <td><DocumentStatusBadge status={document.status} /></td>
                    <td>
                      <strong>{document.fileName || "Sem arquivo"}</strong>
                      <span>{formatBytes(document.fileSize)}</span>
                    </td>
                  </tr>
                ))}
                {!loading && pagination.items.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      <span className="empty-row">Nenhum documento encontrado.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls pagination={pagination} label="documentos" />
        </section>
      </div>

      <Modal eyebrow="Novo cadastro" open={createOpen} onClose={() => setCreateOpen(false)} title="Anexar documento" size="large">
        <DocumentDetailPanel
          createDocument={createDocument}
          document={null}
          mode="create"
          onAfterCreate={() => setCreateOpen(false)}
          onDocumentSave={onDocumentSave}
          producers={producers}
        />
      </Modal>

      <Modal
        eyebrow="Controle documental"
        open={detailOpen && !!selectedDocument}
        onClose={() => setDetailOpen(false)}
        title={selectedDocument?.title || "Documento"}
        size="large"
      >
        <DocumentDetailPanel
          createDocument={createDocument}
          document={selectedDocument}
          mode="edit"
          onDocumentSave={onDocumentSave}
          producers={producers}
        />
      </Modal>
    </>
  );
}

function DocumentDetailPanel({ createDocument, document, mode = "combined", onAfterCreate, onDocumentSave, producers }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSaved, setUploadSaved] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "OUTRO",
    status: "PENDENTE",
    notes: ""
  });
  const [uploadForm, setUploadForm] = useState({
    producerId: "",
    title: "",
    category: "OUTRO",
    notes: "",
    file: null
  });
  const [producerSearch, setProducerSearch] = useState("");
  const filteredUploadProducers = useMemo(() => {
    const search = normalizeForSearch(producerSearch);
    const producerList = producers || [];
    const matches = search
      ? producerList.filter((producer) => (
        normalizeForSearch([
          producer.name,
          producer.cpf,
          producer.accessLogin,
          producer.agency,
          producer.address,
          producer.city
        ].join(" ")).includes(search)
      ))
      : producerList;

    return matches.slice(0, 60);
  }, [producerSearch, producers]);
  const selectedUploadProducer = useMemo(
    () => (producers || []).find((producer) => String(producer.id) === String(uploadForm.producerId)),
    [producers, uploadForm.producerId]
  );
  const visibleUploadProducers = useMemo(() => {
    if (!selectedUploadProducer) return filteredUploadProducers;
    const alreadyVisible = filteredUploadProducers.some((producer) => producer.id === selectedUploadProducer.id);
    return alreadyVisible ? filteredUploadProducers : [selectedUploadProducer, ...filteredUploadProducers];
  }, [filteredUploadProducers, selectedUploadProducer]);
  const showUpload = mode !== "edit";
  const showDocument = mode !== "create";

  useEffect(() => {
    setSaved(false);
    setError("");
    setForm({
      title: document?.title || "",
      category: document?.category || "OUTRO",
      status: document?.status || "PENDENTE",
      notes: document?.notes || ""
    });
  }, [document?.id]);

  async function submit(event) {
    event.preventDefault();
    if (!document) return;

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      await onDocumentSave(document.id, form);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2400);
    } catch (requestError) {
      setError(requestError.message || "Não foi possível salvar o documento.");
    } finally {
      setSaving(false);
    }
  }

  async function submitUpload(event) {
    event.preventDefault();
    setUploading(true);
    setUploadSaved(false);
    setUploadError("");

    try {
      if (!uploadForm.file) {
        throw new Error("Selecione um arquivo para anexar.");
      }

      if (uploadForm.file.size > MAX_DOCUMENT_UPLOAD_BYTES) {
        throw new Error("Arquivo excede o limite de 6 MB.");
      }

      const fileBase64 = await fileToBase64(uploadForm.file);
      await createDocument({
        producerId: uploadForm.producerId,
        title: uploadForm.title || uploadForm.file.name,
        category: uploadForm.category,
        notes: uploadForm.notes,
        fileName: uploadForm.file.name,
        fileMime: uploadForm.file.type,
        fileSize: uploadForm.file.size,
        fileBase64
      });

      setUploadForm({
        producerId: uploadForm.producerId,
        title: "",
        category: "OUTRO",
        notes: "",
        file: null
      });
      event.currentTarget.reset();
      setUploadSaved(true);
      onAfterCreate?.();
      window.setTimeout(() => setUploadSaved(false), 2400);
    } catch (requestError) {
      setUploadError(requestError.message || "Não foi possível anexar o documento.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <aside className="detail-panel document-detail-panel" aria-label="Detalhe do documento">
      {showUpload && (
        <form className="detail-section document-upload-panel no-top" onSubmit={submitUpload}>
          <div className="review-editor-heading">
            <div>
              <p className="eyebrow">Novo anexo</p>
              <h2>Anexar documento</h2>
            </div>
          </div>

          <Field label="Buscar produtor">
            <input
              value={producerSearch}
              onChange={(event) => setProducerSearch(event.target.value)}
              placeholder="Nome, CPF, login, agência ou cidade"
            />
          </Field>

          <Field label="Produtor">
            <select
              value={uploadForm.producerId}
              onChange={(event) => setUploadForm((current) => ({ ...current, producerId: event.target.value }))}
            >
              <option value="">Sem vínculo</option>
              {visibleUploadProducers.map((producer) => (
                <option key={producer.id} value={producer.id}>
                  {producer.name} {producer.accessLogin ? `· ${producer.accessLogin}` : ""}
                </option>
              ))}
            </select>
          </Field>

          <p className="producer-filter-hint">
            {producerSearch
              ? `${visibleUploadProducers.length} produtor(es) exibido(s) pelo filtro.`
              : "Digite para localizar rapidamente quando houver muitos produtores."}
          </p>

          <Field label="Título">
            <input
              value={uploadForm.title}
              onChange={(event) => setUploadForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Ex.: Comprovante de endereço"
            />
          </Field>

          <Field label="Categoria">
            <select
              value={uploadForm.category}
              onChange={(event) => setUploadForm((current) => ({ ...current, category: event.target.value }))}
            >
              {DOCUMENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </Field>

          <Field label="Arquivo">
            <input
              type="file"
              onChange={(event) => setUploadForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
            />
          </Field>

          <Field label="Observação">
            <textarea
              rows="3"
              value={uploadForm.notes}
              onChange={(event) => setUploadForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </Field>

          <p className="upload-hint">Limite atual: 6 MB por arquivo no ambiente de teste local.</p>
          {uploadError && <p className="form-error">{uploadError}</p>}

          <button className="primary-button wide" type="submit" disabled={uploading}>
            {uploading ? <Loader2 className="spin" size={17} /> : <Send size={17} />}
            {uploadSaved ? "Documento anexado" : "Anexar documento"}
          </button>
        </form>
      )}

      {showDocument ? (
        document ? (
          <>
          <div className="detail-header document-detail-header">
            <div>
              <p className="eyebrow">Documento selecionado</p>
              <h2>{document.title}</h2>
            </div>
            <DocumentStatusBadge status={document.status} />
          </div>

          <dl className="detail-list report-detail-list">
            <div>
              <dt>Produtor</dt>
              <dd>{document.producerName || "-"}</dd>
            </div>
            <div>
              <dt>Categoria</dt>
              <dd>{document.category || "OUTRO"}</dd>
            </div>
            <div>
              <dt>Arquivo</dt>
              <dd>{document.fileName || "-"}</dd>
            </div>
            <div>
              <dt>Tamanho</dt>
              <dd>{formatBytes(document.fileSize)}</dd>
            </div>
          </dl>

          <form className="detail-section document-editor" onSubmit={submit}>
            <h3>Controle documental</h3>

            <Field label="Título">
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </Field>

            <div className="inline-grid">
              <Field label="Categoria">
                <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
                  {DOCUMENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </Field>

              <Field label="Status">
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                  {DOCUMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Observações">
              <textarea
                rows="4"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              />
            </Field>

            {document.reviewedAt && <p className="review-meta">Validado em {formatDateTime(document.reviewedAt)}.</p>}
            {error && <p className="form-error">{error}</p>}

            <button className="primary-button wide" type="submit" disabled={saving}>
              {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
              {saved ? "Documento salvo" : "Salvar documento"}
            </button>
          </form>

          {document.filePath && (
            <a className="icon-text-button wide document-download" href={`/api/admin/documents/${document.id}/download`}>
              <Download size={17} />
              Baixar arquivo
            </a>
          )}
          </>
        ) : (
          <div className="empty-history">
            <FileText size={22} />
            <strong>Nenhum documento selecionado</strong>
            <p>Depois de anexar um documento, ele aparecerá aqui para análise e validação.</p>
          </div>
        )
      ) : null}
    </aside>
  );
}

function ProducerPortal() {
  const [checking, setChecking] = useState(true);
  const [producer, setProducer] = useState(null);
  const [reports, setReports] = useState([]);
  const [visits, setVisits] = useState([]);

  useEffect(() => {
    fetchJson("/api/auth/me")
      .then((data) => {
        if (data.user?.role === "producer") {
          setProducer(data.producer);
          setReports(data.reports || []);
          setVisits(data.visits || []);
        }
      })
      .catch(() => null)
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!producer?.id) return undefined;

    const socket = io();
    const refreshProducerData = (event) => {
      if (event.producerId !== producer.id) return;

      fetchJson("/api/producer/me")
        .then((data) => {
          setProducer(data.producer);
          setReports(data.reports || []);
          setVisits(data.visits || []);
        })
        .catch(() => null);
    };

    socket.on("report:reviewed", refreshProducerData);
    socket.on("visit:updated", refreshProducerData);

    return () => socket.close();
  }, [producer?.id]);

  if (checking) {
    return <LoadingScreen label="Carregando acesso" />;
  }

  if (!producer) {
    return <ProducerLogin onLogin={(data) => {
      setProducer(data.producer);
      setReports(data.reports || []);
      setVisits(data.visits || []);
    }} />;
  }

  return (
    <ProducerFormPage
      producer={producer}
      reports={reports}
      visits={visits}
      onProducerChange={setProducer}
      onReportsChange={setReports}
      onVisitsChange={setVisits}
    />
  );
}

function ProducerLogin({ onLogin }) {
  const params = new URLSearchParams(window.location.search);
  const [login, setLogin] = useState(params.get("login") || "");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await fetchJson("/api/auth/producer-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, accessCode })
      });
      onLogin(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="producer-login-screen premium-login-screen producer-premium-login">
      <section className="login-shell" aria-label="Acesso do produtor PAF">
        <aside className="login-story">
          <div className="login-story-topline">
            <img className="login-company-logo" src={BRAND_ASSETS.vilaLogoOnDark} alt="Vila Nova Agroindustrial" />
            <span>Portal do produtor</span>
          </div>

          <div className="login-story-copy">
            <p className="eyebrow">Relatório PAF</p>
            <h1>Dados do campo com acompanhamento próximo.</h1>
            <p>
              Envie seus relatórios, acompanhe registros já gerados e mantenha a equipe técnica conectada à sua produção.
            </p>
          </div>

          <div className="login-story-card">
            <img className="login-paf-logo" src={BRAND_ASSETS.pafIcon} alt="PAF Agricultura Familiar" />
            <div>
              <strong>Acesso individual do produtor</strong>
              <span>Use as credenciais enviadas pela equipe para preencher informações com segurança.</span>
            </div>
          </div>

          <div className="login-benefit-grid">
            <span>
              <ClipboardList size={16} />
              Relatórios
            </span>
            <span>
              <CalendarDays size={16} />
              Acompanhamento
            </span>
            <span>
              <UserCheck size={16} />
              Suporte técnico
            </span>
          </div>
        </aside>

        <section className="producer-login-panel premium-login-panel">
          <div className="login-brand">
            <div className="brand-mark login-brand-mark">
              <img className="brand-mark-img" src={BRAND_ASSETS.pafIcon} alt="" />
            </div>
            <div>
              <p className="eyebrow">Vila Nova Agroindustrial</p>
              <h1>Acesso do produtor</h1>
              <p className="login-panel-text">Entre com o login e o código enviados pela equipe PAF.</p>
            </div>
          </div>

          <form className="login-form" onSubmit={submit}>
            <Field label="Login">
              <input value={login} onChange={(event) => setLogin(event.target.value)} autoComplete="username" required />
            </Field>
            <Field label="Código de acesso">
              <input value={accessCode} onChange={(event) => setAccessCode(event.target.value)} autoComplete="one-time-code" required />
            </Field>
            {error && <p className="form-error">{error}</p>}
            <button className="primary-button wide" type="submit" disabled={loading}>
              {loading ? <Loader2 className="spin" size={18} /> : <LogIn size={18} />}
              Entrar
            </button>
            <a className="login-switch" href="/admin">
              Acesso administrativo da equipe técnica
            </a>
          </form>
        </section>
      </section>
    </main>
  );
}

function ProducerFormPage({ producer, reports, visits, onProducerChange, onReportsChange, onVisitsChange }) {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const latestReport = reports[0] || null;
  const nextVisit = getNextVisit(visits);
  const [form, setForm] = useState({
    reportDate: new Date().toISOString().slice(0, 10),
    contactPhone: "",
    areaStatus: "Sem alteração",
    address: producer.address || "",
    areaHa: producer.areaHa || "",
    plantingYear: producer.plantingYear || "",
    crop: "",
    plantingDate: "",
    productionNote: "",
    needsVisit: false,
    notes: ""
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function logout() {
    await fetchJson("/api/auth/logout", { method: "POST" }).catch(() => null);
    window.location.reload();
  }

  async function submitReport(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const data = await fetchJson("/api/producer/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      onProducerChange(data.producer);
      onReportsChange(data.reports || []);
      onVisitsChange(data.visits || visits);
      setForm((current) => ({
        reportDate: new Date().toISOString().slice(0, 10),
        contactPhone: current.contactPhone,
        areaStatus: "Sem alteração",
        address: data.producer.address || current.address,
        areaHa: data.producer.areaHa || current.areaHa,
        plantingYear: data.producer.plantingYear || current.plantingYear,
        crop: "",
        plantingDate: "",
        productionNote: "",
        needsVisit: false,
        notes: ""
      }));
      setSent(true);
    } catch (requestError) {
      setError(requestError.message || "Não foi possível enviar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="producer-app">
      <header className="producer-topbar">
        <div className="producer-header">
          <div className="brand-mark">
            <img className="brand-mark-img" src={BRAND_ASSETS.pafIcon} alt="" />
          </div>
          <div>
            <p className="eyebrow">Relatório PAF</p>
            <h1>{producer.name}</h1>
            <p className="producer-meta">
              <UserRound size={16} /> {maskCpf(producer.cpf)}
              <MapPin size={16} /> {producer.agency || "Sem agência"}
              <CalendarDays size={16} /> {producer.plantingYear || "-"}
            </p>
          </div>
        </div>
        <button className="icon-text-button" type="button" onClick={logout}>
          <LogOut size={17} />
          Sair
        </button>
      </header>

      <main className="producer-main">
        <ProducerUpcomingVisitCard visit={nextVisit} />

        <section className="producer-summary">
          <Metric label="Status atual" value={producer.processStatus} icon={<Activity size={20} />} />
          <Metric label="Área" value={`${formatArea(producer.areaHa)} ha`} icon={<Leaf size={20} />} />
          <Metric label="Relatórios" value={reports.length} icon={<ClipboardList size={20} />} />
          <Metric label="Último envio" value={latestReport ? formatDateTime(latestReport.createdAt) : "Pendente"} icon={<FileText size={20} />} />
        </section>

        {sent && (
          <div className="success-banner">
            <Check size={18} />
            Relatório enviado e disponível no acompanhamento.
          </div>
        )}

        <ProducerLatestReportCard report={latestReport} />

        <section className="producer-content">
          <form className="report-form" onSubmit={submitReport}>
            <div className="form-grid">
              <Field label="Data do relatório">
                <input
                  type="date"
                  value={form.reportDate}
                  onChange={(event) => updateField("reportDate", event.target.value)}
                  required
                />
              </Field>

              <Field label="Telefone">
                <input
                  value={form.contactPhone}
                  onChange={(event) => updateField("contactPhone", event.target.value)}
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                  required
                />
              </Field>

              <Field label="Situação da área">
                <select value={form.areaStatus} onChange={(event) => updateField("areaStatus", event.target.value)}>
                  {AREA_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Área em hectares">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.areaHa}
                  onChange={(event) => updateField("areaHa", event.target.value)}
                  required
                />
              </Field>

              <Field label="Ano de plantio">
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={form.plantingYear}
                  onChange={(event) => updateField("plantingYear", event.target.value)}
                />
              </Field>

              <Field label="Cultura principal">
                <input value={form.crop} onChange={(event) => updateField("crop", event.target.value)} />
              </Field>
            </div>

            <Field label="Data do plantio">
              <input type="date" value={form.plantingDate} onChange={(event) => updateField("plantingDate", event.target.value)} />
            </Field>

            <Field label="Endereço">
              <input value={form.address} onChange={(event) => updateField("address", event.target.value)} />
            </Field>

            <Field label="Produção ou andamento">
              <input value={form.productionNote} onChange={(event) => updateField("productionNote", event.target.value)} />
            </Field>

            <Field label="Observações">
              <textarea rows="5" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
            </Field>

            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={form.needsVisit}
                onChange={(event) => updateField("needsVisit", event.target.checked)}
              />
              Solicitar visita técnica
            </label>

            {error && <p className="form-error">{error}</p>}

            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
                Enviar relatório
              </button>
            </div>
          </form>

          <ProducerReportHistory reports={reports} />
        </section>
      </main>
    </div>
  );
}

function ProducerLatestReportCard({ report }) {
  if (!report) {
    return (
      <section className="latest-report-card">
        <div>
          <p className="eyebrow">Acompanhamento</p>
          <h2>Último relatório</h2>
        </div>
        <div className="empty-history compact-empty">
          <ClipboardList size={21} />
          <strong>Nenhum envio registrado</strong>
          <p>Depois do primeiro relatório, o andamento técnico aparecerá aqui.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="latest-report-card">
      <div className="latest-report-heading">
        <div>
          <p className="eyebrow">Acompanhamento</p>
          <h2>Último relatório</h2>
        </div>
        <ReviewBadge status={report.reviewStatus} />
      </div>

      <div className="latest-report-grid">
        <span>Recebido <strong>{formatDateTime(report.createdAt)}</strong></span>
        <span>Situação <strong>{report.areaStatus || "-"}</strong></span>
        <span>Visita <strong>{report.needsVisit ? "Solicitada" : "Não solicitada"}</strong></span>
      </div>

      {report.technicalNote ? (
        <div className="technical-feedback">
          <strong>Retorno técnico</strong>
          <p>{report.technicalNote}</p>
        </div>
      ) : (
        <p className="latest-report-note">Aguardando análise da equipe técnica.</p>
      )}
    </section>
  );
}

function ProducerUpcomingVisitCard({ visit }) {
  if (!visit) {
    return null;
  }

  return (
    <section className="latest-report-card upcoming-visit-card">
      <div className="latest-report-heading">
        <div>
          <p className="eyebrow">Agenda técnica</p>
          <h2>Próxima visita</h2>
        </div>
        <VisitStatusBadge status={visit.status} />
      </div>

      <div className="latest-report-grid">
        <span>Data <strong>{visit.scheduledDate ? formatDate(visit.scheduledDate) : "A definir"}</strong></span>
        <span>Técnico <strong>{visit.technician || "Equipe técnica"}</strong></span>
        <span>Prioridade <strong>{visit.priority || "NORMAL"}</strong></span>
      </div>

      <div className="technical-feedback visit-feedback">
        <strong>Objetivo</strong>
        <p>{visit.objective || "A equipe técnica registrará o objetivo da visita."}</p>
      </div>

      {visit.resultNote && (
        <div className="technical-feedback">
          <strong>Encaminhamento</strong>
          <p>{visit.resultNote}</p>
        </div>
      )}
    </section>
  );
}

function ProducerReportHistory({ reports }) {
  return (
    <aside className="history-panel" aria-label="Meus relatórios">
      <div className="history-heading">
        <div>
          <p className="eyebrow">Acompanhamento</p>
          <h2>Meus relatórios</h2>
        </div>
        <span>{reports.length}</span>
      </div>

      {reports.length > 0 ? (
        <div className="history-list">
          {reports.map((report, index) => (
            <article className="history-item" key={`${report.id || index}-${report.createdAt || index}`}>
              <div className="history-item-header">
                <strong>{formatDateTime(report.createdAt) || "Relatório recebido"}</strong>
                <div className="history-badges">
                  <StatusBadge status={report.processStatus} />
                  <ReviewBadge status={report.reviewStatus} />
                </div>
              </div>
              <div className="history-meta">
                <span>{report.reportDate ? `Data: ${formatDate(report.reportDate)}` : "Data não informada"}</span>
                <span>{report.areaStatus || "Sem situação"}</span>
              </div>
              <div className="history-tags">
                <span>{report.needsVisit ? "Visita técnica solicitada" : "Sem visita técnica"}</span>
                {report.areaHa ? <span>{formatArea(report.areaHa)} ha</span> : null}
                {report.crop ? <span>{report.crop}</span> : null}
              </div>
              {report.technicalNote && (
                <div className="technical-feedback">
                  <strong>Retorno técnico</strong>
                  <p>{report.technicalNote}</p>
                </div>
              )}
              <p>{report.notes || report.productionNote || "Sem observações."}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-history">
          <ClipboardList size={22} />
          <strong>Nenhum relatório enviado</strong>
          <p>Depois do primeiro envio, o histórico aparecerá aqui para acompanhamento.</p>
        </div>
      )}
    </aside>
  );
}

function Metric({ label, value, icon }) {
  return (
    <div className="metric-tile">
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function usePagedItems(items, pageSize) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = total ? (safePage - 1) * pageSize : 0;
  const end = Math.min(start + pageSize, total);
  const pageItems = useMemo(() => items.slice(start, end), [items, start, end]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return {
    end,
    items: pageItems,
    page: safePage,
    pageSize,
    setPage,
    start,
    total,
    totalPages
  };
}

function normalizeForSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function PaginationControls({ label, pagination }) {
  const { end, page, setPage, start, total, totalPages } = pagination;

  return (
    <div className="table-pager">
      <span>
        {total ? `Mostrando ${start + 1}-${end} de ${total} ${label}` : `Nenhum ${label}`}
      </span>
      {totalPages > 1 && (
        <div className="pager-actions">
          <button className="pager-button" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </button>
          <strong>
            Página {page} de {totalPages}
          </strong>
          <button className="pager-button" type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`status-badge ${STATUS_TONE[status] || "neutral"}`}>{status || "-"}</span>;
}

function ReviewBadge({ status }) {
  const normalized = status || "PENDENTE";
  return <span className={`review-badge ${REVIEW_TONE[normalized] || "pending"}`}>{normalized}</span>;
}

function VisitStatusBadge({ status }) {
  const normalized = status || "PROGRAMADA";
  return <span className={`review-badge ${VISIT_TONE[normalized] || "pending"}`}>{normalized}</span>;
}

function TaskStatusBadge({ status }) {
  const normalized = status || "ABERTA";
  return <span className={`review-badge ${TASK_TONE[normalized] || "pending"}`}>{normalized}</span>;
}

function DocumentStatusBadge({ status }) {
  const normalized = status || "PENDENTE";
  return <span className={`review-badge ${DOCUMENT_TONE[normalized] || "pending"}`}>{normalized}</span>;
}

function VisitPriorityBadge({ priority }) {
  const normalized = priority || "NORMAL";
  return <span className={`priority-badge ${VISIT_PRIORITY_TONE[normalized] || "normal"}`}>{normalized}</span>;
}

function PriorityBadge({ priority }) {
  return <span className={`priority-badge ${priority.tone}`}>{priority.label}</span>;
}

function Modal({ children, eyebrow, open, onClose, size = "large", title }) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section className={`modal-panel modal-panel-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2>{title}</h2>
          </div>
          <button className="icon-button modal-close" type="button" title="Fechar" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}

function SelectFilter({ children, icon, value, onChange }) {
  return (
    <label className="select-field">
      {icon}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function LoadingScreen({ label }) {
  return (
    <div className="loading-state">
      <Loader2 className="spin" size={28} />
      <span>{label}</span>
    </div>
  );
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || "Erro na requisição.");
    error.status = response.status;
    throw error;
  }

  return data;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function buildCredentialMessage(producer) {
  return [
    `Olá, ${producer.name}.`,
    "Segue seu acesso para preencher o relatório PAF:",
    `Link: ${window.location.origin}/produtor`,
    `Login: ${producer.accessLogin}`,
    `Código: ${producer.accessCode}`
  ].join("\n");
}

function buildQuery(filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return params.toString();
}

function downloadCsv(csv, filename) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function firstEntry(values = {}) {
  const [label, value] = Object.entries(values).sort((a, b) => b[1] - a[1])[0] || [];
  return label ? { label, value } : null;
}

function sortedEntries(values = {}) {
  return Object.entries(values || {})
    .filter(([label]) => label)
    .map(([label, value]) => ({ label, value: Number(value || 0) }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function clampPercent(value, max) {
  const safeMax = Number(max || 0);
  if (!safeMax) return 0;
  return Math.max(0, Math.min(100, Math.round((Number(value || 0) / safeMax) * 100)));
}

function buildDailyReportSeries(reports = [], days = 7) {
  const formatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
  const buckets = [];
  const counts = {};
  const today = new Date();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    counts[key] = 0;
    buckets.push({
      key,
      label: offset === 0 ? "Hoje" : formatter.format(date),
      value: 0
    });
  }

  for (const report of reports) {
    if (!report.createdAt) continue;
    const key = new Date(report.createdAt).toISOString().slice(0, 10);
    if (Object.prototype.hasOwnProperty.call(counts, key)) {
      counts[key] += 1;
    }
  }

  return buckets.map((bucket) => ({ ...bucket, value: counts[bucket.key] || 0 }));
}

function formatArea(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short"
  }).format(date);
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!bytes) return "-";

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function getReportPriority(report = {}) {
  const situation = String(report.areaStatus || "").toLowerCase();
  const status = String(report.processStatus || "").toUpperCase();

  if (report.needsVisit || situation.includes("precisa de visita")) {
    return { label: "Visita técnica", tone: "urgent" };
  }

  if (situation.includes("problema") || situation.includes("alterada") || status === "CANCELADO") {
    return { label: "Atenção", tone: "warning" };
  }

  if (situation.includes("plantado") || status === "PLANTADO") {
    return { label: "Plantio", tone: "success" };
  }

  return { label: "Rotina", tone: "normal" };
}

function getNextVisit(visits = []) {
  const openVisits = visits.filter((visit) => visit.status !== "CONCLUÍDA" && visit.status !== "CANCELADA");
  if (!openVisits.length) return null;

  return [...openVisits].sort((first, second) => {
    const firstDate = first.scheduledDate || "9999-12-31";
    const secondDate = second.scheduledDate || "9999-12-31";
    return firstDate.localeCompare(secondDate);
  })[0];
}

function buildReportTechnicalSummary(report) {
  return [
    `Relatório PAF - ${report.producerName}`,
    `Recebido: ${formatDateTime(report.createdAt)}`,
    `Contato: ${report.contactPhone || "não informado"}`,
    `Agência: ${report.producerAgency || "-"}`,
    `Status: ${report.processStatus || "-"}`,
    `Análise: ${report.reviewStatus || "PENDENTE"}`,
    `Situação da área: ${report.areaStatus || "-"}`,
    `Área: ${formatArea(report.areaHa)} ha`,
    `Cultura: ${report.crop || "-"}`,
    `Visita técnica: ${report.needsVisit ? "solicitada" : "não solicitada"}`,
    `Andamento: ${report.productionNote || "-"}`,
    `Retorno técnico: ${report.technicalNote || "-"}`,
    `Observações: ${report.notes || "-"}`
  ].join("\n");
}

function maskCpf(cpf = "") {
  const digits = String(cpf).replace(/\D/g, "");
  if (digits.length !== 11) return cpf || "-";
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9)}`;
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

createRoot(document.getElementById("root")).render(<App />);
