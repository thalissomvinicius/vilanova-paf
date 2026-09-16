import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ClipboardList, Download, Eye, EyeOff, FileText, Leaf, Loader2, LogOut, MapPin, RefreshCcw, Search, ShieldCheck, Smartphone, X } from 'lucide-react';
import { AnimatedValue } from '../components/AnimatedValue';
import { FieldAccesses } from './FieldAccesses';
import { manageableRoles } from './access-model.mjs';
import { answerText, canReview, csvCell, mapUrl, REVIEW_LABELS } from './model.mjs';
import { changeFieldPassword, fieldClient, fieldSignIn, fieldSignOut, loadFieldCollections, loadFieldCounts, loadFieldDirectories, loadFieldEvidence, loadFieldProfile, reviewFieldCollection } from './client';

const EMPTY_FILTERS = { search: '', status: '', form: '', technician: '', from: '', to: '' };
const date = value => value ? new Date(value).toLocaleString('pt-BR') : '-';
const nameOf = (items, id) => items?.find(item => item.id === id)?.nome ?? 'Nao informado';
const formOf = (directories, row) => directories.forms.find(item => item.id === row.formulario_id);

export function AccessHub({ children }) {
  const [area, setArea] = useState('legacy');
  return <><nav className="access-tabs" aria-label="Areas de acesso"><button className="icon-text-button" aria-pressed={area === 'legacy'} onClick={() => setArea('legacy')}>Portal de produtores</button><button className="icon-text-button" aria-pressed={area === 'field'} onClick={() => setArea('field')}>Equipe e aplicativo</button></nav>{area === 'field' ? <FieldWorkspace mode="accesses" /> : children}</>;
}

function FieldLogin({ onLogin, embedded, error: initialError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError ?? '');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { onLogin(await fieldSignIn(email, password)); setPassword(''); }
    catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }
  return <section className={embedded ? 'field-connect' : 'field-login-page'}>
    <div className="field-connect-copy">
      <img src="/brand/paf-logo-official.png" alt="Programa de Agricultura Familiar" />
      <p className="eyebrow">PAF VNA / PAF</p>
      <h1>O campo, mais perto.</h1>
      <p>Produtores, comunidades e acompanhamento tecnico.</p>
      <div className="field-trust"><Leaf size={18} /> Vila Nova Agroindustrial</div>
    </div>
    <form onSubmit={submit} className="field-auth-form">
      <span className="field-auth-icon"><Smartphone size={24} /></span>
      <h2>Acesso da equipe PAF</h2>
      <p>Entre com seu e-mail de acesso ao PAF VNA.</p>
      <label>E-mail<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Senha<div className="input-with-button"><input type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /><button type="button" title={show ? 'Ocultar senha' : 'Mostrar senha'} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
      {error && <p role="alert" className="form-error">{error}</p>}
      {!fieldClient && <p role="alert" className="form-error">Conexao de campo nao configurada neste ambiente.</p>}
      <button type="submit" className="primary-button wide" disabled={busy || !fieldClient}>{busy ? <Loader2 size={18} className="spin" /> : <ArrowRight size={18} />} Entrar na comunidade</button>
      {!embedded && <a className="login-switch" href="/admin">Gestao administrativa <ArrowRight size={15} /></a>}
    </form>
  </section>;
}

function PasswordChange({ onChanged }) {
  const [password, setPassword] = useState(''), [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setError('');
    if (password !== confirmation) { setError('As senhas nao conferem.'); return; }
    setBusy(true);
    try { onChanged(await changeFieldPassword(password)); }
    catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }
  return <form className="field-auth-form" onSubmit={submit}><ShieldCheck size={28} /><h2>Defina sua senha</h2><p>Conclua o primeiro acesso para continuar.</p><label>Nova senha<input type="password" minLength={10} required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label><label>Confirme a senha<input type="password" required autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy && <Loader2 className="spin" size={16} />}Salvar senha</button></form>;
}

