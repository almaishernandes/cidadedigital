import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Map as MapIcon,
  Radar,
  PanelRightClose,
  PanelRightOpen,
  ChevronRight,
  Store,
} from 'lucide-react';
import MapaLotes from '../components/MapaLotes.jsx';
import PainelLote from '../components/PainelLote.jsx';
import PainelVitrines from '../components/PainelVitrines.jsx';
import PainelLotesFisico from '../components/PainelLotesFisico.jsx';

const CIDADES = {
  'Osvaldo Cruz': { longitude: -50.8778, latitude: -21.7969, zoom: 15 },
  'Parapuã': { longitude: -50.7953, latitude: -21.7797, zoom: 15 },
};

const MODOS = [
  { chave: 'fisico', rotulo: 'Físico', Icone: MapIcon, cls: 'bg-blue-600' },
  { chave: 'virtual', rotulo: 'Digital', Icone: Radar, cls: 'bg-indigo-600' },
];

const CHAVE_CIDADE_SALVA = 'cidadeDigital.ultimaCidade';

function cidadeInicial() {
  try {
    const salva = localStorage.getItem(CHAVE_CIDADE_SALVA);
    if (salva && CIDADES[salva]) return salva;
  } catch {
    // localStorage indisponível (modo privado etc.) — segue com o padrão.
  }
  return 'Osvaldo Cruz';
}

export default function MapaPublico() {
  const [cidade, setCidade] = useState(cidadeInicial);
  const [lote, setLote] = useState(null);
  const [modo, setModo] = useState('fisico'); // 'fisico' | 'virtual' | 'digital'
  const [voarPara, setVoarPara] = useState(null);
  const [painelAberto, setPainelAberto] = useState(true);
  const [abaMobile, setAbaMobile] = useState('cidade'); // 'cidade' | 'vitrines' — só no celular
  const [barraEl, setBarraEl] = useState(null);

  // A barra de controles mora no cabeçalho do site (ver Layout.jsx), ao lado
  // de "Licenças" — usamos portal porque esse div pertence a outro componente.
  useEffect(() => {
    setBarraEl(document.getElementById('barra-contextual'));
  }, []);

  function aoSelecionarNoMapa(props) {
    setLote(props);
    if (props) {
      setPainelAberto(true);
      setAbaMobile('vitrines');
    }
  }

  function aoSelecionarNaLista(v) {
    setLote({
      lote_id: v.lote_id,
      endereco: v.endereco,
      numero: v.numero,
      bairro: v.bairro ?? null,
      complemento: v.complemento ?? null,
      cep: v.cep ?? null,
      area_m2: v.area_m2 ?? null,
      status_vitrine: v.status_vitrine ?? 'ocupado',
      numero_licenca: v.numero_licenca ?? null,
      total_vitrines: v.total_vitrines,
      // lotes_cidade (lista do físico) traz total_vitrines: é o lote, pode ter
      // várias unidades, então mostra o seletor de andar/sala quando houver
      // mais de uma. vitrines_cidade (lista do modo Digital) já é a vitrine
      // exata escolhida — vai direto pra ela.
      selecaoEspecifica: v.total_vitrines === undefined,
      latitude: v.latitude ?? null,
      longitude: v.longitude ?? null,
    });
    if (v.latitude != null && v.longitude != null) {
      setVoarPara({ latitude: v.latitude, longitude: v.longitude, token: Date.now() });
    }
  }

  const barra = (
    <>
      <select
        value={cidade}
        onChange={(e) => {
          const nova = e.target.value;
          setCidade(nova);
          setLote(null);
          try {
            localStorage.setItem(CHAVE_CIDADE_SALVA, nova);
          } catch {
            // ignora se localStorage não estiver disponível
          }
        }}
        className="min-w-0 flex-1 rounded border px-2 py-1 text-sm sm:w-auto sm:flex-none"
      >
        {Object.keys(CIDADES).map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <div className="hidden shrink-0 overflow-hidden whitespace-nowrap rounded-full border text-xs sm:flex">
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
        className="hidden shrink-0 rounded-full border p-1.5 text-slate-600 hover:bg-slate-50 sm:block"
        title={painelAberto ? 'Ocultar painel' : 'Mostrar painel'}
      >
        {painelAberto ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
      </button>
    </>
  );

  return (
    <div className="relative flex h-full w-full flex-col sm:flex-row">
      {barraEl && createPortal(barra, barraEl)}

      <div
        className={`relative min-h-0 sm:flex-1 ${
          abaMobile === 'cidade' ? 'flex-1' : 'h-0 shrink-0 overflow-hidden'
        }`}
      >
        <MapaLotes
          key={cidade}
          cidade={cidade}
          viewInicial={CIDADES[cidade]}
          loteSelecionado={lote?.lote_id ?? null}
          onSelecionarLote={aoSelecionarNoMapa}
          modo={modo}
          voarPara={voarPara}
        />
      </div>

      <div
        className={`relative min-h-0 overflow-hidden border-t bg-white ${
          abaMobile === 'vitrines' ? 'flex-1' : 'h-0 shrink-0 overflow-hidden'
        } ${
          painelAberto
            ? 'sm:flex sm:h-full sm:w-96 sm:flex-none sm:border-l sm:border-t-0'
            : 'sm:hidden'
        }`}
      >
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

      {/* Abas no rodapé — só no celular; no desktop o painel fica sempre ao lado. */}
      <nav className="flex shrink-0 border-t bg-white sm:hidden">
        <button
          onClick={() => {
            setModo('fisico');
            setAbaMobile('cidade');
          }}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
            abaMobile === 'cidade' && modo === 'fisico' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <MapIcon size={18} />
          Físico
        </button>
        <button
          onClick={() => {
            setModo('virtual');
            setAbaMobile('cidade');
          }}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
            abaMobile === 'cidade' && modo === 'virtual' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <Radar size={18} />
          Digital
        </button>
        <button
          onClick={() => setAbaMobile('vitrines')}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
            abaMobile === 'vitrines' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <Store size={18} />
          Vitrines
        </button>
      </nav>
    </div>
  );
}
