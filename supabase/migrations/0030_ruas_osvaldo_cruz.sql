-- =============================================================
-- Cidade Digital — cadastro oficial de ruas/logradouros por
-- município, usado pra popular o filtro de rua no mapa Digital com
-- a lista completa (não só as que já têm vitrine). Fonte:
-- ruas_osvaldo_cruz.csv
-- =============================================================

create table if not exists ruas (
  id               int primary key,
  municipio        text not null,
  uf               text not null,
  codigo_ibge      int not null,
  tipo_logradouro  text not null,
  logradouro       text not null,
  nome_logradouro  text not null,
  slug             text not null,
  ativo            boolean not null default true
);

create index if not exists ruas_municipio_ix on ruas (municipio);

alter table ruas enable row level security;

drop policy if exists "ruas leitura publica" on ruas;
create policy "ruas leitura publica"
  on ruas for select
  using (true);

insert into ruas (id, municipio, uf, codigo_ibge, tipo_logradouro, logradouro, nome_logradouro, slug, ativo)
values
(1, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Alécio Romano', 'Alécio Romano', 'rua-alecio-romano', true),
(2, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Amélio Manicardi', 'Amélio Manicardi', 'rua-amelio-manicardi', true),
(3, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Antônio Mazoca', 'Antônio Mazoca', 'rua-antonio-mazoca', true),
(4, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Aparecida Maria de Souza', 'Aparecida Maria de Souza', 'rua-aparecida-maria-de-souza', true),
(5, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Benedito Cassirarghi', 'Benedito Cassirarghi', 'rua-benedito-cassirarghi', true),
(6, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Deolinda Maria da Silva', 'Deolinda Maria da Silva', 'rua-deolinda-maria-da-silva', true),
(7, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Diamante', 'Diamante', 'rua-diamante', true),
(8, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Doutor John Nicholson Taves', 'Doutor John Nicholson Taves', 'rua-doutor-john-nicholson-taves', true),
(9, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Engenheiro Hans Klots', 'Engenheiro Hans Klots', 'rua-engenheiro-hans-klots', true),
(10, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Esmeralda', 'Esmeralda', 'rua-esmeralda', true),
(11, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Feb', 'Feb', 'rua-feb', true),
(12, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Fernando Costa', 'Fernando Costa', 'rua-fernando-costa', true),
(13, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Governador Armando Salles', 'Governador Armando Salles', 'rua-governador-armando-salles', true),
(14, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Japão', 'Japão', 'rua-japao', true),
(15, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua João Fiorussi', 'João Fiorussi', 'rua-joao-fiorussi', true),
(16, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua João Segatelli', 'João Segatelli', 'rua-joao-segatelli', true),
(17, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua José Alves da Cunha', 'José Alves da Cunha', 'rua-jose-alves-da-cunha', true),
(18, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua José Conca', 'José Conca', 'rua-jose-conca', true),
(19, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Kieffer', 'Kieffer', 'rua-kieffer', true),
(20, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Lídio Alencar', 'Lídio Alencar', 'rua-lidio-alencar', true),
(21, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Luís Fantin', 'Luís Fantin', 'rua-luis-fantin', true),
(22, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Manoel dos Santos', 'Manoel dos Santos', 'rua-manoel-dos-santos', true),
(23, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Maria Neves Ferreira', 'Maria Neves Ferreira', 'rua-maria-neves-ferreira', true),
(24, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Quinze de Novembro', 'Quinze de Novembro', 'rua-quinze-de-novembro', true),
(25, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Rondon', 'Rondon', 'rua-rondon', true),
(26, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Said Jundi', 'Said Jundi', 'rua-said-jundi', true),
(27, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Salgado Filho', 'Salgado Filho', 'rua-salgado-filho', true),
(28, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua São Paulo', 'São Paulo', 'rua-sao-paulo', true),
(29, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Vereador Antônio Ricardo Ponciano', 'Vereador Antônio Ricardo Ponciano', 'rua-vereador-antonio-ricardo-ponciano', true),
(30, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Vereador Rodolpho Zaros', 'Vereador Rodolpho Zaros', 'rua-vereador-rodolpho-zaros', true),
(31, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Vinte e Um de Abril', 'Vinte e Um de Abril', 'rua-vinte-e-um-de-abril', true),
(32, 'Osvaldo Cruz', 'SP', 3534609, 'Rua', 'Rua Yutaka Abe', 'Yutaka Abe', 'rua-yutaka-abe', true)
on conflict (id) do update set
  municipio = excluded.municipio,
  uf = excluded.uf,
  codigo_ibge = excluded.codigo_ibge,
  tipo_logradouro = excluded.tipo_logradouro,
  logradouro = excluded.logradouro,
  nome_logradouro = excluded.nome_logradouro,
  slug = excluded.slug,
  ativo = excluded.ativo;

grant select on ruas to anon, authenticated;
