import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { buscarLotesGeoJSON } from '../lib/supabase/queries.js';

const STYLE_URL =
  import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';

const VAZIO = { type: 'FeatureCollection', features: [] };

// Cor do polígono conforme status_vitrine calculado pelo RPC — azul para
// comercial, verde para público, cinza para residencial (e laranja para
// lote ainda disponível/sem vitrine).
const COR_COMERCIAL = '#2563eb';
const COR_PUBLICO = '#16a34a';
const COR_RESIDENCIAL = '#6b7280';

const corPorStatus = [
  'match',
  ['get', 'status_vitrine'],
  'oportunidade', '#f59e0b',
  'ocupado', COR_COMERCIAL,
  'publico', COR_PUBLICO,
  'residencial', COR_RESIDENCIAL,
  /* outros */ '#cbd5e1',
];

const camadaPreenchimento = {
  id: 'lotes-fill',
  type: 'fill',
  paint: { 'fill-color': corPorStatus, 'fill-opacity': 0.45 },
};
const camadaContorno = {
  id: 'lotes-line',
  type: 'line',
  paint: { 'line-color': corPorStatus, 'line-width': 1.2 },
};
const camadaSelecionado = {
  id: 'lotes-sel',
  type: 'line',
  paint: { 'line-color': '#0f172a', 'line-width': 3 },
  filter: ['==', ['get', 'lote_id'], '__none__'],
};

// Pino numerado das licenças ativas (comercial) — usado no Físico (sobre o
// lote) e no Virtual (única marcação no mapa), com a mesma identidade visual:
// círculo azul. Público usa quadrado verde, residencial usa triângulo cinza.
const FILTRO_OCUPADO = ['==', ['get', 'status_vitrine'], 'ocupado'];
const FILTRO_PUBLICO = ['==', ['get', 'status_vitrine'], 'publico'];
const FILTRO_RESIDENCIAL = ['==', ['get', 'status_vitrine'], 'residencial'];

const camadaPinoBase = {
  id: 'lotes-pino-base',
  type: 'circle',
  filter: FILTRO_OCUPADO,
  paint: {
    'circle-radius': 16,
    'circle-color': COR_COMERCIAL,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
  },
};
const camadaPinoNumero = {
  id: 'lotes-pino-numero',
  type: 'symbol',
  filter: FILTRO_OCUPADO,
  layout: {
    'text-field': ['to-string', ['get', 'numero_licenca']],
    'text-size': 16,
    'text-font': ['Noto Sans Bold'],
    'text-allow-overlap': true,
    'text-ignore-placement': true,
  },
  paint: { 'text-color': '#ffffff' },
};

// Quadrado (público) e triângulo (residencial): ícones gerados via canvas
// (ver criarIconeQuadrado/criarIconeTriangulo) porque a camada 'circle' do
// MapLibre só desenha círculos.
const camadaPinoPublico = {
  id: 'lotes-pino-publico',
  type: 'symbol',
  filter: FILTRO_PUBLICO,
  layout: {
    'icon-image': 'cidade-digital-quadrado-publico',
    'icon-size': 1,
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
  },
};
const camadaPinoResidencial = {
  id: 'lotes-pino-residencial',
  type: 'symbol',
  filter: FILTRO_RESIDENCIAL,
  layout: {
    'icon-image': 'cidade-digital-triangulo-residencial',
    'icon-size': 1,
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
  },
};

function criarIconeQuadrado(cor) {
  const tam = 28;
  const canvas = document.createElement('canvas');
  canvas.width = tam;
  canvas.height = tam;
  const ctx = canvas.getContext('2d');
  const m = 3;
  ctx.fillStyle = cor;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.fillRect(m, m, tam - 2 * m, tam - 2 * m);
  ctx.strokeRect(m, m, tam - 2 * m, tam - 2 * m);
  return ctx.getImageData(0, 0, tam, tam);
}

function criarIconeTriangulo(cor) {
  const tam = 28;
  const canvas = document.createElement('canvas');
  canvas.width = tam;
  canvas.height = tam;
  const ctx = canvas.getContext('2d');
  const m = 3;
  ctx.beginPath();
  ctx.moveTo(tam / 2, m);
  ctx.lineTo(tam - m, tam - m);
  ctx.lineTo(m, tam - m);
  ctx.closePath();
  ctx.fillStyle = cor;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  return ctx.getImageData(0, 0, tam, tam);
}

function garantirIconesPersonalizados(mapa) {
  if (!mapa.hasImage('cidade-digital-quadrado-publico')) {
    mapa.addImage('cidade-digital-quadrado-publico', criarIconeQuadrado(COR_PUBLICO));
  }
  if (!mapa.hasImage('cidade-digital-triangulo-residencial')) {
    mapa.addImage('cidade-digital-triangulo-residencial', criarIconeTriangulo(COR_RESIDENCIAL));
  }
}

// Camadas 'circle' só funcionam com geometria de ponto — por isso os pinos do
// modo virtual usam uma versão com centróide de cada lote, não o polígono.
function centroideBbox(geometry) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const varrer = (coords, prof) => {
    if (prof === 0) {
      const [x, y] = coords;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    } else {
      coords.forEach((c) => varrer(c, prof - 1));
    }
  };
  const profundidade = geometry.type === 'MultiPolygon' ? 3 : 2;
  varrer(geometry.coordinates, profundidade);
  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

