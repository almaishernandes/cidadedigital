-- =============================================================
-- Cidade Digital — lista completa de lotes de uma cidade
-- (painel lateral do mapa físico: vagos + ativos, com busca)
-- =============================================================

create or replace function lotes_cidade(p_cidade text)
returns table (
  lote_id uuid,
  endereco text,
  numero text,
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
    lo.id, lo.endereco, lo.numero, lo.area_m2, lo.status_ocupacao,
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
