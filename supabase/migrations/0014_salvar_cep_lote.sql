-- =============================================================
-- Cidade Digital — salvar CEP isoladamente, sem recalcular a
-- geometria do lote (atualizar_endereco_lote sempre reconstrói o
-- polígono, o que arriscaria substituir a geometria real importada
-- do cadastro municipal por um quadrado sintético só pra gravar CEP).
-- =============================================================

create or replace function atualizar_cep_lote(p_lote_id uuid, p_cep text)
returns void
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

  update lotes set cep = p_cep where id = p_lote_id;
end $$;

grant execute on function atualizar_cep_lote(uuid, text) to authenticated;
