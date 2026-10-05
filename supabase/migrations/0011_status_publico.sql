-- =============================================================
-- Cidade Digital — novo status de ocupação "público" (prédios e
-- equipamentos públicos: prefeitura, escolas, praças, etc.)
--
-- IMPORTANTE: rode este arquivo sozinho (sem colar o 0012 junto),
-- confirme, e só depois rode o 0012. O Postgres não permite usar um
-- valor de enum recém-criado na mesma transação em que ele foi
-- adicionado.
-- =============================================================

alter type status_ocupacao add value if not exists 'publico';
