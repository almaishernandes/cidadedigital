-- =============================================================
-- Cidade Digital — Mapa Virtual: número público da licença + lista
-- =============================================================

alter table licencas
  add column if not exists numero_licenca bigint generated always as identity;

create unique index if not exists licencas_numero_uix on licencas (numero_licenca);

-- Views públicas precisam expor o número da licença.
create or replace view estabelecimentos_publicos
with (security_invoker = true) as
  select e.id, e.nome_fantasia, e.categoria, e.descricao,
         e.telefone_whatsapp, e.instagram_url, e.website_url,
         e.ecommerce_url, e.logo_url, e.horarios,
         l.lote_id, l.numero_licenca
  from estabelecimentos e
  join licencas l on l.id = e.licenca_id
  where l.status = 'ativa'
    and (l.data_fim is null or l.data_fim >= current_date);

grant select on estabelecimentos_publicos to anon, authenticated;

-- RPC: lista de vitrines ativas de uma cidade (pro painel lateral do mapa virtual).
create or replace function vitrines_cidade(p_cidade text)
returns table (
  lote_id uuid,
  numero_licenca bigint,
  nome_fantasia text,
  categoria text,
  endereco text,
  numero text,
  latitude double precision,
  longitude double precision
)
language sql stable security invoker set search_path = public as $$
  select lo.id, ep.numero_licenca, ep.nome_fantasia, ep.categoria,
         lo.endereco, lo.numero, lo.latitude, lo.longitude
  from lotes lo
  join estabelecimentos_publicos ep on ep.lote_id = lo.id
  where lo.cidade = p_cidade
  order by ep.nome_fantasia;
$$;

grant execute on function vitrines_cidade(text) to anon, authenticated;

-- RPC lotes_geojson agora também traz o número público da licença.
create or replace function lotes_geojson(
  p_cidade text,
  p_oeste  double precision,
  p_sul    double precision,
  p_leste  double precision,
  p_norte  double precision
) returns jsonb
language sql stable security invoker set search_path = public as $$
  with janela as (
    select st_makeenvelope(p_oeste, p_sul, p_leste, p_norte, 4326) as bbox
  ),
  base as (
    select
      lo.id,
      lo.endereco, lo.numero, lo.area_m2, lo.status_ocupacao,
      lo.geom,
      ep.nome_fantasia, ep.categoria, ep.numero_licenca,
      case
        when ep.id is not null then 'ocupado'
        when lo.status_ocupacao = 'vago' then 'oportunidade'
        when lo.status_ocupacao = 'residencial' then 'residencial'
        else 'ocupado'
      end as status_vitrine
    from lotes lo
    join janela j on lo.geom && j.bbox
    left join estabelecimentos_publicos ep on ep.lote_id = lo.id
    where (p_cidade is null or lo.cidade = p_cidade)
    limit 3000
  )
  select coalesce(
    jsonb_build_object(
      'type', 'FeatureCollection',
      'features', jsonb_agg(
        jsonb_build_object(
          'type', 'Feature',
          'id', b.id,
          'geometry', st_asgeojson(b.geom, 6)::jsonb,
          'properties', jsonb_build_object(
            'lote_id', b.id,
            'endereco', b.endereco,
            'numero', b.numero,
            'area_m2', b.area_m2,
            'status_ocupacao', b.status_ocupacao,
            'status_vitrine', b.status_vitrine,
            'nome_fantasia', b.nome_fantasia,
            'categoria', b.categoria,
            'numero_licenca', b.numero_licenca
          )
        )
      )
    ),
    jsonb_build_object('type', 'FeatureCollection', 'features', '[]'::jsonb)
  )
  from base b;
$$;

grant execute on function lotes_geojson(text, double precision, double precision, double precision, double precision)
  to anon, authenticated;
