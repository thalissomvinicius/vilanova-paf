import React, { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { currentTextCorrections, editableTextFields } from './text-corrections.mjs';
import { saveTextCorrection } from './client';

export function TextCorrections({ row, fields, profile, revisions, onReload }) {
  const [editing, setEditing] = useState(false), [values, setValues] = useState({}), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const items = editableTextFields(row, fields), latest = revisions[0];
  const { corrections, stale } = currentTextCorrections(row, fields, latest);
  const allowed = profile?.ativo && !profile.deve_trocar_senha && ['super_admin', 'admin', 'coordenador'].includes(profile.papel);
  function start() { setValues(Object.fromEntries(items.map(item => [item.id, corrections[item.id] ?? item.original]))); setError(''); setEditing(true); }
  async function save() {
    const changes = Object.fromEntries(items.filter(item => values[item.id] !== item.original).map(item => [item.id, values[item.id]]));
    if (items.some(item => item.original.trim() && !values[item.id]?.trim())) { setError('Não deixe em branco um texto que estava preenchido.'); return; }
    setBusy(true); setError('');
    try { await saveTextCorrection(row, latest, changes); setEditing(false); await onReload(); }
    catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }
  return <section className="field-text-corrections" aria-label="Revisão textual">
    <div className="field-text-corrections-heading"><div><h3>Revisão textual</h3><p>O registro original e suas assinaturas são preservados.</p></div>{allowed && items.length > 0 && !editing && <button className="icon-text-button" onClick={start}><Pencil size={17} />Corrigir textos</button>}</div>
    {stale.length > 0 && <p role="alert" className="field-text-warning">O conteúdo original mudou após uma revisão. Confira o histórico antes de corrigir novamente.</p>}
    {editing ? <div className="field-text-editor"><p>Revise apenas a escrita, sem alterar o sentido das informações.</p>{items.map(item => <label key={item.id}>{item.label}<textarea rows={item.original.length > 120 ? 5 : 2} maxLength={10000} value={values[item.id] ?? ''} onChange={event => setValues(current => ({ ...current, [item.id]: event.target.value }))} disabled={busy} /></label>)}{error && <p role="alert" className="form-error">{error}</p>}<div className="field-actions"><button className="icon-text-button" disabled={busy} onClick={() => setEditing(false)}><X size={17} />Cancelar</button><button className="primary-button" disabled={busy} onClick={save}><Check size={17} />{busy ? 'Salvando...' : 'Salvar correção'}</button></div></div> : Object.keys(corrections).length ? <div><p className="field-text-caption">Revisão por {latest.author_name} em {new Date(latest.created_at).toLocaleString('pt-BR')}. As assinaturas referem-se ao original.</p>{items.filter(item => Object.hasOwn(corrections, item.id)).map(item => <div className="field-text-entry" key={item.id}><strong>{item.label}</strong><p>{corrections[item.id]}</p><details><summary>Ver texto original</summary><p>{item.original}</p></details></div>)}</div> : <p className="field-text-caption">Nenhuma correção textual aplicada.</p>}
    {revisions.length > 0 && !editing && <details className="field-text-history"><summary>Histórico de correções ({revisions.length})</summary>{revisions.map(revision => <div key={revision.id}><strong>{revision.author_name}</strong> · {new Date(revision.created_at).toLocaleString('pt-BR')}{Object.entries(revision.corrections).map(([id, text]) => <p key={id}><b>{items.find(item => item.id === id)?.label || id}:</b> {text}<br /><small>Original: {revision.original_json?.[id]}</small></p>)}{Object.keys(revision.corrections).length === 0 && <p>Texto original restaurado na visualização.</p>}</div>)}</details>}
  </section>;
}
