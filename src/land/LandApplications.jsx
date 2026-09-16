import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardList, Copy, Download, ExternalLink, FileSearch, Loader2, RefreshCw, Search, ShieldCheck, Sprout, X } from 'lucide-react';
import { LAND_STATUSES, validCpf } from '../../supabase/functions/paf-api/land-domain.mjs';
import { DeveloperSignature } from '../ui/Workspace';
import './land.css';

const date = value => new Date(value).toLocaleString('pt-BR');
const birthday = value => value.split('-').reverse().join('/');
const apiRoot = '/api/land';
async function publicApi(path, body) {
  const response = await fetch(`${apiRoot}/${path}`, { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir. Tente novamente.');
  return data;
}
function saveFile(content, name, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Status({ value }) { return <span className={`land-status land-status-${value}`}>{LAND_STATUSES[value] || value}</span>; }
function Message({ children }) { return children ? <p className="land-error" role="alert">{children}</p> : null; }
function History({ request, history = [], staff = false }) {
  return <ol className="land-history">
    {history.map((item, index) => <li key={item.id || index}><Status value={item.status} /><time>{date(item.created_at)}</time><p>{item.comment}</p>{staff && <small>{item.actor}</small>}</li>)}
    <li><strong>Solicitação recebida</strong><time>{date(request.created_at)}</time><p>Cadastro encaminhado para análise da equipe PAF.</p></li>
  </ol>;
}

export function LandPublic() {
  const [tab, setTab] = useState('new');
  function switchTab(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'new' : event.key === 'End' ? 'track' : tab === 'new' ? 'track' : 'new';
    setTab(next);
    document.getElementById(`land-${next}-tab`)?.focus();
  }
  return <div className="land-public land-ui">
    <header className="land-public-header"><img src="/brand/paf-symbol-official.png" alt="PAF Agricultura Familiar" /><div><strong>PAF VNA</strong><span>Programa de Agricultura Familiar</span></div><span className="land-header-note"><ShieldCheck size={17} /> Canal de solicitações</span></header>
    <main className="land-public-main">
      <div className="land-intro"><p className="eyebrow">AGRICULTURA FAMILIAR</p><h1>Análise de áreas para plantio de dendê</h1><p>Cadastre seu interesse e acompanhe o parecer da equipe PAF sobre a possibilidade de encaminhamento para financiamento.</p></div>
      <div className="land-tabs" role="tablist" aria-label="Solicitações de análise" onKeyDown={switchTab}>
        <button role="tab" tabIndex={tab === 'new' ? 0 : -1} aria-selected={tab === 'new'} aria-controls="land-new" id="land-new-tab" onClick={() => setTab('new')}><Sprout size={18} /> Nova solicitação</button>
        <button role="tab" tabIndex={tab === 'track' ? 0 : -1} aria-selected={tab === 'track'} aria-controls="land-track" id="land-track-tab" onClick={() => setTab('track')}><FileSearch size={18} /> Consultar andamento</button>
      </div>
      <section id="land-new" role="tabpanel" aria-labelledby="land-new-tab" hidden={tab !== 'new'}><ApplicationForm /></section>
      <section id="land-track" role="tabpanel" aria-labelledby="land-track-tab" hidden={tab !== 'track'}><Tracking active={tab === 'track'} /></section>
      <aside className="land-notice"><ShieldCheck size={21} /><p>Esta solicitação é uma análise preliminar da área. Não representa aprovação ou garantia de financiamento. A decisão de crédito cabe à instituição financeira.</p></aside>
    </main>
    <footer className="land-public-footer">
      <div className="land-footer-identity"><img src="/brand/logo-vilanova.png" alt="Vila Nova Agroindustrial" /><div><strong>Vila Nova Agroindustrial</strong><span>Programa de Agricultura Familiar</span><span>Tomé-Açu / PA</span></div></div>
      <div className="land-footer-credit"><DeveloperSignature /></div>
    </footer>
  </div>;
}

function ApplicationForm() {
  const initial = () => ({ clientId: crypto.randomUUID(), fullName: '', cpf: '', birthDate: '', phone: '', municipality: '', community: '', consent: false, website: '' });
  const [values, setValues] = useState(initial);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [copied, setCopied] = useState(false);
  const heading = useRef(null);
  const form = useRef(null);
  const locked = useRef(false);
  const previousStep = useRef(step);
  useEffect(() => { if (step !== previousStep.current) heading.current?.focus(); previousStep.current = step; }, [step]);
  function field(name, label, props = {}) {
    return <label>{label}<input name={name} value={values[name]} onChange={event => setValues(old => ({ ...old, [name]: event.target.value }))} required {...props} /></label>;
  }
  async function submit(event) {
    event.preventDefault();
    if (locked.current) return;
    setError('');
    if (step === 0 && !validCpf(values.cpf)) { setError('Confira o CPF informado.'); return; }
    if (step < 2) { setStep(step + 1); return; }
    locked.current = true; setBusy(true);
    try { const data = await publicApi('requests', values); setReceipt(data.request); setValues(initial()); }
    catch (err) { setError(err.name === 'TimeoutError' ? 'A conexão demorou. Tente enviar novamente; o mesmo envio não será duplicado.' : err.message); }
    finally { setBusy(false); locked.current = false; }
  }
  if (receipt) return <div className="land-receipt" role="status"><CheckCircle2 size={38} /><h2>Solicitação recebida</h2><p>Guarde seu protocolo. Ele será necessário, junto com o CPF, para consultar o andamento.</p><strong className="land-protocol">{receipt.protocol}</strong><Status value={receipt.status} /><div className="land-actions"><button className="primary-button" onClick={() => saveFile(`PAF VNA - Protocolo de solicitação\n${receipt.protocol}\nRecebida em: ${date(receipt.created_at)}\nConsulte com seu CPF em: ${location.origin}/analise-de-area\nGuarde este comprovante em local seguro.`, `protocolo-${receipt.protocol}.txt`)}><Download size={18} /> Salvar protocolo</button><button className="icon-text-button" onClick={async () => { try { await navigator.clipboard.writeText(receipt.protocol); setCopied(true); } catch { setError('Não foi possível copiar. Use Salvar protocolo.'); } }}>{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? 'Copiado' : 'Copiar'}</button></div><Message>{error}</Message><button className="land-text-button" onClick={() => { setReceipt(null); setStep(0); setError(''); setCopied(false); }}>Cadastrar outra pessoa</button></div>;
  return <form ref={form} onSubmit={submit} className="land-form">
    <ol className="land-steps" aria-label="Etapas do cadastro">{['Dados pessoais', 'Localização', 'Conferência'].map((label, index) => <li key={label} aria-current={index === step ? 'step' : undefined} className={index === step ? 'is-current' : index < step ? 'is-complete' : ''}><span>{index < step ? <Check size={15} /> : index + 1}</span>{label}</li>)}</ol>
    <h2 ref={heading} tabIndex={-1}>{['Quem solicita a análise?', 'Onde fica a área?', 'Confira antes de enviar'][step]}</h2>
    <div className="land-fields" key={step}>
      {step === 0 && <>{field('fullName', 'Nome completo', { autoComplete: 'name', minLength: 5, maxLength: 160 })}{field('cpf', 'CPF', { inputMode: 'numeric', placeholder: '000.000.000-00', maxLength: 14 })}{field('birthDate', 'Data de nascimento', { type: 'date', min: '1900-01-01', max: new Date().toISOString().slice(0, 10), autoComplete: 'bday' })}{field('phone', 'Telefone de contato com DDD (opcional)', { type: 'tel', autoComplete: 'tel', required: false, maxLength: 16, placeholder: '(91) 99999-9999' })}</>}
      {step === 1 && <>{field('municipality', 'Município da área', { minLength: 2, maxLength: 100 })}{field('community', 'Comunidade da área', { minLength: 2, maxLength: 120 })}</>}
    </div>
    {step === 2 && <><dl className="land-data">{[['Nome completo', values.fullName], ['CPF', values.cpf], ['Data de nascimento', birthday(values.birthDate)], ['Telefone de contato', values.phone || 'Não informado'], ['Município', values.municipality], ['Comunidade', values.community]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><label className="land-consent"><input type="checkbox" required checked={values.consent} onChange={e => setValues(old => ({ ...old, consent: e.target.checked }))} /><span>Estou ciente de que a Vila Nova Agroindustrial utilizará estes dados para avaliar a solicitação e entrar em contato. O parecer ficará disponível mediante protocolo e CPF.</span></label><p className="land-muted">Os dados ficarão restritos à equipe autorizada. Para correção dos dados ou dúvidas sobre seu uso, procure a equipe PAF.</p></>}
    <label className="land-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={e => setValues(old => ({ ...old, website: e.target.value }))} /></label>
    <Message>{error}</Message>
    <div className="land-form-footer"><span className="land-muted">Etapa {step + 1} de 3</span><div className="land-actions">{step > 0 && <button className="icon-text-button" type="button" disabled={busy} onClick={() => { setStep(step - 1); setError(''); }}><ArrowLeft size={17} /> Voltar</button>}<button className="primary-button" disabled={busy}>{busy ? <Loader2 size={18} className="land-spin" /> : step === 2 ? <Check size={18} /> : <ArrowRight size={18} />}{busy ? 'Enviando...' : step === 2 ? 'Enviar solicitação' : 'Continuar'}</button></div></div>
  </form>;
}

function Tracking({ active }) {
  const [protocol, setProtocol] = useState(''); const [cpf, setCpf] = useState('');
  const [credentials, setCredentials] = useState(null); const [result, setResult] = useState(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const generation = useRef(0); const pending = useRef(false);
  async function lookup(input, quiet = false) {
    if (pending.current) return;
    const version = generation.current; pending.current = true;
    if (!quiet) setBusy(true);
    try { const data = await publicApi('lookup', input); if (version !== generation.current) return; setResult(data.request); setCredentials(input); setError(''); }
    catch (err) { if (version === generation.current) { setError(quiet ? 'Não foi possível atualizar agora. O parecer abaixo é o último consultado.' : err.message); if (!quiet) setResult(null); } }
    finally { pending.current = false; setBusy(false); }
  }
  useEffect(() => { if (!active || !credentials) return; const timer = setInterval(() => { if (document.visibilityState === 'visible') lookup(credentials, true); }, 60000); return () => clearInterval(timer); }, [active, credentials]);
  useEffect(() => () => { generation.current++; }, []);
  return <div className="land-form"><h2>Consulte sua solicitação</h2><form onSubmit={e => { e.preventDefault(); generation.current++; setCredentials(null); lookup({ protocol: protocol.trim(), cpf }); }}><div className="land-fields"><label>Protocolo<input required maxLength={40} value={protocol} onChange={e => setProtocol(e.target.value)} autoCapitalize="characters" placeholder="PAF-XXXXXX-XXXXXX-XXXXXX-XXXXXX" /></label><label>CPF do solicitante<input required value={cpf} maxLength={14} inputMode="numeric" onChange={e => setCpf(e.target.value)} autoComplete="off" /></label></div><div className="land-actions"><button className="primary-button" disabled={busy}>{busy ? <Loader2 size={18} className="land-spin" /> : <Search size={18} />} Consultar andamento</button>{result && <button type="button" className="icon-text-button" onClick={() => { generation.current++; setResult(null); setCredentials(null); setCpf(''); setProtocol(''); setError(''); }}>Encerrar consulta</button>}</div></form><Message>{error}</Message>{result && <section className="land-tracking-result" aria-live="polite"><div className="land-section-heading"><h2>Andamento da solicitação</h2><Status value={result.status} /></div><span className="land-muted">Atualizado em {date(result.updated_at)}</span><p className="land-public-comment">{result.comment}</p><History request={result} history={result.history} /></section>}</div>;
}

export function LandAdmin({ api }) {
  const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
  const [data, setData] = useState({ requests: [], total: 0 }); const [busy, setBusy] = useState(true); const [error, setError] = useState('');
  const [selected, setSelected] = useState(null); const [copied, setCopied] = useState(false); const sequence = useRef(0);
  const publicUrl = `${location.origin}/analise-de-area`;
  const load = useCallback(async (quiet = false) => {
    const current = ++sequence.current; if (!quiet) setBusy(true);
    try { const result = await api(`${apiRoot}/admin/requests?${new URLSearchParams({ search, status, page })}`); if (current !== sequence.current) return; setData(result); setError(''); }
    catch (err) { if (current === sequence.current) setError(err.message); }
    finally { if (current === sequence.current) setBusy(false); }
  }, [api, search, status, page]);
  useEffect(() => { const delay = setTimeout(() => load(), 250); const timer = setInterval(() => { if (document.visibilityState === 'visible') load(true); }, 30000); return () => { clearTimeout(delay); clearInterval(timer); sequence.current++; }; }, [load]);
  function exportPage() {
    const cell = value => `"${String(value ?? '').replace(/^[=+@-]/, "'$&").replace(/"/g, '""')}"`;
    const rows = [['Protocolo', 'Nome', 'CPF', 'Nascimento', 'Telefone', 'Município', 'Comunidade', 'Resultado', 'Recebido em'], ...data.requests.map(row => [row.protocol, row.full_name, row.cpf, birthday(row.birth_date), row.phone, row.municipality, row.community, LAND_STATUSES[row.status], date(row.created_at)])];
    saveFile('\uFEFF' + rows.map(row => row.map(cell).join(';')).join('\r\n'), `analises-pagina-${page}.csv`, 'text/csv;charset=utf-8');
  }
  return <section className="land-admin land-ui"><div className="land-section-heading"><div><p className="eyebrow">CAPTAÇÃO E VIABILIDADE</p><h2>Solicitações de análise de área</h2><p className="land-muted">{data.total} solicitações {search || status ? 'encontradas' : 'recebidas'}</p></div><div className="land-actions"><button className="icon-text-button" onClick={() => load()} disabled={busy} title="Atualizar solicitações"><RefreshCw size={17} /> Atualizar</button><button className="icon-text-button" onClick={exportPage} disabled={!data.requests.length || busy}><Download size={17} /> Exportar página</button></div></div>
    <div className="land-share"><div><strong>Formulário público</strong><a href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}<ExternalLink size={14} /></a></div><button className="primary-button" onClick={async () => { try { await navigator.clipboard.writeText(publicUrl); setCopied(true); } catch { setError('Não foi possível copiar. Selecione o endereço do formulário.'); } }}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? 'Link copiado' : 'Copiar link'}</button></div>
    <div className="land-filters"><label>Buscar solicitações<input type="search" placeholder="Nome, CPF sem pontos, protocolo ou local" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></label><label>Resultado<select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Todos os resultados</option>{Object.entries(LAND_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    <Message>{error}</Message>
    <div className="land-table-wrap" aria-busy={busy}><table className="land-table"><thead><tr><th>Solicitante</th><th>Localização</th><th>Recebimento</th><th>Resultado</th><th><span className="land-muted">Análise</span></th></tr></thead><tbody>{data.requests.map(row => <tr key={row.id}><td><strong>{row.full_name}</strong><span>{row.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</span><small>{row.protocol}</small></td><td>{row.municipality}<span>{row.community}</span></td><td>{date(row.created_at)}</td><td><Status value={row.status} /></td><td><button className="icon-text-button" onClick={() => setSelected(row.id)} aria-label={`Analisar ${row.full_name}`}><FileSearch size={17} /> Analisar</button></td></tr>)}</tbody></table>{!data.requests.length && <div className="land-empty"><ClipboardList size={30} /><h3>{busy ? 'Buscando solicitações...' : error ? 'Não foi possível carregar' : 'Nenhuma solicitação encontrada'}</h3>{!busy && !error && <p>Os cadastros recebidos pelo formulário público aparecerão aqui.</p>}</div>}</div>
    <div className="land-pagination"><span>Página {page} de {Math.max(1, Math.ceil(data.total / 25))}</span><div className="land-actions"><button className="icon-text-button" disabled={page <= 1 || busy} onClick={() => setPage(page - 1)} aria-label="Página anterior"><ArrowLeft size={18} /></button><button className="icon-text-button" disabled={page * 25 >= data.total || busy} onClick={() => setPage(page + 1)} aria-label="Próxima página"><ArrowRight size={18} /></button></div></div>
    {selected && <ReviewDialog key={selected} id={selected} api={api} onClose={() => setSelected(null)} onSaved={() => load(true)} />}
  </section>;
}

function ReviewDialog({ id, api, onClose, onSaved }) {
  const dialog = useRef(null); const [data, setData] = useState(null); const [status, setStatus] = useState('EM_ANALISE'); const [comment, setComment] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const dirty = data && (status !== data.request.status || comment !== data.request.comment);
  function close() { if (!busy && (!dirty || window.confirm('Descartar o parecer ainda não salvo?'))) onClose(); }
  useEffect(() => { dialog.current.showModal(); const controller = new AbortController(); api(`${apiRoot}/admin/requests/${id}`, { signal: controller.signal }).then(result => { setData(result); setStatus(result.request.status); setComment(result.request.comment); }).catch(err => { if (err.name !== 'AbortError') setError(err.message); }); return () => controller.abort(); }, [id, api]);
  async function save(event) {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    try { const result = await api(`${apiRoot}/admin/requests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, comment, version: data.request.version }) }); setData(result); setStatus(result.request.status); setComment(result.request.comment); onSaved(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <dialog className="land-dialog land-ui" ref={dialog} aria-labelledby="land-review-heading" onCancel={event => { event.preventDefault(); close(); }}><div className="land-dialog-header"><div><p className="eyebrow">ANÁLISE DA EQUIPE</p><h2 id="land-review-heading">{data?.request.full_name || 'Solicitação de análise'}</h2></div><button className="icon-text-button" type="button" title="Fechar análise" aria-label="Fechar análise" disabled={busy} onClick={close}><X size={20} /></button></div><div className="land-dialog-body"><Message>{error}</Message>{!data && !error && <p role="status">Carregando dados...</p>}{data && <><p className="land-protocol-small">{data.request.protocol}</p><dl className="land-data">{[['CPF', data.request.cpf], ['Data de nascimento', birthday(data.request.birth_date)], ['Telefone', data.request.phone || 'Não informado'], ['Município', data.request.municipality], ['Comunidade', data.request.community], ['Recebimento', date(data.request.created_at)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><form onSubmit={save}><label>Resultado da análise<select value={status} onChange={e => setStatus(e.target.value)}>{Object.entries(LAND_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Parecer para o solicitante<textarea required minLength={10} maxLength={2000} rows={5} value={comment} onChange={e => setComment(e.target.value)} aria-describedby="land-comment-help" /></label><p id="land-comment-help" className="land-muted">Este comentário será visível na consulta pública. Registre o motivo e as orientações, sem dados bancários ou informações de terceiros.</p><div className="land-actions"><button className="primary-button" disabled={busy || !dirty}>{busy ? <Loader2 size={18} className="land-spin" /> : <Check size={18} />}{busy ? 'Salvando...' : 'Salvar parecer'}</button>{!dirty && data.history.length > 0 && <span role="status" className="land-muted">Parecer salvo e disponível para consulta.</span>}</div></form><h3>Histórico da solicitação</h3><History request={data.request} history={data.history} staff /></>}</div></dialog>;
}
