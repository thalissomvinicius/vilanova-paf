import React, { useEffect, useRef, useState } from 'react';
import { KeyRound, Loader2, Pencil, Plus, Search, ShieldCheck, UserCheck, UserX, X } from 'lucide-react';
import { ACCESS_ROLES, canManageAccess, manageableRoles } from './access-model.mjs';
import { issueFieldAccess, loadFieldAccesses, saveFieldAccess } from './client';

export function FieldAccesses({ profile }) {
  const [rows, setRows] = useState([]), [search, setSearch] = useState(''), [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [editor, setEditor] = useState(null);
  const [credential, setCredential] = useState(null), [action, setAction] = useState(null), [busy, setBusy] = useState(false);
  const generation = useRef(0);
  async function refresh() {
    const id = ++generation.current;
    setLoading(true);
    try { const data = await loadFieldAccesses(profile); if (id === generation.current) { setRows(data); setError(''); } }
    catch (reason) { if (id === generation.current) setError(reason.message); }
    finally { if (id === generation.current) setLoading(false); }
  }
  useEffect(() => { refresh(); return () => { generation.current++; }; }, [profile.id]);
  const roles = manageableRoles(profile);
  if (!roles.length) return <div className="field-empty"><ShieldCheck /><h2>Acesso restrito</h2><p>A gestao de logins e exclusiva da equipe gestora.</p></div>;
  const filtered = rows.filter(row => `${row.nome} ${row.email}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')) && (!status || String(row.ativo) === status));
  async function confirmAction() {
    setBusy(true); setError('');
    try {
      if (action.type === 'reset') setCredential(await issueFieldAccess({ userId: action.row.id }, true));
      else await saveFieldAccess(action.row, { ...action.row, ativo: !action.row.ativo });
      setAction(null); await refresh();
    } catch (reason) { setError(reason.message); setAction(null); }
    finally { setBusy(false); }
  }
  return <section className="field-accesses" aria-label="Logins da equipe e aplicativo">
    <header className="field-heading"><div><p className="eyebrow">PAF VNA / PAF</p><h2>Equipe e aplicativo</h2><p>{rows.filter(row => row.ativo).length} ativos / {rows.filter(row => !row.ativo).length} bloqueados</p></div><button className="primary-button" onClick={() => setEditor({})}><Plus size={18} />Cadastrar acesso</button></header>
    <div className="field-filterbar"><label className="field-search"><Search size={18} /><input aria-label="Buscar acessos da equipe" placeholder="Nome ou e-mail" value={search} onChange={event => setSearch(event.target.value)} /></label><label>Situacao<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option><option value="true">Ativos</option><option value="false">Bloqueados</option></select></label></div>
    {error && <p role="alert" className="form-error">{error}<button className="icon-text-button" onClick={refresh}>Atualizar</button></p>}
    {loading ? <div className="field-loading" role="status"><Loader2 className="spin" />Carregando acessos...</div> : <div className="field-table-scroll"><table className="field-table"><thead><tr><th>Pessoa / e-mail</th><th>Perfil</th><th>Situacao</th><th>Acoes</th></tr></thead><tbody>{filtered.map(row => <tr key={row.id}><td><strong>{row.nome}{row.id === profile.id ? ' (voce)' : ''}</strong><small>{row.email}</small></td><td>{ACCESS_ROLES[row.papel] ?? 'Super administrador'}</td><td><span className={`field-status ${row.ativo ? 'aprovado' : 'rejeitado'}`}>{row.ativo ? 'Ativo' : 'Bloqueado'}</span>{row.deve_trocar_senha && <small>Troca de senha pendente</small>}</td><td><div className="field-actions"><button className="field-open" title={`Editar ${row.nome}`} disabled={!canManageAccess(profile, row)} onClick={() => setEditor(row)}><Pencil size={17} /></button><button className="field-open" title={`Redefinir senha de ${row.nome}`} disabled={!row.ativo || !canManageAccess(profile, row)} onClick={() => setAction({ type: 'reset', row })}><KeyRound size={17} /></button><button className="field-open" title={`${row.ativo ? 'Bloquear' : 'Reativar'} ${row.nome}`} disabled={!canManageAccess(profile, row)} onClick={() => setAction({ type: 'status', row })}>{row.ativo ? <UserX size={17} /> : <UserCheck size={17} />}</button></div></td></tr>)}</tbody></table>{!filtered.length && <div className="field-empty">Nenhum acesso encontrado.</div>}</div>}
    {editor && <AccessEditor target={editor} roles={roles} onClose={() => setEditor(null)} onSaved={async result => { setEditor(null); if (result) setCredential(result); await refresh(); }} />}
    {action && <AccessDialog title={action.type === 'reset' ? 'Redefinir senha' : action.row.ativo ? 'Bloquear acesso' : 'Reativar acesso'} busy={busy} onClose={() => setAction(null)}><p>{action.row.nome} / {action.row.email}</p><p>{action.type === 'reset' ? 'A senha atual sera substituida por uma senha temporaria.' : 'O historico de visitas e coletas sera preservado.'}</p><button className="primary-button" disabled={busy} onClick={confirmAction}>{busy && <Loader2 className="spin" size={16} />}Confirmar</button></AccessDialog>}
    {credential && <AccessDialog title="Credencial temporaria" onClose={() => setCredential(null)}><p>{credential.email}</p><label>Senha temporaria<input readOnly autoComplete="off" value={credential.temporaryPassword} /></label><p>Troca obrigatoria no primeiro acesso. {credential.emailStatus === 'sent' ? 'Credencial enviada por e-mail.' : 'Envio por e-mail indisponivel. Entregue esta credencial por um canal privado.'}</p></AccessDialog>}
  </section>;
}

function AccessEditor({ target, roles, onClose, onSaved }) {
  const [name, setName] = useState(target.nome ?? ''), [email, setEmail] = useState(target.email ?? ''), [role, setRole] = useState(target.papel ?? 'tecnico');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = target.id ? await saveFieldAccess(target, { nome: name, papel: role, ativo: target.ativo }) : await issueFieldAccess({ name, email, role });
      await onSaved(result);
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }
  return <AccessDialog title={target.id ? 'Editar acesso' : 'Cadastrar acesso'} busy={busy} onClose={onClose}><form className="access-form" onSubmit={submit}><label>Nome<input required minLength={3} maxLength={120} value={name} onChange={event => setName(event.target.value)} /></label><label>E-mail<input type="email" required maxLength={254} readOnly={Boolean(target.id)} autoComplete="off" value={email} onChange={event => setEmail(event.target.value)} /></label><label>Perfil<select value={role} onChange={event => setRole(event.target.value)}>{roles.map(value => <option key={value} value={value}>{ACCESS_ROLES[value]}</option>)}</select></label>{error && <p role="alert" className="form-error">{error}</p>}<button className="primary-button" disabled={busy}>{busy && <Loader2 size={16} className="spin" />}Salvar acesso</button></form></AccessDialog>;
}

function AccessDialog({ title, children, busy, onClose }) {
  const dialog = useRef(null);
  useEffect(() => { dialog.current.showModal(); const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = previous; }; }, []);
  return <dialog ref={dialog} className="field-dialog access-dialog" aria-label={title} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}><header><h2>{title}</h2><button className="field-open" title="Fechar" aria-label="Fechar" disabled={busy} onClick={onClose}><X size={20} /></button></header><div className="field-dialog-body">{children}</div></dialog>;
}
