import { useEffect, useMemo, useState } from 'react';
import { Search, LayoutGrid, MapPin } from 'lucide-react';
import { buscarLotesCidade } from '../lib/supabase/queries.js';
import { STATUS_MAPA } from './StatusBadge.jsx';

const ABAS = [
  { chave: 'ocupado', rotulo: 'Comercial', cor: STATUS_MAPA.ocupado.cor },
  { chave: 'publico', rotulo: 'Público', cor: STATUS_MAPA.publico.cor },
];

export default function PainelLotesFisico({ cidade, loteSelecionado, aoSelecionar, filtro }) {
  const [lotes, setLotes] = useState([]);
  const [termo, setTermo] = useState('');
  const [aba, setAba] = useState('todos'); // 'todos' | uma das ABAS — nenhum filtro ativo mostra tudo
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
      if (filtro?.setor) {
        const setorDoLote = l.status_vitrine === 'publico' ? 'Público' : l.status_vitrine === 'ocupado' ? 'Privado' : null;
        if (setorDoLote !== filtro.setor) return false;
      }
      if (filtro?.categoria && l.categoria !== filtro.categoria) return false;
      if (filtro?.subcategoria && l.subcategoria !== filtro.subcategoria) return false;
      if (!t) return true;
      return (
        l.nome_fantasia?.toLowerCase().includes(t) ||
        l.categoria?.toLowerCase().includes(t) ||
        l.endereco?.toLowerCase().includes(t)
      );
    });
  }, [lotes, termo, aba, filtro]);

  return (
    <aside className="flex h-full w-full flex-col bg-white">
      <div className="border-b p-3">
        <h2 className="mb-2 hidden items-center gap-1.5 font-semibold sm:flex">
          <LayoutGrid size={16} /> Vitrines em {cidade}
        </h2>

        <div className="relative mb-2">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded border py-1.5 pl-7 pr-2 text-sm"
            placeholder="Buscar nome, categoria, endereço..."
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {ABAS.map((a) => (
            <button
              key={a.chave}
              onClick={() => setAba((atual) => (atual === a.chave ? 'todos' : a.chave))}
              className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs ${
                aba === a.chave ? 'bg-slate-800 text-white' : 'border text-slate-600'
              }`}
            >
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: a.cor }}
              />
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
                    {l.numero_licenca != null ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                        {l.numero_licenca}
                      </span>
                    ) : (
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: cor }}
                      />
                    )}
                    <span className="font-medium">
                      {l.nome_fantasia ??
                        (l.status_vitrine === 'oportunidade'
                          ? l.status_ocupacao && l.status_ocupacao !== 'vago'
                            ? 'Sem vitrine digital'
                            : 'Espaço disponível'
                          : l.status_vitrine === 'residencial'
                            ? 'Residencial'
                            : l.status_vitrine === 'publico'
                              ? 'Espaço público'
                              : 'Sem vitrine digital')}
                    </span>
                  </span>
                  {l.categoria && (
                    <span className={`${l.numero_licenca != null ? 'ml-8' : 'ml-[18px]'} block text-xs text-slate-500`}>
                      {l.categoria}
                    </span>
                  )}
                  <span
                    className={`${l.numero_licenca != null ? 'ml-8' : 'ml-[18px]'} flex items-center gap-1 text-xs text-slate-400`}
                  >
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
