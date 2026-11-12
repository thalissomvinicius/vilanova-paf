import React, { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { currentTextCorrections, editableTextFields } from './text-corrections.mjs';
import { saveTextCorrection } from './client';
import { answerText } from './model.mjs';
import { documentAnswerText } from './visit-report.generated.mjs';

export function TextCorrections({ row, fields, profile, revisions, onReload }) {
  const [editing, setEditing] = useState(false), [values, setValues] = useState({}), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const items = editableTextFields(row, fields), latest = revisions[0];
  const { corrections, stale } = currentTextCorrections(row, fields, latest);
  const allowed = profile?.ativo && !profile.deve_trocar_senha && ['super_admin', 'admin', 'coordenador'].includes(profile.papel);
  function start(id) { setValues(Object.fromEntries(items.map(item => [item.id, corrections[item.id] ?? item.original]))); setError(''); setEditing(id); }
  async function save() {
    const changes = Object.fromEntries(items.filter(item => values[item.id] !== item.original).map(item => [item.id, values[item.id]]));
    if (items.some(item => item.original.trim() && !values[item.id]?.trim())) { setError('Não deixe em branco um texto que estava preenchido.'); return; }
    setBusy(true); setError('');
    try { await saveTextCorrection(row, latest, changes); setEditing(false); await onReload(); }
    catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }
  return <section aria-label="Respostas da coleta">
    <h3>Respostas da coleta</h3>
    <dl className="field-answers">{[...Object.entries(row.dados_json || {}).filter(([id]) => !id.startsWith('_')), ...(row.observacoes != null ? [['__observacoes', row.observacoes]] : [])].map(([id, original]) => {
      const item = items.find(item => item.id === id), revised = Object.hasOwn(corrections, id);
      const label = item?.label || fields.find(field => field.id === id)?.label || id;
      return <div key={id}><dt className="field-inline-heading"><span>{label}</span>{allowed && item && <button type="button" className="icon-text-button" title={`Corrigir ${label}`} aria-label={`Corrigir ${label}`} disabled={busy} onClick={() => start(id)}><Pencil size={16} /></button>}</dt><dd>{editing === id ? <div className="field-text-editor"><textarea aria-label={label} autoFocus rows={5} maxLength={10000} value={values[id] ?? ''} onChange={event => setValues(current => ({ ...current, [id]: event.target.value }))} disabled={busy} />{error && <p role="alert" className="form-error">{error}</p>}<div className="field-actions"><button className="icon-text-button" disabled={busy} onClick={() => setEditing(false)}><X size={16} />Cancelar</button><button className="primary-button" disabled={busy} onClick={save}><Check size={16} />{busy ? 'Salvando...' : 'Salvar correção'}</button></div></div> : <><span>{revised ? corrections[id] : documentAnswerText(id, original) ?? answerText(original)}</span>{revised && <details className="field-text-caption"><summary>Original e revisão</summary><p>{String(original)}</p><small>{latest.author_name} · {new Date(latest.created_at).toLocaleString('pt-BR')}. Assinaturas vinculadas ao original.</small></details>}</>}</dd></div>;
    })}</dl>
    {stale.length > 0 && <p className="field-text-warning">Há revisões anteriores cujo conteúdo original mudou. Consulte o histórico.</p>}
    {revisions.length > 0 && <details className="field-text-history"><summary>Histórico de correções ({revisions.length})</summary>{revisions.map(revision => <div key={revision.id}><strong>{revision.author_name}</strong> · {new Date(revision.created_at).toLocaleString('pt-BR')}{Object.entries(revision.corrections).map(([id, text]) => <p key={id}>{items.find(item => item.id === id)?.label || id}: {text}<br /><small>Original: {revision.original_json?.[id]}</small></p>)}</div>)}</details>}
  </section>;
}
