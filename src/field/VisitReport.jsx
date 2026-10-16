import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Printer, X } from 'lucide-react';
import { loadCollectionProperty, loadFieldEvidence } from './client';
import { photoStamp } from './model.mjs';
import { dashboardVisitReport } from './visit-report-model.mjs';
import { FIELD_URL } from './public-config';

async function embeddedAsset(url, mime, signal) {
  const parsed = new URL(url, location.href);
  if (![location.origin, new URL(import.meta.env.VITE_PAF_FIELD_URL || FIELD_URL).origin].includes(parsed.origin)) throw new Error('Origem da evidência não autorizada.');
  const response = await fetch(parsed, { signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]) });
  if (!response.ok) throw new Error('Não foi possível carregar uma imagem do relatório. Tente novamente.');
  const blob = await response.blob();
  if (blob.size > 12000000) throw new Error('Uma imagem excede o tamanho permitido para emissão.');
  const contentType = mime || blob.type.split(';')[0];
  if (!['image/png', 'image/jpeg', 'image/webp', 'font/woff2'].includes(contentType)) throw new Error('Formato de evidência não suportado.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a evidência.'));
    reader.onload = () => resolve(String(reader.result).replace(/^data:[^;]+;/, `data:${contentType};`));
    reader.readAsDataURL(blob);
  });
}

export function VisitReport({ row, directories, profile, onClose }) {
  const dialog = useRef(null), frame = useRef(null);
  const [html, setHtml] = useState(''), [ready, setReady] = useState(false), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  useEffect(() => { dialog.current.showModal(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    setHtml(''); setReady(false); setError('');
    async function prepare() {
      // Renew signed URLs for every emission; never persist private report data in browser storage.
      const evidence = await loadFieldEvidence(row);
      const property = await loadCollectionProperty(row);
      const logo = await embeddedAsset('/brand/paf-symbol-official.png', 'image/png', signal);
      const companyLogo = await embeddedAsset('/brand/logo-vilanova.png', 'image/png', signal);
      const fontRegular = await embeddedAsset('/brand/fonts/poppins-400.woff2', 'font/woff2', signal);
      const fontSemibold = await embeddedAsset('/brand/fonts/poppins-600.woff2', 'font/woff2', signal);
      const producer = directories.producers.find(item => item.id === row.produtor_id)?.nome || 'Produtor não informado';
      const technician = directories.users.find(item => item.id === row.tecnico_id)?.nome || String(row.dados_json?.tecnicoResponsavel || 'Técnico não informado');
      const photos = [], evidenceSignatures = [];
      for (const [index, photo] of evidence.photos.entries()) {
        photos.push({ dataUrl: await embeddedAsset(photo.url, undefined, signal), caption: `Foto ${index + 1} · ${photo.capturado_em ? new Date(photo.capturado_em).toLocaleString('pt-BR', { timeZone: 'America/Belem' }) : 'Horário não registrado'}`, stamp: photoStamp(photo, evidence.gps, producer, technician) });
      }
      for (const signature of evidence.signatures) {
        const meta = signature.metadados_json || {};
        evidenceSignatures.push({ role: meta.role, signerName: meta.signerName || 'Nome não informado', relationship: meta.relationship, capturedAt: signature.capturado_em || row.coletado_em, dataUrl: await embeddedAsset(signature.url, 'image/png', signal) });
      }
      if (!signal.aborted) setHtml(dashboardVisitReport(row, directories, property, evidence, { logo, companyLogo, fontRegular, fontSemibold, photos, evidenceSignatures, signerName: profile.nome }));
    }
    prepare().catch(reason => { if (!signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, [row, directories, profile.nome, attempt]);
  async function loaded() {
    const doc = frame.current?.contentDocument;
    if (!doc || !html) return;
    const screenStyle = doc.createElement('style');
    screenStyle.textContent = '@media screen{html{background:#edf1ed}body{max-width:210mm;margin:16px auto;padding:12mm 14mm;background:white}.photo-section{margin-top:32px}}@media screen and (max-width:600px){body{padding:20px;margin:0}header{gap:10px}.company-logo{width:140px}.report-title{gap:12px}h1{font-size:24px}.producer-band{flex-wrap:wrap}.producer-band .program{max-width:100%;text-align:left}.identity{grid-template-columns:1fr 1fr}.photos,.signature-grid{grid-template-columns:1fr}.evidence-summary{gap:8px}.footer{flex-wrap:wrap}}';
    doc.head.append(screenStyle);
    doc.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    });
    try {
      await doc.fonts.ready;
      await Promise.all([...doc.images].map(image => image.decode()));
      if (frame.current?.contentDocument === doc) { doc.title = `Visita-PAF-${row.id}`; setReady(true); }
    } catch { setError('Uma imagem não pôde ser exibida. Gere o relatório novamente.'); }
  }
  function print() {
    try { frame.current.contentWindow.focus(); frame.current.contentWindow.print(); }
    catch { setError('Não foi possível abrir a impressão neste navegador. Tente pelo Chrome.'); }
  }
  return <dialog className="visit-report-dialog" ref={dialog} aria-labelledby="visit-report-title" onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}>
    <header><h2 id="visit-report-title">Relatório da visita</h2><div><button className="primary-button" disabled={!ready || !!error} onClick={print}><Printer size={18} />Salvar PDF / imprimir</button><button className="icon-text-button" title="Fechar relatório" aria-label="Fechar relatório" onClick={onClose}><X size={20} /></button></div></header>
    {error ? <div className="field-error" role="alert"><p>{error}</p><button className="icon-text-button" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div> : !ready && <p className="field-loading" role="status"><Loader2 className="spin" />Preparando fotos, assinaturas e relatório...</p>}
    {html && <iframe ref={frame} title="Prévia do relatório da visita" sandbox="allow-same-origin allow-modals" srcDoc={html} onLoad={loaded} />}
  </dialog>;
}
