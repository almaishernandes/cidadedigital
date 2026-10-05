-- =============================================================
-- Cidade Digital — cotações: o perfil Usuário (visitante logado)
-- pode pedir cotação de itens do catálogo de uma vitrine; o
-- comerciante (dono da licença) responde com condições de entrega
-- e pagamento.
-- =============================================================

create table if not exists cotacoes (
  id                 uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos (id) on delete cascade,
  perfil_id          uuid not null references perfis (id) on delete cascade,
  mensagem           text,   -- preferências do solicitante (entrega, pagamento, prazo...)
  resposta           text,   -- resposta do comerciante
  status             text not null default 'pendente'
                       check (status in ('pendente', 'respondida', 'cancelada')),
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now()
);
create index if not exists cotacoes_estab_ix on cotacoes (estabelecimento_id);
create index if not exists cotacoes_perfil_ix on cotacoes (perfil_id);

create table if not exists cotacao_itens (
  id          uuid primary key default gen_random_uuid(),
  cotacao_id  uuid not null references cotacoes (id) on delete cascade,
  produto_id  uuid not null references produtos (id) on delete restrict,
  quantidade  numeric(10, 2) not null default 1,
  observacao  text
);
create index if not exists cotacao_itens_cotacao_ix on cotacao_itens (cotacao_id);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_cotacoes_atualizado') then
    create trigger trg_cotacoes_atualizado before update on cotacoes
      for each row execute function set_atualizado_em();
  end if;
end $$;

alter table cotacoes      enable row level security;
alter table cotacao_itens enable row level security;

-- Solicitante vê as próprias; dono do estabelecimento (via licença) e admin veem as recebidas.
create policy cotacoes_sel on cotacoes for select
  using (
    perfil_id = auth.uid()
    or is_admin()
    or exists (
      select 1 from estabelecimentos e
      where e.id = cotacoes.estabelecimento_id and possui_licenca(e.licenca_id)
    )
  );

create policy cotacoes_ins on cotacoes for insert
  with check (perfil_id = auth.uid() and status = 'pendente');

-- Só o dono do estabelecimento (ou admin) responde/atualiza status.
create policy cotacoes_upd on cotacoes for update
  using (
    is_admin()
    or exists (
      select 1 from estabelecimentos e
      where e.id = cotacoes.estabelecimento_id and possui_licenca(e.licenca_id)
    )
  );

create policy cotacao_itens_sel on cotacao_itens for select
  using (exists (
    select 1 from cotacoes c
    where c.id = cotacao_itens.cotacao_id
      and (
        c.perfil_id = auth.uid()
        or is_admin()
        or exists (
          select 1 from estabelecimentos e
          where e.id = c.estabelecimento_id and possui_licenca(e.licenca_id)
        )
      )
  ));

create policy cotacao_itens_ins on cotacao_itens for insert
  with check (exists (
    select 1 from cotacoes c where c.id = cotacao_itens.cotacao_id and c.perfil_id = auth.uid()
  ));

grant select, insert, update on cotacoes to authenticated;
grant select, insert on cotacao_itens to authenticated;
