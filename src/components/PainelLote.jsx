import { useEffect, useMemo, useState } from 'react';
import { X, Phone, Instagram, Globe, ExternalLink, MapPin, Box, Search, FileText, Check } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import {
  buscarEstabelecimentoPorLote,
  buscarProdutos,
  linkWhatsApp,
  linkGoogleEarth3D,
} from '../lib/supabase/queries.js';
import { criarCotacao } from '../lib/supabase/gestao.js';
import { useAuth } from '../lib/supabase/AuthContext.jsx';

export default function PainelLote({ lote, aoFechar, inline = false }) {
  const { usuario } = useAuth();
  const [estab, setEstab] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [buscaCatalogo, setBuscaCatalogo] = useState('');
  const [carrinho, setCarrinho] = useState({}); // produtoId -> quantidade
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensagemCotacao, setMensagemCotacao] = useState('');
  const [enviandoCotacao, setEnviandoCotacao] = useState(false);
  const [cotacaoEnviada, setCotacaoEnviada] = useState(false);
  const [erroCotacao, setErroCotacao] = useState(null);

  useEffect(() => {
    if (!lote) return;
    let vivo = true;
    setEstab(null);
    setProdutos([]);
    setBuscaCatalogo('');
    setCarrinho({});
    setMostrarForm(false);
    setCotacaoEnviada(false);
    if (lote.status_vitrine !== 'ocupado' || !usuario) return;
    setCarregando(true);
    (async () => {
      try {
        const e = await buscarEstabelecimentoPorLote(lote.lote_id);
        if (!vivo) return;
        setEstab(e);
        if (e) {
          const { produtos } = await buscarProdutos(e.id, { pagina: 0, tamanho: 200 });
          if (vivo) setProdutos(produtos);
        }
      } finally {
        if (vivo) setCarregando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [lote, usuario]);

  const produtosFiltrados = useMemo(() => {
    const t = buscaCatalogo.trim().toLowerCase();
    if (!t) return produtos;
    return produtos.filter((p) => p.nome?.toLowerCase().includes(t));
  }, [produtos, buscaCatalogo]);

  const itensCarrinho = Object.entries(carrinho).filter(([, qtd]) => qtd > 0);

  function alternarItem(produtoId) {
    setCarrinho((c) => {
      const atual = { ...c };
      if (atual[produtoId] > 0) delete atual[produtoId];
      else atual[produtoId] = 1;
      return atual;
    });
  }

  function mudarQuantidade(produtoId, qtd) {
    setCarrinho((c) => ({ ...c, [produtoId]: Math.max(1, qtd) }));
  }

  async function enviarCotacao() {
    setErroCotacao(null);
    setEnviandoCotacao(true);
    try {
      await criarCotacao(estab.id, {
        mensagem: mensagemCotacao,
        itens: itensCarrinho.map(([produtoId, quantidade]) => ({ produtoId, quantidade })),
      });
      setCotacaoEnviada(true);
      setCarrinho({});
      setMensagemCotacao('');
      setMostrarForm(false);
    } catch (err) {
      setErroCotacao(err.message);
    } finally {
      setEnviandoCotacao(false);
    }
  }

  if (!lote) return null;

  const status =
    lote.status_vitrine === 'ocupado'
      ? 'ocupado'
      : lote.status_vitrine === 'oportunidade'
        ? 'oportunidade'
        : 'residencial';

  const classes = inline
    ? 'flex h-full w-full flex-col overflow-y-auto bg-white'
    : 'absolute inset-x-0 bottom-0 z-20 flex max-h-[75%] flex-col overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:inset-x-auto sm:right-0 sm:top-0 sm:max-h-none sm:h-full sm:w-full sm:max-w-sm sm:rounded-none';

  return (
    <aside className={classes}>
      <header className="flex items-start justify-between gap-3 border-b p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <StatusBadge
              status={status}
              rotulo={
                status === 'oportunidade' && lote.status_ocupacao && lote.status_ocupacao !== 'vago'
                  ? 'Sem vitrine'
                  : undefined
              }
            />
            {(estab?.numero_licenca ?? lote.numero_licenca) != null && (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                {estab?.numero_licenca ?? lote.numero_licenca}
              </span>
            )}
            {lote.latitude != null && lote.longitude != null && (
              <a
                className="inline-flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
                href={linkGoogleEarth3D(lote.latitude, lote.longitude)}
                target="_blank"
                rel="noreferrer"
              >
                <Box size={14} /> Ver em 3D
              </a>
            )}
          </div>
          <h2 className="text-lg font-semibold leading-tight">
            {status === 'ocupado' && !usuario
              ? 'Vitrine licenciada'
              : (estab?.nome_fantasia ?? 'Espaço disponível')}
          </h2>
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin size={14} />
            {lote.cep ? `CEP ${lote.cep} — ` : ''}
            {lote.endereco}
            {lote.numero ? `, ${lote.numero}` : ''}
          </p>
          {(lote.bairro || lote.complemento) && (
            <p className="pl-[20px] text-sm text-slate-500">
              {lote.bairro}
              {lote.bairro && lote.complemento ? ' — ' : ''}
              {lote.complemento}
            </p>
          )}
        </div>
        <button onClick={aoFechar} className="rounded p-1 hover:bg-slate-100" aria-label="Fechar">
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 space-y-4 p-4">
        {carregando && <p className="text-sm text-slate-500">Carregando vitrine…</p>}

        {status === 'ocupado' && !usuario && (
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            Entre ou cadastre-se pra ver os dados dessa vitrine (nome, contato, catálogo).{' '}
            <a className="font-medium underline" href="/entrar">
              Entrar
            </a>
          </div>
        )}

        {!carregando && status === 'oportunidade' && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            {lote.status_ocupacao === 'vago'
              ? 'Este lote está livre.'
              : 'Este espaço ainda não tem vitrine digital.'}{' '}
            Quer transformá-lo em uma vitrine digital?{' '}
            <a className="font-medium underline" href="/painel">
              Ativar licença
            </a>
          </div>
        )}

        {estab && (
          <>
            {estab.descricao && <p className="text-sm text-slate-700">{estab.descricao}</p>}

            <div className="flex flex-wrap gap-2">
              {estab.telefone_whatsapp && (
                <a
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white"
                  href={linkWhatsApp(estab.telefone_whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Phone size={15} /> WhatsApp
                </a>
              )}
              {estab.instagram_url && (
                <a
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm"
                  href={estab.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Instagram size={15} /> Instagram
                </a>
              )}
              {estab.website_url && (
                <a
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white"
                  href={estab.website_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe size={15} /> Site
                </a>
              )}
              {estab.ecommerce_url && (
                <a
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm"
                  href={estab.ecommerce_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={15} /> Loja online
                </a>
              )}
            </div>

            {produtos.length > 0 && (
              <section>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded border py-1.5 pl-7 pr-2 text-sm"
                    placeholder="Buscar Produtos e Serviços..."
                    value={buscaCatalogo}
                    onChange={(e) => setBuscaCatalogo(e.target.value)}
                  />
                </div>
                <ul className="divide-y rounded-lg border">
                  {produtosFiltrados.length === 0 && (
                    <li className="p-2 text-sm text-slate-500">Nenhum item encontrado.</li>
                  )}
                  {produtosFiltrados.map((p) => (
                    <li key={p.id} className="flex items-center gap-2 px-2 py-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={carrinho[p.id] > 0}
                        onChange={() => alternarItem(p.id)}
                        className="h-4 w-4 shrink-0"
                        aria-label={`Selecionar ${p.nome} para cotação`}
                      />
                      <span
                        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold ${
                          p.tipo === 'servico'
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                        title={p.tipo === 'servico' ? 'Serviço' : 'Produto'}
                      >
                        {p.tipo === 'servico' ? 'S' : 'P'}
                      </span>
                      {p.imagem_url && (
                        <a href={p.imagem_url} target="_blank" rel="noreferrer" className="shrink-0">
                          <img
                            src={p.imagem_url}
                            alt={p.nome}
                            className="h-7 w-7 rounded object-cover"
                          />
                        </a>
                      )}
                      <span className="flex-1 truncate">{p.nome}</span>
                      {carrinho[p.id] > 0 && (
                        <input
                          type="number"
                          min={1}
                          value={carrinho[p.id]}
                          onChange={(e) => mudarQuantidade(p.id, Number(e.target.value))}
                          className="w-14 shrink-0 rounded border px-1.5 py-0.5 text-sm"
                          aria-label={`Quantidade de ${p.nome}`}
                        />
                      )}
                      {p.preco != null ? (
                        <span className="shrink-0 text-slate-600">
                          {Number(p.preco).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      ) : estab.website_url ? (
                        <a
                          href={estab.website_url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 font-medium text-blue-600 hover:underline"
                        >
                          Consultar Preço
                        </a>
                      ) : (
                        <span className="shrink-0 text-slate-400">Consultar</span>
                      )}
                    </li>
                  ))}
                </ul>

                {!mostrarForm && !cotacaoEnviada && (
                  <button
                    onClick={() => (usuario ? setMostrarForm(true) : (window.location.href = '/entrar'))}
                    disabled={itensCarrinho.length === 0}
                    className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <FileText size={15} /> Fazer Cotação
                    {itensCarrinho.length > 0 &&
                      ` (${itensCarrinho.length} item${itensCarrinho.length > 1 ? 'ns' : ''})`}
                  </button>
                )}
                {itensCarrinho.length > 0 && !usuario && (
                  <p className="mt-1 text-xs text-slate-500">
                    <a href="/entrar" className="font-medium text-blue-600 hover:underline">
                      Entre ou cadastre-se
                    </a>{' '}
                    pra enviar o pedido.
                  </p>
                )}

                {mostrarForm && (
                  <div className="mt-2 space-y-2 rounded-lg border bg-slate-50 p-3">
                    <label className="block text-sm">
                      <span className="mb-1 block text-slate-600">
                        Observações (entrega, prazo, forma de pagamento...)
                      </span>
                      <textarea
                        className="w-full rounded border px-2 py-1.5 text-sm"
                        rows={3}
                        value={mensagemCotacao}
                        onChange={(e) => setMensagemCotacao(e.target.value)}
                        placeholder="Ex.: preciso até sexta, prefiro retirar no local..."
                      />
                    </label>
                    {erroCotacao && <p className="text-sm text-red-600">{erroCotacao}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={enviarCotacao}
                        disabled={enviandoCotacao}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                      >
                        <Check size={15} /> {enviandoCotacao ? 'Enviando…' : 'Enviar pedido de cotação'}
                      </button>
                      <button
                        onClick={() => setMostrarForm(false)}
                        className="rounded-lg border px-3 py-2 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {cotacaoEnviada && (
                  <p className="mt-2 rounded-lg bg-green-50 p-2 text-sm text-green-800">
                    Pedido de cotação enviado! A vitrine vai responder com as condições.
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
