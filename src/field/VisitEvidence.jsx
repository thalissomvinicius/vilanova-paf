import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, LocateFixed, Minus, Plus, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { mapUrl, photoStamp } from './model.mjs';
import './visits.css';

export function VisitMap({ property, gps }) {
  const container = useRef(null), instance = useRef(null), bounds = useRef(null);
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    const map = L.map(container.current, { scrollWheelZoom: false, attributionControl: false }).setView([-2.4, -48.2], 10);
    instance.current = map;
    const layers = L.featureGroup().addTo(map);
    setInvalid(false);
    if (property?.shape_geojson) {
      try { L.geoJSON(property.shape_geojson, { style: { color: '#3f6b2a', fillColor: '#5f933c', fillOpacity: 0.18, weight: 2 } }).addTo(layers); }
      catch { setInvalid(true); }
    }
    gps.filter(mapUrl).forEach((point, index) => {
      const label = document.createElement('span'); label.textContent = `Ponto ${index + 1}: ${point.latitude}, ${point.longitude}`;
      L.circleMarker([Number(point.latitude), Number(point.longitude)], { radius: 7, color: '#fff', weight: 2, fillColor: '#e14c25', fillOpacity: 1 }).bindTooltip(label).addTo(layers);
    });
    bounds.current = layers.getBounds();
    if (bounds.current.isValid()) map.fitBounds(bounds.current, { padding: [30, 30], maxZoom: 18 });
    const observer = new ResizeObserver(() => map.invalidateSize()); observer.observe(container.current);
    return () => { observer.disconnect(); map.remove(); instance.current = null; };
  }, [property, gps]);
  return <section className="visit-map-section"><div className="visit-map-heading"><h3>Área e pontos da visita</h3><button type="button" className="icon-text-button" title="Enquadrar área e pontos" onClick={() => { if (bounds.current?.isValid()) instance.current?.fitBounds(bounds.current, { padding: [30, 30], maxZoom: 18 }); }}><LocateFixed size={18} /><span>Enquadrar</span></button></div><div ref={container} className="visit-map" aria-label="Mapa da área cadastrada e dos pontos coletados" /><div className="visit-map-legend"><span><i />Área cadastrada</span><span><i />Ponto coletado</span><span>Croqui georreferenciado</span></div>{(!property?.shape_geojson || invalid) && <p className="muted">{invalid ? 'Shape indisponível para visualização. Confira o cadastro da propriedade.' : 'Esta propriedade ainda não possui shape cadastrado.'}</p>}</section>;
}

export function VisitPhotos({ photos, gps, producer, technician }) {
  const [selected, setSelected] = useState(null), [zoom, setZoom] = useState(1);
  const viewer = useRef(null), opener = useRef(null);
  const photo = selected === null ? null : photos[selected];
  function close() { setSelected(null); setZoom(1); opener.current?.focus(); }
  useEffect(() => { if (photo && !viewer.current.open) viewer.current.showModal(); }, [photo]);
  function frame(item) { return <><img src={item.url} alt={`Foto da visita de ${producer}`} /><figcaption className="visit-photo-stamp">{photoStamp(item, gps, producer, technician).map((line, index) => <span key={index}>{line}</span>)}</figcaption></>; }
  return <><div className="visit-photos">{photos.map((item, index) => item.mime_type?.startsWith('image/') ? <button key={item.id} className="visit-photo-button" type="button" aria-label={`Ampliar foto ${index + 1}`} onClick={event => { opener.current = event.currentTarget; setSelected(index); setZoom(1); }}><figure>{frame(item)}<Expand size={20} className="visit-photo-expand" /></figure></button> : <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer">Abrir anexo</a>)}</div>{photo && <dialog ref={viewer} className="visit-photo-viewer" aria-label="Foto completa da visita" onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }}><header><strong>Foto {selected + 1} de {photos.length}</strong><button type="button" aria-label="Fechar foto" onClick={close}><X /></button></header><div className="visit-photo-scroll"><figure style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>{frame(photo)}</figure></div><footer><button aria-label="Foto anterior" disabled={selected === 0} onClick={() => { setSelected(selected - 1); setZoom(1); }}><ChevronLeft /></button><button aria-label="Reduzir foto" disabled={zoom === 1} onClick={() => setZoom(Math.max(1, zoom - 0.5))}><Minus /></button><span>{zoom * 100}%</span><button aria-label="Ampliar foto" disabled={zoom === 3} onClick={() => setZoom(Math.min(3, zoom + 0.5))}><Plus /></button><button aria-label="Próxima foto" disabled={selected === photos.length - 1} onClick={() => { setSelected(selected + 1); setZoom(1); }}><ChevronRight /></button></footer></dialog>}</>;
}
