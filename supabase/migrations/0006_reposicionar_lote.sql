-- =============================================================
-- Cidade Digital — reposicionar lote por endereço geocodificado
-- Chamável pelo dono da licença (qualquer status) ou por admin.
-- Gera um polígono pequeno (área aproximada) centrado no ponto,
-- já que não temos a cartografia cadastral exata para esse caso.
-- =============================================================

create or replace function atualizar_endereco_lote(
  p_lote_id uuid,
  p_endereco text,
  p_numero text,
  p_lat double precision,
  p_lng double precision,
  p_area_m2 numeric default 300
) returns void
language plpgsql
security definer
set search_path = public as $$
declare
  lado double precision;
  dlat double precision;
  dlng double precision;
  g geometry;
begin
  if not (
    is_admin() or exists (
      select 1 from licencas where lote_id = p_lote_id and perfil_id = auth.uid()
    )
  ) then
    raise exception 'permissao negada';
  end if;

  lado := sqrt(coalesce(p_area_m2, 300));
  dlat := (lado / 2) / 111320.0;
  dlng := (lado / 2) / (111320.0 * cos(radians(p_lat)));

  g := st_multi(st_makepolygon(st_makeline(array[
    st_point(p_lng - dlng, p_lat - dlat),
    st_point(p_lng + dlng, p_lat - dlat),
    st_point(p_lng + dlng, p_lat + dlat),
    st_point(p_lng - dlng, p_lat + dlat),
    st_point(p_lng - dlng, p_lat - dlat)
  ])));
  g := st_setsrid(g, 4326);

  update lotes set
    endereco = p_endereco,
    numero = p_numero,
    geom = g,
    area_m2 = round((st_area(g::geography))::numeric, 2)
  where id = p_lote_id;
end $$;

grant execute on function atualizar_endereco_lote(uuid, text, text, double precision, double precision, numeric)
  to authenticated;
