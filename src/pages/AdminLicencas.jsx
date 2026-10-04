import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Check, Ban, MapPin } from 'lucide-react';
import { licencasPorStatus, ativarLicenca, definirLicenca } from '../lib/supabase/gestao.js';
import EditorEndereco from '../components/EditorEndereco.jsx';

const ABAS = ['pendente', 'ativa', 'expirada'];

export default function AdminLicencas() {
  const [aba, setAba] = useState('pendente');
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(null);
  const [editandoEndereco, setEditandoEndereco] = useState(null);

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
      await ativarLicenca(l.id, l.lote.id);
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
      await definirLicenca(l.id, { status: 'expirada' });
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
                  {l.lote?.endereco}
                  {l.lote?.numero ? `, ${l.lote.numero}` : ''} — {l.lote?.cidade}
                </p>
                <p className="text-slate-500">
                  {l.perfil?.nome ?? '—'} · {l.perfil?.email} · {l.perfil?.telefone ?? 'sem telefone'}
                </p>
                {l.data_fim && (
                  <p className="text-slate-400">Vigência até {l.data_fim}</p>
                )}
              </div>
              <button
                onClick={() => setEditandoEndereco((id) => (id === l.id ? null : l.id))}
                className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-slate-700"
              >
                <MapPin size={14} /> {editandoEndereco === l.id ? 'Fechar' : 'Editar endereço'}
              </button>
              {aba === 'pendente' && (
                <button
                  disabled={ocupado === l.id}
                  onClick={() => ativar(l)}
                  className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-white disabled:opacity-50"
                >
                  <Check size={14} /> Ativar (12 meses)
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
                  cidade={l.lote.cidade}
                  enderecoInicial={l.lote.endereco}
                  numeroInicial={l.lote.numero}
                  aoSalvar={() => {
                    setEditandoEndereco(null);
                    carregar();
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
