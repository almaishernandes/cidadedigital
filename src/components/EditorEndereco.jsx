import { useState } from 'react';
import { MapPin, Check, Mail, Crosshair, LocateFixed, Save } from 'lucide-react';
import { buscarCep, formatarCep } from '../lib/cep.js';
import {
  atualizarEnderecoLote,
  atualizarCepLote,
  atualizarEnderecoTextoLote,
} from '../lib/supabase/gestao.js';

// Aceita decimal ("-21.7969") ou graus/minutos/segundos ("21°47'31.9\"S"),
// que é o formato que o Google Maps copia pro clipboard.
function parseCoordenada(txt) {
  const s = String(txt).trim();
  const dms = s.match(/(\d+(?:[.,]\d+)?)\s*°\s*(\d+(?:[.,]\d+)?)?\s*'?\s*(\d+(?:[.,]\d+)?)?\s*"?\s*([NSEWnsew])?/);
  if (dms && s.includes('°')) {
    const graus = Number(dms[1].replace(',', '.'));
    const min = Number((dms[2] ?? '0').replace(',', '.'));
    const seg = Number((dms[3] ?? '0').replace(',', '.'));
    const direcao = (dms[4] ?? '').toUpperCase();
    let valor = graus + min / 60 + seg / 3600;
    if (direcao === 'S' || direcao === 'W') valor = -valor;
    return valor;
  }
  return Number(s.replace(',', '.'));
}

// Quando cola "21°47'31.9"S 50°5'46.9"W" (copiado do Google Maps) num só campo,
// separa automaticamente em latitude e longitude.
function separarParCoordenadas(txt) {
  const partes = String(txt).match(/\d+°[^°]*?[NSEWnsew]/g);
  if (partes && partes.length >= 2) {
    return { lat: partes[0].trim(), lng: partes[1].trim() };
  }
  const porVirgula = String(txt).split(',');
  if (porVirgula.length === 2 && !txt.includes('°')) {
    return { lat: porVirgula[0].trim(), lng: porVirgula[1].trim() };
  }
  return null;
}

export default function EditorEndereco({
  loteId,
  enderecoInicial,
  numeroInicial,
  bairroInicial,
  complementoInicial,
  cepInicial,
  latInicial,
  lngInicial,
  areaM2Inicial,
  aoSalvar,
}) {
  const [cep, setCep] = useState(cepInicial ?? '');
  const [endereco, setEndereco] = useState(enderecoInicial ?? '');
  const [numero, setNumero] = useState(numeroInicial ?? '');
  const [bairro, setBairro] = useState(bairroInicial ?? '');
  const [complemento, setComplemento] = useState(complementoInicial ?? '');
  const [localidadeCep, setLocalidadeCep] = useState(null); // { cidade, uf } vindos do CEP
  const [lat, setLat] = useState(latInicial != null ? String(latInicial) : '');
  const [lng, setLng] = useState(lngInicial != null ? String(lngInicial) : '');

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [localizandoGps, setLocalizandoGps] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvandoTexto, setSalvandoTexto] = useState(false);
  const [encontrado, setEncontrado] = useState(null);
  const [erro, setErro] = useState(null);

  async function gravarDadosInformados() {
    setErro(null);
    setSalvandoTexto(true);
    try {
      await atualizarEnderecoTextoLote(loteId, { endereco, numero, bairro, complemento, cep });
      aoSalvar?.();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvandoTexto(false);
    }
  }

  function usarLocalizacaoAtual() {
    setErro(null);
    if (!navigator.geolocation) {
      setErro('Seu navegador não suporta geolocalização.');
      return;
    }
    if (!endereco.trim()) {
      setErro('Preencha a rua antes de usar a localização atual.');
      return;
    }
    setLocalizandoGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latN = pos.coords.latitude;
        const lngN = pos.coords.longitude;
        setLat(String(latN));
        setLng(String(lngN));
        setEncontrado({
          lat: latN,
          lng: lngN,
          nomeExibicao: `Localização atual do dispositivo (±${Math.round(pos.coords.accuracy)} m)`,
        });
        setLocalizandoGps(false);
      },
      (err) => {
        setErro(`Não foi possível obter sua localização: ${err.message}`);
        setLocalizandoGps(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function buscarPorCep(e) {
    e.preventDefault();
    setErro(null);
    setEncontrado(null);
    setBuscandoCep(true);
    try {
      const r = await buscarCep(cep);
      if (!r) {
        setErro('CEP não encontrado na base dos Correios.');
        return;
      }
      const enderecoNovo = r.logradouro || endereco;
      setEndereco(enderecoNovo);
      setBairro(r.bairro);
      setLocalidadeCep({ cidade: r.cidade, uf: r.uf });
      setNumero(''); // número do lote anterior não vale pro endereço novo encontrado
      await atualizarCepLote(loteId, r.cep, { endereco: enderecoNovo, bairro: r.bairro });
      aoSalvar?.();
    } catch (err) {
      setErro(err.message);
    } finally {
      setBuscandoCep(false);
    }
  }

  function usarCoordenadas(e) {
    e.preventDefault();
    setErro(null);
    const latN = parseCoordenada(lat);
    const lngN = parseCoordenada(lng);
    if (!Number.isFinite(latN) || !Number.isFinite(lngN) || latN === 0 || lngN === 0) {
      setErro(
        'Informe latitude e longitude válidas: decimal (ex.: -21.7969, -50.8778) ou no formato do Google Maps (ex.: 21°47\'31.9"S).'
      );
      return;
    }
    if (!endereco.trim()) {
      setErro('Preencha a rua antes de confirmar pelas coordenadas.');
      return;
    }
    setEncontrado({ lat: latN, lng: lngN, nomeExibicao: `Coordenadas informadas: ${latN}, ${lngN}` });
  }

  async function confirmar() {
    setSalvando(true);
    setErro(null);
    try {
      await atualizarEnderecoLote(loteId, {
        endereco,
        numero,
        cep,
        lat: encontrado.lat,
        lng: encontrado.lng,
        areaM2: areaM2Inicial ?? undefined,
      });
      setEncontrado(null);
      aoSalvar?.();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <h3 className="flex items-center gap-1.5 text-sm font-medium">
        <MapPin size={15} /> Endereço do lote
      </h3>

      <form onSubmit={buscarPorCep} className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">CEP (opcional, preenche automático)</span>
          <input
            className="w-32 rounded border px-2 py-1.5 text-sm"
            placeholder="00000-000"
            value={formatarCep(cep)}
            onChange={(e) => setCep(e.target.value)}
            maxLength={9}
          />
        </label>
        <button
          disabled={buscandoCep || cep.replace(/\D/g, '').length !== 8}
          className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          <Mail size={14} /> {buscandoCep ? 'Buscando…' : 'Buscar CEP'}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <input
          className="flex-1 rounded border px-2 py-1.5 text-sm"
          placeholder="Rua, avenida..."
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
        />
        <input
          className="w-24 rounded border px-2 py-1.5 text-sm"
          placeholder="Nº"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="w-40 rounded border px-2 py-1.5 text-sm"
          placeholder="Bairro"
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
        />
        <input
          className="flex-1 rounded border px-2 py-1.5 text-sm"
          placeholder="Complemento (sala, bloco, referência...)"
          value={complemento}
          onChange={(e) => setComplemento(e.target.value)}
        />
        {localidadeCep && (
          <span className="inline-flex items-center rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
            {localidadeCep.cidade}/{localidadeCep.uf}
          </span>
        )}
        <button
          type="button"
          onClick={gravarDadosInformados}
          disabled={salvandoTexto || !endereco.trim()}
          className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          <Save size={14} /> {salvandoTexto ? 'Gravando…' : 'Gravar dados informados'}
        </button>
      </div>

      <form onSubmit={usarCoordenadas} className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Latitude</span>
          <input
            className="w-40 rounded border px-2 py-1.5 text-sm"
            placeholder="-21.7969"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            onPaste={(e) => {
              const colado = e.clipboardData.getData('text');
              const par = separarParCoordenadas(colado);
              if (par) {
                e.preventDefault();
                setLat(par.lat);
                setLng(par.lng);
              }
            }}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Longitude</span>
          <input
            className="w-40 rounded border px-2 py-1.5 text-sm"
            placeholder="-50.8778"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            onPaste={(e) => {
              const colado = e.clipboardData.getData('text');
              const par = separarParCoordenadas(colado);
              if (par) {
                e.preventDefault();
                setLat(par.lat);
                setLng(par.lng);
              }
            }}
          />
        </label>
        <button className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm">
          <Crosshair size={14} /> Usar coordenadas
        </button>
        <button
          type="button"
          onClick={usarLocalizacaoAtual}
          disabled={localizandoGps}
          className="inline-flex items-center gap-1 rounded bg-slate-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          <LocateFixed size={14} /> {localizandoGps ? 'Localizando…' : 'Usar minha localização atual'}
        </button>
      </form>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {encontrado && (
        <div className="flex flex-wrap items-center gap-2 rounded bg-green-50 p-2 text-sm">
          <span className="flex-1 text-green-800">Encontrado: {encontrado.nomeExibicao}</span>
          <button
            onClick={confirmar}
            disabled={salvando}
            className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-white disabled:opacity-50"
          >
            <Check size={14} /> {salvando ? 'Salvando…' : 'Confirmar posição'}
          </button>
        </div>
      )}
    </div>
  );
}
