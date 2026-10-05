-- =============================================================
-- Cidade Digital — a busca de CEP passa a gravar também rua e
-- bairro automaticamente (não só o CEP), já que esses dados vêm
-- prontos dos Correios. Número e complemento continuam sendo
-- digitados manualmente e gravados pelo botão "Gravar dados
-- informados".
-- =============================================================

drop function if exists atualizar_cep_lote(uuid, text);

create or replace function atualizar_cep_lote(
  p_lote_id uuid,
  p_cep text,
  p_endereco text default null,
  p_bairro text default null
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
    cep = p_cep,
    endereco = coalesce(p_endereco, endereco),
    bairro = coalesce(p_bairro, bairro)
  where id = p_lote_id;
end $$;

grant execute on function atualizar_cep_lote(uuid, text, text, text) to authenticated;
