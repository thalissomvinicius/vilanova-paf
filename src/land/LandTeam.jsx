import React, { useEffect, useRef, useState } from 'react';
import { Check, Plus, Settings2, UserRoundCheck, X } from 'lucide-react';

export function reviewerNames(settings, current = '') {
  return [...new Set([...(settings?.analysts || []).filter(row => row.active).map(row => row.name), ...(settings?.team || []).map(row => row.nome), ...(current ? [current] : [])])].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function ReviewerSelect({ settings, value, onChange, loading, error }) {
  return <label>Nome de quem realizou a análise<select required value={value || ''} onChange={event => onChange(event.target.value)} disabled={loading}>
    <option value="">{loading ? 'Carregando analistas...' : 'Selecione o analista'}</option>
    {reviewerNames(settings, value).map(name => <option key={name} value={name}>{name}</option>)}
  </select>{error && <small role="alert">{error}</small>}</label>;
}

function TeamDialog({ title, children, onClose, busy }) {
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current, previous = document.activeElement; dialog.showModal(); return () => { dialog.close(); if (previous?.isConnected) previous.focus(); }; }, []);
  function close() { if (!busy) { ref.current.close(); onClose(); } }
  return <dialog ref={ref} className="land-dialog land-ui land-team-dialog" aria-labelledby="land-team-title" onCancel={event => { event.preventDefault(); close(); }}>
    <header className="land-dialog-header"><h2 id="land-team-title">{title}</h2><button className="icon-button" aria-label="Fechar configuração" title="Fechar" disabled={busy} onClick={close}><X size={20} /></button></header>
    <div className="land-dialog-body">{children}</div>
  </dialog>;
}

export function LandTeamSettings({ api, onClose, onSaved }) {
  const [settings, setSettings] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [name, setName] = useState('');
  const lock = useRef(false);
  useEffect(() => { const controller = new AbortController(); api('/api/land/admin/settings', { signal: controller.signal }).then(setSettings).catch(e => { if (e.name !== 'AbortError') setError(e.message); }); return () => controller.abort(); }, [api]);
  async function save(row) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      await api(`/api/land/admin/analysts${row ? `/${row.id}` : ''}`, { method: row ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row ? { name: row.name, active: !row.active, version: row.version } : { name }) });
      setSettings(await api('/api/land/admin/settings')); setName(''); onSaved?.();
    } catch (e) { setError(e.message); } finally { lock.current = false; setBusy(false); }
  }
  return <TeamDialog title="Equipe de análise" onClose={onClose} busy={busy}>
    {error && <p role="alert" className="land-error">{error}</p>}
    {!settings ? <p role="status">Carregando configuração...</p> : <>
      <section><h3>Analistas adicionais</h3><form className="land-name-form" onSubmit={event => { event.preventDefault(); save(); }}><label>Nome completo<input required minLength={3} maxLength={160} value={name} disabled={busy} onChange={event => setName(event.target.value)} /></label><button className="primary-button" disabled={busy}><Plus size={17} /> Cadastrar</button></form>
        <ul className="land-team-list">{settings.analysts.map(row => <li key={row.id}><span><strong>{row.name}</strong><small>{row.active ? 'Disponível para seleção' : 'Inativo'}</small></span><button className="icon-text-button" disabled={busy} onClick={() => save(row)}>{row.active ? 'Desativar' : 'Ativar'}</button></li>)}</ul>
        {!settings.analysts.length && <p className="land-muted">Nenhum analista adicional cadastrado.</p>}
      </section>
      <section><div className="land-section-heading"><h3>Técnicos com acesso ativo</h3><a className="icon-text-button" href="/admin/acessos?area=field"><Settings2 size={17} /> Gerenciar acessos</a></div>
        <ul className="land-team-list">{settings.team.filter(row => ['tecnico', 'agente'].includes(row.papel)).map(row => <li key={row.id}><UserRoundCheck size={20} /><span><strong>{row.nome}</strong><small>{row.email || 'Acesso técnico'}</small></span></li>)}</ul>
        {!settings.team.some(row => ['tecnico', 'agente'].includes(row.papel)) && <p className="land-muted">Nenhum técnico com acesso ativo. Cadastre em Gerenciar acessos.</p>}
      </section>
    </>}
  </TeamDialog>;
}

export function AssignTechnician({ team, current, busy, error, onSave, onClose }) {
  const [value, setValue] = useState(current || '');
  const technicians = team.filter(row => ['tecnico', 'agente'].includes(row.papel) || row.id === current);
  return <TeamDialog title="Técnico responsável" onClose={onClose} busy={busy}><form className="ops-case-form" onSubmit={async event => { event.preventDefault(); if (await onSave(value)) onClose(); }}>
    <label>Técnico<select value={value} onChange={event => setValue(event.target.value)} disabled={busy}><option value="">A definir</option>{technicians.map(row => <option value={row.id} key={row.id}>{row.nome}</option>)}</select></label>
    {!technicians.length && <p className="land-muted">Cadastre um acesso técnico na configuração da equipe.</p>}
    {error && <p className="land-error" role="alert">{error}</p>}
    <button className="primary-button" disabled={busy}><Check size={17} />{busy ? 'Salvando...' : 'Salvar responsável'}</button>
  </form></TeamDialog>;
}
