import { Component } from 'react';

export default class ErroGeral extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro, info) {
    console.error('Erro não tratado na Cidade Digital:', erro, info);
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-semibold text-slate-800">Algo deu errado.</p>
        <p className="text-sm text-slate-500">
          Tenta recarregar a página. Se continuar, manda um print desta tela pro suporte.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Recarregar
        </button>
        <pre className="mt-4 max-w-full overflow-auto whitespace-pre-wrap rounded-lg bg-slate-100 p-3 text-left text-xs text-slate-600">
          {String(this.state.erro?.stack || this.state.erro?.message || this.state.erro)}
        </pre>
      </div>
    );
  }
}
