import { useCallback, useEffect, useState } from 'react';
import { Store, Search, Mail, Crosshair, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../lib/supabase/AuthContext.jsx';
import { minhasLicencas, criarLote, solicitarLicenca } from '../lib/supabase/gestao.js';
import { buscarCep, formatarCep } from '../lib/cep.js';
import { geocodarComFallback } from '../lib/geocode.js';
import EditorEstabelecimento from '../components/EditorEstabelecimento.jsx';
import EditorProdutos from '../components/EditorProdutos.jsx';
import EditorEndereco from '../components/EditorEndereco.jsx';

const ROTULO_STATUS = {
  ativa: { txt: 'Ativa', cls: 'bg-green-100 text-green-700', Icone: CheckCircle2 },
  pendente: { txt: 'Aguardando ativação', cls: 'bg-amber-100 text-amber-700', Icone: Clock },
  expirada: { txt: 'Expirada', cls: 'bg-slate-100 text-slate-500', Icone: XCircle },
};

function Solicitar({ aoSolicitar }) {
  const [cidade, setCidade] = useState('Osvaldo Cruz');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [encontrado, setEncontrado] = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoGeo, setBuscandoGeo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

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
      if (r.cidade) setCidade(r.cidade);
      setNumero('');
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
      const r = await geocodarComFallback({ endereco, numero, bairro, cidade, uf: 'SP' });
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
      setErro('Informe latitude e longitude válidas.');
      return;
    }
    if (!endereco.trim()) {
      setErro('Preencha a rua antes de confirmar pelas coordenadas.');
      return;
    }
    setEncontrado({ lat: latN, lng: lngN, nomeExibicao: `Coordenadas informadas: ${latN}, ${lngN}` });
  }

  async function confirmarSolicitacao() {
    setEnviando(true);
    setErro(null);
    try {
      const loteId = await criarLote(cidade, {
        endereco,
        numero,
        lat: encontrado.lat,
        lng: encontrado.lng,
      });
      await aoSolicitar(loteId);
      setEndereco('');
      setNumero('');
      setBairro('');
      setCep('');
      setEncontrado(null);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="font-medium">Solicitar licença para um endereço</h3>

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
        <select
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          className="rounded border px-2 py-1.5 text-sm"
        >
          <option>Osvaldo Cruz</option>
          <option>Parapuã</option>
        </select>
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

      <form onSubmit={usarCoordenadas} className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Latitude</span>
          <input
            className="w-28 rounded border px-2 py-1.5 text-sm"
            placeholder="-21.7969"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Longitude</span>
          <input
            className="w-28 rounded border px-2 py-1.5 text-sm"
            placeholder="-50.8778"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <button className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm">
          <Crosshair size={14} /> Usar coordenadas
        </button>
      </form>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {encontrado && (
        <div className="flex flex-wrap items-center gap-2 rounded bg-green-50 p-2 text-sm">
          <span className="flex-1 text-green-800">Encontrado: {encontrado.nomeExibicao}</span>
          <button
            onClick={confirmarSolicitacao}
            disabled={enviando}
            className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-white disabled:opacity-50"
          >
            {enviando ? 'Enviando…' : 'Confirmar e solicitar licença'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function PainelComerciante() {
  const { perfil, virarComerciante } = useAuth();
  const [licencas, setLicencas] = useState([]);
  const [sel, setSel] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [mostrarSolicitar, setMostrarSolicitar] = useState(false);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await minhasLicencas();
      setLicencas(dados);
      setSel((s) => dados.find((l) => l.id === s?.id) ?? dados[0] ?? null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  async function pedir(loteId) {
    setErro(null);
    try {
      if (perfil?.funcao === 'visitante') await virarComerciante();
      await solicitarLicenca(loteId);
      await recarregar();
      setMostrarSolicitar(false);
    } catch (e) {
      setErro(e.message);
    }
  }

  if (carregando) return <p className="p-6 text-sm text-slate-500">Carregando…</p>;

  const exibirFormSolicitar = mostrarSolicitar || licencas.length === 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="flex items-center gap-2 text-xl font-semibold">
        <Store size={20} /> Minha vitrine
      </h1>
      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {exibirFormSolicitar ? (
        <Solicitar aoSolicitar={pedir} />
      ) : (
        <button
          onClick={() => setMostrarSolicitar(true)}
          className="rounded-lg border border-dashed px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          + Solicitar licença para outro endereço
        </button>
      )}

      {licencas.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {licencas.map((l) => {
              const st = ROTULO_STATUS[l.status] ?? ROTULO_STATUS.pendente;
              return (
                <button
                  key={l.id}
                  onClick={() => setSel(l)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm ${
                    sel?.id === l.id ? 'border-blue-600 ring-1 ring-blue-600' : ''
                  }`}
                >
                  <span className="block font-medium">
                    {l.numero_licenca != null && (
                      <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 align-middle text-xs font-semibold text-white">
                        {l.numero_licenca}
                      </span>
                    )}
                    {l.estabelecimento?.nome_fantasia ?? l.lote?.endereco ?? 'Lote'}
                  </span>
                  <span
                    className={`mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${st.cls}`}
                  >
                    <st.Icone size={12} /> {st.txt}
                  </span>
                </button>
              );
            })}
          </div>

          {sel && (
            <section className="space-y-6">
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                Lote: {sel.lote?.endereco}
                {sel.lote?.numero ? `, ${sel.lote.numero}` : ''} — {sel.lote?.cidade}
                {sel.status === 'pendente' && (
                  <span className="mt-1 block text-amber-700">
                    Você já pode preencher a vitrine. Ela ficará pública quando o
                    administrador confirmar o pagamento e ativar a licença.
                  </span>
                )}
              </div>

              <EditorEndereco
                loteId={sel.lote.id}
                cidade={sel.lote.cidade}
                enderecoInicial={sel.lote.endereco}
                numeroInicial={sel.lote.numero}
                aoSalvar={recarregar}
              />

              <div>
                <h2 className="mb-3 font-medium">Dados da vitrine</h2>
                <EditorEstabelecimento
                  licencaId={sel.id}
                  inicial={sel.estabelecimento ?? undefined}
                  aoSalvar={recarregar}
                />
              </div>

              {sel.estabelecimento?.id && (
                <div>
                  <h2 className="mb-3 font-medium">Catálogo de produtos</h2>
                  <EditorProdutos estabelecimentoId={sel.estabelecimento.id} />
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
