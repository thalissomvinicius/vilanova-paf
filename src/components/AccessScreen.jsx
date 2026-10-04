import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, KeyRound, Loader2, ShieldCheck, Sprout, UserRound } from 'lucide-react';
import { DeveloperSignature } from '../ui/Workspace';

export function useAccessTransition() {
  const [phase, setPhase] = useState('idle');
  const locked = useRef(false);
  const pending = useRef(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; if (pending.current) { clearTimeout(pending.current.timer); pending.current.resolve(false); } };
  }, []);
  function begin() { if (locked.current) return false; locked.current = true; setPhase('authenticating'); return true; }
  function fail() { locked.current = false; if (mounted.current) setPhase('idle'); }
  async function succeed() {
    if (!mounted.current) return false;
    setPhase('success');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    return new Promise(resolve => { pending.current = { resolve, timer: setTimeout(() => { pending.current = null; resolve(mounted.current); }, 650) }; });
  }
  return { phase, begin, fail, succeed };
}

export function AccessScreen({ portal, title, description, children, help, producer = false, embedded = false, phase = 'idle' }) {
  const Tag = embedded ? 'section' : 'main';
  const form = <section className={`paf-access-form${phase === 'success' ? ' paf-access-confirmed' : ''}`} aria-labelledby="paf-access-title">
    <div className="paf-access-heading"><span className="paf-access-kicker"><span aria-hidden="true" />{portal}</span><h2 id="paf-access-title">{title}</h2><p>{description}</p></div>
    {children}
    {help && <p className="paf-producer-help">{help}</p>}
    {phase === 'success' && <div className="paf-access-success" role="status" aria-live="polite"><span className="paf-access-success-mark"><Check size={32} strokeWidth={2.5} /></span><h3>Acesso confirmado</h3><p>Preparando seu ambiente PAF.</p><span className="paf-access-success-track" aria-hidden="true"><span /></span></div>}
  </section>;

  if (embedded) return <Tag className="paf-access paf-access-embedded pa-login">{form}</Tag>;

  return <Tag className={`paf-access pa-login${producer ? ' paf-producer-access' : ''}`}>
    <aside className="paf-access-visual" aria-label="Programa de Agricultura Familiar">
      <a className="pa-login-brand" href="/" aria-label="PAF VNA, acesso principal">
        <span className="pa-login-symbol"><img src="/brand/paf-symbol-official.png" alt="" width="44" height="44" /></span>
        <span><strong>PAF VNA</strong><small>Programa de Agricultura Familiar</small></span>
      </a>
      <div className="pa-login-identity"><span className="pa-login-edition">PAF / VILA NOVA AGROINDUSTRIAL</span><img className="pa-login-art" src="/brand/paf-logo-official.png" alt="PAF Agricultura Familiar" width="1280" height="1280" /><span className="pa-login-identity-caption"><Sprout size={18} />Raízes no campo. Conexões para o futuro.</span></div>
      <div className="pa-login-story">
        <p className="pa-login-statement">Agricultura familiar acompanhada de perto.</p>
      </div>
      <p className="pa-login-place">Vila Nova Agroindustrial · Tomé-Açu, Pará</p>
    </aside>
    <div className="pa-login-side">
      <header className="paf-access-header">
        <img className="paf-access-company" src="/brand/logo-vilanova.png" alt="Vila Nova Agroindustrial" width="120" height="48" />
      </header>
      <div className="paf-access-center">{form}</div>
      <footer className="paf-access-footer"><span><ShieldCheck size={15} /> Acesso individual e protegido</span><DeveloperSignature /></footer>
    </div>
  </Tag>;
}

export function AccessField({ id, label, value, onChange, placeholder, password = false, show = false, onToggle, disabled, errorId, type = 'text', toggleLabel = 'senha' }) {
  return <div className="paf-access-field">
    <label htmlFor={id}>{label}</label>
    <div className="paf-access-input">{password ? <KeyRound size={19} aria-hidden="true" /> : <UserRound size={19} aria-hidden="true" />}
      <input id={id} type={password ? (show ? 'text' : 'password') : type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={password ? 'current-password' : 'username'} autoCapitalize="none" spellCheck={false} required disabled={disabled} aria-describedby={errorId} />
      {password && <button className="paf-access-reveal" type="button" title={`${show ? 'Ocultar' : 'Mostrar'} ${toggleLabel}`} aria-label={`${show ? 'Ocultar' : 'Mostrar'} ${toggleLabel}`} aria-pressed={show} onClick={onToggle} disabled={disabled}>{show ? <EyeOff size={19} /> : <Eye size={19} />}</button>}
    </div>
  </div>;
}

export function AccessSubmit({ busy, disabled, success = false, children = 'Entrar' }) {
  return <button className="paf-access-submit" type="submit" disabled={busy || disabled || success}><span>{success ? 'Acesso confirmado' : busy ? 'Validando acesso...' : children}</span><span className="paf-access-submit-icon" aria-hidden="true">{success ? <Check size={20} /> : busy ? <Loader2 className="spin" size={20} /> : <ArrowRight size={20} />}</span></button>;
}

export function AccessLink({ href, producer = false, children }) {
  return <nav className="paf-access-portals" aria-label="Outros acessos"><a href={href}>{producer ? <Sprout size={21} /> : <ShieldCheck size={21} />}<span>{children}</span><ArrowRight size={18} /></a></nav>;
}
