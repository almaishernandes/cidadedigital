-- =============================================================
-- Cidade Digital — corrige o travamento no celular: lotes_geojson
-- devolvia {"features": null} em vez de {"features": []} quando a
-- área visível do mapa não tinha nenhum lote (jsonb_agg de zero
-- linhas retorna NULL no Postgres — e isso quebrava o app ao
-- tentar desenhar os pinos, "Cannot read properties of null
-- (reading 'flatMap')").
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
  ativas as (
    select
      l.lote_id,
      count(*) as total,
      (array_agg(l.id order by l.andar nulls first, l.sala nulls first))[1] as licenca_repr
    from licencas l
    where l.status = 'ativa' and (l.data_fim is null or l.data_fim >= current_date)
    group by l.lote_id
  ),
  base as (
    select
      lo.id,
      lo.endereco, lo.numero, lo.bairro, lo.complemento, lo.cep, lo.area_m2, lo.status_ocupacao,
      lo.latitude, lo.longitude,
      lo.geom,
      ep.nome_fantasia, ep.categoria, lr.numero_licenca,
      coalesce(a.total, 0)::int as total_vitrines,
      case
        when a.total > 0 then 'ocupado'
        when lo.status_ocupacao = 'residencial' then 'residencial'
        when lo.status_ocupacao = 'publico' then 'publico'
        else 'oportunidade'
      end as status_vitrine
    from lotes lo
    join janela j on lo.geom && j.bbox
    left join ativas a on a.lote_id = lo.id
    left join licencas lr on lr.id = a.licenca_repr
    left join estabelecimentos_publicos ep on ep.lote_id = lo.id and ep.numero_licenca = lr.numero_licenca
    where (p_cidade is null or lo.cidade = p_cidade)
    limit 3000
  )
  select jsonb_build_object(
    'type', 'FeatureCollection',
    'features', coalesce(
      jsonb_agg(
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
            'total_vitrines', b.total_vitrines,
            'latitude', b.latitude,
            'longitude', b.longitude
          )
        )
      ),
      '[]'::jsonb
    )
  )
  from base b;
$$;

grant execute on function lotes_geojson(text, double precision, double precision, double precision, double precision)
  to anon, authenticated;
