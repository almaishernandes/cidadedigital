import { useState } from 'react';
import {
  MapPinned,
  Map as MapIcon,
  Radar,
  Grid3x3,
  PanelRightClose,
  PanelRightOpen,
  ChevronRight,
} from 'lucide-react';
import MapaLotes from '../components/MapaLotes.jsx';
import MapaDigital from '../components/MapaDigital.jsx';
import PainelLote from '../components/PainelLote.jsx';
import PainelVitrines from '../components/PainelVitrines.jsx';
import PainelLotesFisico from '../components/PainelLotesFisico.jsx';

const CIDADES = {
  'Osvaldo Cruz': { longitude: -50.8778, latitude: -21.7969, zoom: 15 },
  'Parapuã': { longitude: -50.7953, latitude: -21.7797, zoom: 15 },
};

const MODOS = [
  { chave: 'fisico', rotulo: 'Físico', Icone: MapIcon, cls: 'bg-blue-600' },
  { chave: 'virtual', rotulo: 'Virtual', Icone: Radar, cls: 'bg-indigo-600' },
  { chave: 'digital', rotulo: 'Digital', Icone: Grid3x3, cls: 'bg-slate-800' },
];

export default function MapaPublico() {
  const [cidade, setCidade] = useState('Osvaldo Cruz');
  const [lote, setLote] = useState(null);
  const [modo, setModo] = useState('fisico'); // 'fisico' | 'virtual' | 'digital'
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
      numero_licenca: v.numero_licenca ?? null,
    });
    if (v.latitude != null && v.longitude != null) {
      setVoarPara({ latitude: v.latitude, longitude: v.longitude, token: Date.now() });
    }
  }

  return (
    <div className={`relative flex h-full w-full ${painelAberto ? 'flex-col sm:flex-row' : ''}`}>
      <div className="relative min-h-0 flex-1">
        {modo === 'digital' ? (
          <MapaDigital cidade={cidade} loteSelecionado={lote?.lote_id ?? null} aoSelecionar={aoSelecionarNaLista} />
        ) : (
          <MapaLotes
            key={cidade}
            cidade={cidade}
            viewInicial={CIDADES[cidade]}
            loteSelecionado={lote?.lote_id ?? null}
            onSelecionarLote={aoSelecionarNoMapa}
            modo={modo}
            voarPara={voarPara}
          />
        )}

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
            {MODOS.map(({ chave, rotulo, Icone, cls }) => (
              <button
                key={chave}
                onClick={() => setModo(chave)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 ${
                  modo === chave ? `${cls} text-white` : 'text-slate-600'
                }`}
              >
                <Icone size={13} /> {rotulo}
              </button>
            ))}
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
        <div className="relative h-64 shrink-0 overflow-hidden border-t bg-white sm:h-full sm:w-96 sm:border-l sm:border-t-0">
          <button
            onClick={() => setPainelAberto(false)}
            title="Ocultar painel (ver mapa inteiro)"
            className="absolute -left-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border bg-white p-1 text-slate-500 shadow hover:bg-slate-100 sm:block"
          >
            <ChevronRight size={16} />
          </button>

          {/* Tela 1: lista — desliza pra fora (esquerda) quando um espaço é selecionado */}
          <div
            className={`absolute inset-0 transition-transform duration-300 ease-out ${
              lote ? '-translate-x-full' : 'translate-x-0'
            }`}
          >
            {modo === 'fisico' ? (
              <PainelLotesFisico cidade={cidade} loteSelecionado={lote?.lote_id} aoSelecionar={aoSelecionarNaLista} />
            ) : (
              <PainelVitrines cidade={cidade} loteSelecionado={lote?.lote_id} aoSelecionar={aoSelecionarNaLista} />
            )}
          </div>

          {/* Tela 2: detalhes — entra deslizando da direita */}
          <div
            className={`absolute inset-0 transition-transform duration-300 ease-out ${
              lote ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <PainelLote lote={lote} aoFechar={() => setLote(null)} inline />
          </div>
        </div>
      )}
    </div>
  );
}
