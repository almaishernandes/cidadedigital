import { useState } from 'react';
import { MapPin, Search, Check, Mail, Crosshair, Save, LocateFixed } from 'lucide-react';
import { buscarCep, formatarCep } from '../lib/cep.js';
import { geocodarComFallback } from '../lib/geocode.js';
import { atualizarEnderecoLote, atualizarCepLote } from '../lib/supabase/gestao.js';

export default function EditorEndereco({
  loteId,
  cidade,
  enderecoInicial,
  numeroInicial,
  cepInicial,
  latInicial,
  lngInicial,
  areaM2Inicial,
  aoSalvar,
}) {
  const [cep, setCep] = useState(cepInicial ?? '');
  const [endereco, setEndereco] = useState(enderecoInicial ?? '');
  const [numero, setNumero] = useState(numeroInicial ?? '');
  const [bairro, setBairro] = useState('');
  const [localidadeCep, setLocalidadeCep] = useState(null); // { cidade, uf } vindos do CEP
  const [lat, setLat] = useState(latInicial != null ? String(latInicial) : '');
  const [lng, setLng] = useState(lngInicial != null ? String(lngInicial) : '');

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoGeo, setBuscandoGeo] = useState(false);
  const [localizandoGps, setLocalizandoGps] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvandoCep, setSalvandoCep] = useState(false);
  const [encontrado, setEncontrado] = useState(null);
  const [erro, setErro] = useState(null);

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

  async function salvarCep() {
    setErro(null);
    setSalvandoCep(true);
    try {
      await atualizarCepLote(loteId, cep);
      aoSalvar?.();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvandoCep(false);
    }
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
      setEndereco(r.logradouro || endereco);
      setBairro(r.bairro);
      setLocalidadeCep({ cidade: r.cidade, uf: r.uf });
      setNumero(''); // número do lote anterior não vale pro endereço novo encontrado
    } catch (err) {
      setErro(err.message);
    } finally {
      setBuscandoCep(false);
    }
  }

  async function localizarNoMapa(e) {
    e.preventDefault();
    setErro(null);
    setEncontrado(null);
    setBuscandoGeo(true);
    try {
      const cidadeConsulta = localidadeCep?.cidade || cidade;
      const ufConsulta = localidadeCep?.uf || 'SP';
      const r = await geocodarComFallback({
        endereco,
        numero,
        bairro,
        cidade: cidadeConsulta,
        uf: ufConsulta,
      });
      if (!r) setErro('Endereço não encontrado no mapa. Confira a rua e o número.');
      else setEncontrado(r);
    } catch (err) {
      setErro(err.message);
    } finally {
      setBuscandoGeo(false);
    }
  }

  function usarCoordenadas(e) {
    e.preventDefault();
    setErro(null);
    const latN = Number(String(lat).replace(',', '.'));
    const lngN = Number(String(lng).replace(',', '.'));
    if (!Number.isFinite(latN) || !Number.isFinite(lngN) || latN === 0 || lngN === 0) {
      setErro('Informe latitude e longitude válidas (ex.: -21.7969, -50.8778).');
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
          className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm disabled:opacity-50"
        >
          <Mail size={14} /> {buscandoCep ? 'Buscando…' : 'Buscar CEP'}
        </button>
        <button
          type="button"
          onClick={salvarCep}
          disabled={salvandoCep || cep.replace(/\D/g, '').length !== 8 || cep === (cepInicial ?? '')}
          className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          <Save size={14} /> {salvandoCep ? 'Salvando…' : 'Salvar CEP'}
        </button>
        {bairro && (
          <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
            {bairro}
            {localidadeCep ? ` — ${localidadeCep.cidade}/${localidadeCep.uf}` : ''}
          </span>
        )}
      </form>

      <form onSubmit={usarCoordenadas} className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Latitude</span>
          <input
            className="w-32 rounded border px-2 py-1.5 text-sm"
            placeholder="-21.7969"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Longitude</span>
          <input
            className="w-32 rounded border px-2 py-1.5 text-sm"
            placeholder="-50.8778"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            inputMode="decimal"
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

      <form onSubmit={localizarNoMapa} className="flex flex-wrap gap-2">
        <input
          className="flex-1 rounded border px-2 py-1.5 text-sm"
          placeholder="Rua, avenida..."
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          required
        />
        <input
          className="w-24 rounded border px-2 py-1.5 text-sm"
          placeholder="Nº"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
        />
        <button
          disabled={buscandoGeo}
          className="inline-flex items-center gap-1 rounded bg-slate-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          <Search size={14} /> {buscandoGeo ? 'Localizando…' : 'Localizar no mapa'}
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
