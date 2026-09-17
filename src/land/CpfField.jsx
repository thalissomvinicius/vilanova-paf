import React, { useEffect, useId, useRef, useState } from 'react';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { digits, validCpf } from '../../supabase/functions/paf-api/land-domain.mjs';

export function CpfField({ value, onChange }) {
  const id = useId();
  const input = useRef(null);
  const [touched, setTouched] = useState(false);
  const length = digits(value).length;
  const valid = validCpf(value);
  const show = length >= 11 || (touched && value.length > 0);
  const message = valid ? 'CPF válido.' : length !== 11 ? 'Informe os 11 números do CPF.' : 'CPF inválido. Confira os números digitados.';
  useEffect(() => { input.current?.setCustomValidity(value && !valid ? message : ''); }, [value, valid, message]);
  return <div className="land-cpf-field">
    <label htmlFor={id}>CPF</label>
    <input ref={input} id={id} name="cpf" inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" required maxLength={14} value={value} onChange={event => onChange(event.target.value)} onBlur={() => setTouched(true)} onInvalid={() => setTouched(true)} aria-invalid={show && !valid} aria-describedby={`${id}-status ${id}-help`} />
    <span id={`${id}-status`} role="status" className={`land-cpf-status ${valid ? 'is-valid' : 'is-invalid'}`}>{show && <>{valid ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}{message}</>}</span>
    <small id={`${id}-help`} className="land-muted">Verificação dos números, sem consulta à Receita Federal.</small>
  </div>;
}
