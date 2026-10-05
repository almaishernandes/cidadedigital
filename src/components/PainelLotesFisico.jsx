import { useEffect, useMemo, useState } from 'react';
import { Search, LayoutGrid, MapPin } from 'lucide-react';
import { buscarLotesCidade } from '../lib/supabase/queries.js';
import { STATUS_MAPA } from './StatusBadge.jsx';

const ABAS = [
  { chave: 'todos', rotulo: 'Todos' },
  { chave: 'oportunidade', rotulo: 'Disponível' },
  { chave: 'ocupado', rotulo: 'Comercial' },
  { chave: 'residencial', rotulo: 'Residencial' },
  { chave: 'publico', rotulo: 'Público' },
];

export default function PainelLotesFisico({ cidade, loteSelecionado, aoSelecionar }) {
  const [lotes, setLotes] = useState([]);
  const [termo, setTermo] = useState('');
  const [aba, setAba] = useState('todos');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    buscarLotesCidade(cidade)
      .then((r) => vivo && setLotes(r))
      .catch((e) => vivo && setErro(e.message))
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, [cidade]);

  const filtrados = useMemo(() => {
    const t = termo.trim().toLowerCase();
    return lotes.filter((l) => {
      if (aba !== 'todos' && l.status_vitrine !== aba) return false;
      if (!t) return true;
      return (
        l.nome_fantasia?.toLowerCase().includes(t) ||
        l.categoria?.toLowerCase().includes(t) ||
        l.endereco?.toLowerCase().includes(t)
      );
    });
  }, [lotes, termo, aba]);

  return (
    <aside className="flex h-full w-full flex-col bg-white">
      <div className="border-b p-3">
        <h2 className="mb-2 flex items-center gap-1.5 font-semibold">
          <LayoutGrid size={16} /> Vitrines em {cidade}
        </h2>

        <div className="mb-2 space-y-1 rounded-lg bg-slate-50 p-2 text-xs">
          {Object.entries(STATUS_MAPA).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: v.cor }} />
              {v.rotulo}
            </div>
          ))}
        </div>

        <div className="relative mb-2">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded border py-1.5 pl-7 pr-2 text-sm"
            placeholder="Buscar nome, categoria, endereço..."
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
        </div>

        <div className="flex gap-1">
          {ABAS.map((a) => (
            <button
              key={a.chave}
              onClick={() => setAba(a.chave)}
              className={`rounded px-2 py-1 text-xs ${
                aba === a.chave ? 'bg-slate-800 text-white' : 'border text-slate-600'
              }`}
            >
              {a.rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {carregando && <p className="p-3 text-sm text-slate-500">Carregando…</p>}
        {erro && <p className="p-3 text-sm text-red-600">{erro}</p>}
        {!carregando && filtrados.length === 0 && (
          <p className="p-3 text-sm text-slate-500">Nenhum lote encontrado.</p>
        )}
        <ul className="divide-y">
          {filtrados.map((l) => {
            const cor = STATUS_MAPA[l.status_vitrine]?.cor ?? '#cbd5e1';
            return (
              <li key={l.lote_id}>
                <button
                  onClick={() => aoSelecionar?.(l)}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50 ${
                    loteSelecionado === l.lote_id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: cor }}
                    />
                    <span className="font-medium">
                      {l.nome_fantasia ?? (l.status_vitrine === 'oportunidade' ? 'Espaço disponível' : l.endereco)}
                    </span>
                  </span>
                  {l.categoria && <span className="ml-[18px] block text-xs text-slate-500">{l.categoria}</span>}
                  <span className="ml-[18px] flex items-center gap-1 text-xs text-slate-400">
                    <MapPin size={11} />
                    {l.endereco}
                    {l.numero ? `, ${l.numero}` : ''}
                    {l.cep ? ` — CEP ${l.cep}` : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