// Modo virtual: mantém só ruas (+ nome) e esconde prédios, POIs, bairros etc.
// Camadas próprias (lotes-*) nunca são tocadas aqui.
const SOURCE_LAYERS_MANTIDAS_VIRTUAL = new Set(['transportation', 'transportation_name']);

function aplicarVisibilidadeRuas(map, somenteRuas) {
  if (!map || !map.isStyleLoaded()) return;
  for (const l of map.getStyle().layers) {
    if (l.id.startsWith('lotes-') || l.type === 'background') continue;
    const manter = SOURCE_LAYERS_MANTIDAS_VIRTUAL.has(l['source-layer']);
    map.setLayoutProperty(l.id, 'visibility', somenteRuas && !manter ? 'none' : 'visible');
  }
}

function paraPontos(fc) {
  return {
    type: 'FeatureCollection',
    features: (fc.features ?? []).flatMap((f) => {
      if (!f.geometry || !f.geometry.coordinates?.length) return [];
      try {
        return [
          {
            type: 'Feature',
            id: f.id,
            properties: f.properties,
            geometry: { type: 'Point', coordinates: centroideBbox(f.geometry) },
          },
        ];
      } catch {
        return [];
      }
    }),
  };
}

export default function MapaLotes({
  cidade,
  viewInicial,
  loteSelecionado,
  onSelecionarLote,
  modo = 'fisico',
  voarPara,
  categoria,
}) {
  const mapRef = useRef(null);
  const timer = useRef(null);
  const [dados, setDados] = useState(VAZIO);
  const [carregando, setCarregando] = useState(false);

  // Filtro por categoria (vindo do cabeçalho): só mostra lotes cuja vitrine
  // seja dessa categoria — os demais (vagos, residenciais, outras
  // categorias) somem do mapa enquanto o filtro estiver ativo.
  const dadosFiltrados = useMemo(() => {
    if (!categoria) return dados;
    return { type: 'FeatureCollection', features: dados.features.filter((f) => f.properties?.categoria === categoria) };
  }, [dados, categoria]);

  const dadosPinos = useMemo(() => paraPontos(dadosFiltrados), [dadosFiltrados]);

  const recarregar = useCallback(async () => {
    const mapa = mapRef.current?.getMap();
    if (!mapa) return;
    const b = mapa.getBounds();
    setCarregando(true);
    try {
      const fc = await buscarLotesGeoJSON({
        cidade,
        oeste: b.getWest(),
        sul: b.getSouth(),
        leste: b.getEast(),
        norte: b.getNorth(),
      });
      setDados(fc);
    } catch (e) {
      console.error('Falha ao carregar lotes:', e.message);
    } finally {
      setCarregando(false);
    }
  }, [cidade]);

  const aoMover = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(recarregar, 350);
  }, [recarregar]);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    const mapa = mapRef.current?.getMap();
    if (!mapa) return;
    const aplicar = () => aplicarVisibilidadeRuas(mapa, modo === 'virtual');
    aplicar();
    mapa.on('styledata', aplicar);
    return () => mapa.off('styledata', aplicar);
  }, [modo]);

  useEffect(() => {
    if (!voarPara) return;
    const mapa = mapRef.current?.getMap();
    if (!mapa) return;
    mapa.flyTo({ center: [voarPara.longitude, voarPara.latitude], zoom: 18, speed: 1.2 });
  }, [voarPara]);

  const aoCarregar = useCallback(() => {
    const mapa = mapRef.current?.getMap();
    if (mapa) garantirIconesPersonalizados(mapa);
    recarregar();
    aplicarVisibilidadeRuas(mapa, modo === 'virtual');
  }, [recarregar, modo]);

  const aoClicar = useCallback(
    (evt) => {
      const f = evt.features?.[0];
      onSelecionarLote?.(f ? f.properties : null);
    },
    [onSelecionarLote]
  );

  const PINOS_INTERATIVOS = ['lotes-pino-base', 'lotes-pino-publico', 'lotes-pino-residencial'];
  const camadasInterativas =
    modo === 'virtual' ? PINOS_INTERATIVOS : ['lotes-fill', ...PINOS_INTERATIVOS];

  return (
    <Map
      ref={mapRef}
      mapLib={maplibregl}
      mapStyle={STYLE_URL}
      initialViewState={viewInicial}
      interactiveLayerIds={camadasInterativas}
      onLoad={aoCarregar}
      onMoveEnd={aoMover}
      onClick={aoClicar}
      cursor="pointer"
      style={{
        position: 'absolute',
        inset: 0,
        filter:
          modo === 'virtual'
            ? 'grayscale(0.55) brightness(1.08) sepia(0.15) hue-rotate(190deg) saturate(1.3)'
            : undefined,
      }}
    >
      {modo === 'fisico' && (
        <Source key="lotes" id="lotes" type="geojson" data={dadosFiltrados}>
          <Layer {...camadaPreenchimento} />
          <Layer {...camadaContorno} />
          <Layer
            {...camadaSelecionado}
            filter={['==', ['get', 'lote_id'], loteSelecionado ?? '__none__']}
          />
        </Source>
      )}
      <Source key="lotes-pontos" id="lotes-pontos" type="geojson" data={dadosPinos}>
        <Layer {...camadaPinoPublico} />
        <Layer {...camadaPinoResidencial} />
        <Layer {...camadaPinoBase} />
        <Layer {...camadaPinoNumero} />
      </Source>
      {carregando && (
        <div className="absolute left-3 top-3 rounded bg-white/90 px-2 py-1 text-xs shadow">
          Carregando lotes…
        </div>
      )}
    </Map>
  );
}
