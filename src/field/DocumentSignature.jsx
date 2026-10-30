import React, { useEffect, useRef } from 'react';
import SignaturePad from 'signature_pad';
import { Trash2 } from 'lucide-react';

export function DocumentSignature({ label, value, onChange, resetKey }) {
  const canvas = useRef(null), pad = useRef(null), change = useRef(onChange); change.current = onChange;
  useEffect(() => {
    const node = canvas.current;
    const instance = new SignaturePad(node, { penColor: '#183e31', backgroundColor: '#fff', minWidth: 1, maxWidth: 2.5 });
    pad.current = instance;
    const resize = () => { const box = node.getBoundingClientRect(), ratio = Math.max(devicePixelRatio, 1); if (node.width === Math.round(box.width * ratio)) return; node.width = Math.round(box.width * ratio); node.height = Math.round(180 * ratio); node.getContext('2d').scale(ratio, ratio); instance.clear(); change.current(undefined); };
    const observer = new ResizeObserver(resize); observer.observe(node); resize();
    instance.addEventListener('endStroke', () => change.current(instance.isEmpty() ? undefined : instance.toDataURL('image/png')));
    return () => { observer.disconnect(); instance.off(); };
  }, []);
  useEffect(() => { pad.current?.clear(); }, [resetKey]);
  return <div className="paf-doc-signature"><label>{label}</label><canvas ref={canvas} aria-label={label} style={{ width: '100%', height: 180, touchAction: 'none' }} /><button type="button" className="icon-text-button" onClick={() => { pad.current.clear(); onChange(undefined); }}><Trash2 size={17} />Limpar assinatura</button>{value && <span className="field-update">Assinatura registrada</span>}</div>;
}