export function FieldWorkspace({ embedded = true, mode = 'collections' }) {
  const [profile, setProfile] = useState(null), [checking, setChecking] = useState(true);
  const [authError, setAuthError] = useState('');
  useEffect(() => {
    let alive = true;
    loadFieldProfile().then(value => { if (alive) setProfile(value); }).catch(reason => { if (alive) setAuthError(reason.message); }).finally(() => { if (alive) setChecking(false); });
    const subscription = fieldClient?.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT' && alive) setProfile(null); });
    return () => { alive = false; subscription?.data.subscription.unsubscribe(); };
  }, []);
  if (checking) return <div className="field-loading" role="status"><Loader2 className="spin" /> Verificando acesso de campo...</div>;
  if (!profile) return <FieldLogin onLogin={setProfile} embedded={embedded} error={authError} />;
  if (profile.deve_trocar_senha) return <PasswordChange onChanged={setProfile} />;
  if (mode === 'accesses') return <section className={embedded ? '' : 'field-standalone'}><div className="field-actions"><a className="icon-text-button" href="/campo">Coletas de campo</a><button className="icon-text-button" onClick={async () => { await fieldSignOut(); setProfile(null); }}><LogOut size={17} />Sair</button></div><FieldAccesses profile={profile} /></section>;
  return <FieldCollections profile={profile} embedded={embedded} onLogout={async () => { try { await fieldSignOut(); } finally { setProfile(null); } }} />;
}

