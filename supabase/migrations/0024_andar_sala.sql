-- =============================================================
-- Cidade Digital — prédios com vários andares/salas: cada unidade é
-- uma licença própria (dono, vitrine e catálogo independentes),
-- identificada por lote + andar + sala. Troca a regra "1 licença
-- ativa por lote" por "1 licença ativa por lote+andar+sala".
-- =============================================================

alter table licencas add column if not exists andar int;
alter table licencas add column if not exists sala  int;

drop index if exists licencas_lote_ativa_uix;

create unique index licencas_lote_andar_sala_ativa_uix
  on licencas (lote_id, coalesce(andar, -1), coalesce(sala, -1))
  where status = 'ativa';

-- RPC: todas as vitrines ativas de um lote (prédio), pra quando há
-- mais de uma e é preciso escolher qual andar/sala ver.
create or replace function vitrines_do_lote(p_lote_id uuid)
returns table (
  licenca_id uuid,
  numero_licenca bigint,
  andar int,
  sala int,
  nome_fantasia text,
  categoria text
)
language sql stable security invoker set search_path = public as $$
  select l.id, l.numero_licenca, l.andar, l.sala, e.nome_fantasia, e.categoria
  from licencas l
  join estabelecimentos e on e.licenca_id = l.id
  where l.lote_id = p_lote_id
    and l.status = 'ativa'
    and (l.data_fim is null or l.data_fim >= current_date)
  order by l.andar nulls first, l.sala nulls first;
$$;

grant execute on function vitrines_do_lote(uuid) to anon, authenticated;

-- lotes_cidade e lotes_geojson mostram 1 linha por lote (não por
-- licença): quando há várias vitrines ativas no mesmo lote, usamos
-- a primeira (menor andar/sala) como representante e expomos
-- total_vitrines pra a tela saber que precisa oferecer a escolha.
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
  total_vitrines int,
  latitude double precision,
  longitude double precision
)
language sql stable security invoker set search_path = public as $$
  with ativas as (
    select
      l.lote_id,
      count(*) as total,
      (array_agg(l.id order by l.andar nulls first, l.sala nulls first))[1] as licenca_repr
    from licencas l
    where l.status = 'ativa' and (l.data_fim is null or l.data_fim >= current_date)
    group by l.lote_id
  )
  select
    lo.id, lo.endereco, lo.numero, lo.bairro, lo.complemento, lo.cep, lo.area_m2, lo.status_ocupacao,
    case
      when a.total > 0 then 'ocupado'
      when lo.status_ocupacao = 'residencial' then 'residencial'
      when lo.status_ocupacao = 'publico' then 'publico'
      else 'oportunidade'
    end as status_vitrine,
    ep.nome_fantasia, ep.categoria, lr.numero_licenca,
    coalesce(a.total, 0)::int,
    lo.latitude, lo.longitude
  from lotes lo
  left join ativas a on a.lote_id = lo.id
  left join licencas lr on lr.id = a.licenca_repr
  left join estabelecimentos_publicos ep on ep.lote_id = lo.id and ep.numero_licenca = lr.numero_licenca
  where lo.cidade = p_cidade
  order by (a.total is null or a.total = 0), lo.endereco, lo.numero
  limit 1000;
$$;

grant execute on function lotes_cidade(text) to anon, authenticated;

-- vitrines_cidade: lista plana (uma linha por vitrine), já suporta
-- várias por lote naturalmente — só adiciona andar/sala.
drop function if exists vitrines_cidade(text);

create function vitrines_cidade(p_cidade text)
returns table (
  lote_id uuid,
  numero_licenca bigint,
  nome_fantasia text,
  categoria text,
  andar int,
  sala int,
  endereco text,
  numero text,
  bairro text,
  complemento text,
  cep text,
  latitude double precision,
  longitude double precision
)
language sql stable security invoker set search_path = public as $$
  select lo.id, ep.numero_licenca, ep.nome_fantasia, ep.categoria, l.andar, l.sala,
         lo.endereco, lo.numero, lo.bairro, lo.complemento, lo.cep, lo.latitude, lo.longitude
  from lotes lo
  join estabelecimentos_publicos ep on ep.lote_id = lo.id
  join licencas l on l.numero_licenca = ep.numero_licenca
  where lo.cidade = p_cidade
  order by ep.nome_fantasia;
$$;

grant execute on function vitrines_cidade(text) to anon, authenticated;

-- lotes_geojson: mesma lógica de representante + total_vitrines.
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
            'total_vitrines', b.total_vitrines,
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
