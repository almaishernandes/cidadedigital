-- Distingue produtos de serviços no catálogo de cada vitrine.
alter table produtos
  add column if not exists tipo text not null default 'produto'
    check (tipo in ('produto', 'servico'));

create or replace view produtos_publicos
with (security_invoker = true) as
  select p.id, p.estabelecimento_id, p.nome, p.descricao, p.preco, p.imagem_url, p.tipo
  from produtos p
  join estabelecimentos e on e.id = p.estabelecimento_id
  join licencas l on l.id = e.licenca_id
  where p.ativo
    and l.status = 'ativa'
    and (l.data_fim is null or l.data_fim >= current_date);
