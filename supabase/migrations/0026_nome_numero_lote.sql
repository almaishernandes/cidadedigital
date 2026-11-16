-- =============================================================
-- Cidade Digital — nome e número internos do lote (organizacional,
-- não tem relação com o número do endereço nem com inscrição
-- cadastral municipal). Usados só pra facilitar identificar/atualizar
-- o lote certo nas telas administrativas.
-- =============================================================

alter table lotes add column if not exists nome_lote text;
alter table lotes add column if not exists numero_lote text;

-- Remove a assinatura antiga (6 args) pra evitar ambiguidade de overload
-- com a nova versão (8 args, 2 com default).
drop function if exists atualizar_endereco_texto_lote(uuid, text, text, text, text, text);

create or replace function atualizar_endereco_texto_lote(
  p_lote_id uuid,
  p_endereco text,
  p_numero text,
  p_bairro text,
  p_complemento text,
  p_cep text default null,
  p_nome_lote text default null,
  p_numero_lote text default null
) returns void
language plpgsql
security definer
set search_path = public as $$
begin
  if not (
    is_admin() or exists (
      select 1 from licencas where lote_id = p_lote_id and perfil_id = auth.uid()
    )
  ) then
    raise exception 'permissao negada';
  end if;

  update lotes set
    endereco = p_endereco,
    numero = p_numero,
    bairro = p_bairro,
    complemento = p_complemento,
    cep = coalesce(p_cep, cep),
    nome_lote = p_nome_lote,
    numero_lote = p_numero_lote
  where id = p_lote_id;
end $$;

grant execute on function atualizar_endereco_texto_lote(uuid, text, text, text, text, text, text, text)
  to authenticated;
