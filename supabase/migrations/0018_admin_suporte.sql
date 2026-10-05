-- =============================================================
-- Cidade Digital — promove almaishernandes@gmail.com a admin
-- (perfil de Suporte: gestão de todo o processo, ativação de
-- licenças etc.). Só tem efeito se a pessoa já tiver se cadastrado
-- no app (criou conta em /entrar) — senão não há perfil pra achar.
-- =============================================================

update perfis set funcao = 'admin' where email = 'almaishernandes@gmail.com';
