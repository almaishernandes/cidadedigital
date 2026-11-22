import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { salvarEstabelecimento } from '../lib/supabase/gestao.js';
import { buscarTaxonomiaCategorias } from '../lib/supabase/queries.js';

const CAMPOS = [
  ['nome_fantasia', 'Nome fantasia', 'text', true],
  ['telefone_whatsapp', 'WhatsApp (só números, com DDD)', 'text'],
  ['instagram_url', 'Instagram (URL)', 'url'],
  ['website_url', 'Site (URL)', 'url'],
  ['ecommerce_url', 'Loja online / e-commerce (URL)', 'url'],
  ['logo_url', 'Logo (URL da imagem)', 'url'],
];

// Setor da taxonomia é determinado pelo tipo da licença — comercial é
// sempre Privado, pública é sempre Público.
const SETOR_DO_TIPO = { comercial: 'Privado', publica: 'Público' };

export default function EditorEstabelecimento({ licencaId, tipo, inicial, aoSalvar }) {
  const setor = SETOR_DO_TIPO[tipo] ?? 'Privado';
  const [taxonomia, setTaxonomia] = useState([]);

  useEffect(() => {
    let vivo = true;
    buscarTaxonomiaCategorias()
      .then((r) => vivo && setTaxonomia(r))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  const categoriasDoSetor = useMemo(
    () => [...new Set(taxonomia.filter((t) => t.setor === setor).map((t) => t.categoria))],
    [taxonomia, setor]
  );

  const [form, setForm] = useState(() => ({
    nome_fantasia: '',
    categoria: '',
    subcategoria: '',
    descricao: '',
    telefone_whatsapp: '',
    instagram_url: '',
    website_url: '',
    ecommerce_url: '',
    logo_url: '',
    ...inicial,
  }));

  const subcategoriasDaCategoria = useMemo(
    () =>
      taxonomia
        .filter((t) => t.setor === setor && t.categoria === form.categoria)
        .map((t) => t.subcategoria),
    [taxonomia, setor, form.categoria]
  );

  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    setErro(null);
    setOcupado(true);
    try {
      const limpo = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
      );
      const salvo = await salvarEstabelecimento(licencaId, limpo);
      aoSalvar?.(salvo);
    } catch (err) {
      setErro(err.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={enviar} className="grid gap-3 sm:grid-cols-2">
      {CAMPOS.map(([k, rotulo, tipo, req]) => (
        <label key={k} className="text-sm">
          <span className="mb-1 block text-slate-600">{rotulo}</span>
          <input
            type={tipo}
            required={req}
            value={form[k] ?? ''}
            onChange={set(k)}
            className="w-full rounded border px-3 py-2"
          />
        </label>
      ))}
      <label className="text-sm">
        <span className="mb-1 block text-slate-600">Categoria ({setor})</span>
        <select
          required
          value={form.categoria ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value, subcategoria: '' }))}
          className="w-full rounded border bg-white px-3 py-2"
        >
          <option value="" disabled>
            Selecione...
          </option>
          {categoriasDoSetor.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-slate-600">Subcategoria</span>
        <select
          required
          disabled={!form.categoria}
          value={form.subcategoria ?? ''}
          onChange={set('subcategoria')}
          className="w-full rounded border bg-white px-3 py-2 disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="" disabled>
            {form.categoria ? 'Selecione...' : 'Escolha a categoria primeiro'}
          </option>
          {subcategoriasDaCategoria.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm sm:col-span-2">
        <span className="mb-1 block text-slate-600">Descrição</span>
        <textarea
          value={form.descricao ?? ''}
          onChange={set('descricao')}
          rows={3}
          className="w-full rounded border px-3 py-2"
        />
      </label>
      {erro && <p className="text-sm text-red-600 sm:col-span-2">{erro}</p>}
      <div className="sm:col-span-2">
        <button
          disabled={ocupado}
          className="inline-flex items-center gap-1.5 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          <Save size={15} /> Salvar vitrine
        </button>
      </div>
    </form>
  );
}
