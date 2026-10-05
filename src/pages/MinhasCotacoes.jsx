import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { linkWhatsApp } from '../lib/supabase/queries.js';
import { minhasCotacoes } from '../lib/supabase/gestao.js';

const ROTULO_STATUS = {
  pendente: { txt: 'Aguardando resposta', cls: 'bg-amber-100 text-amber-700' },
  respondida: { txt: 'Respondida', cls: 'bg-green-100 text-green-700' },
  cancelada: { txt: 'Cancelada', cls: 'bg-slate-100 text-slate-500' },
};

export default function MinhasCotacoes() {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    minhasCotacoes()
      .then(setItens)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) return <p className="p-6 text-sm text-slate-500">Carregando…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="flex items-center gap-2 text-xl font-semibold">
        <FileText size={20} /> Minhas cotações
      </h1>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {itens.length === 0 && (
        <p className="text-sm text-slate-500">
          Você ainda não pediu nenhuma cotação. Abra uma vitrine no mapa, selecione itens do
          catálogo e peça uma cotação.
        </p>
      )}
      <ul className="space-y-3">
        {itens.map((c) => {
          const st = ROTULO_STATUS[c.status] ?? ROTULO_STATUS.pendente;
          return (
            <li key={c.id} className="rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{c.estabelecimento?.nome_fantasia}</span>
                <span className={`rounded px-2 py-0.5 text-xs ${st.cls}`}>{st.txt}</span>
              </div>
              <ul className="mt-2 space-y-0.5">
                {c.itens.map((i) => (
                  <li key={i.id} className="text-slate-700">
                    {i.quantidade}× {i.produto?.nome}
                  </li>
                ))}
              </ul>
              {c.mensagem && <p className="mt-2 text-slate-600">Você pediu: {c.mensagem}</p>}
              {c.resposta && (
                <p className="mt-2 rounded bg-green-50 p-2 text-green-800">
                  <strong>Resposta da vitrine:</strong> {c.resposta}
                </p>
              )}
              {c.status === 'respondida' && c.estabelecimento?.telefone_whatsapp && (
                <a
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white"
                  href={linkWhatsApp(c.estabelecimento.telefone_whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Falar no WhatsApp
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
