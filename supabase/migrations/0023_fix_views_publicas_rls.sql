-- =============================================================
-- Cidade Digital — corrige bug de longa data: as views públicas
-- (estabelecimentos_publicos / produtos_publicos) foram criadas com
-- security_invoker = true, o que faz o JOIN interno com `licencas`
-- rodar com as permissões de QUEM CONSULTA. Um visitante anônimo
-- (ou qualquer um que não seja dono/admin) não tem RLS pra ler
-- `licencas`, então o join falhava silenciosamente — a vitrine
-- sumia mesmo com licença ativa, pra qualquer pessoa que não fosse
-- o próprio dono.
--
-- A correção: tirar security_invoker (volta ao padrão, a view roda
-- com o dono/criador, que não é restringido por RLS). A segurança
-- continua garantida pelo WHERE da própria view (só expõe linhas de
-- licença ativa e dentro da vigência).
-- =============================================================

create or replace view estabelecimentos_publicos as
  select e.id, e.nome_fantasia, e.categoria, e.descricao,
         e.telefone_whatsapp, e.instagram_url, e.website_url,
         e.ecommerce_url, e.logo_url, e.horarios,
         l.lote_id, l.numero_licenca
  from estabelecimentos e
  join licencas l on l.id = e.licenca_id
  where l.status = 'ativa'
    and (l.data_fim is null or l.data_fim >= current_date);

create or replace view produtos_publicos as
  select p.id, p.estabelecimento_id, p.nome, p.descricao, p.preco, p.imagem_url, p.tipo
  from produtos p
  join estabelecimentos e on e.id = p.estabelecimento_id
  join licencas l on l.id = e.licenca_id
  where p.ativo
    and l.status = 'ativa'
    and (l.data_fim is null or l.data_fim >= current_date);

grant select on estabelecimentos_publicos, produtos_publicos to anon, authenticated;
