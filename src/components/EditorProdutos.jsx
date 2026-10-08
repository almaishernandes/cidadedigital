import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, Pencil, Save, X } from 'lucide-react';
import { listarProdutos, salvarProduto, removerProduto } from '../lib/supabase/gestao.js';

const NOVO = { nome: '', descricao: '', preco: '', imagem_url: '', tipo: 'produto', ativo: true };

function paraRascunho(p) {
  return {
    nome: p.nome ?? '',
    descricao: p.descricao ?? '',
    preco: p.preco ?? '',
    imagem_url: p.imagem_url ?? '',
    tipo: p.tipo ?? 'produto',
  };
}

export default function EditorProdutos({ estabelecimentoId }) {
  const [itens, setItens] = useState([]);
  const [rascunho, setRascunho] = useState(NOVO);
  const [editandoId, setEditandoId] = useState(null);
  const [rascunhoEdicao, setRascunhoEdicao] = useState(NOVO);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    listarProdutos(estabelecimentoId).then(setItens).catch((e) => setErro(e.message));
  }, [estabelecimentoId]);

  async function adicionar(e) {
    e.preventDefault();
    setErro(null);
    try {
      const salvo = await salvarProduto({
        estabelecimento_id: estabelecimentoId,
        nome: rascunho.nome,
        descricao: rascunho.descricao || null,
        preco: rascunho.preco === '' ? null : Number(rascunho.preco),
        imagem_url: rascunho.imagem_url || null,
        tipo: rascunho.tipo,
        ativo: true,
      });
      setItens((l) => [...l, salvo].sort((a, b) => a.nome.localeCompare(b.nome)));
      setRascunho(NOVO);
    } catch (err) {
      setErro(err.message);
    }
  }

  async function alternarAtivo(p) {
    const salvo = await salvarProduto({ id: p.id, estabelecimento_id: estabelecimentoId, ativo: !p.ativo });
    setItens((l) => l.map((x) => (x.id === p.id ? { ...x, ativo: salvo.ativo } : x)));
  }

  async function excluir(id) {
    await removerProduto(id);
    setItens((l) => l.filter((x) => x.id !== id));
  }

  function iniciarEdicao(p) {
    setEditandoId(p.id);
    setRascunhoEdicao(paraRascunho(p));
    setErro(null);
  }

  async function salvarEdicao(id) {
    setErro(null);
    setSalvandoEdicao(true);
    try {
      const salvo = await salvarProduto({
        id,
        estabelecimento_id: estabelecimentoId,
        nome: rascunhoEdicao.nome,
        descricao: rascunhoEdicao.descricao || null,
        preco: rascunhoEdicao.preco === '' ? null : Number(rascunhoEdicao.preco),
        imagem_url: rascunhoEdicao.imagem_url || null,
        tipo: rascunhoEdicao.tipo,
      });
      setItens((l) => l.map((x) => (x.id === id ? salvo : x)).sort((a, b) => a.nome.localeCompare(b.nome)));
      setEditandoId(null);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvandoEdicao(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={adicionar} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-4">
        <input
          className="rounded border px-2 py-1.5 text-sm"
          placeholder="Nome *"
          value={rascunho.nome}
          onChange={(e) => setRascunho((r) => ({ ...r, nome: e.target.value }))}
          required
        />
        <input
          className="rounded border px-2 py-1.5 text-sm"
          placeholder="Preço"
          type="number"
          step="0.01"
          value={rascunho.preco}
          onChange={(e) => setRascunho((r) => ({ ...r, preco: e.target.value }))}
        />
        <select
          className="rounded border px-2 py-1.5 text-sm"
          value={rascunho.tipo}
          onChange={(e) => setRascunho((r) => ({ ...r, tipo: e.target.value }))}
        >
          <option value="produto">Produto (P)</option>
          <option value="servico">Serviço (S)</option>
        </select>
        <input
          className="rounded border px-2 py-1.5 text-sm sm:col-span-2"
          placeholder="URL da imagem"
          value={rascunho.imagem_url}
          onChange={(e) => setRascunho((r) => ({ ...r, imagem_url: e.target.value }))}
        />
        <input
          className="rounded border px-2 py-1.5 text-sm sm:col-span-3"
          placeholder="Descrição"
          value={rascunho.descricao}
          onChange={(e) => setRascunho((r) => ({ ...r, descricao: e.target.value }))}
        />
        <button className="inline-flex items-center justify-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white">
          <Plus size={14} /> Adicionar
        </button>
      </form>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <ul className="divide-y rounded-lg border">
        {itens.length === 0 && (
          <li className="p-3 text-sm text-slate-500">Nenhum produto ainda.</li>
        )}
        {itens.map((p) =>
          editandoId === p.id ? (
            <li key={p.id} className="grid gap-2 p-3 sm:grid-cols-4">
              <input
                className="rounded border px-2 py-1.5 text-sm"
                placeholder="Nome *"
                value={rascunhoEdicao.nome}
                onChange={(e) => setRascunhoEdicao((r) => ({ ...r, nome: e.target.value }))}
                required
              />
              <input
                className="rounded border px-2 py-1.5 text-sm"
                placeholder="Preço"
                type="number"
                step="0.01"
                value={rascunhoEdicao.preco}
                onChange={(e) => setRascunhoEdicao((r) => ({ ...r, preco: e.target.value }))}
              />
              <select
                className="rounded border px-2 py-1.5 text-sm"
                value={rascunhoEdicao.tipo}
                onChange={(e) => setRascunhoEdicao((r) => ({ ...r, tipo: e.target.value }))}
              >
                <option value="produto">Produto (P)</option>
                <option value="servico">Serviço (S)</option>
              </select>
              <input
                className="rounded border px-2 py-1.5 text-sm"
                placeholder="URL da imagem"
                value={rascunhoEdicao.imagem_url}
                onChange={(e) => setRascunhoEdicao((r) => ({ ...r, imagem_url: e.target.value }))}
              />
              <input
                className="rounded border px-2 py-1.5 text-sm sm:col-span-3"
                placeholder="Descrição"
                value={rascunhoEdicao.descricao}
                onChange={(e) => setRascunhoEdicao((r) => ({ ...r, descricao: e.target.value }))}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => salvarEdicao(p.id)}
                  disabled={salvandoEdicao || !rascunhoEdicao.nome.trim()}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  <Save size={14} /> {salvandoEdicao ? 'Salvando…' : 'Salvar'}
                </button>
                <button
                  onClick={() => setEditandoId(null)}
                  className="inline-flex items-center justify-center gap-1 rounded border px-3 py-1.5 text-sm"
                >
                  <X size={14} />
                </button>
              </div>
            </li>
          ) : (
            <li key={p.id} className="flex items-center gap-3 p-3 text-sm">
              {p.imagem_url && (
                <img src={p.imagem_url} alt="" className="h-10 w-10 rounded object-cover" />
              )}
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold ${
                  p.tipo === 'servico' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
                }`}
                title={p.tipo === 'servico' ? 'Serviço' : 'Produto'}
              >
                {p.tipo === 'servico' ? 'S' : 'P'}
              </span>
              <div className="flex-1">
                <p className="font-medium">{p.nome}</p>
                {p.preco != null && (
                  <p className="text-slate-500">
                    {Number(p.preco).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                )}
              </div>
              <button
                onClick={() => iniciarEdicao(p)}
                className="rounded p-1 text-slate-600 hover:bg-slate-100"
                aria-label="Editar"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => alternarAtivo(p)}
                className={`rounded px-2 py-1 text-xs ${
                  p.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {p.ativo ? (
                  <span className="inline-flex items-center gap-1">
                    <Check size={12} /> Ativo
                  </span>
                ) : (
                  'Inativo'
                )}
              </button>
              <button
                onClick={() => excluir(p.id)}
                className="rounded p-1 text-red-600 hover:bg-red-50"
                aria-label="Excluir"
              >
                <Trash2 size={15} />
              </button>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
