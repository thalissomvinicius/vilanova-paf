import React from 'react';
import { RefreshCcw, ShieldAlert } from 'lucide-react';

export class RecoveryBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('PAF interface failure', error?.name); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="paf-recovery" role="alert">
      <img src="/brand/paf-symbol-official.png" alt="PAF VNA" width="64" height="64" />
      <ShieldAlert size={28} aria-hidden="true" />
      <h1>Nao foi possivel abrir esta tela</h1>
      <p>Atualize a pagina para tentar novamente. Seus dados salvos permanecem no sistema.</p>
      <button className="primary-button" onClick={() => window.location.reload()}><RefreshCcw size={18} />Tentar novamente</button>
      <a href="/">Voltar ao acesso PAF</a>
    </main>;
  }
}
