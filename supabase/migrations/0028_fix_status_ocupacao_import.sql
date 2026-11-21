-- =============================================================
-- Cidade Digital — corrige importar_vitrine_publica: o CASE pra
-- status_ocupacao precisa de cast explícito pro tipo enum, senão o
-- Postgres trata como texto puro e a inserção falha.
-- =============================================================

create or replace function importar_vitrine_publica(
  p_cidade text,
  p_endereco text,
  p_numero text,
  p_cep text,
  p_lat double precision,
  p_lng double precision,
  p_nome text,
  p_categoria text,
  p_tipo text default 'publica'
) returns uuid
language plpgsql
security definer
set search_path = public as $$
declare
  v_lote_id uuid;
  v_licenca_id uuid;
  lado double precision := sqrt(300);
  dlat double precision;
  dlng double precision;
  g geometry;
begin
  if not is_admin() then
    raise exception 'permissao negada';
  end if;

  select id into v_lote_id
  from lotes
  where cidade = p_cidade
    and endereco = p_endereco
    and coalesce(numero, '') = coalesce(p_numero, '')
  limit 1;

  if v_lote_id is null then
    dlat := (lado / 2) / 111320.0;
    dlng := (lado / 2) / (111320.0 * cos(radians(p_lat)));
    g := st_setsrid(st_multi(st_makepolygon(st_makeline(array[
      st_point(p_lng - dlng, p_lat - dlat),
      st_point(p_lng + dlng, p_lat - dlat),
      st_point(p_lng + dlng, p_lat + dlat),
      st_point(p_lng - dlng, p_lat + dlat),
      st_point(p_lng - dlng, p_lat - dlat)
    ]))), 4326);

    insert into lotes (cidade, endereco, numero, cep, geom, area_m2, status_ocupacao)
    values (
      p_cidade, p_endereco, p_numero, p_cep, g,
      round((st_area(g::geography))::numeric, 2),
      (case when p_tipo = 'publica' then 'publico' else 'comercial' end)::status_ocupacao
    )
    returning id into v_lote_id;
  end if;

  insert into licencas (lote_id, perfil_id, status, tipo, data_inicio)
  values (v_lote_id, auth.uid(), 'ativa', p_tipo, current_date)
  on conflict (lote_id, coalesce(andar, -1), coalesce(sala, -1)) where status = 'ativa'
  do nothing
  returning id into v_licenca_id;

  if v_licenca_id is null then
    select id into v_licenca_id from licencas
    where lote_id = v_lote_id and status = 'ativa' and andar is null and sala is null
    limit 1;
  end if;

  insert into estabelecimentos (licenca_id, nome_fantasia, categoria)
  values (v_licenca_id, p_nome, p_categoria)
  on conflict (licenca_id) do update set nome_fantasia = excluded.nome_fantasia, categoria = excluded.categoria;

  return v_lote_id;
end $$;

grant execute on function importar_vitrine_publica(
  text, text, text, text, double precision, double precision, text, text, text
) to authenticated;
