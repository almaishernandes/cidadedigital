-- =============================================================
-- Cidade Digital — expõe bairro e complemento nas RPCs dos mapas,
-- pra exibir o endereço completo (rua, número, bairro, complemento)
-- igual foi gravado no cadastro da vitrine.
-- =============================================================

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
      when lo.status_ocupacao = 'vago' then 'oportunidade'
      when lo.status_ocupacao = 'residencial' then 'residencial'
      when lo.status_ocupacao = 'publico' then 'publico'
      else 'ocupado'
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

drop function if exists vitrines_cidade(text);

create function vitrines_cidade(p_cidade text)
returns table (
  lote_id uuid,
  numero_licenca bigint,
  nome_fantasia text,
  categoria text,
  endereco text,
  numero text,
  bairro text,
  complemento text,
  cep text,
  latitude double precision,
  longitude double precision
)
language sql stable security invoker set search_path = public as $$
  select lo.id, ep.numero_licenca, ep.nome_fantasia, ep.categoria,
         lo.endereco, lo.numero, lo.bairro, lo.complemento, lo.cep, lo.latitude, lo.longitude
  from lotes lo
  join estabelecimentos_publicos ep on ep.lote_id = lo.id
  where lo.cidade = p_cidade
  order by ep.nome_fantasia;
$$;

grant execute on function vitrines_cidade(text) to anon, authenticated;
