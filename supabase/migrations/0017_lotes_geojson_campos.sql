-- =============================================================
-- Cidade Digital — lotes_geojson também precisa devolver
-- latitude/longitude e bairro/complemento nas properties, já que
-- clicar direto no polígono do mapa físico usa essas properties
-- (e não a RPC lotes_cidade) pra abrir o painel do lote.
-- =============================================================

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
      lo.endereco, lo.numero, lo.bairro, lo.complemento, lo.cep, lo.area_m2, lo.status_ocupacao,
      lo.latitude, lo.longitude,
      lo.geom,
      ep.nome_fantasia, ep.categoria, ep.numero_licenca,
      case
        when ep.id is not null then 'ocupado'
        when lo.status_ocupacao = 'vago' then 'oportunidade'
        when lo.status_ocupacao = 'residencial' then 'residencial'
        when lo.status_ocupacao = 'publico' then 'publico'
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
            'bairro', b.bairro,
            'complemento', b.complemento,
            'cep', b.cep,
            'area_m2', b.area_m2,
            'status_ocupacao', b.status_ocupacao,
            'status_vitrine', b.status_vitrine,
            'nome_fantasia', b.nome_fantasia,
            'categoria', b.categoria,
            'numero_licenca', b.numero_licenca,
            'latitude', b.latitude,
            'longitude', b.longitude
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
