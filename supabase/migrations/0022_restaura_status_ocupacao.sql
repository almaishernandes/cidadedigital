-- =============================================================
-- Cidade Digital — corrige erro da migration anterior (0021): ela
-- resetou status_ocupacao (estado FÍSICO real do lote, vindo do
-- cadastro) para 'vago' em qualquer lote sem licença digital ativa.
-- Isso está errado: um lote pode ser fisicamente comercial/público
-- mesmo sem vitrine digital cadastrada agora. Restaura o status
-- físico a partir do histórico de licenças (a mais recente expirada
-- diz se o lugar era comercial ou público).
-- =============================================================

update lotes lo
set status_ocupacao = (
  select case when l.tipo = 'publica' then 'publico' else 'comercial' end::status_ocupacao
  from licencas l
  where l.lote_id = lo.id and l.status = 'expirada'
  order by l.atualizado_em desc
  limit 1
)
where lo.status_ocupacao = 'vago'
  and exists (select 1 from licencas l where l.lote_id = lo.id and l.status = 'expirada');
