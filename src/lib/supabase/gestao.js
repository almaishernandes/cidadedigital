import { supabase } from './client.js';

// ---------- Comerciante ----------

/** Licenças do usuário logado, com lote e estabelecimento aninhados. */
export async function minhasLicencas() {
  const { data, error } = await supabase
    .from('licencas')
    .select(
      `id, status, tipo, numero_licenca, data_inicio, data_fim, observacao,
       lote:lotes ( id, cidade, endereco, numero, area_m2, status_ocupacao ),
       estabelecimento:estabelecimentos (
         id, nome_fantasia, categoria, descricao, telefone_whatsapp,
         instagram_url, website_url, ecommerce_url, logo_url, horarios
       )`
    )
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Busca lotes por texto de endereço para solicitar licença (não residenciais). */
export async function buscarLotesParaLicenca(cidade, termo) {
  let q = supabase
    .from('lotes')
    .select('id, cidade, endereco, numero, area_m2, status_ocupacao')
    .eq('cidade', cidade)
    .neq('status_ocupacao', 'residencial')
    .order('endereco')
    .limit(20);
  if (termo) q = q.ilike('endereco', `%${termo}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function atualizarEnderecoLote(loteId, { endereco, numero, cep, lat, lng, areaM2 }) {
  const { error } = await supabase.rpc('atualizar_endereco_lote', {
    p_lote_id: loteId,
    p_endereco: endereco,
    p_numero: numero || null,
    p_lat: lat,
    p_lng: lng,
    p_area_m2: areaM2 ?? null,
    p_cep: cep || null,
  });
  if (error) throw error;
}

export async function criarLote(cidade, { endereco, numero, cep, lat, lng }) {
  const { data, error } = await supabase.rpc('criar_lote', {
    p_cidade: cidade,
    p_endereco: endereco,
    p_numero: numero || null,
    p_lat: lat,
    p_lng: lng,
    p_cep: cep || null,
  });
  if (error) throw error;
  return data; // uuid do novo lote
}

export async function solicitarLicenca(loteId, tipo = 'comercial') {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('licencas')
    .insert({ lote_id: loteId, perfil_id: u.user.id, status: 'pendente', tipo })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function salvarEstabelecimento(licencaId, campos) {
  const { data, error } = await supabase
    .from('estabelecimentos')
    .upsert({ licenca_id: licencaId, ...campos }, { onConflict: 'licenca_id' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function listarProdutos(estabelecimentoId) {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('nome');
  if (error) throw error;
  return data ?? [];
}

export async function salvarProduto(produto) {
  const { data, error } = await supabase
    .from('produtos')
    .upsert(produto)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function removerProduto(id) {
  const { error } = await supabase.from('produtos').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Admin ----------

export async function licencasPorStatus(status = 'pendente') {
  const { data, error } = await supabase
    .from('licencas')
    .select(
      `id, status, tipo, numero_licenca, data_inicio, data_fim, observacao, criado_em,
       lote:lotes ( id, cidade, endereco, numero ),
       perfil:perfis ( id, nome, email, telefone )`
    )
    .eq('status', status)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function definirLicenca(id, campos) {
  const { error } = await supabase.from('licencas').update(campos).eq('id', id);
  if (error) throw error;
}

/**
 * Ativa a licença. Comercial: define vigência (meses) e marca o lote como
 * comercial. Pública (sem custo, só identifica o espaço): sem vencimento,
 * marca o lote como público.
 */
export async function ativarLicenca(id, loteId, meses = 12, tipo = 'comercial') {
  const inicio = new Date();
  const publica = tipo === 'publica';
  await definirLicenca(id, {
    status: 'ativa',
    data_inicio: inicio.toISOString().slice(0, 10),
    data_fim: publica ? null : (() => {
      const fim = new Date();
      fim.setMonth(fim.getMonth() + meses);
      return fim.toISOString().slice(0, 10);
    })(),
  });
  const { error } = await supabase
    .from('lotes')
    .update({ status_ocupacao: publica ? 'publico' : 'comercial' })
    .eq('id', loteId);
  if (error) throw error;
}