function FieldCollections({ profile, onLogout, embedded }) {
  const [directories, setDirectories] = useState(null), [result, setResult] = useState({ rows: [], total: 0 });
  const [counts, setCounts] = useState(null), [filters, setFilters] = useState(EMPTY_FILTERS), [search, setSearch] = useState('');
  const [page, setPage] = useState(0), [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [updated, setUpdated] = useState(null);
  const requestId = useRef(0), refreshing = useRef(false), directoryRequest = useRef(0);
  const loadDirectories = useCallback(async () => {
    const id = ++directoryRequest.current;
    try { const data = await loadFieldDirectories(profile); if (id === directoryRequest.current) { setDirectories(data); setError(''); } }
    catch (reason) { if (id === directoryRequest.current) setError(reason.message); }
  }, [profile]);
  useEffect(() => { loadDirectories(); return () => { directoryRequest.current++; }; }, [loadDirectories]);
  useEffect(() => { const timer = setTimeout(() => { setPage(0); setFilters(current => ({ ...current, search })); }, 300); return () => clearTimeout(timer); }, [search]);
  const refresh = useCallback(async (quiet = false) => {
    if (!directories || (quiet && refreshing.current)) return;
    const id = ++requestId.current;
    refreshing.current = true; if (!quiet) setBusy(true);
    try {
      const rows = await loadFieldCollections(profile, directories, filters, page);
      const summary = await loadFieldCounts(profile);
      if (id === requestId.current) { setResult(rows); setCounts(summary); setUpdated(new Date()); setError(''); }
    } catch (reason) { if (id === requestId.current) setError(reason.message); }
    finally { if (id === requestId.current) { refreshing.current = false; setBusy(false); } }
  }, [profile, directories, filters, page]);
  useEffect(() => {
    refresh();
    const tick = () => { if (document.visibilityState === 'visible') refresh(true); };
    const timer = setInterval(tick, 30000);
    document.addEventListener('visibilitychange', tick);
    return () => { requestId.current++; refreshing.current = false; clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [refresh]);
  const change = (key, value) => { setPage(0); setFilters(current => ({ ...current, [key]: value })); };
  function exportPage() {
    const rows = [['Formulario', 'Versao', 'Produtor', 'Comunidade', 'Tecnico', 'Data', 'Situacao'], ...result.rows.map(row => [formOf(directories, row)?.titulo, row.formulario_versao, nameOf(directories.producers, row.produtor_id), nameOf(directories.communities, row.comunidade_id), nameOf(directories.users, row.tecnico_id), date(row.coletado_em), REVIEW_LABELS[row.status_validacao]])];
    const blob = new Blob(['\uFEFF' + rows.map(row => row.map(csvCell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob), anchor = document.createElement('a'); anchor.href = url; anchor.download = 'paf-coletas-pagina.csv'; anchor.click(); URL.revokeObjectURL(url);
  }
  return <section className={`field-workspace ${embedded ? '' : 'field-standalone'}`} aria-label="Coletas de campo">
    {manageableRoles(profile).length > 0 && <a className="icon-text-button" href="/campo/acessos"><ShieldCheck size={17} />Gerenciar acessos da equipe</a>}
    <header className="field-heading"><div><p className="eyebrow">PAF VNA</p><h2>Coletas de campo</h2><p>{profile.nome} <span className="field-separator">/</span> {profile.papel}</p></div><div className="field-actions"><span className="field-update">{updated ? `Recebido as ${updated.toLocaleTimeString('pt-BR')}` : 'Aguardando conexao'}</span><button className="icon-text-button" onClick={() => { loadDirectories(); }} disabled={busy} title="Atualizar coletas"><RefreshCcw size={17} className={busy ? 'spin' : ''} />Atualizar</button><button className="icon-text-button" onClick={onLogout} title="Sair do acesso de campo"><LogOut size={17} />Sair</button></div></header>
    <div className="field-kpis">{[['pendente', 'Aguardando revisao', ClipboardList], ['aprovado', 'Coletas aprovadas', Check], ['rejeitado', 'Ajustes solicitados', FileText]].map(([status, label, Icon]) => <button key={status} className={`field-kpi ${status}`} onClick={() => change('status', status)}><span><Icon size={20} /></span><div><small>{label}</small><strong>{counts ? <AnimatedValue value={counts[status]} /> : '-'}</strong></div><ArrowRight size={17} /></button>)}</div>
    <div className="field-filterbar"><label className="field-search"><Search size={18} /><input aria-label="Buscar coletas" placeholder="Produtor, comunidade, tecnico..." value={search} onChange={e => setSearch(e.target.value)} /></label><label>Situacao<select value={filters.status} onChange={e => change('status', e.target.value)}><option value="">Todas</option>{['pendente', 'aprovado', 'rejeitado'].map(status => <option key={status} value={status}>{REVIEW_LABELS[status]}</option>)}</select></label><label>Formulario<select value={filters.form} onChange={e => change('form', e.target.value)}><option value="">Todos</option>{directories?.forms.map(form => <option value={form.id} key={form.id}>{form.titulo} / v{form.versao}</option>)}</select></label><label>Tecnico<select value={filters.technician} onChange={e => change('technician', e.target.value)}><option value="">Todos</option>{directories?.users.map(user => <option value={user.id} key={user.id}>{user.nome}</option>)}</select></label><label>De<input type="date" value={filters.from} max={filters.to || undefined} onChange={e => change('from', e.target.value)} /></label><label>Ate<input type="date" value={filters.to} min={filters.from || undefined} onChange={e => change('to', e.target.value)} /></label><button className="icon-text-button" title="Limpar filtros" onClick={() => { setSearch(''); setFilters(EMPTY_FILTERS); setPage(0); }}><X size={16} />Limpar</button></div>
    {error && <div className="field-error" role="alert"><span>{error}</span><button className="icon-text-button" onClick={() => directories ? refresh() : loadDirectories()}>Tentar novamente</button></div>}
    <div className="field-results-heading"><strong>{result.total} coletas encontradas</strong><button className="icon-text-button" disabled={!result.rows.length || busy} onClick={exportPage}><Download size={17} />Exportar pagina</button></div>
    {busy ? <div className="field-loading" role="status"><Loader2 className="spin" /> Recebendo coletas...</div> : !directories ? <div className="field-loading">Carregando cadastros de campo...</div> : result.rows.length ? <div className="field-table-scroll"><table className="field-table"><thead><tr><th>Coleta / formulario</th><th>Produtor / comunidade</th><th>Tecnico autor</th><th>Coletado em</th><th>Situacao</th><th><span className="sr-only">Acoes</span></th></tr></thead><tbody>{result.rows.map(row => <tr key={row.id}><td><strong>{formOf(directories, row)?.titulo ?? 'Formulario'}</strong><small>Versao {row.formulario_versao} / {row.id.slice(0, 8)}</small></td><td><strong>{nameOf(directories.producers, row.produtor_id)}</strong><small>{nameOf(directories.communities, row.comunidade_id)}</small></td><td>{nameOf(directories.users, row.tecnico_id)}</td><td>{date(row.coletado_em)}</td><td><span className={`field-status ${row.status_validacao}`}>{REVIEW_LABELS[row.status_validacao]}</span></td><td><button className="field-open" title="Abrir coleta" aria-label={`Abrir coleta ${row.id.slice(0, 8)}`} onClick={() => setSelected(row)}><ArrowRight size={18} /></button></td></tr>)}</tbody></table></div> : <div className="field-empty"><ClipboardList size={32} /><h3>Nenhuma coleta encontrada</h3><p>Os registros enviados pelo aplicativo aparecerao aqui.</p></div>}
    <footer className="field-pagination"><span>Pagina {page + 1} de {Math.max(1, Math.ceil(result.total / 25))}</span><button className="icon-text-button" disabled={!page || busy} onClick={() => setPage(page - 1)}>Anterior</button><button className="icon-text-button" disabled={(page + 1) * 25 >= result.total || busy} onClick={() => setPage(page + 1)}>Proxima <ArrowRight size={16} /></button></footer>
    {selected && <CollectionDetails row={selected} directories={directories} profile={profile} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); refresh(); }} />}
  </section>;
}

function CollectionDetails({ row, directories, profile, onClose, onSaved }) {
  const dialog = useRef(null), close = useRef(onClose);
  close.current = onClose;
  const [evidence, setEvidence] = useState(null), [error, setError] = useState(''), [note, setNote] = useState(row.nota_revisao ?? ''), [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    dialog.current.showModal();
    loadFieldEvidence(row).then(data => { if (alive) setEvidence(data); }).catch(reason => { if (alive) setError(reason.message); });
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { alive = false; document.body.style.overflow = previous; };
  }, [row]);
  async function review(status) {
    setBusy(true); setError('');
    try { await reviewFieldCollection(row, profile, status, note); onSaved(); }
    catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }
  const form = formOf(directories, row);
  const definition = form?.definicao_json;
  const fields = Array.isArray(definition) ? definition : definition?.fields ?? [];
  return <dialog className="field-dialog" ref={dialog} onCancel={event => { event.preventDefault(); if (!busy) close.current(); }} aria-labelledby="field-detail-title">
    <header><div><p className="eyebrow">Registro de campo / v{row.formulario_versao}</p><h2 id="field-detail-title">{form?.titulo ?? 'Detalhes da coleta'}</h2></div><button className="field-open" title="Fechar coleta" aria-label="Fechar coleta" disabled={busy} onClick={onClose}><X size={20} /></button></header>
    <div className="field-dialog-body"><div className="field-detail-meta"><span>Produtor<strong>{nameOf(directories.producers, row.produtor_id)}</strong></span><span>Comunidade<strong>{nameOf(directories.communities, row.comunidade_id)}</strong></span><span>Tecnico autor<strong>{nameOf(directories.users, row.tecnico_id)}</strong></span><span>Recebido em<strong>{date(row.recebido_em)}</strong></span></div><h3>Respostas da coleta</h3><dl className="field-answers">{Object.entries(row.dados_json ?? {}).map(([id, value]) => <div key={id}><dt>{fields.find(field => field.id === id)?.label ?? id}</dt><dd>{answerText(value)}</dd></div>)}</dl>{row.observacoes && <p className="field-note">{row.observacoes}</p>}
      <h3>Localizacao e evidencias</h3>{evidence ? <><div className="field-gps">{evidence.gps.map(point => <div key={point.id}><MapPin size={18} /><span>{point.latitude}, {point.longitude}<small>{date(point.capturado_em)} / Precisao: {point.precisao_metros ?? '-'} m</small></span>{mapUrl(point) && <a href={mapUrl(point)} target="_blank" rel="noopener noreferrer">Abrir mapa <ArrowRight size={15} /></a>}</div>)}{!evidence.gps.length && <p>Sem coordenadas registradas.</p>}</div><div className="field-photos">{evidence.photos.map(photo => <figure key={photo.id}>{photo.mime_type?.startsWith('image/') ? <img src={photo.url} alt={photo.nome_arquivo ?? 'Evidencia da coleta'} /> : <a href={photo.url} target="_blank" rel="noopener noreferrer">Abrir anexo</a>}<figcaption>{photo.nome_arquivo ?? 'Evidencia'}<small>{date(photo.capturado_em)}</small></figcaption></figure>)}</div>{!evidence.photos.length && <p>Sem anexos registrados.</p>}</> : <p role="status">Carregando evidencias...</p>}
      {row.revisado_em && <div className="field-review-history"><ShieldCheck size={18} /><div><strong>{REVIEW_LABELS[row.status_validacao]}</strong><p>{nameOf(directories.users, row.revisado_por)} / {date(row.revisado_em)}</p>{row.nota_revisao && <p>{row.nota_revisao}</p>}</div></div>}
      {canReview(profile) && <label className="field-review-note">Observacao da revisao<textarea value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={4000} placeholder="Descreva o ajuste ou a observacao..." /></label>}{error && <p role="alert" className="form-error">{error}</p>}
    </div><footer><button className="icon-text-button" onClick={onClose} disabled={busy}>Fechar</button>{canReview(profile) && <><button className="icon-text-button" onClick={() => review('rejeitado')} disabled={busy}>Solicitar ajuste</button><button className="primary-button" onClick={() => review('aprovado')} disabled={busy}>{busy ? <Loader2 className="spin" size={17} /> : <Check size={17} />}Aprovar coleta</button></>}</footer>
  </dialog>;
}
