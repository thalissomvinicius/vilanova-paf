import React, { useId } from 'react';

const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const pad = value => String(value).padStart(2, '0');

export function BirthDateField({ value, onChange }) {
  const id = useId();
  const [year = '', month = '', day = ''] = value.split('-');
  const today = new Date();
  const currentYear = today.getFullYear();
  const monthLimit = y => Number(y) === currentYear ? today.getMonth() + 1 : 12;
  function dayLimit(y, m) {
    const days = m ? new Date(Number(y) || 2000, Number(m), 0).getDate() : 31;
    return Number(y) === currentYear && Number(m) === today.getMonth() + 1 ? Math.min(days, today.getDate()) : days;
  }
  function change(part, next) {
    const parts = { year, month, day, [part]: next };
    if (Number(parts.month) > monthLimit(parts.year)) parts.month = '';
    if (Number(parts.day) > dayLimit(parts.year, parts.month)) parts.day = '';
    onChange(`${parts.year}-${parts.month}-${parts.day}`);
  }
  return <fieldset className="land-birth-date">
    <legend>Data de nascimento</legend>
    <div className="land-birth-parts">
      <div><label htmlFor={`${id}-day`}>Dia</label><select id={`${id}-day`} name="birthDay" autoComplete="bday-day" required value={day} onChange={event => change('day', event.target.value)}>
        <option value="">Dia</option>
        {Array.from({ length: dayLimit(year, month) }, (_, index) => <option key={index + 1} value={pad(index + 1)}>{pad(index + 1)}</option>)}
      </select></div>
      <div><label htmlFor={`${id}-month`}>Mês</label><select id={`${id}-month`} name="birthMonth" autoComplete="bday-month" required value={month} onChange={event => change('month', event.target.value)}>
        <option value="">Mês</option>
        {months.slice(0, monthLimit(year)).map((name, index) => <option key={name} value={pad(index + 1)}>{name}</option>)}
      </select></div>
      <div><label htmlFor={`${id}-year`}>Ano</label><select id={`${id}-year`} name="birthYear" autoComplete="bday-year" required value={year} onChange={event => change('year', event.target.value)}>
        <option value="">Ano</option>
        {Array.from({ length: currentYear - 1899 }, (_, index) => <option key={currentYear - index} value={currentYear - index}>{currentYear - index}</option>)}
      </select></div>
    </div>
  </fieldset>;
}
