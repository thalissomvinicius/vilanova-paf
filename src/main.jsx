import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
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
  Menu,
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
  Trash2,
  Truck,
  UserCheck,
  UserRound,
  Users,
  X
} from "lucide-react";
import "./styles.css";
import "./redesign.css";

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

const ACCESS_TYPES = [
  { value: "PRODUTOR", label: "Produtor", description: "Envia relatórios do próprio cadastro." },
  { value: "TECNICO", label: "Técnico", description: "Registra visitas dos produtores vinculados." },
  { value: "ORGANIZACAO", label: "Organização", description: "Gerencia vários produtores, como uma cooperativa." }
];

const NAV_ITEMS = [
  { id: "dashboard", label: "Painel", path: "/admin/dashboard", icon: BarChart3 },
  { id: "producers", label: "Produtores", path: "/admin/produtores", icon: Users },
  { id: "registrations", label: "Cadastros", path: "/admin/cadastros", icon: Plus },
  { id: "logins", label: "Acessos", path: "/admin/acessos", icon: KeyRound },
  { id: "reports", label: "Relatórios", path: "/admin/relatorios", icon: ClipboardList },
  { id: "fuel", label: "Abastecimento", path: "/admin/abastecimento", icon: Droplets },
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
  "/admin/abastecimento": "fuel",
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
const FUEL_PAGE_SIZE = 22;
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

  if (path.startsWith("/tecnico")) {
    return <TechnicalPortal />;
  }

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
            <a className="login-switch" href="/tecnico">
              Acesso da equipe técnica
            </a>
          </form>
        </section>
      </section>
    </main>
  );
}

function AdminDashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState(() => getAdminViewFromPath());
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const [fuelFilters, setFuelFilters] = useState({
    search: "",
    year: "",
    month: "",
    driver: "",
    plate: "",
    location: ""
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
  const [accesses, setAccesses] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [visits, setVisits] = useState([]);
  const [visitSummary, setVisitSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskSummary, setTaskSummary] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentSummary, setDocumentSummary] = useState(null);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [fuelVehicles, setFuelVehicles] = useState([]);
  const [fuelDrivers, setFuelDrivers] = useState([]);
  const [fuelSummary, setFuelSummary] = useState(null);
  const [fuelOptions, setFuelOptions] = useState({
    years: [],
    months: [],
    drivers: [],
    plates: [],
    locations: [],
    fleetTypes: [],
    driverItems: []
  });
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [techniciansLoading, setTechniciansLoading] = useState(false);
  const [accessesLoading, setAccessesLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [fuelLoading, setFuelLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [liveAt, setLiveAt] = useState("");
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const query = useMemo(() => buildQuery(filters), [filters]);
  const reportQuery = useMemo(() => buildQuery(reportFilters), [reportFilters]);
  const visitQuery = useMemo(() => buildQuery(visitFilters), [visitFilters]);
  const taskQuery = useMemo(() => buildQuery(taskFilters), [taskFilters]);
  const documentQuery = useMemo(() => buildQuery(documentFilters), [documentFilters]);
  const fuelQuery = useMemo(() => buildQuery(fuelFilters), [fuelFilters]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

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
    if (activeView === "fuel") {
      refreshFuel();
    }
  }, [activeView, fuelQuery]);

  useEffect(() => {
    if (activeView === "registrations") {
      refreshTechnicians();
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === "logins") {
      refreshAccesses();
      refreshTechnicians({ quiet: true });
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView !== "dashboard") return;

    refreshReports({ quiet: true });
    refreshVisits({ quiet: true });
    refreshTasks({ quiet: true });
    refreshDocuments({ quiet: true });
    refreshFuel({ quiet: true });
  }, [activeView]);

  useEffect(() => {
    let stopped = false;

    function refreshVisibleView() {
      if (stopped || document.visibilityState !== "visible") return;
      setLiveAt(new Date().toISOString());
      if (activeView === "dashboard") {
        refreshProducers({ quiet: true });
        refreshReports({ quiet: true });
        refreshVisits({ quiet: true });
        refreshTasks({ quiet: true });
        refreshDocuments({ quiet: true });
        refreshFuel({ quiet: true });
      } else if (activeView === "producers") refreshProducers({ quiet: true });
      else if (activeView === "registrations") refreshTechnicians({ quiet: true });
      else if (activeView === "logins") refreshAccesses({ quiet: true });
      else if (activeView === "reports") refreshReports({ quiet: true });
      else if (activeView === "visits") refreshVisits({ quiet: true });
      else if (activeView === "tasks") refreshTasks({ quiet: true });
      else if (activeView === "documents") refreshDocuments({ quiet: true });
      else if (activeView === "fuel") refreshFuel({ quiet: true });
    }

    const timer = window.setInterval(refreshVisibleView, 30000);
    document.addEventListener("visibilitychange", refreshVisibleView);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshVisibleView);
    };
  }, [activeView, query, reportQuery, visitQuery, taskQuery, documentQuery, fuelQuery]);

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

  function refreshAccesses({ quiet = false } = {}) {
    if (!quiet) setAccessesLoading(true);

    return fetchJson("/api/admin/accesses")
      .then((data) => setAccesses(data.accesses || []))
      .catch(handleAuthError)
      .finally(() => {
        if (!quiet) setAccessesLoading(false);
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

  function refreshFuel({ quiet = false } = {}) {
    if (!quiet) setFuelLoading(true);

    return fetchJson(`/api/admin/fuel${fuelQuery ? `?${fuelQuery}` : ""}`)
      .then((data) => {
        setFuelRecords(data.records || []);
        setFuelVehicles(data.vehicles || []);
        setFuelDrivers(data.drivers || []);
        setFuelSummary(data.summary || null);
        setFuelOptions(data.options || { years: [], months: [], drivers: [], plates: [], locations: [], fleetTypes: [], driverItems: [] });
      })
      .catch(handleAuthError)
      .finally(() => {
        if (!quiet) setFuelLoading(false);
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

  function updateFuelFilter(key, value) {
    setFuelFilters((current) => ({ ...current, [key]: value }));
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

  function resetFuelFilters() {
    setFuelFilters({
      search: "",
      year: "",
      month: "",
      driver: "",
      plate: "",
      location: ""
    });
  }

  function navigateAdmin(item) {
    if (window.location.pathname !== item.path) {
      window.history.pushState({ adminView: item.id }, "", item.path);
    }

    setActiveView(item.id);
    setSidebarOpen(false);
  }

  async function logout() {
    await fetchJson("/api/auth/logout", { method: "POST" }).catch(() => null);
    onLogout();
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

  async function createAccessRegistration(payload) {
    const data = await fetchJson("/api/admin/accesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setAccesses((current) => [data.account, ...current.filter((access) => access.id !== data.account.id)]);
    setToast("Acesso cadastrado.");
    refreshAccesses({ quiet: true });
    return data;
  }

  async function saveAccessRegistration(accessId, payload) {
    const data = await fetchJson(`/api/admin/accesses/${accessId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setAccesses((current) => current.map((access) => (access.id === data.access.id ? data.access : access)));
    setToast(data.access.active ? "Acesso atualizado." : "Acesso bloqueado.");
    return data.access;
  }

  async function resetAccessRegistration(accessId) {
    const data = await fetchJson(`/api/admin/accesses/${accessId}/reset-code`, { method: "POST" });
    setAccesses((current) => current.map((access) => (access.id === data.account.id ? data.account : access)));
    setToast("Novo código gerado. As sessões anteriores foram encerradas.");
    return data;
  }

  async function removeAccessRegistration(accessId) {
    await fetchJson(`/api/admin/accesses/${accessId}`, { method: "DELETE" });
    setAccesses((current) => current.filter((access) => access.id !== accessId));
    setToast("Acesso excluído.");
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

  async function createFuelEntry(payload) {
    const data = await fetchJson("/api/admin/fuel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setFuelRecords((current) => [data.record, ...current.filter((record) => record.id !== data.record.id)]);
    setToast("Abastecimento lançado.");
    refreshFuel({ quiet: true });
    return data.record;
  }

  async function createFuelVehicle(payload) {
    const data = await fetchJson("/api/admin/fuel/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setFuelVehicles((current) => [data.vehicle, ...current.filter((vehicle) => vehicle.id !== data.vehicle.id)]);
    setToast("Veículo cadastrado.");
    refreshFuel({ quiet: true });
    return data.vehicle;
  }

  async function saveFuelVehicleRegistration(vehicleId, payload) {
    const data = await fetchJson(`/api/admin/fuel/vehicles/${vehicleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setFuelVehicles((current) => current.map((vehicle) => (vehicle.id === data.vehicle.id ? data.vehicle : vehicle)));
    setToast("Veículo atualizado.");
    refreshFuel({ quiet: true });
    return data.vehicle;
  }

  async function removeFuelVehicleRegistration(vehicleId) {
    await fetchJson(`/api/admin/fuel/vehicles/${vehicleId}`, { method: "DELETE" });
    setFuelVehicles((current) => current.filter((vehicle) => vehicle.id !== vehicleId));
    setToast("Veículo excluído. Os abastecimentos históricos foram preservados.");
    refreshFuel({ quiet: true });
  }

  async function createFuelDriverRegistration(payload) {
    const data = await fetchJson("/api/admin/fuel/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setFuelDrivers((current) => [data.driver, ...current.filter((driver) => driver.id !== data.driver.id)]);
    setToast("Motorista cadastrado.");
    refreshFuel({ quiet: true });
    return data.driver;
  }

  async function saveFuelDriverRegistration(driverId, payload) {
    const data = await fetchJson(`/api/admin/fuel/drivers/${driverId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setFuelDrivers((current) => current.map((driver) => (driver.id === data.driver.id ? data.driver : driver)));
    setToast("Motorista atualizado.");
    refreshFuel({ quiet: true });
    return data.driver;
  }

  async function removeFuelDriverRegistration(driverId) {
    await fetchJson(`/api/admin/fuel/drivers/${driverId}`, { method: "DELETE" });
    setFuelDrivers((current) => current.filter((driver) => driver.id !== driverId));
    setToast("Motorista excluído.");
    refreshFuel({ quiet: true });
  }

  async function importFuelFile(file) {
    const fileBase64 = await fileToBase64(file);
    const result = await fetchJson("/api/admin/fuel/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileBase64,
        fileName: file.name,
        fileMime: file.type || "application/vnd.ms-excel"
      })
    });

    setToast(`Importados ${result.importedRecords || 0} abastecimentos.`);
    refreshFuel({ quiet: true });
    return result;
  }

  function exportFuel() {
    const headers = [
      "Data",
      "Ano",
      "Mês",
      "Condutor",
      "Placa",
      "Veículo",
      "Responsável",
      "Litros solicitados",
      "Litros atendidos",
      "KM inicial",
      "KM final",
      "KM rodado",
      "Média KM/L",
      "Local",
      "Requisição",
      "Cota",
      "Observações"
    ];

    const lines = fuelRecords.map((record) =>
      [
        record.servedDate,
        record.year,
        record.month,
        record.driver,
        record.plate,
        record.vehicleName,
        record.vehicleResponsible || record.assignedTo,
        formatDecimal(record.requestedLiters),
        formatDecimal(record.suppliedLiters),
        formatDecimal(record.kmStart),
        formatDecimal(record.kmEnd),
        formatDecimal(record.kmDriven),
        formatDecimal(record.kmPerLiter),
        record.location,
        record.requisition,
        formatDecimal(record.quotaLiters),
        record.notes
      ]
        .map(csvCell)
        .join(";")
    );

    downloadCsv([headers.join(";"), ...lines].join("\n"), `paf-abastecimento-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function exportProducers() {
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

      return row.map(csvCell).join(";");
    });

    downloadCsv(
      [headers.join(";"), ...lines].join("\n"),
      `paf-produtores-${new Date().toISOString().slice(0, 10)}.csv`
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
    logins: "Gestão de acessos",
    reports: "Triagem de relatórios",
    fuel: "Controle de abastecimento",
    visits: "Visitas técnicas",
    tasks: "Pendências internas",
    documents: "Documentos e anexos"
  }[activeView];

  return (
    <div className={`admin-layout ${sidebarOpen ? "nav-open" : ""}`}>
      <button
        className="sidebar-scrim"
        type="button"
        aria-label="Fechar menu"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            <img className="brand-mark-img" src={BRAND_ASSETS.pafIcon} alt="" />
          </div>
          <div>
            <p className="eyebrow">Vila Nova</p>
            <strong>PAF Gestão Rural</strong>
          </div>
          <button className="sidebar-close" type="button" title="Fechar menu" onClick={() => setSidebarOpen(false)}>
            <X size={19} />
          </button>
        </div>

        <p className="sidebar-section-label">Operação</p>
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
          <img src={BRAND_ASSETS.vilaLogoOnDark} alt="Vila Nova Agroindustrial" />
          <div className="sidebar-user">
            <span>Usuário conectado</span>
            <strong>{user.name}</strong>
          </div>
          <div className="sidebar-footer-actions">
            <button
              className="icon-text-button dark"
              type="button"
              title="Alterar senha"
              aria-label="Alterar senha"
              onClick={() => setPasswordModalOpen(true)}
            >
              <KeyRound size={17} />
              Alterar senha
            </button>
            <button className="icon-text-button dark" type="button" title="Sair" aria-label="Sair" onClick={logout}>
              <LogOut size={17} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="dashboard-header">
          <div className="dashboard-title-group">
            <button
              className="mobile-menu-button"
              type="button"
              title="Abrir menu"
              aria-label="Abrir menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div>
              <p className="eyebrow">PAF / Gestão da agricultura familiar</p>
              <h1>{viewTitle}</h1>
            </div>
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
            ) : activeView === "fuel" ? (
              <button className="icon-text-button" type="button" onClick={exportFuel}>
                <Download size={18} />
                Abastecimento
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
            ) : activeView === "registrations" || activeView === "logins" ? null : (
              <>
                <button className="icon-text-button" type="button" onClick={() => exportProducers()}>
                  <Download size={18} />
                  Dados
                </button>
                <button className="icon-text-button" type="button" onClick={() => navigateAdmin(NAV_ITEMS.find((item) => item.id === "logins"))}>
                  <KeyRound size={18} />
                  Acessos
                </button>
              </>
            )}
            <button className="icon-text-button" type="button" onClick={() => {
              if (activeView === "reports") refreshReports();
              else if (activeView === "fuel") refreshFuel();
              else if (activeView === "visits") refreshVisits();
              else if (activeView === "tasks") refreshTasks();
              else if (activeView === "documents") refreshDocuments();
              else if (activeView === "registrations") {
                refreshTechnicians();
                refreshProducers({ quiet: true });
                refreshOptions();
              }
              else if (activeView === "logins") {
                refreshAccesses();
                refreshTechnicians({ quiet: true });
                refreshProducers({ quiet: true });
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
              saveProducer={saveProducer}
            />
          </>
        )}

        {activeView === "registrations" && (
          <RegistrationsWorkspace
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
          <LoginWorkspace
            accesses={accesses}
            createAccess={createAccessRegistration}
            deleteAccess={removeAccessRegistration}
            loading={accessesLoading}
            producers={producers}
            resetAccessCode={resetAccessRegistration}
            saveAccess={saveAccessRegistration}
            technicians={technicians}
          />
        )}

        {activeView === "reports" && (
          <ReportsWorkspace
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

        {activeView === "fuel" && (
          <FuelWorkspace
            createFuelEntry={createFuelEntry}
            createFuelDriver={createFuelDriverRegistration}
            createFuelVehicle={createFuelVehicle}
            deleteFuelDriver={removeFuelDriverRegistration}
            deleteFuelVehicle={removeFuelVehicleRegistration}
            drivers={fuelDrivers}
            filters={fuelFilters}
            importFuelFile={importFuelFile}
            loading={fuelLoading}
            onChange={updateFuelFilter}
            onReset={resetFuelFilters}
            options={fuelOptions}
            records={fuelRecords}
            summary={fuelSummary}
            saveFuelDriver={saveFuelDriverRegistration}
            saveFuelVehicle={saveFuelVehicleRegistration}
            vehicles={fuelVehicles}
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
            createTask={createTask}
            filters={taskFilters}
            loading={tasksLoading}
            onChange={updateTaskFilter}
            onReset={resetTaskFilters}
            onTaskSave={saveTask}
            options={options}
            producers={producers}
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

      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onChanged={onLogout}
      />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function ChangePasswordModal({ open, onClose, onChanged }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmation("");
    setError("");
  }, [open]);

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmation) {
      setError("A confirmação não corresponde à nova senha.");
      return;
    }

    setSubmitting(true);
    try {
      await fetchJson("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      onChanged();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal eyebrow="Segurança da conta" open={open} onClose={submitting ? undefined : onClose} size="small" title="Alterar senha">
      <form className="password-form" onSubmit={submit}>
        <Field label="Senha atual">
          <input
            autoComplete="current-password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </Field>
        <Field label="Nova senha">
          <input
            autoComplete="new-password"
            minLength={12}
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </Field>
        <Field label="Confirmar nova senha">
          <input
            autoComplete="new-password"
            minLength={12}
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            required
          />
        </Field>
        <p className="password-requirement">Use 12 ou mais caracteres, com letras maiúsculas, minúsculas e números.</p>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions password-actions">
          <button className="ghost-button" type="button" disabled={submitting} onClick={onClose}>Cancelar</button>
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}
            Salvar nova senha
          </button>
        </div>
      </form>
    </Modal>
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
            <span>produtores com relatório</span>
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

      <SelectFilter ariaLabel="Filtrar produtores por status" icon={<Filter size={17} />} value={filters.status} onChange={(value) => onChange("status", value)}>
        <option value="">Todos os status</option>
        {options.statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </SelectFilter>

      <SelectFilter ariaLabel="Filtrar produtores por agência" value={filters.agency} onChange={(value) => onChange("agency", value)}>
        <option value="">Todas as agências</option>
        {options.agencies.map((agency) => (
          <option key={agency} value={agency}>
            {agency}
          </option>
        ))}
      </SelectFilter>

      {!compact && (
        <>
          <SelectFilter ariaLabel="Filtrar produtores por projetista" value={filters.designer} onChange={(value) => onChange("designer", value)}>
            <option value="">Todos os projetistas</option>
            {options.designers.map((designer) => (
              <option key={designer} value={designer}>
                {designer}
              </option>
            ))}
          </SelectFilter>

          <SelectFilter ariaLabel="Filtrar produtores por ano" value={filters.year} onChange={(value) => onChange("year", value)}>
            <option value="">Todos os anos</option>
            {options.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </SelectFilter>

          <SelectFilter ariaLabel="Filtrar produtores por envio de relatório" value={filters.reported} onChange={(value) => onChange("reported", value)}>
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

function ProducerWorkspace({ loading, producers, saveProducer, selected, selectedId, setSelectedId }) {
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
          saveProducer={saveProducer}
        />
      </Modal>
    </div>
  );
}

function ProducerTable({ onOpenDetail, producers, selectedId, setSelectedId }) {
  const pagination = usePagedItems(producers, TABLE_PAGE_SIZE);

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produtor</th>
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
                tabIndex="0"
                aria-label={`Abrir cadastro de ${producer.name}`}
                onClick={() => onOpenDetail(producer)}
                onKeyDown={(event) => activateRow(event, () => onOpenDetail(producer))}
              >
                <td>
                  <strong>{producer.name}</strong>
                  <span>{maskCpf(producer.cpf)} · {producer.plantingYear || "-"}</span>
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
                  </div>
                </td>
              </tr>
            ))}
            {!pagination.items.length && (
              <tr>
                <td colSpan="6">
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

function ProducerDetail({ producer, saveProducer }) {
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
        <StatusBadge status={producer.processStatus} />
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
            Inclua produtores e mantenha a equipe técnica organizada para visitas, relatórios e acompanhamento.
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
            placeholder="Buscar produtor, CPF, técnico, agência ou telefone"
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
                    {maskCpf(producer.cpf)} · {producer.agency || "Sem agência"}
                  </small>
                </div>
                <StatusBadge status={producer.processStatus} />
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
            Agências, projetistas e técnicos ativos ficam disponíveis em toda a operação e mantêm os registros
            padronizados no banco central.
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

function StepWizard({ cancelLabel = "Cancelar", className = "", error, onCancel, resetKey, saving, steps, submitLabel }) {
  const [stepIndex, setStepIndex] = useState(0);
  const wizardRef = useRef(null);
  const safeSteps = steps.filter(Boolean);
  const currentStep = safeSteps[stepIndex] || safeSteps[0];
  const isLast = stepIndex >= safeSteps.length - 1;

  useEffect(() => {
    setStepIndex(0);
  }, [steps.length, resetKey]);

  function canAdvance() {
    const panel = wizardRef.current?.querySelector(`[data-step-panel="${currentStep?.id}"]`);
    const fields = Array.from(panel?.querySelectorAll("input, select, textarea") || []);
    const invalid = fields.find((field) => !field.checkValidity());

    if (invalid) {
      invalid.reportValidity();
      return false;
    }

    return true;
  }

  function goToStep(index) {
    if (index <= stepIndex) {
      setStepIndex(index);
      return;
    }

    if (index === stepIndex + 1 && canAdvance()) {
      setStepIndex(index);
    }
  }

  return (
    <div className={`step-form ${className}`} ref={wizardRef}>
      <div className="step-nav" aria-label="Etapas do formulário">
        {safeSteps.map((step, index) => (
          <button
            className={index === stepIndex ? "active" : index < stepIndex ? "done" : ""}
            aria-current={index === stepIndex ? "step" : undefined}
            disabled={index > stepIndex + 1}
            key={step.id}
            type="button"
            onClick={() => goToStep(index)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {step.title}
          </button>
        ))}
      </div>

      <div className="step-progress-meta">
        <span>Etapa {stepIndex + 1} de {safeSteps.length}</span>
        <strong>{currentStep?.title}</strong>
      </div>

      <div className="step-viewport">
        <div
          className="step-track"
          style={{
            width: `${safeSteps.length * 100}%`,
            transform: `translateX(-${(stepIndex * 100) / safeSteps.length}%)`
          }}
        >
          {safeSteps.map((step, index) => (
            <section
              className="step-panel"
              data-step-panel={step.id}
              key={step.id}
              aria-label={step.title}
              aria-hidden={index !== stepIndex}
              inert={index !== stepIndex}
              style={{ flexBasis: `${100 / safeSteps.length}%` }}
            >
              {step.description && <p className="step-description">{step.description}</p>}
              <div className="step-fields">
                {step.content}
              </div>
            </section>
          ))}
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="step-actions">
        <button className="ghost-button" type="button" onClick={isLast ? onCancel : () => setStepIndex(Math.max(stepIndex - 1, 0))}>
          {stepIndex === 0 ? cancelLabel : "Voltar"}
        </button>
        {isLast ? (
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
            {submitLabel}
          </button>
        ) : (
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              if (canAdvance()) setStepIndex((current) => Math.min(current + 1, safeSteps.length - 1));
            }}
          >
            Avançar
            <ArrowRight size={17} />
          </button>
        )}
      </div>
    </div>
  );
}

function ProducerRegistrationForm({ createProducer, onCancel, options }) {
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
      <StepWizard
        cancelLabel="Cancelar"
        error={error}
        onCancel={onCancel}
        saving={saving}
        submitLabel="Cadastrar produtor"
        steps={[
          {
            id: "producer-personal",
            title: "Produtor",
            description: "Identifique o produtor e o contato principal.",
            content: (
              <>
                <Field label="Nome do produtor">
                  <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} />
                </Field>

                <div className="inline-grid">
                  <Field label="CPF">
                    <input value={form.cpf} onChange={(event) => updateField("cpf", event.target.value)} />
                  </Field>

                  <Field label="Telefone">
                    <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
                  </Field>
                </div>
              </>
            )
          },
          {
            id: "producer-operation",
            title: "Operação",
            description: "Informe status, agência e dados da área acompanhada.",
            content: (
              <>
                <div className="inline-grid">
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
                </div>

                <div className="inline-grid">
                  <Field label="Área (ha)">
                    <input type="number" min="0" step="0.01" value={form.areaHa} onChange={(event) => updateField("areaHa", event.target.value)} />
                  </Field>
                  <Field label="Ano de plantio">
                    <input type="number" value={form.plantingYear} onChange={(event) => updateField("plantingYear", event.target.value)} />
                  </Field>
                </div>
              </>
            )
          },
          {
            id: "producer-location",
            title: "Localização",
            description: "Complete com projetista e referência da propriedade.",
            content: (
              <>
                <Field label="Projetista">
                  <input list="registration-designers" value={form.designer} onChange={(event) => updateField("designer", event.target.value)} />
                  <datalist id="registration-designers">
                    {options.designers.map((designer) => <option key={designer} value={designer} />)}
                  </datalist>
                </Field>

                <Field label="Endereço / localização">
                  <textarea rows="3" value={form.address} onChange={(event) => updateField("address", event.target.value)} />
                </Field>
              </>
            )
          }
        ]}
      />

      {created && (
        <div className="registration-success-card">
          <div>
            <p className="eyebrow">Cadastro concluído</p>
            <strong>{created.name}</strong>
            <span>O produtor foi incluído na base. Crie a credencial dele na aba Acessos.</span>
          </div>
          <button className="primary-button" type="button" onClick={onCancel}>
            <Check size={17} />
            Concluir
          </button>
        </div>
      )}

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
      <StepWizard
        cancelLabel="Cancelar"
        error={error}
        onCancel={onCancel}
        saving={saving}
        submitLabel={mode === "edit" ? "Salvar técnico" : "Cadastrar técnico"}
        steps={[
          {
            id: "technician-personal",
            title: "Técnico",
            description: "Dados de identificação e contato.",
            content: (
              <>
                <Field label="Nome do técnico">
                  <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} />
                </Field>

                <div className="inline-grid">
                  <Field label="Telefone">
                    <input value={form.phone || ""} onChange={(event) => updateField("phone", event.target.value)} />
                  </Field>

                  <Field label="E-mail">
                    <input type="email" value={form.email || ""} onChange={(event) => updateField("email", event.target.value)} />
                  </Field>
                </div>
              </>
            )
          },
          {
            id: "technician-role",
            title: "Atuação",
            description: "Defina função e região de atendimento.",
            content: (
              <>
                <Field label="Função">
                  <input value={form.role || ""} onChange={(event) => updateField("role", event.target.value)} />
                </Field>

                <Field label="Região / agência">
                  <input value={form.region || ""} onChange={(event) => updateField("region", event.target.value)} />
                </Field>
              </>
            )
          },
          {
            id: "technician-status",
            title: "Status",
            description: "Controle se o técnico aparece como ativo no sistema.",
            content: (
              <>
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
              </>
            )
          }
        ]}
      />
    </form>
  );
}

function LoginWorkspace({ accesses, createAccess, deleteAccess, loading, producers, resetAccessCode, saveAccess, technicians }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState(null);
  const [issuedCredential, setIssuedCredential] = useState(null);
  const normalizedSearch = normalizeForSearch(search);
  const filtered = accesses.filter((access) => {
    if (type && access.accountType !== type) return false;
    if (status === "active" && !access.active) return false;
    if (status === "blocked" && access.active) return false;
    if (!normalizedSearch) return true;

    return [
      access.name,
      access.login,
      access.organization,
      access.technicianName,
      ...(access.producers || []).map((producer) => producer.name)
    ].some((value) => normalizeForSearch(value).includes(normalizedSearch));
  });
  const pagination = usePagedItems(filtered, TABLE_PAGE_SIZE);
  const activeCount = accesses.filter((access) => access.active).length;
  const organizationCount = accesses.filter((access) => access.accountType === "ORGANIZACAO").length;
  const technicalCount = accesses.filter((access) => access.accountType !== "PRODUTOR").length;

  function openCreate() {
    setSelectedAccess(null);
    setIssuedCredential(null);
    setModalOpen(true);
  }

  function openEdit(access) {
    setSelectedAccess(access);
    setIssuedCredential(null);
    setModalOpen(true);
  }

  async function copyIssuedCredential(credential) {
    const portal = credential.account.accountType === "PRODUTOR" ? "/produtor" : "/tecnico";
    const message = [
      "Acesso PAF - Vila Nova Agroindustrial",
      `Nome: ${credential.account.name}`,
      `Login: ${credential.account.login}`,
      `Código: ${credential.temporaryCode}`,
      `Portal: ${window.location.origin}${portal}`
    ].join("\n");
    await navigator.clipboard.writeText(message);
  }

  async function handleReset(access) {
    const credential = await resetAccessCode(access.id);
    setSelectedAccess(credential.account);
    setIssuedCredential(credential);
  }

  return (
    <section className="access-workspace">
      <div className="access-hero">
        <div>
          <p className="eyebrow">Identidade e permissões</p>
          <h2>Acessos controlados por perfil e produtores vinculados.</h2>
          <p>Cadastre produtores, técnicos ou organizações e defina exatamente quais dados cada acesso pode utilizar.</p>
        </div>
        <button className="primary-button" type="button" onClick={openCreate}>
          <Plus size={18} />
          Cadastrar acesso
        </button>
      </div>

      <section className="overview-band access-summary-band">
        <Metric label="Acessos" value={accesses.length} icon={<KeyRound size={20} />} />
        <Metric label="Ativos" value={activeCount} icon={<ShieldCheck size={20} />} />
        <Metric label="Equipe técnica" value={technicalCount} icon={<UserCheck size={20} />} />
        <Metric label="Organizações" value={organizationCount} icon={<Building2 size={20} />} />
      </section>

      <section className="filters access-filters" aria-label="Filtros de acessos">
        <label className="search-field">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nome, login, organização ou produtor" />
        </label>
        <SelectFilter ariaLabel="Filtrar acessos por tipo" value={type} onChange={setType}>
          <option value="">Todos os perfis</option>
          {ACCESS_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </SelectFilter>
        <SelectFilter ariaLabel="Filtrar acessos por situação" value={status} onChange={setStatus}>
          <option value="">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="blocked">Bloqueados</option>
        </SelectFilter>
        <button className="ghost-button" type="button" onClick={() => { setSearch(""); setType(""); setStatus(""); }}>
          Limpar
        </button>
      </section>

      <section className="table-shell" aria-label="Acessos cadastrados">
        <div className="table-heading">
          <div>
            <h2>Central de acessos</h2>
            <p>{loading ? "Carregando..." : `${filtered.length} acessos encontrados`}</p>
          </div>
          <div className="table-heading-actions">
            {loading && <Loader2 className="spin" size={20} />}
            <button className="primary-button" type="button" onClick={openCreate}>
              <Plus size={17} />
              Novo acesso
            </button>
          </div>
        </div>

        <div className="table-wrap access-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Acesso</th>
                <th>Perfil</th>
                <th>Login</th>
                <th>Escopo</th>
                <th>Status</th>
                <th>Último acesso</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {pagination.items.map((access) => (
                <tr
                  key={access.id}
                  tabIndex="0"
                  aria-label={`Editar acesso de ${access.name}`}
                  onClick={() => openEdit(access)}
                  onKeyDown={(event) => activateRow(event, () => openEdit(access))}
                >
                  <td>
                    <strong>{access.name}</strong>
                    <span>{access.organization || access.technicianName || "Acesso individual"}</span>
                  </td>
                  <td><AccessTypeBadge type={access.accountType} /></td>
                  <td><code>{access.login}</code></td>
                  <td>
                    <strong>{access.producers.length}</strong>
                    <span>{access.producers.length === 1 ? "produtor" : "produtores"}</span>
                  </td>
                  <td><span className={`review-badge ${access.active ? "done" : "returned"}`}>{access.active ? "ATIVO" : "BLOQUEADO"}</span></td>
                  <td>{access.lastLoginAt ? formatDateTime(access.lastLoginAt) : "Nunca acessou"}</td>
                  <td>
                    <button className="icon-button" type="button" title="Editar acesso" onClick={(event) => { event.stopPropagation(); openEdit(access); }}>
                      <Pencil size={17} />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !pagination.items.length && (
                <tr>
                  <td colSpan="7"><span className="empty-row">Nenhum acesso cadastrado. Use “Cadastrar acesso” para começar.</span></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls pagination={pagination} label="acessos" />
      </section>

      <Modal
        eyebrow={selectedAccess ? "Editar permissões" : "Nova credencial"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedAccess?.name || "Cadastrar acesso"}
        size="large"
      >
        <AccessRegistrationForm
          access={selectedAccess}
          credential={issuedCredential}
          onCancel={() => setModalOpen(false)}
          onCopyCredential={copyIssuedCredential}
          onDelete={selectedAccess ? async () => {
            if (!window.confirm(`Excluir definitivamente o acesso de ${selectedAccess.name}?`)) return;
            await deleteAccess(selectedAccess.id);
            setModalOpen(false);
          } : null}
          onResetCode={selectedAccess ? () => handleReset(selectedAccess) : null}
          onSubmit={async (payload) => {
            if (selectedAccess) {
              const access = await saveAccess(selectedAccess.id, payload);
              setSelectedAccess(access);
              return { account: access };
            }

            const result = await createAccess(payload);
            setSelectedAccess(result.account);
            setIssuedCredential(result);
            return result;
          }}
          producers={producers}
          technicians={technicians}
        />
      </Modal>
    </section>
  );
}

function AccessTypeBadge({ type }) {
  const item = ACCESS_TYPES.find((option) => option.value === type) || ACCESS_TYPES[0];
  return <span className={`access-type-badge ${String(type || "").toLowerCase()}`}>{item.label}</span>;
}

function AccessRegistrationForm({ access, credential, onCancel, onCopyCredential, onDelete, onResetCode, onSubmit, producers, technicians }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [producerSearch, setProducerSearch] = useState("");
  const [form, setForm] = useState(() => ({
    name: access?.name || "",
    login: access?.login || "",
    accessCode: "",
    accountType: access?.accountType || "PRODUTOR",
    technicianId: access?.technicianId || "",
    organization: access?.organization || "",
    producerIds: access?.producerIds || [],
    active: access?.active ?? true,
    canSubmitReports: access?.canSubmitReports ?? true,
    canManageVisits: access?.canManageVisits ?? false,
    notes: access?.notes || ""
  }));
  const filteredProducers = producers
    .filter((producer) => [producer.name, producer.cpf, producer.agency].some((value) => normalizeForSearch(value).includes(normalizeForSearch(producerSearch))))
    .slice(0, 80);

  useEffect(() => {
    setForm({
      name: access?.name || "",
      login: access?.login || "",
      accessCode: "",
      accountType: access?.accountType || "PRODUTOR",
      technicianId: access?.technicianId || "",
      organization: access?.organization || "",
      producerIds: access?.producerIds || [],
      active: access?.active ?? true,
      canSubmitReports: access?.canSubmitReports ?? true,
      canManageVisits: access?.canManageVisits ?? false,
      notes: access?.notes || ""
    });
    setError("");
  }, [access?.id]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeType(accountType) {
    setForm((current) => ({
      ...current,
      accountType,
      producerIds: accountType === "PRODUTOR" ? current.producerIds.slice(0, 1) : current.producerIds,
      canSubmitReports: accountType === "PRODUTOR",
      canManageVisits: accountType !== "PRODUTOR"
    }));
  }

  function toggleProducer(producerId) {
    setForm((current) => {
      if (current.accountType === "PRODUTOR") {
        return { ...current, producerIds: [producerId] };
      }

      const selected = current.producerIds.includes(producerId);
      return {
        ...current,
        producerIds: selected
          ? current.producerIds.filter((id) => id !== producerId)
          : [...current.producerIds, producerId]
      };
    });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSubmit(form);
    } catch (requestError) {
      setError(requestError.message || "Não foi possível salvar o acesso.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="detail-panel access-registration-form" onSubmit={submit}>
      {credential?.temporaryCode && (
        <div className="issued-credential">
          <div>
            <p className="eyebrow">Código gerado</p>
            <strong>{credential.account.login}</strong>
            <code>{credential.temporaryCode}</code>
            <small>Guarde este código agora. Ele não ficará visível novamente.</small>
          </div>
          <button className="primary-button" type="button" onClick={() => onCopyCredential(credential)}>
            <Copy size={17} />
            Copiar acesso
          </button>
        </div>
      )}

      <StepWizard
        cancelLabel="Cancelar"
        error={error}
        onCancel={onCancel}
        saving={saving}
        submitLabel={access ? "Salvar acesso" : "Criar acesso"}
        steps={[
          {
            id: "access-identity",
            title: "Identidade",
            description: "Defina quem usará o acesso e em qual portal entrará.",
            content: (
              <>
                <Field label="Nome do acesso">
                  <input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Ex.: Técnico COOPAFAMITA" required />
                </Field>
                <div className="access-type-options">
                  {ACCESS_TYPES.map((item) => (
                    <label className={form.accountType === item.value ? "active" : ""} key={item.value}>
                      <input type="radio" name="accountType" value={item.value} checked={form.accountType === item.value} onChange={() => changeType(item.value)} />
                      <span><strong>{item.label}</strong><small>{item.description}</small></span>
                    </label>
                  ))}
                </div>
                <div className="inline-grid">
                  <Field label="Login">
                    <input value={form.login} onChange={(event) => updateField("login", event.target.value.toUpperCase().replace(/\s+/g, "-"))} placeholder="EX.: COOPAFAMITA-01" required />
                  </Field>
                  <Field label={access ? "Novo código (opcional)" : "Código (opcional)"}>
                    <input value={form.accessCode} onChange={(event) => updateField("accessCode", event.target.value.toUpperCase())} placeholder={access ? "Deixe vazio para manter" : "Gerado automaticamente"} />
                  </Field>
                </div>
                {form.accountType === "ORGANIZACAO" && (
                  <Field label="Nome da organização">
                    <input value={form.organization} onChange={(event) => updateField("organization", event.target.value)} placeholder="Ex.: COOPAFAMITA" />
                  </Field>
                )}
              </>
            )
          },
          {
            id: "access-scope",
            title: "Produtores",
            description: "Escolha quais produtores este acesso poderá acompanhar.",
            content: (
              <>
                {form.accountType !== "PRODUTOR" && (
                  <Field label="Técnico vinculado">
                    <select value={form.technicianId} onChange={(event) => updateField("technicianId", event.target.value)}>
                      <option value="">Sem técnico específico</option>
                      {technicians.filter((technician) => technician.active).map((technician) => (
                        <option key={technician.id} value={technician.id}>{technician.name}</option>
                      ))}
                    </select>
                  </Field>
                )}
                <label className="search-field access-producer-search">
                  <Search size={17} />
                  <input value={producerSearch} onChange={(event) => setProducerSearch(event.target.value)} placeholder="Buscar produtor, CPF ou agência" />
                </label>
                <div className="access-producer-list">
                  {filteredProducers.map((producer) => (
                    <label className={form.producerIds.includes(producer.id) ? "selected" : ""} key={producer.id}>
                      <input
                        type={form.accountType === "PRODUTOR" ? "radio" : "checkbox"}
                        name={form.accountType === "PRODUTOR" ? "producerScope" : undefined}
                        checked={form.producerIds.includes(producer.id)}
                        onChange={() => toggleProducer(producer.id)}
                      />
                      <span><strong>{producer.name}</strong><small>{maskCpf(producer.cpf)} · {producer.agency || "Sem agência"}</small></span>
                    </label>
                  ))}
                </div>
                <p className="scope-selection-count">{form.producerIds.length} {form.producerIds.length === 1 ? "produtor vinculado" : "produtores vinculados"}</p>
              </>
            )
          },
          {
            id: "access-permissions",
            title: "Permissões",
            description: "Revise as permissões e o status da conta.",
            content: (
              <>
                <div className="access-permission-list">
                  <label>
                    <input type="checkbox" checked={form.canSubmitReports} onChange={(event) => updateField("canSubmitReports", event.target.checked)} />
                    <span><strong>Enviar relatórios</strong><small>Permite preencher dados de produção.</small></span>
                  </label>
                  <label>
                    <input type="checkbox" checked={form.canManageVisits} onChange={(event) => updateField("canManageVisits", event.target.checked)} />
                    <span><strong>Cadastrar visitas</strong><small>Permite registrar e atualizar visitas técnicas.</small></span>
                  </label>
                  <label>
                    <input type="checkbox" checked={form.active} onChange={(event) => updateField("active", event.target.checked)} />
                    <span><strong>Acesso ativo</strong><small>Desmarque para bloquear imediatamente.</small></span>
                  </label>
                </div>
                <Field label="Observações internas">
                  <textarea rows="4" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
                </Field>
                {access && (
                  <div className="access-danger-actions">
                    <button className="ghost-button" type="button" onClick={onResetCode}><RefreshCcw size={16} /> Redefinir código</button>
                    <button className="danger-button" type="button" onClick={onDelete}><Trash2 size={16} /> Excluir acesso</button>
                  </div>
                )}
              </>
            )
          }
        ]}
      />
    </form>
  );
}

function ReportsWorkspace({ createTask, filters, loading, onChange, onReset, onReviewSave, options, reports, summary }) {
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

        <SelectFilter ariaLabel="Filtrar relatórios por necessidade de visita" value={filters.needsVisit} onChange={(value) => onChange("needsVisit", value)}>
          <option value="">Todas as visitas</option>
          <option value="yes">Precisa visita</option>
        </SelectFilter>

        <SelectFilter ariaLabel="Filtrar relatórios por status" value={filters.status} onChange={(value) => onChange("status", value)}>
          <option value="">Todos os status</option>
          {options.statuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </SelectFilter>

        <SelectFilter ariaLabel="Filtrar relatórios por agência" value={filters.agency} onChange={(value) => onChange("agency", value)}>
          <option value="">Todas as agências</option>
          {options.agencies.map((agency) => (
            <option key={agency} value={agency}>{agency}</option>
          ))}
        </SelectFilter>

        <SelectFilter ariaLabel="Filtrar relatórios por situação da análise" value={filters.reviewStatus} onChange={(value) => onChange("reviewStatus", value)}>
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
                      tabIndex="0"
                      aria-label={`Abrir relatório de ${report.producerName}`}
                      onClick={() => {
                        setSelectedReportId(report.id);
                        setDetailOpen(true);
                      }}
                      onKeyDown={(event) => activateRow(event, () => {
                        setSelectedReportId(report.id);
                        setDetailOpen(true);
                      })}
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
        <ReportDetailPanel createTask={createTask} onReviewSave={onReviewSave} report={selectedReport} />
      </Modal>
    </>
  );
}

function ReportDetailPanel({ createTask, onReviewSave, report }) {
  const [copied, setCopied] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskSaved, setTaskSaved] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [reviewForm, setReviewForm] = useState({
    reviewStatus: "PENDENTE",
    technicalNote: ""
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
    setTaskSaved(false);
    setTaskError("");
    setReviewForm({
      reviewStatus: report?.reviewStatus || "PENDENTE",
      technicalNote: report?.technicalNote || ""
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

        <SelectFilter ariaLabel="Filtrar visitas por status" value={filters.status} onChange={(value) => onChange("status", value)}>
          <option value="">Todos os status</option>
          {(options.visitStatuses || VISIT_STATUSES).map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </SelectFilter>

        <SelectFilter ariaLabel="Filtrar visitas por prioridade" value={filters.priority} onChange={(value) => onChange("priority", value)}>
          <option value="">Todas as prioridades</option>
          {(options.visitPriorities || VISIT_PRIORITIES).map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </SelectFilter>

        <SelectFilter ariaLabel="Filtrar visitas por agência" value={filters.agency} onChange={(value) => onChange("agency", value)}>
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
                    tabIndex="0"
                    aria-label={`Abrir visita de ${visit.producerName}`}
                    onClick={() => {
                      setSelectedVisitId(visit.id);
                      setDetailOpen(true);
                    }}
                    onKeyDown={(event) => activateRow(event, () => {
                      setSelectedVisitId(visit.id);
                      setDetailOpen(true);
                    })}
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
          <p>Nenhum registro disponível para análise técnica.</p>
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

function TasksWorkspace({ createTask, filters, loading, onChange, onReset, onTaskSave, options, producers, summary, tasks }) {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
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

        <SelectFilter ariaLabel="Filtrar pendências por status" value={filters.status} onChange={(value) => onChange("status", value)}>
          <option value="">Todos os status</option>
          {(options.taskStatuses || TASK_STATUSES).map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </SelectFilter>

        <SelectFilter ariaLabel="Filtrar pendências por prioridade" value={filters.priority} onChange={(value) => onChange("priority", value)}>
          <option value="">Todas as prioridades</option>
          {(options.visitPriorities || VISIT_PRIORITIES).map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </SelectFilter>

        <SelectFilter ariaLabel="Filtrar pendências por tipo" value={filters.type} onChange={(value) => onChange("type", value)}>
          <option value="">Todos os tipos</option>
          {(options.taskTypes || TASK_TYPES).map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </SelectFilter>

        <SelectFilter ariaLabel="Filtrar pendências por agência" value={filters.agency} onChange={(value) => onChange("agency", value)}>
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
              <button className="primary-button" type="button" onClick={() => setCreateOpen(true)}>
                <Plus size={17} />
                Cadastrar pendência
              </button>
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
                    tabIndex="0"
                    aria-label={`Abrir pendência ${task.title}`}
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setDetailOpen(true);
                    }}
                    onKeyDown={(event) => activateRow(event, () => {
                      setSelectedTaskId(task.id);
                      setDetailOpen(true);
                    })}
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
        eyebrow="Nova atividade"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Cadastrar pendência"
        size="large"
      >
        <TaskCreateForm
          onCancel={() => setCreateOpen(false)}
          onSubmit={async (payload) => {
            await createTask(payload);
            setCreateOpen(false);
          }}
          producers={producers}
        />
      </Modal>

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

function TaskCreateForm({ onCancel, onSubmit, producers }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [producerSearch, setProducerSearch] = useState("");
  const [form, setForm] = useState({
    producerId: "",
    title: "",
    type: "OUTRO",
    priority: "NORMAL",
    assignee: "",
    dueDate: "",
    notes: ""
  });
  const filteredProducers = producers
    .filter((producer) => [producer.name, producer.cpf, producer.agency].some((value) => normalizeForSearch(value).includes(normalizeForSearch(producerSearch))))
    .slice(0, 60);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSubmit(form);
    } catch (requestError) {
      setError(requestError.message || "Não foi possível criar a pendência.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="detail-panel task-create-form" onSubmit={submit}>
      <StepWizard
        cancelLabel="Cancelar"
        error={error}
        onCancel={onCancel}
        saving={saving}
        submitLabel="Criar pendência"
        steps={[
          {
            id: "task-identification",
            title: "Pendência",
            description: "Defina a atividade, tipo e prioridade.",
            content: (
              <>
                <Field label="Título">
                  <input value={form.title} onChange={(event) => updateField("title", event.target.value)} required />
                </Field>
                <div className="inline-grid">
                  <Field label="Tipo">
                    <select value={form.type} onChange={(event) => updateField("type", event.target.value)}>
                      {TASK_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </Field>
                  <Field label="Prioridade">
                    <select value={form.priority} onChange={(event) => updateField("priority", event.target.value)}>
                      {VISIT_PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                    </select>
                  </Field>
                </div>
              </>
            )
          },
          {
            id: "task-context",
            title: "Responsável",
            description: "Vincule um produtor, responsável e prazo.",
            content: (
              <>
                <label className="search-field">
                  <Search size={17} />
                  <input value={producerSearch} onChange={(event) => setProducerSearch(event.target.value)} placeholder="Buscar produtor" />
                </label>
                <Field label="Produtor vinculado">
                  <select value={form.producerId} onChange={(event) => updateField("producerId", event.target.value)}>
                    <option value="">Sem produtor específico</option>
                    {filteredProducers.map((producer) => <option key={producer.id} value={producer.id}>{producer.name} · {producer.agency || "Sem agência"}</option>)}
                  </select>
                </Field>
                <div className="inline-grid">
                  <Field label="Responsável">
                    <input value={form.assignee} onChange={(event) => updateField("assignee", event.target.value)} />
                  </Field>
                  <Field label="Prazo">
                    <input type="date" value={form.dueDate} onChange={(event) => updateField("dueDate", event.target.value)} />
                  </Field>
                </div>
              </>
            )
          },
          {
            id: "task-notes",
            title: "Detalhes",
            description: "Registre as orientações para execução.",
            content: (
              <Field label="Observações">
                <textarea rows="6" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
              </Field>
            )
          }
        ]}
      />
    </form>
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

        <SelectFilter ariaLabel="Filtrar documentos por status" value={filters.status} onChange={(value) => onChange("status", value)}>
          <option value="">Todos os status</option>
          {(options.documentStatuses || DOCUMENT_STATUSES).map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </SelectFilter>

        <SelectFilter ariaLabel="Filtrar documentos por categoria" value={filters.category} onChange={(value) => onChange("category", value)}>
          <option value="">Todas as categorias</option>
          {(options.documentCategories || DOCUMENT_CATEGORIES).map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </SelectFilter>

        <SelectFilter ariaLabel="Filtrar documentos por agência" value={filters.agency} onChange={(value) => onChange("agency", value)}>
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
                    tabIndex="0"
                    aria-label={`Abrir documento ${document.title}`}
                    onClick={() => {
                      setSelectedDocumentId(document.id);
                      setDetailOpen(true);
                    }}
                    onKeyDown={(event) => activateRow(event, () => {
                      setSelectedDocumentId(document.id);
                      setDetailOpen(true);
                    })}
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
              placeholder="Nome, CPF, agência ou cidade"
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
                  {producer.name} · {producer.agency || "Sem agência"}
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
              accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls"
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

          <p className="upload-hint">Limite de 6 MB por arquivo, armazenado em área privada.</p>
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

function FuelWorkspace({
  createFuelEntry,
  createFuelDriver,
  createFuelVehicle,
  deleteFuelDriver,
  deleteFuelVehicle,
  drivers,
  filters,
  importFuelFile,
  loading,
  onChange,
  onReset,
  options,
  records,
  saveFuelDriver,
  saveFuelVehicle,
  summary,
  vehicles
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [driverOpen, setDriverOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");
  const pagination = usePagedItems(records, FUEL_PAGE_SIZE);
  const monthly = summary?.byMonth || [];
  const monthlyRows = monthly.slice(-10);
  const driverRows = summary?.byDriver || [];
  const plateRows = summary?.byPlate || [];
  const efficiencyRows = summary?.efficiencyByPlate || [];
  const quotaRows = summary?.quotaRisks || [];
  const futureRows = summary?.futureRecords || [];
  const alertRows = summary?.efficiencyAlerts || [];
  const maxMonthLiters = Math.max(...monthlyRows.map((item) => item.suppliedLiters || 0), 1);
  const maxDriverLiters = Math.max(...driverRows.map((item) => item.suppliedLiters || 0), 1);
  const maxEfficiency = Math.max(...efficiencyRows.map((item) => item.averageKmPerLiter || 0), 1);
  const maxQuotaUsage = Math.max(...quotaRows.map((item) => item.quotaLiters ? (item.suppliedLiters / item.quotaLiters) * 100 : 0), 100);

  async function submitImport(event) {
    event.preventDefault();
    setImportError("");
    setImportMessage("");

    if (!file) {
      setImportError("Selecione a planilha de abastecimento.");
      return;
    }

    setImporting(true);

    try {
      const result = await importFuelFile(file);
      setImportMessage(`${result.importedRecords || 0} abastecimentos e ${result.importedVehicles || 0} veículos importados.`);
      setFile(null);
      event.currentTarget.reset();
    } catch (requestError) {
      setImportError(requestError.message || "Não foi possível importar a planilha.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <section className="fuel-cockpit">
        <div className="fuel-cockpit-copy">
          <p className="eyebrow">Gestão de abastecimento</p>
          <h2>Consumo, frota e eficiência em uma visão de controle.</h2>
          <div className="fuel-cockpit-strip">
            <span><strong>{formatDecimal(summary?.totalSuppliedLiters)} L</strong> atendidos</span>
            <span><strong>{summary?.drivers ?? 0}</strong> condutores</span>
            <span><strong>{(futureRows.length || 0) + (alertRows.length || 0)}</strong> alertas</span>
          </div>
        </div>

        <div className="fuel-cockpit-actions">
          <button className="icon-text-button" type="button" onClick={() => { setEditingVehicle(null); setVehicleOpen(true); }}>
            <Truck size={17} />
            Cadastrar veículo
          </button>
          <button className="icon-text-button" type="button" onClick={() => { setEditingDriver(null); setDriverOpen(true); }}>
            <UserRound size={17} />
            Cadastrar motorista
          </button>
          <button className="primary-button" type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={17} />
            Novo abastecimento
          </button>
          <button className="icon-button" type="button" title="Importar planilha" onClick={() => setImportOpen(true)}>
            <Download size={17} />
          </button>
        </div>
      </section>

      <section className="overview-band fuel-summary-band">
        <Metric label="Registros" value={summary?.total ?? 0} icon={<ClipboardList size={21} />} />
        <Metric label="Litros atendidos" value={`${formatDecimal(summary?.totalSuppliedLiters)} L`} icon={<Droplets size={21} />} />
        <Metric label="KM rodado" value={formatDecimal(summary?.totalKmDriven)} icon={<Truck size={21} />} />
        <Metric label="Média KM/L" value={formatDecimal(summary?.averageKmPerLiter)} icon={<Activity size={21} />} />
        <Metric label="Veículos" value={summary?.activeVehicles ?? vehicles.length} icon={<Factory size={21} />} />
      </section>

      <section className="filters report-filters fuel-filters" aria-label="Filtros de abastecimento">
        <label className="search-field">
          <Search size={18} />
          <input
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
            placeholder="Buscar condutor, placa, requisição, local ou observação"
          />
        </label>

        <SelectFilter ariaLabel="Filtrar abastecimentos por ano" value={filters.year} onChange={(value) => onChange("year", value)}>
          <option value="">Todos os anos</option>
          {(options.years || []).map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </SelectFilter>

        <SelectFilter ariaLabel="Filtrar abastecimentos por mês" value={filters.month} onChange={(value) => onChange("month", value)}>
          <option value="">Todos os meses</option>
          {(options.months || []).map((month) => (
            <option key={month} value={month}>{month}</option>
          ))}
        </SelectFilter>

        <SelectFilter ariaLabel="Filtrar abastecimentos por motorista" value={filters.driver} onChange={(value) => onChange("driver", value)}>
          <option value="">Todos os condutores</option>
          {(options.drivers || []).map((driver) => (
            <option key={driver} value={driver}>{driver}</option>
          ))}
        </SelectFilter>

        <SelectFilter ariaLabel="Filtrar abastecimentos por placa" value={filters.plate} onChange={(value) => onChange("plate", value)}>
          <option value="">Todas as placas</option>
          {(options.plates || []).map((plate) => (
            <option key={plate} value={plate}>{plate}</option>
          ))}
        </SelectFilter>

        <SelectFilter ariaLabel="Filtrar abastecimentos por local" value={filters.location} onChange={(value) => onChange("location", value)}>
          <option value="">Todos os locais</option>
          {(options.locations || []).map((location) => (
            <option key={location} value={location}>{location}</option>
          ))}
        </SelectFilter>

        <button className="ghost-button" type="button" onClick={onReset}>
          Limpar
        </button>
      </section>

      <section className="fuel-command-grid">
        <article className="fuel-card fuel-chart-card">
          <div className="fuel-card-heading">
            <div>
              <p className="eyebrow">Consumo mensal</p>
              <h2>Litros e KM por período</h2>
            </div>
            <CalendarDays size={22} />
          </div>

          <div className="fuel-bars" aria-label="Gráfico mensal de abastecimento">
            {monthlyRows.length ? monthlyRows.map((item) => (
              <div className="fuel-bar-row" key={item.key}>
                <span>{formatFuelMonthLabel(item)}</span>
                <div>
                  <i style={{ width: `${clampPercent(item.suppliedLiters, maxMonthLiters)}%` }} />
                </div>
                <strong>{formatDecimal(item.suppliedLiters)} L</strong>
              </div>
            )) : (
              <p className="empty-row">Os gráficos aparecerão depois dos primeiros abastecimentos.</p>
            )}
          </div>
        </article>

        <article className="fuel-card fuel-ranking-card">
          <div className="fuel-card-heading">
            <div>
              <p className="eyebrow">Condutores</p>
              <h2>Maior volume abastecido</h2>
            </div>
            <UserCheck size={22} />
          </div>

          <div className="fuel-ranking-list">
            {driverRows.length ? driverRows.slice(0, 6).map((item) => (
              <div className="fuel-ranking-item" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.records} lançamentos · {formatDecimal(item.averageKmPerLiter)} KM/L</span>
                </div>
                <div className="fuel-ranking-bar">
                  <i style={{ width: `${clampPercent(item.suppliedLiters, maxDriverLiters)}%` }} />
                </div>
                <b>{formatDecimal(item.suppliedLiters)} L</b>
              </div>
            )) : (
              <p className="empty-row">Cadastre motoristas e registre abastecimentos para iniciar a análise.</p>
            )}
          </div>
        </article>
      </section>

      <section className="fuel-decision-grid" aria-label="Análises para decisão">
        <article className="fuel-card fuel-alert-card">
          <div className="fuel-card-heading">
            <div>
              <p className="eyebrow">Atenção gerencial</p>
              <h2>Pontos para validar</h2>
            </div>
            <Activity size={22} />
          </div>

          <div className="fuel-alert-list">
            {futureRows.map((item) => (
              <div className="fuel-alert-item" key={`future-${item.id}`}>
                <strong>Data futura</strong>
                <span>{formatDate(item.servedDate)} · {item.driver || "-"} · {item.plate || "-"}</span>
                <b>{formatDecimal(item.suppliedLiters)} L</b>
              </div>
            ))}
            {alertRows.map((item) => (
              <div className="fuel-alert-item" key={`eff-${item.id}`}>
                <strong>Média fora do padrão</strong>
                <span>{formatDate(item.servedDate)} · {item.driver || "-"} · {item.plate || "-"}</span>
                <b>{formatDecimal(item.kmPerLiter)} KM/L</b>
              </div>
            ))}
            {!futureRows.length && !alertRows.length && (
              <p className="empty-row">Sem alertas no filtro atual.</p>
            )}
          </div>
        </article>

        <article className="fuel-card">
          <div className="fuel-card-heading">
            <div>
              <p className="eyebrow">Cotas</p>
              <h2>Uso por condutor</h2>
            </div>
            <ScanLine size={22} />
          </div>

          <div className="fuel-ranking-list">
            {quotaRows.length ? quotaRows.map((item) => {
              const usage = item.quotaLiters ? (item.suppliedLiters / item.quotaLiters) * 100 : 0;
              return (
                <div className="fuel-ranking-item quota" key={item.label}>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{formatDecimal(item.suppliedLiters)} L de {formatDecimal(item.quotaLiters)} L</span>
                  </div>
                  <div className="fuel-ranking-bar">
                    <i style={{ width: `${clampPercent(usage, maxQuotaUsage)}%` }} />
                  </div>
                  <b className={item.quotaBalance < 0 ? "danger-text" : ""}>
                    {item.quotaBalance < 0 ? "+" : ""}{formatDecimal(Math.abs(item.quotaBalance || 0))} L
                  </b>
                </div>
              );
            }) : (
              <p className="empty-row">Sem cotas para analisar neste filtro.</p>
            )}
          </div>
        </article>

        <article className="fuel-card">
          <div className="fuel-card-heading">
            <div>
              <p className="eyebrow">Eficiência</p>
              <h2>KM/L por placa</h2>
            </div>
            <Truck size={22} />
          </div>

          <div className="fuel-ranking-list">
            {efficiencyRows.length ? efficiencyRows.map((item) => (
              <div className="fuel-ranking-item efficiency" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.vehicle || item.fleetType || `${item.records} lançamentos`}</span>
                </div>
                <div className="fuel-ranking-bar">
                  <i style={{ width: `${clampPercent(item.averageKmPerLiter, maxEfficiency)}%` }} />
                </div>
                <b>{formatDecimal(item.averageKmPerLiter)} KM/L</b>
              </div>
            )) : (
              <p className="empty-row">Sem KM suficiente para calcular eficiência.</p>
            )}
          </div>
        </article>
      </section>

      <section className="table-shell fuel-table-shell" aria-label="Controle de abastecimento">
        <div className="table-heading">
          <div>
            <h2>Abastecimentos</h2>
            <p>{loading ? "Carregando..." : `${records.length} registros encontrados`}</p>
          </div>
          <div className="table-heading-actions">
            {loading && <Loader2 className="spin" size={20} />}
            <button className="icon-text-button" type="button" onClick={() => { setEditingVehicle(null); setVehicleOpen(true); }}>
              <Truck size={17} />
              Veículo
            </button>
            <button className="icon-text-button" type="button" onClick={() => setCreateOpen(true)}>
              <Plus size={17} />
              Novo abastecimento
            </button>
          </div>
        </div>

        <div className="fuel-insight-strip">
          {plateRows.slice(0, 4).map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{formatDecimal(item.suppliedLiters)} L</strong>
              <small>{item.vehicle || `${formatDecimal(item.averageKmPerLiter)} KM/L`}</small>
            </div>
          ))}
          {!plateRows.length && (
            <div>
              <span>Frota</span>
              <strong>{vehicles.length}</strong>
              <small>veículos cadastrados</small>
            </div>
          )}
        </div>

        <div className="table-wrap fuel-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Condutor</th>
                <th>Placa</th>
                <th>Litros</th>
                <th>KM</th>
                <th>Média</th>
                <th>Local</th>
                <th>Cota</th>
              </tr>
            </thead>
            <tbody>
              {pagination.items.map((record) => (
                <tr key={record.id}>
                  <td>
                    <strong>{record.servedDate ? formatDate(record.servedDate) : "-"}</strong>
                    <span>{record.month || ""} {record.year || ""}</span>
                  </td>
                  <td>
                    <strong>{record.driver || "-"}</strong>
                    <span>{record.vehicleResponsible || record.assignedTo || "Sem responsável"}</span>
                  </td>
                  <td>
                    <code>{record.plate || "-"}</code>
                    <span>{record.vehicleName || record.fleetType || ""}</span>
                  </td>
                  <td>
                    <strong>{formatDecimal(record.suppliedLiters)} L</strong>
                    <span>Solicitado: {formatDecimal(record.requestedLiters)} L</span>
                  </td>
                  <td>
                    <strong>{formatDecimal(record.kmDriven)}</strong>
                    <span>{formatDecimal(record.kmStart)} → {formatDecimal(record.kmEnd)}</span>
                  </td>
                  <td>{formatDecimal(record.kmPerLiter)} KM/L</td>
                  <td>{record.location || "-"}</td>
                  <td>{record.quotaLiters ? `${formatDecimal(record.quotaLiters)} L` : "-"}</td>
                </tr>
              ))}
              {!loading && pagination.items.length === 0 && (
                <tr>
                  <td colSpan="8">
                    <span className="empty-row">Nenhum abastecimento encontrado.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls pagination={pagination} label="abastecimentos" />
      </section>

      <section className="table-shell fuel-vehicle-shell" aria-label="Cadastro de frota">
        <div className="table-heading">
          <div>
            <h2>Frota e placas</h2>
            <p>{vehicles.length} veículos cadastrados</p>
          </div>
          <div className="table-heading-actions">
            <button className="icon-text-button" type="button" onClick={() => { setEditingVehicle(null); setVehicleOpen(true); }}>
              <Plus size={17} />
              Cadastrar veículo
            </button>
          </div>
        </div>

        <div className="fuel-vehicle-grid">
          {vehicles.slice(0, 8).map((vehicle) => (
            <article className="fuel-vehicle-card" key={vehicle.id}>
              <div className="fuel-vehicle-copy">
                <code>{vehicle.plate}</code>
                <strong>{vehicle.vehicle || "Veículo sem descrição"}</strong>
                <span>{vehicle.driverName || vehicle.assignedTo || "Responsável não informado"}</span>
              </div>
              <div className="fuel-vehicle-meta">
                <b>{vehicle.quotaLiters ? `${formatDecimal(vehicle.quotaLiters)} L` : "Sem cota"}</b>
                <small>{vehicle.fleetType || vehicle.area || "Tipo não informado"}</small>
              </div>
              <div className="row-actions fuel-vehicle-actions">
                <button
                  className="icon-button"
                  type="button"
                  title="Editar veículo"
                  onClick={() => { setEditingVehicle(vehicle); setVehicleOpen(true); }}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button danger-icon-button"
                  type="button"
                  title="Excluir veículo"
                  onClick={async () => {
                    if (!window.confirm(`Excluir o veículo ${vehicle.plate}? Os abastecimentos já registrados serão preservados.`)) return;
                    await deleteFuelVehicle(vehicle.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
          {!vehicles.length && (
            <div className="fuel-empty-card">
              <Truck size={22} />
              <strong>Nenhum veículo cadastrado</strong>
              <span>Cadastre placas, responsáveis e cotas para qualificar a análise.</span>
            </div>
          )}
        </div>
      </section>

      <section className="table-shell fuel-driver-shell" aria-label="Cadastro de motoristas">
        <div className="table-heading">
          <div>
            <h2>Motoristas</h2>
            <p>{drivers.length} motoristas cadastrados</p>
          </div>
          <div className="table-heading-actions">
            <button className="icon-text-button" type="button" onClick={() => { setEditingDriver(null); setDriverOpen(true); }}>
              <Plus size={17} />
              Cadastrar motorista
            </button>
          </div>
        </div>

        <div className="fuel-driver-grid">
          {drivers.map((driver) => (
            <article className={`fuel-driver-card ${driver.active ? "" : "inactive"}`} key={driver.id}>
              <span className="registration-avatar"><UserRound size={18} /></span>
              <div>
                <strong>{driver.name}</strong>
                <small>{driver.licenseNumber ? `CNH ${driver.licenseNumber}` : "CNH não informada"} · {driver.phone || "Sem telefone"}</small>
              </div>
              <span className={`review-badge ${driver.active ? "done" : "returned"}`}>{driver.active ? "ATIVO" : "INATIVO"}</span>
              <div className="row-actions">
                <button className="icon-button" type="button" title="Editar motorista" onClick={() => { setEditingDriver(driver); setDriverOpen(true); }}>
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button danger-icon-button"
                  type="button"
                  title="Excluir motorista"
                  onClick={async () => {
                    if (!window.confirm(`Excluir o motorista ${driver.name}?`)) return;
                    await deleteFuelDriver(driver.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
          {!drivers.length && (
            <div className="fuel-empty-card">
              <UserRound size={22} />
              <strong>Nenhum motorista cadastrado</strong>
              <span>Cadastre os condutores antes de registrar os abastecimentos.</span>
            </div>
          )}
        </div>
      </section>

      <Modal
        eyebrow="Lançamento manual"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Novo abastecimento"
        size="large"
      >
        <FuelEntryForm
          onCancel={() => setCreateOpen(false)}
          onSubmit={async (payload) => {
            await createFuelEntry(payload);
            setCreateOpen(false);
          }}
          options={options}
        />
      </Modal>

      <Modal
        eyebrow="Planilha de abastecimento"
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Importar Excel"
        size="large"
      >
        <form className="detail-panel fuel-entry-form" onSubmit={submitImport}>
          <div className="detail-header">
            <div>
              <p className="eyebrow">Atualização de dados</p>
              <h2>Controle de abastecimento</h2>
            </div>
            <Download size={24} />
          </div>

          <Field label="Arquivo Excel">
            <input
              accept=".xlsx,.xlsm"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </Field>

          {importError && <p className="form-error">{importError}</p>}
          {importMessage && <p className="form-success">{importMessage}</p>}

          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={() => setImportOpen(false)}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={importing}>
              {importing ? <Loader2 className="spin" size={17} /> : <Download size={17} />}
              Importar
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        eyebrow="Cadastro de frota"
        open={vehicleOpen}
        onClose={() => { setVehicleOpen(false); setEditingVehicle(null); }}
        title={editingVehicle?.plate || "Cadastrar veículo"}
        size="large"
      >
        <FuelVehicleForm
          initial={editingVehicle}
          onCancel={() => { setVehicleOpen(false); setEditingVehicle(null); }}
          onSubmit={async (payload) => {
            if (editingVehicle) {
              await saveFuelVehicle(editingVehicle.id, payload);
            } else {
              await createFuelVehicle(payload);
            }
            setVehicleOpen(false);
            setEditingVehicle(null);
          }}
          options={options}
        />
      </Modal>

      <Modal
        eyebrow="Cadastro de motoristas"
        open={driverOpen}
        onClose={() => setDriverOpen(false)}
        title={editingDriver?.name || "Cadastrar motorista"}
        size="large"
      >
        <FuelDriverForm
          initial={editingDriver}
          onCancel={() => setDriverOpen(false)}
          onSubmit={async (payload) => {
            if (editingDriver) {
              await saveFuelDriver(editingDriver.id, payload);
            } else {
              await createFuelDriver(payload);
            }
            setDriverOpen(false);
          }}
        />
      </Modal>
    </>
  );
}

function FuelEntryForm({ onCancel, onSubmit, options }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    servedDate: new Date().toISOString().slice(0, 10),
    driver: "",
    plate: "",
    vehicleResponsible: "",
    requestedLiters: "",
    suppliedLiters: "",
    kmStart: "",
    kmEnd: "",
    location: "",
    requisition: "",
    quotaLiters: "",
    notes: ""
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSubmit(form);
    } catch (requestError) {
      setError(requestError.message || "Não foi possível salvar o abastecimento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="detail-panel fuel-entry-form" onSubmit={submit}>
      <div className="detail-header">
        <div>
          <p className="eyebrow">Controle de campo</p>
          <h2>Registrar abastecimento</h2>
        </div>
        <Droplets size={24} />
      </div>

      <StepWizard
        cancelLabel="Cancelar"
        error={error}
        onCancel={onCancel}
        saving={saving}
        submitLabel="Salvar abastecimento"
        steps={[
          {
            id: "fuel-basic",
            title: "Identificação",
            description: "Data, local, condutor e placa.",
            content: (
              <>
                <div className="inline-grid">
                  <Field label="Data">
                    <input type="date" value={form.servedDate} onChange={(event) => updateField("servedDate", event.target.value)} />
                  </Field>

                  <Field label="Local">
                    <input
                      list="fuel-locations"
                      value={form.location}
                      onChange={(event) => updateField("location", event.target.value)}
                      placeholder="Indústria, posto, fazenda..."
                    />
                    <datalist id="fuel-locations">
                      {(options.locations || []).map((location) => <option key={location} value={location} />)}
                    </datalist>
                  </Field>
                </div>

                <div className="inline-grid">
                  <Field label="Condutor">
                    <input
                      list="fuel-drivers"
                      value={form.driver}
                      onChange={(event) => updateField("driver", event.target.value)}
                      required
                    />
                    <datalist id="fuel-drivers">
                      {(options.drivers || []).map((driver) => <option key={driver} value={driver} />)}
                    </datalist>
                  </Field>

                  <Field label="Placa">
                    <input
                      list="fuel-plates"
                      value={form.plate}
                      onChange={(event) => updateField("plate", event.target.value)}
                    />
                    <datalist id="fuel-plates">
                      {(options.plates || []).map((plate) => <option key={plate} value={plate} />)}
                    </datalist>
                  </Field>
                </div>
              </>
            )
          },
          {
            id: "fuel-volume",
            title: "Volume e KM",
            description: "Litros abastecidos e leitura de odômetro.",
            content: (
              <>
                <div className="inline-grid">
                  <Field label="Litros solicitados">
                    <input type="number" step="0.001" value={form.requestedLiters} onChange={(event) => updateField("requestedLiters", event.target.value)} />
                  </Field>

                  <Field label="Litros atendidos">
                    <input type="number" step="0.001" value={form.suppliedLiters} onChange={(event) => updateField("suppliedLiters", event.target.value)} required />
                  </Field>
                </div>

                <div className="inline-grid">
                  <Field label="KM inicial">
                    <input type="number" step="0.1" value={form.kmStart} onChange={(event) => updateField("kmStart", event.target.value)} />
                  </Field>

                  <Field label="KM final">
                    <input type="number" step="0.1" value={form.kmEnd} onChange={(event) => updateField("kmEnd", event.target.value)} />
                  </Field>
                </div>
              </>
            )
          },
          {
            id: "fuel-control",
            title: "Controle",
            description: "Responsável, requisição, cota e observações.",
            content: (
              <>
                <Field label="Responsável pelo veículo">
                  <input
                    value={form.vehicleResponsible}
                    onChange={(event) => updateField("vehicleResponsible", event.target.value)}
                  />
                </Field>

                <div className="inline-grid">
                  <Field label="Requisição">
                    <input value={form.requisition} onChange={(event) => updateField("requisition", event.target.value)} />
                  </Field>

                  <Field label="Cota">
                    <input type="number" step="0.001" value={form.quotaLiters} onChange={(event) => updateField("quotaLiters", event.target.value)} />
                  </Field>
                </div>

                <Field label="Observações">
                  <textarea rows="4" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
                </Field>
              </>
            )
          }
        ]}
      />
    </form>
  );
}

function FuelVehicleForm({ initial, onCancel, onSubmit, options }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    plate: initial?.plate || "",
    vehicle: initial?.vehicle || "",
    driverId: initial?.driverId ? String(initial.driverId) : "",
    assignedTo: initial?.assignedTo || "",
    quotaLiters: initial?.quotaLiters ?? "",
    fleetType: initial?.fleetType || "",
    costCenter: initial?.costCenter || "",
    department: initial?.department || "",
    area: initial?.area || "PAF",
    category: initial?.category || ""
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSubmit(form);
    } catch (requestError) {
      setError(requestError.message || "Não foi possível salvar o veículo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="detail-panel fuel-entry-form" onSubmit={submit}>
      <div className="detail-header">
        <div>
          <p className="eyebrow">Frota PAF</p>
          <h2>{initial ? "Editar veículo e vínculo" : "Placa, veículo e cota"}</h2>
        </div>
        <Truck size={24} />
      </div>

      <StepWizard
        cancelLabel="Cancelar"
        error={error}
        onCancel={onCancel}
        saving={saving}
        submitLabel="Salvar veículo"
        steps={[
          {
            id: "vehicle-identification",
            title: "Veículo",
            description: "Placa, tipo e descrição da frota.",
            content: (
              <>
                <div className="inline-grid">
                  <Field label="Placa">
                    <input
                      value={form.plate}
                      onChange={(event) => updateField("plate", event.target.value.toUpperCase())}
                      placeholder="Ex.: SZA5J37"
                      required
                    />
                  </Field>

                  <Field label="Tipo">
                    <input
                      list="fuel-fleet-types"
                      value={form.fleetType}
                      onChange={(event) => updateField("fleetType", event.target.value)}
                      placeholder="Moto, carro, caminhonete..."
                    />
                    <datalist id="fuel-fleet-types">
                      {(options.fleetTypes || []).map((type) => <option key={type} value={type} />)}
                    </datalist>
                  </Field>
                </div>

                <Field label="Veículo">
                  <input
                    value={form.vehicle}
                    onChange={(event) => updateField("vehicle", event.target.value)}
                    placeholder="Modelo ou descrição do veículo"
                    required
                  />
                </Field>
              </>
            )
          },
          {
            id: "vehicle-responsibility",
            title: "Responsável",
            description: "Vincule o motorista principal e o responsável pelo veículo.",
            content: (
              <>
                <Field label="Motorista principal">
                  <select value={form.driverId} onChange={(event) => updateField("driverId", event.target.value)}>
                    <option value="">Sem motorista vinculado</option>
                    {(options.driverItems || []).filter((driver) => driver.active).map((driver) => (
                      <option key={driver.id} value={driver.id}>{driver.name}</option>
                    ))}
                  </select>
                </Field>
                <div className="inline-grid">
                  <Field label="Responsável interno">
                    <input
                      value={form.assignedTo}
                      onChange={(event) => updateField("assignedTo", event.target.value)}
                      placeholder="Nome do responsável"
                    />
                  </Field>
                  <Field label="Cota mensal em litros">
                    <input
                      type="number"
                      step="0.001"
                      value={form.quotaLiters}
                      onChange={(event) => updateField("quotaLiters", event.target.value)}
                    />
                  </Field>
                </div>
              </>
            )
          },
          {
            id: "vehicle-internal",
            title: "Interno",
            description: "Dados administrativos para filtros e relatórios.",
            content: (
              <>
                <div className="inline-grid">
                  <Field label="Centro de custo">
                    <input value={form.costCenter} onChange={(event) => updateField("costCenter", event.target.value)} />
                  </Field>

                  <Field label="Departamento">
                    <input value={form.department} onChange={(event) => updateField("department", event.target.value)} />
                  </Field>
                </div>

                <div className="inline-grid">
                  <Field label="Área">
                    <input value={form.area} onChange={(event) => updateField("area", event.target.value)} />
                  </Field>

                  <Field label="Categoria">
                    <input value={form.category} onChange={(event) => updateField("category", event.target.value)} />
                  </Field>
                </div>
              </>
            )
          }
        ]}
      />
    </form>
  );
}

function FuelDriverForm({ initial, onCancel, onSubmit }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: initial?.name || "",
    cpf: initial?.cpf || "",
    phone: initial?.phone || "",
    licenseNumber: initial?.licenseNumber || "",
    licenseCategory: initial?.licenseCategory || "",
    licenseExpiresAt: initial?.licenseExpiresAt || "",
    active: initial?.active ?? true,
    notes: initial?.notes || ""
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSubmit(form);
    } catch (requestError) {
      setError(requestError.message || "Não foi possível salvar o motorista.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="detail-panel fuel-entry-form" onSubmit={submit}>
      <div className="detail-header">
        <div>
          <p className="eyebrow">Condutor da frota</p>
          <h2>{initial ? "Editar motorista" : "Novo motorista"}</h2>
        </div>
        <UserRound size={24} />
      </div>

      <StepWizard
        cancelLabel="Cancelar"
        error={error}
        onCancel={onCancel}
        saving={saving}
        submitLabel="Salvar motorista"
        steps={[
          {
            id: "driver-personal",
            title: "Motorista",
            description: "Identificação e contato do condutor.",
            content: (
              <>
                <Field label="Nome completo">
                  <input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
                </Field>
                <div className="inline-grid">
                  <Field label="CPF">
                    <input value={form.cpf} onChange={(event) => updateField("cpf", event.target.value)} />
                  </Field>
                  <Field label="Telefone">
                    <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
                  </Field>
                </div>
              </>
            )
          },
          {
            id: "driver-license",
            title: "Habilitação",
            description: "Dados da CNH para controle e vencimento.",
            content: (
              <>
                <Field label="Número da CNH">
                  <input value={form.licenseNumber} onChange={(event) => updateField("licenseNumber", event.target.value)} />
                </Field>
                <div className="inline-grid">
                  <Field label="Categoria">
                    <input value={form.licenseCategory} onChange={(event) => updateField("licenseCategory", event.target.value.toUpperCase())} placeholder="Ex.: AB" />
                  </Field>
                  <Field label="Validade da CNH">
                    <input type="date" value={form.licenseExpiresAt} onChange={(event) => updateField("licenseExpiresAt", event.target.value)} />
                  </Field>
                </div>
              </>
            )
          },
          {
            id: "driver-status",
            title: "Status",
            description: "Defina a disponibilidade do motorista no sistema.",
            content: (
              <>
                <label className="checkbox-line registration-checkbox">
                  <input type="checkbox" checked={form.active} onChange={(event) => updateField("active", event.target.checked)} />
                  Motorista ativo para novos abastecimentos
                </label>
                <Field label="Observações">
                  <textarea rows="4" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
                </Field>
              </>
            )
          }
        ]}
      />
    </form>
  );
}

function TechnicalPortal() {
  const [checking, setChecking] = useState(true);
  const [account, setAccount] = useState(null);
  const [producers, setProducers] = useState([]);
  const [visits, setVisits] = useState([]);
  const [summary, setSummary] = useState(null);

  function applyTechnicalData(data) {
    setAccount(data.account || null);
    setProducers(data.producers || []);
    setVisits(data.visits || []);
    setSummary(data.summary || null);
  }

  function refreshTechnicalData() {
    return fetchJson("/api/technical/me").then(applyTechnicalData);
  }

  useEffect(() => {
    fetchJson("/api/auth/me")
      .then((data) => {
        if (data.user?.role === "technical") {
          return refreshTechnicalData();
        }
        return null;
      })
      .catch(() => null)
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!account?.id) return undefined;
    const refresh = () => {
      if (document.visibilityState === "visible") refreshTechnicalData().catch(() => null);
    };
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [account?.id]);

  if (checking) {
    return <LoadingScreen label="Carregando portal técnico" />;
  }

  if (!account) {
    return <TechnicalLogin onLogin={() => refreshTechnicalData()} />;
  }

  async function logout() {
    await fetchJson("/api/auth/logout", { method: "POST" }).catch(() => null);
    setAccount(null);
    setProducers([]);
    setVisits([]);
  }

  async function createTechnicalVisit(payload) {
    const data = await fetchJson("/api/technical/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setVisits((current) => [data.visit, ...current.filter((visit) => visit.id !== data.visit.id)]);
    refreshTechnicalData().catch(() => null);
    return data.visit;
  }

  async function saveTechnicalVisit(visitId, payload) {
    const data = await fetchJson(`/api/technical/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setVisits((current) => current.map((visit) => (visit.id === data.visit.id ? data.visit : visit)));
    return data.visit;
  }

  return (
    <TechnicalWorkspace
      account={account}
      createVisit={createTechnicalVisit}
      onLogout={logout}
      producers={producers}
      saveVisit={saveTechnicalVisit}
      summary={summary}
      visits={visits}
    />
  );
}

function TechnicalLogin({ onLogin }) {
  const [login, setLogin] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await fetchJson("/api/auth/access-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, accessCode })
      });
      await onLogin();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="premium-login-screen technical-login-screen">
      <section className="login-shell" aria-label="Acesso da equipe técnica PAF">
        <aside className="login-story technical-login-story">
          <div className="login-story-topline">
            <img className="login-company-logo" src={BRAND_ASSETS.vilaLogoOnDark} alt="Vila Nova Agroindustrial" />
            <span>Portal técnico</span>
          </div>
          <div className="login-story-copy">
            <p className="eyebrow">Acompanhamento de campo</p>
            <h1>Visitas registradas por quem está próximo do produtor.</h1>
            <p>Consulte os produtores vinculados, registre visitas e mantenha o histórico técnico atualizado.</p>
          </div>
          <div className="login-benefit-grid">
            <span><Users size={16} /> Produtores vinculados</span>
            <span><MapPin size={16} /> Visitas de campo</span>
            <span><ShieldCheck size={16} /> Escopo controlado</span>
          </div>
        </aside>

        <section className="premium-login-panel">
          <div className="login-brand">
            <div className="brand-mark login-brand-mark"><img className="brand-mark-img" src={BRAND_ASSETS.pafIcon} alt="" /></div>
            <div>
              <p className="eyebrow">Equipe de campo</p>
              <h1>Acesso técnico</h1>
              <p className="login-panel-text">Use o login criado pela gestão do PAF.</p>
            </div>
          </div>
          <form className="login-form" onSubmit={submit}>
            <Field label="Login">
              <input value={login} onChange={(event) => setLogin(event.target.value)} autoComplete="username" required />
            </Field>
            <Field label="Código de acesso">
              <input type="password" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} autoComplete="current-password" required />
            </Field>
            {error && <p className="form-error">{error}</p>}
            <button className="primary-button wide" type="submit" disabled={loading}>
              {loading ? <Loader2 className="spin" size={18} /> : <LogIn size={18} />}
              Entrar
            </button>
            <a className="login-switch" href="/produtor">Acesso do produtor</a>
            <a className="login-switch" href="/admin">Acesso administrativo</a>
          </form>
        </section>
      </section>
    </main>
  );
}

function TechnicalWorkspace({ account, createVisit, onLogout, producers, saveVisit, summary, visits }) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const normalizedSearch = normalizeForSearch(search);
  const filteredVisits = visits.filter((visit) => [
    visit.producerName,
    visit.producerCpf,
    visit.producerAgency,
    visit.technician,
    visit.objective,
    visit.status
  ].some((value) => normalizeForSearch(value).includes(normalizedSearch)));
  const pagination = usePagedItems(filteredVisits, VISIT_PAGE_SIZE);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  function openCreate() {
    if (!producers.length) return;
    setEditingVisit(null);
    setModalOpen(true);
  }

  function openEdit(visit) {
    setEditingVisit(visit);
    setModalOpen(true);
  }

  return (
    <div className="technical-app">
      <header className="technical-topbar">
        <div className="technical-brand">
          <div className="brand-mark"><img className="brand-mark-img" src={BRAND_ASSETS.pafIcon} alt="" /></div>
          <div>
            <p className="eyebrow">Portal técnico PAF</p>
            <h1>{account.name}</h1>
            <span>{account.organization || account.technicianName || "Equipe técnica Vila Nova"}</span>
          </div>
        </div>
        <button className="icon-text-button" type="button" onClick={onLogout}><LogOut size={17} /> Sair</button>
      </header>

      <main className="technical-main">
        <section className="technical-hero">
          <div>
            <p className="eyebrow">Operação de campo</p>
            <h2>Produtores vinculados e visitas técnicas.</h2>
            <p>Registre o atendimento em campo e mantenha a gestão informada em tempo real.</p>
          </div>
          <button className="primary-button" type="button" disabled={!producers.length} title={!producers.length ? "Nenhum produtor vinculado" : undefined} onClick={openCreate}><Plus size={18} /> Cadastrar visita</button>
        </section>

        <section className="overview-band technical-summary">
          <Metric label="Produtores" value={producers.length} icon={<Users size={20} />} />
          <Metric label="Visitas" value={summary?.total ?? visits.length} icon={<MapPin size={20} />} />
          <Metric label="Programadas" value={summary?.scheduled ?? 0} icon={<CalendarDays size={20} />} />
          <Metric label="Concluídas" value={summary?.completed ?? 0} icon={<Check size={20} />} />
        </section>

        <section className="filters technical-filters">
          <label className="search-field">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar produtor, agência, técnico ou objetivo" />
          </label>
          <button className="ghost-button" type="button" onClick={() => setSearch("")}>Limpar</button>
          <button className="primary-button" type="button" disabled={!producers.length} title={!producers.length ? "Nenhum produtor vinculado" : undefined} onClick={openCreate}><Plus size={17} /> Nova visita</button>
        </section>

        <section className="table-shell">
          <div className="table-heading">
            <div><h2>Histórico de visitas</h2><p>{filteredVisits.length} registros no seu escopo</p></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Produtor</th><th>Data</th><th>Status</th><th>Prioridade</th><th>Objetivo</th><th aria-label="Ações" /></tr></thead>
              <tbody>
                {pagination.items.map((visit) => (
                  <tr
                    key={visit.id}
                    tabIndex="0"
                    aria-label={`Editar visita de ${visit.producerName}`}
                    onClick={() => openEdit(visit)}
                    onKeyDown={(event) => activateRow(event, () => openEdit(visit))}
                  >
                    <td><strong>{visit.producerName}</strong><span>{visit.producerAgency || "Sem agência"}</span></td>
                    <td>{visit.scheduledDate ? formatDate(visit.scheduledDate) : "A definir"}</td>
                    <td><VisitStatusBadge status={visit.status} /></td>
                    <td><VisitPriorityBadge priority={visit.priority} /></td>
                    <td>{visit.objective || "Sem objetivo registrado"}</td>
                    <td><button className="icon-button" type="button" title="Editar visita" onClick={(event) => { event.stopPropagation(); openEdit(visit); }}><Pencil size={16} /></button></td>
                  </tr>
                ))}
                {!pagination.items.length && <tr><td colSpan="6"><span className="empty-row">{producers.length ? "Nenhuma visita cadastrada. Use “Cadastrar visita” para começar." : "Nenhum produtor está vinculado a este acesso. Solicite o vínculo à gestão PAF."}</span></td></tr>}
              </tbody>
            </table>
          </div>
          <PaginationControls pagination={pagination} label="visitas" />
        </section>
      </main>

      <Modal
        eyebrow="Acompanhamento de campo"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVisit ? `Visita · ${editingVisit.producerName}` : "Cadastrar visita"}
        size="large"
      >
        <TechnicalVisitForm
          account={account}
          initial={editingVisit}
          onCancel={() => setModalOpen(false)}
          onSubmit={async (payload) => {
            if (editingVisit) await saveVisit(editingVisit.id, payload);
            else await createVisit(payload);
            setModalOpen(false);
          }}
          producers={producers}
        />
      </Modal>
    </div>
  );
}

function TechnicalVisitForm({ account, initial, onCancel, onSubmit, producers }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    producerId: initial?.producerId || producers[0]?.id || "",
    scheduledDate: initial?.scheduledDate || new Date().toISOString().slice(0, 10),
    status: initial?.status || "PROGRAMADA",
    priority: initial?.priority || "NORMAL",
    technician: initial?.technician || account.technicianName || account.name,
    objective: initial?.objective || "",
    resultNote: initial?.resultNote || ""
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit(form);
    } catch (requestError) {
      setError(requestError.message || "Não foi possível salvar a visita.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="detail-panel technical-visit-form" onSubmit={submit}>
      <StepWizard
        cancelLabel="Cancelar"
        error={error}
        onCancel={onCancel}
        saving={saving}
        submitLabel="Salvar visita"
        steps={[
          {
            id: "technical-visit-producer",
            title: "Produtor",
            description: "Selecione o produtor atendido e a data da visita.",
            content: (
              <>
                <Field label="Produtor">
                  <select value={form.producerId} onChange={(event) => updateField("producerId", event.target.value)} disabled={Boolean(initial)} required>
                    {producers.map((producer) => <option key={producer.id} value={producer.id}>{producer.name} · {producer.agency || "Sem agência"}</option>)}
                  </select>
                </Field>
                <div className="inline-grid">
                  <Field label="Data da visita"><input type="date" value={form.scheduledDate} onChange={(event) => updateField("scheduledDate", event.target.value)} /></Field>
                  <Field label="Prioridade"><select value={form.priority} onChange={(event) => updateField("priority", event.target.value)}>{VISIT_PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></Field>
                </div>
              </>
            )
          },
          {
            id: "technical-visit-service",
            title: "Atendimento",
            description: "Registre o técnico, o status e o objetivo do atendimento.",
            content: (
              <>
                <div className="inline-grid">
                  <Field label="Técnico"><input value={form.technician} onChange={(event) => updateField("technician", event.target.value)} required /></Field>
                  <Field label="Status"><select value={form.status} onChange={(event) => updateField("status", event.target.value)}>{VISIT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></Field>
                </div>
                <Field label="Objetivo da visita"><textarea rows="5" value={form.objective} onChange={(event) => updateField("objective", event.target.value)} required /></Field>
              </>
            )
          },
          {
            id: "technical-visit-result",
            title: "Resultado",
            description: "Descreva o que foi encontrado e os próximos encaminhamentos.",
            content: (
              <Field label="Resultado e orientação técnica"><textarea rows="7" value={form.resultNote} onChange={(event) => updateField("resultNote", event.target.value)} /></Field>
            )
          }
        ]}
      />
    </form>
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
    const refreshProducerData = () => {
      if (document.visibilityState !== "visible") return;
      fetchJson("/api/producer/me")
        .then((data) => {
          setProducer(data.producer);
          setReports(data.reports || []);
          setVisits(data.visits || []);
        })
        .catch(() => null);
    };
    const timer = window.setInterval(refreshProducerData, 30000);
    document.addEventListener("visibilitychange", refreshProducerData);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshProducerData);
    };
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
            <a className="login-switch" href="/tecnico">
              Portal de visitas dos técnicos
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

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
            <div className="report-form-heading">
              <div>
                <p className="eyebrow">Novo acompanhamento</p>
                <h2>Atualize os dados da sua produção</h2>
              </div>
              <span>Leva poucos minutos</span>
            </div>

            <StepWizard
              cancelLabel="Limpar"
              className="producer-report-wizard"
              error={error}
              onCancel={() => setForm((current) => ({ ...current, notes: "", productionNote: "", needsVisit: false }))}
              resetKey={reports.length}
              saving={submitting}
              submitLabel="Enviar relatório"
              steps={[
                {
                  id: "producer-report-contact",
                  title: "Identificação",
                  description: "Confirme a data, seu contato e a situação atual da área.",
                  content: (
                    <div className="form-grid">
                      <Field label="Data do relatório">
                        <input
                          type="date"
                          value={form.reportDate}
                          onChange={(event) => updateField("reportDate", event.target.value)}
                          required
                        />
                      </Field>
                      <Field label="Telefone para contato">
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
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  )
                },
                {
                  id: "producer-report-production",
                  title: "Produção",
                  description: "Informe os dados atuais do plantio e confirme o local da produção.",
                  content: (
                    <div className="form-grid">
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
                      <Field label="Data do plantio">
                        <input type="date" value={form.plantingDate} onChange={(event) => updateField("plantingDate", event.target.value)} />
                      </Field>
                      <Field label="Endereço da área">
                        <input value={form.address} onChange={(event) => updateField("address", event.target.value)} />
                      </Field>
                    </div>
                  )
                },
                {
                  id: "producer-report-final",
                  title: "Finalização",
                  description: "Conte o que mudou e sinalize se precisa do apoio da equipe técnica.",
                  content: (
                    <div className="report-final-fields">
                      <Field label="Produção ou andamento">
                        <input value={form.productionNote} onChange={(event) => updateField("productionNote", event.target.value)} placeholder="Ex.: plantio concluído, manutenção ou colheita" />
                      </Field>
                      <Field label="Observações para a equipe técnica">
                        <textarea rows="5" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Descreva ocorrências, dúvidas ou necessidades da área" />
                      </Field>
                      <label className="checkbox-line visit-request-control">
                        <input
                          type="checkbox"
                          checked={form.needsVisit}
                          onChange={(event) => updateField("needsVisit", event.target.checked)}
                        />
                        <span>
                          <strong>Solicitar visita técnica</strong>
                          <small>Marque quando precisar de acompanhamento presencial da equipe PAF.</small>
                        </span>
                      </label>
                      <div className="report-review-strip" aria-label="Resumo do relatório">
                        <span><small>Situação</small><strong>{form.areaStatus}</strong></span>
                        <span><small>Área</small><strong>{formatArea(form.areaHa)} ha</strong></span>
                        <span><small>Visita</small><strong>{form.needsVisit ? "Solicitada" : "Não solicitada"}</strong></span>
                      </div>
                    </div>
                  )
                }
              ]}
            />
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
        {total ? `Mostrando ${start + 1}-${end} de ${total} ${label}` : "Nenhum registro"}
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
  const panelRef = useRef(null);
  const openerRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      const focusTarget = panelRef.current?.querySelector("[data-modal-autofocus]")
        || panelRef.current?.querySelector("input:not([disabled]), select:not([disabled]), textarea:not([disabled])")
        || panelRef.current?.querySelector("button:not([disabled]), a[href]");
      (focusTarget || panelRef.current)?.focus();
    });

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = [...panelRef.current.querySelectorAll(
        "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href]"
      )].filter((element) => element instanceof HTMLElement && element.offsetParent !== null && !element.closest("[inert]"));
      if (!focusable.length) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section ref={panelRef} tabIndex="-1" className={`modal-panel modal-panel-${size}`} role="dialog" aria-modal="true" aria-label={title}>
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
    </div>,
    document.body
  );
}

function activateRow(event, action) {
  if (event.target !== event.currentTarget || !["Enter", " "].includes(event.key)) return;
  event.preventDefault();
  action();
}

function SelectFilter({ ariaLabel = "Filtrar resultados", children, icon, value, onChange }) {
  return (
    <label className="select-field">
      {icon}
      <select aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)}>
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

function formatDecimal(value, digits = 2) {
  const numeric = Number(value || 0);
  return numeric.toLocaleString("pt-BR", {
    minimumFractionDigits: numeric % 1 === 0 ? 0 : Math.min(digits, 2),
    maximumFractionDigits: digits
  });
}

function formatFuelMonthLabel(item = {}) {
  if (item.key && /^\d{4}-\d{2}$/.test(item.key)) {
    const [year, month] = item.key.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(date);
  }

  return [item.month || item.label, item.year].filter(Boolean).join(" ") || "-";
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
