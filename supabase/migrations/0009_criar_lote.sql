-- =============================================================
-- Cidade Digital — criar lote pelo endereço real (CEP + coordenadas)
-- Permite ao comerciante solicitar licença num endereço novo, sem
-- depender de escolher um lote pré-existente na grade de demonstração.
-- =============================================================

create or replace function criar_lote(
  p_cidade text,
  p_endereco text,
  p_numero text,
  p_lat double precision,
  p_lng double precision,
  p_area_m2 numeric default 300
) returns uuid
language plpgsql
security definer
set search_path = public as $$
declare
  lado double precision;
  dlat double precision;
  dlng double precision;
  g geometry;
  novo_id uuid;
begin
  if auth.uid() is null then
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

  insert into lotes (cidade, endereco, numero, geom, area_m2, status_ocupacao)
  values (
    p_cidade, p_endereco, p_numero, g,
    round((st_area(g::geography))::numeric, 2),
    'vago'
  )
  returning id into novo_id;

  return novo_id;
end $$;

grant execute on function criar_lote(text, text, text, double precision, double precision, numeric)
  to authenticated;
