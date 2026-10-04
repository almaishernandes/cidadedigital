import { useEffect, useMemo, useState } from 'react';
import { Grid3x3 } from 'lucide-react';
import { buscarVitrinesCidade } from '../lib/supabase/queries.js';

const MIN_CELULAS = 100;

/**
 * Representação abstrata (não-geográfica) da cidade sendo construída:
 * uma folha quadriculada onde cada célula é uma vaga de vitrine. As
 * licenças reais aparecem preenchidas e numeradas; o resto fica como
 * contorno pontilhado, mostrando a capacidade/crescimento da cidade.
 */
export default function MapaDigital({ cidade, loteSelecionado, aoSelecionar }) {
  const [vitrines, setVitrines] = useState([]);
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

  const porPosicao = useMemo(() => {
    const m = new Map();
    for (const v of vitrines) m.set(v.numero_licenca, v);
    return m;
  }, [vitrines]);

  const totalCelulas = Math.max(MIN_CELULAS, Math.ceil((vitrines.length + 1) / 10) * 10);
  const posicoes = Array.from({ length: totalCelulas }, (_, i) => i + 1);

  return (
    <div className="flex h-full w-full flex-col bg-slate-900 text-white">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-slate-700 px-3 py-2 text-xs text-slate-300">
        <Grid3x3 size={14} />
        Matriz de licenças — {cidade}
        <span className="ml-auto rounded-full bg-slate-700 px-2 py-0.5">{vitrines.length} ativas</span>
      </div>

      <div className="flex-1 overflow-y-auto p-1">
        {erro && <p className="p-2 text-sm text-red-400">{erro}</p>}
        {!carregando && vitrines.length === 0 && !erro && (
          <p className="p-2 text-xs text-slate-500">
            Nenhuma licença ativa ainda — cada vitrine licenciada ocupa a próxima célula.
          </p>
        )}

        <div className="grid grid-cols-12 gap-0.5 sm:grid-cols-[repeat(16,minmax(0,1fr))] md:grid-cols-[repeat(20,minmax(0,1fr))] lg:grid-cols-[repeat(24,minmax(0,1fr))]">
          {posicoes.map((pos) => {
            const v = porPosicao.get(pos);
            if (!v) {
              return (
                <div
                  key={pos}
                  className="aspect-square rounded-sm border border-dashed border-slate-700/70"
                />
              );
            }
            const selecionado = loteSelecionado === v.lote_id;
            return (
              <button
                key={pos}
                onClick={() => aoSelecionar?.(v)}
                title={v.nome_fantasia}
                className={`flex aspect-square items-center justify-center rounded-sm text-[8px] font-semibold transition-colors sm:text-[10px] ${
                  selecionado
                    ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-200'
                    : 'bg-indigo-500 text-white hover:bg-indigo-400'
                }`}
              >
                {v.numero_licenca}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
