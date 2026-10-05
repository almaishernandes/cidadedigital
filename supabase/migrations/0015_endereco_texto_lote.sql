-- =============================================================
-- Cidade Digital — bairro e complemento do lote, e gravação dos
-- dados de endereço (texto) sem depender de geocodificação nem
-- mexer na geometria/posição do lote.
-- =============================================================

alter table lotes add column if not exists bairro text;
alter table lotes add column if not exists complemento text;

create or replace function atualizar_endereco_texto_lote(
  p_lote_id uuid,
  p_endereco text,
  p_numero text,
  p_bairro text,
  p_complemento text,
  p_cep text default null
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
    cep = coalesce(p_cep, cep)
  where id = p_lote_id;
end $$;

grant execute on function atualizar_endereco_texto_lote(uuid, text, text, text, text, text)
  to authenticated;
