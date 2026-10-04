-- =============================================================
-- Cidade Digital — CEP do lote, exibido junto do endereço
-- =============================================================

alter table lotes add column if not exists cep text;

create or replace function criar_lote(
  p_cidade text,
  p_endereco text,
  p_numero text,
  p_lat double precision,
  p_lng double precision,
  p_area_m2 numeric default 300,
  p_cep text default null
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

  insert into lotes (cidade, endereco, numero, cep, geom, area_m2, status_ocupacao)
  values (
    p_cidade, p_endereco, p_numero, p_cep, g,
    round((st_area(g::geography))::numeric, 2),
    'vago'
  )
  returning id into novo_id;

  return novo_id;
end $$;

grant execute on function criar_lote(text, text, text, double precision, double precision, numeric, text)
  to authenticated;

create or replace function atualizar_endereco_lote(
  p_lote_id uuid,
  p_endereco text,
  p_numero text,
  p_lat double precision,
  p_lng double precision,
  p_area_m2 numeric default 300,
  p_cep text default null
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
    cep = coalesce(p_cep, cep),
    geom = g,
    area_m2 = round((st_area(g::geography))::numeric, 2)
  where id = p_lote_id;
end $$;

grant execute on function atualizar_endereco_lote(uuid, text, text, double precision, double precision, numeric, text)
  to authenticated;

-- RPCs usadas pelos painéis dos mapas (físico, virtual e digital) passam a
-- devolver o CEP junto do endereço, mantendo as telas consistentes entre si.
create or replace function lotes_cidade(p_cidade text)
returns table (
  lote_id uuid,
  endereco text,
  numero text,
  cep text,
  area_m2 numeric,
  status_ocupacao status_ocupacao,
  status_vitrine text,
  nome_fantasia text,
  categoria text,
  numero_licenca bigint,
  latitude double precision,
  longitude double precision
)
language sql stable security invoker set search_path = public as $$
  select
    lo.id, lo.endereco, lo.numero, lo.cep, lo.area_m2, lo.status_ocupacao,
    case
      when ep.id is not null then 'ocupado'
      when lo.status_ocupacao = 'vago' then 'oportunidade'
      when lo.status_ocupacao = 'residencial' then 'residencial'
      else 'ocupado'
    end as status_vitrine,
    ep.nome_fantasia, ep.categoria, ep.numero_licenca,
    lo.latitude, lo.longitude
  from lotes lo
  left join estabelecimentos_publicos ep on ep.lote_id = lo.id
  where lo.cidade = p_cidade
    and lo.status_ocupacao <> 'residencial'
  order by (ep.id is null), lo.endereco, lo.numero
  limit 1000;
$$;

grant execute on function lotes_cidade(text) to anon, authenticated;

create or replace function vitrines_cidade(p_cidade text)
returns table (
  lote_id uuid,
  numero_licenca bigint,
  nome_fantasia text,
  categoria text,
  endereco text,
  numero text,
  cep text,
  latitude double precision,
  longitude double precision
)
language sql stable security invoker set search_path = public as $$
  select lo.id, ep.numero_licenca, ep.nome_fantasia, ep.categoria,
         lo.endereco, lo.numero, lo.cep, lo.latitude, lo.longitude
  from lotes lo
  join estabelecimentos_publicos ep on ep.lote_id = lo.id
  where lo.cidade = p_cidade
  order by ep.nome_fantasia;
$$;

grant execute on function vitrines_cidade(text) to anon, authenticated;
