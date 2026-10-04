import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { buscarLotesGeoJSON } from '../lib/supabase/queries.js';

const STYLE_URL =
  import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';

const VAZIO = { type: 'FeatureCollection', features: [] };

// Cor do polígono conforme status_vitrine calculado pelo RPC.
const corPorStatus = [
  'match',
  ['get', 'status_vitrine'],
  'oportunidade', '#f59e0b',
  'ocupado', '#2563eb',
  /* residencial / outros */ '#cbd5e1',
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

// Modo virtual: só pinos numerados das licenças ativas, com identidade própria.
const FILTRO_OCUPADO = ['==', ['get', 'status_vitrine'], 'ocupado'];
const camadaPinoBase = {
  id: 'lotes-pino-base',
  type: 'circle',
  filter: FILTRO_OCUPADO,
  paint: {
    'circle-radius': 12,
    'circle-color': '#4f46e5',
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
    'text-size': 11,
    'text-font': ['Noto Sans Bold'],
    'text-allow-overlap': true,
  },
  paint: { 'text-color': '#ffffff' },
};

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
    features: fc.features.map((f) => ({
      type: 'Feature',
      id: f.id,
      properties: f.properties,
      geometry: { type: 'Point', coordinates: centroideBbox(f.geometry) },
    })),
  };
}

export default function MapaLotes({
  cidade,
  viewInicial,
  loteSelecionado,
  onSelecionarLote,
  modo = 'fisico',
  voarPara,
}) {
  const mapRef = useRef(null);
  const timer = useRef(null);
  const [dados, setDados] = useState(VAZIO);
  const [carregando, setCarregando] = useState(false);

  const dadosPinos = useMemo(() => (modo === 'virtual' ? paraPontos(dados) : VAZIO), [dados, modo]);

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
    recarregar();
    aplicarVisibilidadeRuas(mapRef.current?.getMap(), modo === 'virtual');
  }, [recarregar, modo]);

  const aoClicar = useCallback(
    (evt) => {
      const f = evt.features?.[0];
      onSelecionarLote?.(f ? f.properties : null);
    },
    [onSelecionarLote]
  );

  const camadasInterativas =
    modo === 'virtual' ? ['lotes-pino-base'] : ['lotes-fill'];

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
      {modo === 'fisico' ? (
        <Source key="lotes" id="lotes" type="geojson" data={dados}>
          <Layer {...camadaPreenchimento} />
          <Layer {...camadaContorno} />
          <Layer
            {...camadaSelecionado}
            filter={['==', ['get', 'lote_id'], loteSelecionado ?? '__none__']}
          />
        </Source>
      ) : (
        <Source key="lotes-pontos" id="lotes-pontos" type="geojson" data={dadosPinos}>
          <Layer {...camadaPinoBase} />
          <Layer {...camadaPinoNumero} />
        </Source>
      )}
      {carregando && (
        <div className="absolute left-3 top-3 rounded bg-white/90 px-2 py-1 text-xs shadow">
          Carregando lotes…
        </div>
      )}
    </Map>
  );
}
