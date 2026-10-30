import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Check, ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react';
import { blankBudgetItem, budgetTotalCents, documentIdentityAnswers, documentSignatureRoles, formatMoney, initialDocumentAnswers, isPafDocument, pafDocumentForms, readBudgetItems, RELEASE_FORM_ID } from './visit-report.generated.mjs';
import { loadFieldEvidence } from './client';
import { canWriteDocument, documentHash, saveDocument } from './document-client';
import { DocumentSignature } from './DocumentSignature';

export function DocumentComposer({ directories, profile, source, onClose, onSaved }) {
  const dialog = useRef(null), body = useRef(null), session = useRef({ clientId: isPafDocument(directories.forms.find(item => item.id === source?.formulario_id)?.codigo) ? source.client_id : crypto.randomUUID(), signatureIds: {}, row: isPafDocument(directories.forms.find(item => item.id === source?.formulario_id)?.codigo) ? source : undefined });
  const editing = !!source && isPafDocument(directories.forms.find(item => item.id === source.formulario_id)?.codigo);
  const [formId, setFormId] = useState(editing ? directories.forms.find(item => item.id === source.formulario_id).codigo : 'paf-notificacao');
  const [producerId, setProducerId] = useState(source?.produtor_id || ''), [propertyId, setPropertyId] = useState(source?.propriedade_id || ''), [search, setSearch] = useState('');
  const [answers, setAnswers] = useState(editing ? Object.fromEntries(Object.entries(source.dados_json).filter(([key]) => !key.startsWith('_'))) : initialDocumentAnswers(formId, profile.nome, session.current.clientId));
  const [photos, setPhotos] = useState([]), [sourcePhotos, setSourcePhotos] = useState([]), [signatures, setSignatures] = useState({}), [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(!!source), [error, setError] = useState(''), [exit, setExit] = useState(false), [dirty, setDirty] = useState(false);
  const urls = useRef([]);
  const form = pafDocumentForms.find(item => item.id === formId);
  const sections = [...new Set(form.fields.map(field => field.section))], last = sections.length;
  const identity = (producer, property) => documentIdentityAnswers(producer ? { name: producer.nome, document: producer.cpf, address: producer.endereco } : undefined, property ? { name: property.nome, provisionalName: property.nome_provisorio, municipality: property.municipio, ruralAddress: property.endereco_rural, latitude: property.latitude, longitude: property.longitude } : undefined);
  const prefills = (p = producerId, prop = propertyId) => identity(directories.producers.find(item => item.id === p), directories.properties.find(item => item.id === prop));
  useEffect(() => { dialog.current.showModal(); const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; if (!editing) setAnswers(current => ({ ...current, ...prefills() })); return () => { document.body.style.overflow = previous; urls.current.forEach(URL.revokeObjectURL); }; }, []);
  useEffect(() => { body.current?.scrollTo({ top: 0 }); }, [step]);
  useEffect(() => {
    if (!source) return;
    let alive = true;
    loadFieldEvidence(source).then(evidence => {
      if (!alive) return;
      const items = evidence.photos.map(item => ({ id: crypto.randomUUID(), url: item.url, caption: item.metadados_json?.legenda || '', capturedAt: item.capturado_em || source.coletado_em, latitude: item.metadados_json?.latitude, longitude: item.metadados_json?.longitude }));
      if (editing) setPhotos(items); else setSourcePhotos(items);
    }).catch(reason => { if (alive) setError(reason.message); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [source]);
  const change = (key, value) => { setAnswers(current => ({ ...current, [key]: value })); setSignatures({}); setDirty(true); setError(''); };
  const changePhotos = next => { setPhotos(next); setSignatures({}); setDirty(true); };
  function selectProducer(id) {
    const property = directories.properties.find(item => item.produtor_id === id);
    setProducerId(id); setPropertyId(property?.id || '');
    setAnswers(current => ({ ...current, ...prefills(id, property?.id) }));
    changePhotos([]); setSourcePhotos([]);
  }
  function selectForm(id) { setFormId(id); setStep(0); setAnswers({ ...initialDocumentAnswers(id, profile.nome, session.current.clientId), ...prefills() }); setSignatures({}); setDirty(true); }
  function addFiles(event) {
    const additions = [...event.target.files];
    if (photos.length + additions.length > 20) return setError('Use até 20 fotos por documento.');
    if (additions.some(file => !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 12000000)) return setError('Use fotos JPG, PNG ou WebP de até 12 MB cada.');
    changePhotos([...photos, ...additions.map(file => { const url = URL.createObjectURL(file); urls.current.push(url); return { id: crypto.randomUUID(), file, url, caption: '', capturedAt: new Date().toISOString() }; })]);
    event.target.value = '';
  }
  async function save(draft) {
    if (busy || loading) return;
    setBusy(true); setError('');
    try {
      const remoteForm = directories.forms.filter(item => item.codigo === formId).sort((a, b) => b.versao - a.versao)[0];
      const row = await saveDocument({ profile, form, remoteForm, producerId, propertyId, answers, photos, signatures, session: session.current, draft });
      onSaved(row);
    } catch (reason) { setError(reason.message); setExit(false); }
    finally { setBusy(false); }
  }
  const close = () => { if (busy) return; if (dirty) setExit(true); else onClose(); };
  const budget = readBudgetItems(answers.itensOrcamento);
  const updateBudget = (id, patch) => change('itensOrcamento', JSON.stringify(budget.map(item => item.id === id ? { ...item, ...patch } : item)));
  const hash = documentHash(answers, photos, producerId, propertyId);
  return <dialog className="paf-doc-editor" ref={dialog} aria-label={editing ? 'Editar documento' : 'Emitir documento'} onCancel={event => { event.preventDefault(); close(); }}>
    <header><div><p className="eyebrow">DOCUMENTOS PAF</p><h2 id="paf-doc-title">{editing ? 'Editar documento' : 'Emitir documento'}</h2></div><button className="icon-text-button" aria-label="Fechar emissão" disabled={busy} onClick={close}><X size={20} /></button></header>
    <div className="paf-doc-body" ref={body}>
      {!editing && <label>Tipo de documento<select value={formId} onChange={event => selectForm(event.target.value)} disabled={busy}>{pafDocumentForms.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
      <div className="paf-doc-steps"><span>Etapa {step + 1} de {last + 1}</span><strong>{step === last ? 'Fotos e assinaturas' : sections[step]?.replace(/^\d+\.\s*/, '')}</strong><progress max={last + 1} value={step + 1} /></div>
      <fieldset disabled={busy || loading}>
        {step === 0 && <div className="paf-doc-grid"><label>Buscar produtor<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nome ou CPF" /></label><label>Produtor<select aria-label="Produtor" value={producerId} onChange={event => selectProducer(event.target.value)}><option value="">Selecione</option>{directories.producers.filter(item => `${item.nome} ${item.cpf || ''}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')) || item.id === producerId).map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label><label className="wide">Propriedade<select aria-label="Propriedade" value={propertyId} onChange={event => { setPropertyId(event.target.value); setAnswers(current => ({ ...current, ...prefills(producerId, event.target.value) })); setSignatures({}); setPhotos([]); setSourcePhotos([]); setDirty(true); }}><option value="">Selecione</option>{directories.properties.filter(item => item.produtor_id === producerId).map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label></div>}
        {step < last && <div className="paf-doc-grid">{form.fields.filter(field => field.section === sections[step]).map(field => field.id === 'itensOrcamento' ? <div className="wide" key={field.id}>
          {budget.map((item, index) => <div className="paf-budget-item" key={item.id}><div className="paf-doc-row"><strong>Item {index + 1}</strong><button className="icon-text-button" type="button" aria-label={`Remover item ${index + 1}`} onClick={() => change('itensOrcamento', JSON.stringify(budget.filter(row => row.id !== item.id)))}><Trash2 size={18} /></button></div><label>Descrição<input aria-label={`Descrição do item ${index + 1}`} value={item.description} onChange={event => updateBudget(item.id, { description: event.target.value })} /></label><div className="paf-doc-grid"><label>Valor a liberar (R$)<input aria-label={`Valor do item ${index + 1}`} inputMode="decimal" value={item.amount} onChange={event => updateBudget(item.id, { amount: event.target.value })} /></label><label>Data prevista<input aria-label={`Data do item ${index + 1}`} type="date" value={item.releaseDate} onChange={event => updateBudget(item.id, { releaseDate: event.target.value })} /></label></div></div>)}
          <button className="icon-text-button" disabled={budget.length >= 40} onClick={() => change('itensOrcamento', JSON.stringify([...budget, blankBudgetItem(crypto.randomUUID())]))}><Plus size={18} />Adicionar item do orçamento</button><p className="paf-doc-total">Total solicitado <strong>{formatMoney(budgetTotalCents(budget))}</strong></p>
        </div> : <label key={field.id} className={field.type === 'multiline' ? 'wide' : ''}>{field.label}{field.required ? ' *' : ''}{field.type === 'select' ? <select aria-label={`${field.label}${field.required ? ' *' : ''}`} value={answers[field.id] || ''} onChange={event => change(field.id, event.target.value)}><option value="">Selecione</option>{field.options.map(option => <option key={option}>{option}</option>)}</select> : field.type === 'multiline' ? <textarea rows={5} value={answers[field.id] || ''} onChange={event => change(field.id, event.target.value)} /> : <input readOnly={field.id === 'tecnicoResponsavel'} type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} min={field.type === 'number' ? 0 : undefined} value={answers[field.id] ?? ''} onChange={event => change(field.id, event.target.value)} />}</label>)}</div>}
        {step === last && <>
          <label className="paf-doc-upload"><ImagePlus size={20} />Adicionar fotos<input aria-label="Adicionar fotos ao documento" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addFiles} /></label>
          {sourcePhotos.length > 0 && <div><h3>Fotos da visita de origem</h3><div className="paf-doc-photos">{sourcePhotos.map(item => <button className="paf-doc-source" key={item.id} disabled={photos.some(photo => photo.id === item.id) || photos.length >= 20} onClick={() => changePhotos([...photos, item])}><img src={item.url} alt="Foto da visita de origem" /><span>{photos.some(photo => photo.id === item.id) ? 'Adicionada' : 'Usar foto'}</span></button>)}</div></div>}
          <div className="paf-doc-photos">{photos.map((photo, index) => <figure key={photo.id}><img src={photo.url} alt={`Foto ${index + 1} do documento`} /><figcaption><label>Legenda da foto {index + 1}<textarea maxLength={500} rows={2} value={photo.caption} onChange={event => changePhotos(photos.map(item => item.id === photo.id ? { ...item, caption: event.target.value } : item))} /></label><button className="icon-text-button" onClick={() => changePhotos(photos.filter(item => item.id !== photo.id))}><Trash2 size={17} />Remover foto {index + 1}</button></figcaption></figure>)}</div>
          {formId === RELEASE_FORM_ID && <p className="muted">A liberação exige ao menos duas fotos com legenda.</p>}
          <h3>Assinaturas do documento</h3>{documentSignatureRoles(formId, answers).map(role => <DocumentSignature key={role} label={role === 'technician' ? `Assinatura do técnico: ${answers.tecnicoResponsavel || ''}` : `Ciência do destinatário: ${answers.nomeConfirmacaoProdutor || ''}`} value={signatures[role]} resetKey={hash} onChange={image => { setSignatures(current => ({ ...current, [role]: image })); setDirty(true); }} />)}
        </>}
      </fieldset>
      {loading && <p role="status">Recebendo fotos da visita...</p>}{error && <p role="alert" className="form-error">{error}</p>}
      {exit && <section className="paf-doc-exit" aria-label="Antes de fechar documento"><h3>Salvar este preenchimento?</h3><button className="icon-text-button" onClick={() => setExit(false)}>Continuar preenchendo</button><button className="icon-text-button" onClick={() => save(true)}>Salvar rascunho e sair</button><button className="icon-text-button" onClick={onClose}>Descartar e sair</button></section>}
    </div>
    <footer><button className="icon-text-button" disabled={!step || busy} onClick={() => setStep(value => value - 1)}><ArrowLeft size={17} />Voltar</button><button className="icon-text-button" disabled={busy || loading || !canWriteDocument(profile, session.current.row)} onClick={() => save(true)}><Bookmark size={17} />Rascunho</button><button className="primary-button" disabled={busy || loading} onClick={() => step === last ? save(false) : setStep(value => value + 1)}>{busy ? <Loader2 className="spin" size={18} /> : step === last ? <Check size={18} /> : <ArrowRight size={18} />}{busy ? 'Salvando...' : step === last ? 'Concluir documento' : 'Avançar'}</button></footer>
  </dialog>;
}
