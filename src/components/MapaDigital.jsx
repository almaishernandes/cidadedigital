import { useEffect, useState } from 'react';
import { Grid3x3 } from 'lucide-react';
import { buscarVitrinesCidade } from '../lib/supabase/queries.js';

/**
 * Representação abstrata (não-geográfica) da cidade sendo construída:
 * uma matriz com o número de cada licença, na ordem em que foram emitidas.
 */
export default function MapaDigital({ cidade, loteSelecionado, aoSelecionar }) {
  const [vitrines, setVitrines] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    buscarVitrinesCidade(cidade)
      .then((r) => vivo && setVitrines([...r].sort((a, b) => a.numero_licenca - b.numero_licenca)))
      .catch((e) => vivo && setErro(e.message))
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, [cidade]);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-slate-900 text-white">
      <div className="flex items-center gap-1.5 border-b border-slate-700 p-3 text-sm text-slate-300">
        <Grid3x3 size={15} />
        Matriz de licenças — {cidade}
        <span className="ml-auto rounded-full bg-slate-700 px-2 py-0.5 text-xs">
          {vitrines.length}
        </span>
      </div>

      <div className="flex-1 p-3">
        {carregando && <p className="text-sm text-slate-400">Carregando…</p>}
        {erro && <p className="text-sm text-red-400">{erro}</p>}
        {!carregando && vitrines.length === 0 && (
          <p className="text-sm text-slate-400">
            Nenhuma vitrine licenciada ainda nessa cidade. Cada licença ativada ocupa a próxima
            posição na matriz.
          </p>
        )}

        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {vitrines.map((v) => (
            <button
              key={v.lote_id}
              onClick={() => aoSelecionar?.(v)}
              title={v.nome_fantasia}
              className={`flex aspect-square items-center justify-center rounded text-xs font-semibold transition-colors ${
                loteSelecionado === v.lote_id
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {v.numero_licenca}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
