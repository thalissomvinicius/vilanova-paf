import React, { useState } from 'react';
import { CalendarDays, ClipboardCheck } from 'lucide-react';
import { FieldWorkspace } from '../field/FieldWorkspace';
import { ActivityOperations } from './OperationsWorkspace';
import '../field/visits.css';

export function VisitsHub({ api }) {
  const [tab, setTab] = useState(() => new URLSearchParams(location.search).get('tab') === 'agenda' ? 'agenda' : 'realizadas');
  const tabs = [['realizadas', 'Realizadas', ClipboardCheck], ['agenda', 'Agendamento', CalendarDays]];
  function select(next) { setTab(next); const url = new URL(location.href); url.searchParams.set('tab', next); history.replaceState(history.state, '', url); }
  return <><div className="visits-workspace-tabs" role="tablist" aria-label="Visitas técnicas">{tabs.map(([id, label, Icon], index) => <button type="button" key={id} role="tab" id={`visits-tab-${id}`} aria-controls="visits-panel" aria-selected={tab === id} tabIndex={tab === id ? 0 : -1} onClick={() => select(id)} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index; select(tabs[next][0]); document.getElementById(`visits-tab-${tabs[next][0]}`)?.focus(); } }}><Icon size={18} />{label}</button>)}</div><section role="tabpanel" id="visits-panel" aria-labelledby={`visits-tab-${tab}`}>{tab === 'realizadas' ? <FieldWorkspace /> : <ActivityOperations api={api} kind="visit" />}</section></>;
}
