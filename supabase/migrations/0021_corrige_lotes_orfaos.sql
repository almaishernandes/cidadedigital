-- =============================================================
-- Cidade Digital — corrige lotes "presos" como comercial/público
-- sem licença ativa (expirar nunca devolvia o lote pra vago) e
-- corrige o fallback das funções de mapa, que tratava QUALQUER
-- status_ocupacao desconhecido como "ocupado" — então um lote
-- 'comercial' sem estabelecimento ativo aparecia com o selo
-- "Comercial" mas sem nenhum dado de vitrine (contraditório).
-- =============================================================

-- 1) Limpa o estado atual: comercial/público sem licença ativa volta a vago.
update lotes lo
set status_ocupacao = 'vago'
where lo.status_ocupacao in ('comercial', 'publico')
  and not exists (
    select 1 from estabelecimentos_publicos ep where ep.lote_id = lo.id
  );

-- 2) lotes_cidade: fallback correto.
drop function if exists lotes_cidade(text);

create function lotes_cidade(p_cidade text)
returns table (
  lote_id uuid,
  endereco text,
  numero text,
  bairro text,
  complemento text,
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
    lo.id, lo.endereco, lo.numero, lo.bairro, lo.complemento, lo.cep, lo.area_m2, lo.status_ocupacao,
    case
      when ep.id is not null then 'ocupado'
      when lo.status_ocupacao = 'residencial' then 'residencial'
      when lo.status_ocupacao = 'publico' then 'publico'
      else 'oportunidade'
    end as status_vitrine,
    ep.nome_fantasia, ep.categoria, ep.numero_licenca,
    lo.latitude, lo.longitude
  from lotes lo
  left join estabelecimentos_publicos ep on ep.lote_id = lo.id
  where lo.cidade = p_cidade
  order by (ep.id is null), lo.endereco, lo.numero
  limit 1000;
$$;

grant execute on function lotes_cidade(text) to anon, authenticated;

-- 3) lotes_geojson: mesmo fallback correto, e também devolve bairro/complemento/lat/lng
--    (já tinha sido corrigido pra isso na migration 0017).
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
        when lo.status_ocupacao = 'residencial' then 'residencial'
        when lo.status_ocupacao = 'publico' then 'publico'
        else 'oportunidade'
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
