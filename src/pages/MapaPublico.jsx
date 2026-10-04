import { useState } from 'react';
import { MapPinned, Map as MapIcon, Radar, PanelRightClose, PanelRightOpen } from 'lucide-react';
import MapaLotes from '../components/MapaLotes.jsx';
import PainelLote from '../components/PainelLote.jsx';
import PainelVitrines from '../components/PainelVitrines.jsx';
import PainelLotesFisico from '../components/PainelLotesFisico.jsx';

const CIDADES = {
  'Osvaldo Cruz': { longitude: -50.8778, latitude: -21.7969, zoom: 15 },
  'Parapuã': { longitude: -50.7953, latitude: -21.7797, zoom: 15 },
};

export default function MapaPublico() {
  const [cidade, setCidade] = useState('Osvaldo Cruz');
  const [lote, setLote] = useState(null);
  const [modo, setModo] = useState('fisico'); // 'fisico' | 'virtual'
  const [voarPara, setVoarPara] = useState(null);
  const [painelAberto, setPainelAberto] = useState(true);

  function aoSelecionarNoMapa(props) {
    setLote(props);
    if (props) setPainelAberto(true);
  }

  function aoSelecionarNaLista(v) {
    setLote({
      lote_id: v.lote_id,
      endereco: v.endereco,
      numero: v.numero,
      area_m2: v.area_m2 ?? null,
      status_vitrine: v.status_vitrine ?? 'ocupado',
    });
    setVoarPara({ latitude: v.latitude, longitude: v.longitude, token: Date.now() });
  }

  return (
    <div className={`relative flex h-full w-full ${painelAberto ? 'flex-col sm:flex-row' : ''}`}>
      <div className="relative min-h-0 flex-1">
        <MapaLotes
          key={cidade}
          cidade={cidade}
          viewInicial={CIDADES[cidade]}
          loteSelecionado={lote?.lote_id ?? null}
          onSelecionarLote={aoSelecionarNoMapa}
          modo={modo}
          voarPara={voarPara}
        />

        <header className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow sm:gap-3 sm:px-4 sm:py-2">
          <MapPinned size={18} className="hidden text-blue-600 sm:block" />
          <select
            value={cidade}
            onChange={(e) => {
              setCidade(e.target.value);
              setLote(null);
            }}
            className="rounded border px-2 py-1 text-sm"
          >
            {Object.keys(CIDADES).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <div className="flex overflow-hidden rounded-full border text-xs">
            <button
              onClick={() => setModo('fisico')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 ${
                modo === 'fisico' ? 'bg-blue-600 text-white' : 'text-slate-600'
              }`}
            >
              <MapIcon size={13} /> Físico
            </button>
            <button
              onClick={() => setModo('virtual')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 ${
                modo === 'virtual' ? 'bg-indigo-600 text-white' : 'text-slate-600'
              }`}
            >
              <Radar size={13} /> Virtual
            </button>
          </div>
          <button
            onClick={() => setPainelAberto((v) => !v)}
            className="rounded-full border p-1.5 text-slate-600 hover:bg-slate-50"
            title={painelAberto ? 'Ocultar painel' : 'Mostrar painel'}
          >
            {painelAberto ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
          </button>
        </header>
      </div>

      {painelAberto && (
        <div className="h-64 shrink-0 border-t bg-white sm:h-full sm:w-96 sm:border-l sm:border-t-0">
          {lote ? (
            <PainelLote lote={lote} aoFechar={() => setLote(null)} inline />
          ) : modo === 'virtual' ? (
            <PainelVitrines cidade={cidade} loteSelecionado={lote?.lote_id} aoSelecionar={aoSelecionarNaLista} />
          ) : (
            <PainelLotesFisico cidade={cidade} loteSelecionado={lote?.lote_id} aoSelecionar={aoSelecionarNaLista} />
          )}
        </div>
      )}
    </div>
  );
}
