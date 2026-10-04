import { useEffect, useMemo, useState } from 'react';
import { Search, Store, MapPin } from 'lucide-react';
import { buscarVitrinesCidade } from '../lib/supabase/queries.js';

export default function PainelVitrines({ cidade, loteSelecionado, aoSelecionar }) {
  const [vitrines, setVitrines] = useState([]);
  const [termo, setTermo] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    buscarVitrinesCidade(cidade)
      .then((r) => vivo && setVitrines(r))
      .catch((e) => vivo && setErro(e.message))
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, [cidade]);

  const filtradas = useMemo(() => {
    const t = termo.trim().toLowerCase();
    if (!t) return vitrines;
    return vitrines.filter(
      (v) =>
        v.nome_fantasia?.toLowerCase().includes(t) ||
        v.categoria?.toLowerCase().includes(t) ||
        v.endereco?.toLowerCase().includes(t)
    );
  }, [vitrines, termo]);

  return (
    <aside className="flex h-full w-full max-w-sm flex-col border-l bg-white">
      <div className="border-b p-3">
        <h2 className="mb-2 flex items-center gap-1.5 font-semibold">
          <Store size={16} /> Vitrines em {cidade}
        </h2>
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded border py-1.5 pl-7 pr-2 text-sm"
            placeholder="Buscar nome, categoria, endereço..."
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {carregando && <p className="p-3 text-sm text-slate-500">Carregando…</p>}
        {erro && <p className="p-3 text-sm text-red-600">{erro}</p>}
        {!carregando && filtradas.length === 0 && (
          <p className="p-3 text-sm text-slate-500">Nenhuma vitrine ativa encontrada.</p>
        )}
        <ul className="divide-y">
          {filtradas.map((v) => (
            <li key={v.lote_id}>
              <button
                onClick={() => aoSelecionar?.(v)}
                className={`w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50 ${
                  loteSelecionado === v.lote_id ? 'bg-indigo-50' : ''
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                    {v.numero_licenca}
                  </span>
                  <span className="font-medium">{v.nome_fantasia}</span>
                </span>
                {v.categoria && <span className="ml-8 block text-xs text-slate-500">{v.categoria}</span>}
                <span className="ml-8 flex items-center gap-1 text-xs text-slate-400">
                  <MapPin size={11} />
                  {v.endereco}
                  {v.numero ? `, ${v.numero}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
