import { useEffect, useMemo, useState } from 'react';
import { Grid3x3, ChevronLeft, ChevronRight } from 'lucide-react';
import { buscarVitrinesCidade } from '../lib/supabase/queries.js';

const COLUNAS = 10;
const LINHAS = 10;
const POR_PAGINA = COLUNAS * LINHAS;

/**
 * Representação abstrata (não-geográfica) da cidade sendo construída:
 * uma matriz fixa 10x10 por página, onde cada célula é uma vaga de
 * vitrine. Licenças reais aparecem preenchidas e numeradas; o resto
 * fica como contorno pontilhado com a posição em opaco.
 */
export default function MapaDigital({ cidade, loteSelecionado, aoSelecionar }) {
  const [vitrines, setVitrines] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [pagina, setPagina] = useState(0);

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

  useEffect(() => setPagina(0), [cidade]);

  const porPosicao = useMemo(() => {
    const m = new Map();
    for (const v of vitrines) m.set(v.numero_licenca, v);
    return m;
  }, [vitrines]);

  const totalPaginas = Math.max(1, Math.ceil((vitrines.length + 1) / POR_PAGINA));
  const inicio = pagina * POR_PAGINA;
  const posicoes = Array.from({ length: POR_PAGINA }, (_, i) => inicio + i + 1);

  return (
    <div className="flex h-full w-full flex-col bg-slate-900 text-white">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-slate-700 px-3 py-2 text-xs text-slate-300">
        <Grid3x3 size={14} />
        Matriz de licenças — {cidade}
        <span className="rounded-full bg-slate-700 px-2 py-0.5">{vitrines.length} ativas</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setPagina((p) => Math.max(0, p - 1))}
            disabled={pagina === 0}
            className="rounded p-1 hover:bg-slate-700 disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          <span>
            {inicio + 1}–{inicio + POR_PAGINA}
          </span>
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
            disabled={pagina >= totalPaginas - 1}
            className="rounded p-1 hover:bg-slate-700 disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center overflow-y-auto bg-slate-950 p-2">
        {erro && <p className="p-2 text-sm text-red-400">{erro}</p>}
        {!carregando && vitrines.length === 0 && !erro && (
          <p className="p-2 text-xs text-slate-500">
            Nenhuma licença ativa ainda — cada vitrine licenciada ocupa a próxima célula.
          </p>
        )}

        <div className="m-auto grid grid-cols-[repeat(10,36px)] grid-rows-[repeat(10,36px)] gap-1">
          {posicoes.map((pos) => {
            const v = porPosicao.get(pos);
            if (!v) {
              return (
                <div
                  key={pos}
                  className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-600 bg-slate-800 text-[9px] font-medium text-slate-400"
                >
                  {pos}
                </div>
              );
            }
            const selecionado = loteSelecionado === v.lote_id;
            return (
              <button
                key={pos}
                onClick={() => aoSelecionar?.(v)}
                title={v.nome_fantasia}
                className={`relative z-0 flex h-9 w-9 items-center justify-center overflow-visible rounded-sm font-black leading-none transition-colors hover:z-10 ${
                  selecionado
                    ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-200'
                    : 'bg-indigo-500 text-white hover:bg-indigo-400'
                }`}
                style={{ fontSize: 30 }}
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
