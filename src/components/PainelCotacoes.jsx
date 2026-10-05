import { useEffect, useState } from 'react';
import { FileText, Send } from 'lucide-react';
import { cotacoesRecebidas, responderCotacao } from '../lib/supabase/gestao.js';

const ROTULO_STATUS = {
  pendente: { txt: 'Aguardando resposta', cls: 'bg-amber-100 text-amber-700' },
  respondida: { txt: 'Respondida', cls: 'bg-green-100 text-green-700' },
  cancelada: { txt: 'Cancelada', cls: 'bg-slate-100 text-slate-500' },
};

export default function PainelCotacoes({ estabelecimentoId }) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [rascunhos, setRascunhos] = useState({}); // cotacaoId -> texto da resposta
  const [enviando, setEnviando] = useState(null);

  async function carregar() {
    setCarregando(true);
    try {
      setItens(await cotacoesRecebidas(estabelecimentoId));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [estabelecimentoId]);

  async function responder(id) {
    setEnviando(id);
    setErro(null);
    try {
      await responderCotacao(id, rascunhos[id] ?? '');
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(null);
    }
  }

  if (carregando) return <p className="text-sm text-slate-500">Carregando cotações…</p>;

  return (
    <div className="space-y-3">
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {itens.length === 0 && (
        <p className="text-sm text-slate-500">Nenhum pedido de cotação recebido ainda.</p>
      )}
      <ul className="space-y-3">
        {itens.map((c) => {
          const st = ROTULO_STATUS[c.status] ?? ROTULO_STATUS.pendente;
          return (
            <li key={c.id} className="rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{c.perfil?.nome ?? c.perfil?.email ?? 'Consumidor'}</span>
                <span className={`rounded px-2 py-0.5 text-xs ${st.cls}`}>{st.txt}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {c.perfil?.email} · {c.perfil?.telefone ?? 'sem telefone'}
              </p>

              <ul className="mt-2 space-y-0.5">
                {c.itens.map((i) => (
                  <li key={i.id} className="text-slate-700">
                    {i.quantidade}× {i.produto?.nome}
                    {i.produto?.preco != null &&
                      ` — ${Number(i.produto.preco).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })} cada`}
                  </li>
                ))}
              </ul>

              {c.mensagem && (
                <p className="mt-2 rounded bg-slate-50 p-2 text-slate-600">
                  <FileText size={13} className="mr-1 inline" />
                  {c.mensagem}
                </p>
              )}

              {c.resposta ? (
                <p className="mt-2 rounded bg-green-50 p-2 text-green-800">
                  <strong>Sua resposta:</strong> {c.resposta}
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  <textarea
                    className="min-w-[14rem] flex-1 rounded border px-2 py-1.5 text-sm"
                    rows={2}
                    placeholder="Responda com preço final, prazo e forma de pagamento/entrega..."
                    value={rascunhos[c.id] ?? ''}
                    onChange={(e) => setRascunhos((r) => ({ ...r, [c.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => responder(c.id)}
                    disabled={enviando === c.id || !(rascunhos[c.id] ?? '').trim()}
                    className="inline-flex items-center gap-1 self-start rounded bg-blue-600 px-3 py-1.5 text-white disabled:opacity-50"
                  >
                    <Send size={14} /> {enviando === c.id ? 'Enviando…' : 'Responder'}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
