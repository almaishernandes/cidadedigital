import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Check, Ban, MapPin, Box, Store, Trash2 } from 'lucide-react';
import {
  licencasPorStatus,
  ativarLicenca,
  expirarLicenca,
  excluirEstabelecimento,
} from '../lib/supabase/gestao.js';
import { linkGoogleEarth3D } from '../lib/supabase/queries.js';
import EditorEndereco from '../components/EditorEndereco.jsx';
import EditorEstabelecimento from '../components/EditorEstabelecimento.jsx';
import EditorProdutos from '../components/EditorProdutos.jsx';

const ABAS = ['pendente', 'ativa', 'expirada'];

function formatarData(dataIso) {
  const [ano, mes, dia] = dataIso.split('-');
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${dia}/${meses[Number(mes) - 1]}/${ano}`;
}

export default function AdminLicencas() {
  const [aba, setAba] = useState('pendente');
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(null);
  const [editandoEndereco, setEditandoEndereco] = useState(null);
  const [editandoVitrine, setEditandoVitrine] = useState(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setItens(await licencasPorStatus(aba));
    } catch (e) {
      setErro(e.message);
    }
  }, [aba]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function ativar(l) {
    setOcupado(l.id);
    try {
      await ativarLicenca(l.id, l.lote.id, 12, l.tipo);
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(null);
    }
  }

  async function expirar(l) {
    setOcupado(l.id);
    try {
      await expirarLicenca(l.id, l.lote.id);
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(null);
    }
  }

  async function excluirVitrine(l) {
    if (!window.confirm(`Excluir a vitrine "${l.estabelecimento?.nome_fantasia}"? O catálogo junto também será apagado.`)) {
      return;
    }
    setOcupado(l.id);
    try {
      await excluirEstabelecimento(l.estabelecimento.id);
      setEditandoVitrine(null);
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="flex items-center gap-2 text-xl font-semibold">
        <ShieldCheck size={20} /> Licenças digitais
      </h1>

      <div className="flex gap-1">
        {ABAS.map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`rounded px-3 py-1.5 text-sm capitalize ${
              aba === a ? 'bg-blue-600 text-white' : 'border'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <ul className="divide-y rounded-lg border">
        {itens.length === 0 && (
          <li className="p-4 text-sm text-slate-500">Nada em “{aba}”.</li>
        )}
        {itens.map((l) => (
          <li key={l.id} className="p-4 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1">
                <p className="font-medium">
                  {l.numero_licenca != null && (
                    <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 align-middle text-xs font-semibold text-white">
                      {l.numero_licenca}
                    </span>
                  )}
                  {l.lote?.latitude != null && l.lote?.longitude != null && (
                    <a
                      className="mr-1.5 inline-flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-1 align-middle text-xs font-medium text-white hover:bg-green-700"
                      href={linkGoogleEarth3D(l.lote.latitude, l.lote.longitude)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Box size={14} /> Ver em 3D
                    </a>
                  )}
                  {l.lote?.endereco}
                  {l.lote?.numero ? `, ${l.lote.numero}` : ''}
                  {l.lote?.bairro ? ` — ${l.lote.bairro}` : ''}
                  {l.lote?.complemento ? ` (${l.lote.complemento})` : ''} — {l.lote?.cidade}
                  {l.tipo === 'publica' && (
                    <span className="ml-1.5 inline-block rounded bg-violet-100 px-1.5 py-0.5 align-middle text-xs font-medium text-violet-700">
                      Pública (sem custo)
                    </span>
                  )}
                </p>
                <p className="text-slate-500">
                  {l.perfil?.nome ?? '—'} · {l.perfil?.email} · {l.perfil?.telefone ?? 'sem telefone'}
                </p>
                {l.data_fim ? (
                  <p className="text-slate-400">Vigência até {formatarData(l.data_fim)}</p>
                ) : (
                  l.status === 'ativa' &&
                  l.tipo === 'publica' && <p className="text-slate-400">Sem vencimento</p>
                )}
              </div>
              <button
                onClick={() => setEditandoEndereco((id) => (id === l.id ? null : l.id))}
                className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-slate-700"
              >
                <MapPin size={14} /> {editandoEndereco === l.id ? 'Fechar' : 'Editar endereço'}
              </button>
              <button
                onClick={() => setEditandoVitrine((id) => (id === l.id ? null : l.id))}
                className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-slate-700"
              >
                <Store size={14} /> {editandoVitrine === l.id ? 'Fechar' : 'Editar vitrine'}
              </button>
              {aba === 'pendente' && (
                <button
                  disabled={ocupado === l.id}
                  onClick={() => ativar(l)}
                  className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-white disabled:opacity-50"
                >
                  <Check size={14} /> {l.tipo === 'publica' ? 'Ativar (sem vencimento)' : 'Ativar (12 meses)'}
                </button>
              )}
              {aba === 'ativa' && (
                <button
                  disabled={ocupado === l.id}
                  onClick={() => expirar(l)}
                  className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-red-600 disabled:opacity-50"
                >
                  <Ban size={14} /> Expirar
                </button>
              )}
            </div>

            {editandoEndereco === l.id && (
              <div className="mt-3">
                <EditorEndereco
                  loteId={l.lote.id}
                  enderecoInicial={l.lote.endereco}
                  numeroInicial={l.lote.numero}
                  bairroInicial={l.lote.bairro}
                  complementoInicial={l.lote.complemento}
                  cepInicial={l.lote.cep}
                  latInicial={l.lote.latitude}
                  lngInicial={l.lote.longitude}
                  areaM2Inicial={l.lote.area_m2}
                  aoSalvar={() => {
                    setEditandoEndereco(null);
                    carregar();
                  }}
                />
              </div>
            )}

            {editandoVitrine === l.id && (
              <div className="mt-3 space-y-4 rounded-lg border bg-slate-50 p-3">
                <EditorEstabelecimento
                  licencaId={l.id}
                  inicial={l.estabelecimento ?? undefined}
                  aoSalvar={carregar}
                />
                {l.estabelecimento?.id && (
                  <>
                    <div>
                      <h3 className="mb-2 text-sm font-medium">Catálogo de produtos</h3>
                      <EditorProdutos estabelecimentoId={l.estabelecimento.id} />
                    </div>
                    <button
                      disabled={ocupado === l.id}
                      onClick={() => excluirVitrine(l)}
                      className="inline-flex items-center gap-1 rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={14} /> Excluir vitrine (dados + catálogo)
                    </button>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
