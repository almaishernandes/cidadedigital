-- =============================================================
-- Cidade Digital — licença do tipo "pública": identifica um espaço
-- público dentro da cidade (prefeitura, escola, praça etc.), sem
-- cobrança — serve só para marcar o lote no mapa, não para venda.
-- =============================================================

alter table licencas
  add column if not exists tipo text not null default 'comercial'
    check (tipo in ('comercial', 'publica'));
