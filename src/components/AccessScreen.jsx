import React from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, Leaf, Loader2, MapPin, ShieldCheck, Sprout, UserRound } from 'lucide-react';
import { DeveloperSignature } from '../ui/Workspace';

export function AccessScreen({ portal, title, description, children, help, producer = false, embedded = false }) {
  const Tag = embedded ? 'section' : 'main';
  return <Tag className={`paf-access${producer ? ' paf-producer-access' : ''}${embedded ? ' paf-access-embedded' : ''}`}>
    {!embedded && <aside className="paf-access-visual" aria-label="Agricultura familiar Vila Nova">
      <div className="paf-access-origin"><span><Leaf size={18} /> Agricultura familiar</span><span><MapPin size={14} /> Tomé-Açu, Pará</span></div>
      <div className="paf-access-photo"><img className="paf-access-scene" src="/brand/login-equipe-dende-realista.png" alt="Equipe Vila Nova em uma plantação de palma" fetchPriority="high" width="1254" height="1254" /></div>
      <div className="paf-access-caption"><p>O futuro se cultiva<br />em comunidade.</p><span>Vila Nova Agroindustrial</span><Leaf size={32} aria-hidden="true" /></div>
    </aside>}
    <header className="paf-access-header">
      <a className="paf-access-identity" href="/" aria-label="PAF VNA, acesso principal"><img src="/brand/paf-symbol-official.png" alt="" width="48" height="48" /><div><h1>PAF VNA</h1><span>Programa de Agricultura Familiar</span></div></a>
      <img className="paf-access-company" src="/brand/logo-vilanova.png" alt="Vila Nova Agroindustrial" width="120" height="48" />
    </header>
    <div className="paf-access-center">
      <section className="paf-access-form" aria-labelledby="paf-access-title">
        <div className="paf-access-heading"><span className="paf-access-kicker"><span aria-hidden="true" />{portal}</span><h2 id="paf-access-title">{title}</h2><p>{description}</p></div>
        {children}
        {help && <p className="paf-producer-help">{help}</p>}
      </section>
    </div>
    <footer className="paf-access-footer"><span><ShieldCheck size={15} /> Acesso individual e protegido</span><DeveloperSignature /></footer>
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

export function AccessSubmit({ busy, disabled, children = 'Entrar' }) {
  return <button className="paf-access-submit" type="submit" disabled={busy || disabled}><span>{busy ? 'Conectando...' : children}</span><span className="paf-access-submit-icon" aria-hidden="true">{busy ? <Loader2 className="spin" size={20} /> : <ArrowRight size={20} />}</span></button>;
}

export function AccessLink({ href, producer = false, children }) {
  return <nav className="paf-access-portals" aria-label="Outros acessos"><a href={href}>{producer ? <Sprout size={21} /> : <ShieldCheck size={21} />}<span>{children}</span><ArrowRight size={18} /></a></nav>;
}
