import React from 'react';

export function LandConsent({ checked, onChange }) {
  return <section className="land-privacy" aria-labelledby="land-privacy-title">
    <h3 id="land-privacy-title">Proteção de dados e autorização</h3>
    <p>A Vila Nova Agroindustrial utilizará os dados deste cadastro para identificar o solicitante, analisar a área para plantio de dendê, entrar em contato e disponibilizar o andamento da solicitação.</p>
    <p>O tratamento deve observar a Lei Geral de Proteção de Dados Pessoais (LGPD), <a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm" target="_blank" rel="noopener noreferrer">Lei nº 13.709/2018</a>. O acesso é restrito à equipe autorizada. Este aceite não autoriza publicidade nem, por si só, o compartilhamento com instituições financeiras.</p>
    <p>A equipe PAF validará e verificará os dados no painel administrativo. Você tem direito a solicitar acesso, correção ou eliminação dos dados, quando aplicável, e a revogar esta autorização. A revogação pode impedir a continuidade da análise; permanecem as hipóteses de conservação previstas em lei.</p>
    <label className="land-consent"><input type="checkbox" required checked={checked} onChange={event => onChange(event.target.checked)} /><span>Li as informações acima e autorizo a Vila Nova Agroindustrial a utilizar os dados fornecidos para as finalidades deste cadastro.</span></label>
  </section>;
}
