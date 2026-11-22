-- =============================================================
-- Cidade Digital — taxonomia de categorias/subcategorias (Público e
-- Privado), usada pra classificar vitrines e filtrar o mapa por
-- categoria/subcategoria. Fonte: categorias_subcategorias_cidade_digital.csv
-- =============================================================

create table if not exists categorias_taxonomia (
  id                int primary key,
  setor             text not null check (setor in ('Público', 'Privado')),
  setor_slug        text not null,
  categoria         text not null,
  categoria_slug    text not null,
  subcategoria      text not null,
  subcategoria_slug text not null,
  ativo             boolean not null default true
);

create index if not exists categorias_taxonomia_setor_ix on categorias_taxonomia (setor);
create index if not exists categorias_taxonomia_categoria_ix on categorias_taxonomia (categoria);

alter table categorias_taxonomia enable row level security;

drop policy if exists "categorias_taxonomia leitura publica" on categorias_taxonomia;
create policy "categorias_taxonomia leitura publica"
  on categorias_taxonomia for select
  using (true);

insert into categorias_taxonomia (id, setor, setor_slug, categoria, categoria_slug, subcategoria, subcategoria_slug, ativo)
values
(1, 'Público', 'publico', 'Saúde', 'saude', 'UBS', 'ubs', true),
(2, 'Público', 'publico', 'Saúde', 'saude', 'Urgência', 'urgencia', true),
(3, 'Público', 'publico', 'Saúde', 'saude', 'Especialidades', 'especialidades', true),
(4, 'Público', 'publico', 'Saúde', 'saude', 'Exames', 'exames', true),
(5, 'Público', 'publico', 'Saúde', 'saude', 'Farmácia', 'farmacia', true),
(6, 'Público', 'publico', 'Saúde', 'saude', 'Vigilância', 'vigilancia', true),
(7, 'Público', 'publico', 'Saúde', 'saude', 'Zoonoses', 'zoonoses', true),
(8, 'Público', 'publico', 'Educação', 'educacao', 'Creches', 'creches', true),
(9, 'Público', 'publico', 'Educação', 'educacao', 'Escolas', 'escolas', true),
(10, 'Público', 'publico', 'Educação', 'educacao', 'Transporte', 'transporte', true),
(11, 'Público', 'publico', 'Educação', 'educacao', 'Merenda', 'merenda', true),
(12, 'Público', 'publico', 'Educação', 'educacao', 'EJA', 'eja', true),
(13, 'Público', 'publico', 'Educação', 'educacao', 'Bibliotecas', 'bibliotecas', true),
(14, 'Público', 'publico', 'Educação', 'educacao', 'Matrículas', 'matriculas', true),
(15, 'Público', 'publico', 'Assistência Social', 'assistencia-social', 'CRAS', 'cras', true),
(16, 'Público', 'publico', 'Assistência Social', 'assistencia-social', 'CREAS', 'creas', true),
(17, 'Público', 'publico', 'Assistência Social', 'assistencia-social', 'CadÚnico', 'cadunico', true),
(18, 'Público', 'publico', 'Assistência Social', 'assistencia-social', 'Benefícios', 'beneficios', true),
(19, 'Público', 'publico', 'Assistência Social', 'assistencia-social', 'Idosos', 'idosos', true),
(20, 'Público', 'publico', 'Assistência Social', 'assistencia-social', 'Juventude', 'juventude', true),
(21, 'Público', 'publico', 'Assistência Social', 'assistencia-social', 'Mulheres', 'mulheres', true),
(22, 'Público', 'publico', 'Assistência Social', 'assistencia-social', 'Conselhos', 'conselhos', true),
(23, 'Público', 'publico', 'Finanças e Tributos', 'financas-e-tributos', 'IPTU', 'iptu', true),
(24, 'Público', 'publico', 'Finanças e Tributos', 'financas-e-tributos', 'ISS', 'iss', true),
(25, 'Público', 'publico', 'Finanças e Tributos', 'financas-e-tributos', 'Certidões', 'certidoes', true),
(26, 'Público', 'publico', 'Finanças e Tributos', 'financas-e-tributos', 'Alvarás', 'alvaras', true),
(27, 'Público', 'publico', 'Finanças e Tributos', 'financas-e-tributos', 'Licenciamento', 'licenciamento', true),
(28, 'Público', 'publico', 'Finanças e Tributos', 'financas-e-tributos', 'Empreendedor', 'empreendedor', true),
(29, 'Público', 'publico', 'Finanças e Tributos', 'financas-e-tributos', 'Empregos', 'empregos', true),
(30, 'Público', 'publico', 'Finanças e Tributos', 'financas-e-tributos', 'Feiras', 'feiras', true),
(31, 'Público', 'publico', 'Obras e Meio Ambiente', 'obras-e-meio-ambiente', 'Iluminação', 'iluminacao', true),
(32, 'Público', 'publico', 'Obras e Meio Ambiente', 'obras-e-meio-ambiente', 'Pavimentação', 'pavimentacao', true),
(33, 'Público', 'publico', 'Obras e Meio Ambiente', 'obras-e-meio-ambiente', 'Limpeza', 'limpeza', true),
(34, 'Público', 'publico', 'Obras e Meio Ambiente', 'obras-e-meio-ambiente', 'Coleta', 'coleta', true),
(35, 'Público', 'publico', 'Obras e Meio Ambiente', 'obras-e-meio-ambiente', 'Ecopontos', 'ecopontos', true),
(36, 'Público', 'publico', 'Obras e Meio Ambiente', 'obras-e-meio-ambiente', 'Saneamento', 'saneamento', true),
(37, 'Público', 'publico', 'Obras e Meio Ambiente', 'obras-e-meio-ambiente', 'Parques', 'parques', true),
(38, 'Público', 'publico', 'Obras e Meio Ambiente', 'obras-e-meio-ambiente', 'Arborização', 'arborizacao', true),
(39, 'Público', 'publico', 'Trânsito e Segurança', 'transito-e-seguranca', 'Sinalização', 'sinalizacao', true),
(40, 'Público', 'publico', 'Trânsito e Segurança', 'transito-e-seguranca', 'Multas', 'multas', true),
(41, 'Público', 'publico', 'Trânsito e Segurança', 'transito-e-seguranca', 'Estacionamento', 'estacionamento', true),
(42, 'Público', 'publico', 'Trânsito e Segurança', 'transito-e-seguranca', 'Ônibus', 'onibus', true),
(43, 'Público', 'publico', 'Trânsito e Segurança', 'transito-e-seguranca', 'Táxi', 'taxi', true),
(44, 'Público', 'publico', 'Trânsito e Segurança', 'transito-e-seguranca', 'Guarda', 'guarda', true),
(45, 'Público', 'publico', 'Trânsito e Segurança', 'transito-e-seguranca', 'Defesa', 'defesa', true),
(46, 'Público', 'publico', 'Urbanismo e Habitação', 'urbanismo-e-habitacao', 'Zoneamento', 'zoneamento', true),
(47, 'Público', 'publico', 'Urbanismo e Habitação', 'urbanismo-e-habitacao', 'Cadastro', 'cadastro', true),
(48, 'Público', 'publico', 'Urbanismo e Habitação', 'urbanismo-e-habitacao', 'Regularização', 'regularizacao', true),
(49, 'Público', 'publico', 'Urbanismo e Habitação', 'urbanismo-e-habitacao', 'Habitação', 'habitacao', true),
(50, 'Público', 'publico', 'Cultura, Esporte e Lazer', 'cultura-esporte-e-lazer', 'Cultura', 'cultura', true),
(51, 'Público', 'publico', 'Cultura, Esporte e Lazer', 'cultura-esporte-e-lazer', 'Teatros', 'teatros', true),
(52, 'Público', 'publico', 'Cultura, Esporte e Lazer', 'cultura-esporte-e-lazer', 'Museus', 'museus', true),
(53, 'Público', 'publico', 'Cultura, Esporte e Lazer', 'cultura-esporte-e-lazer', 'Ginásios', 'ginasios', true),
(54, 'Público', 'publico', 'Cultura, Esporte e Lazer', 'cultura-esporte-e-lazer', 'Quadras', 'quadras', true),
(55, 'Público', 'publico', 'Cultura, Esporte e Lazer', 'cultura-esporte-e-lazer', 'Estádios', 'estadios', true),
(56, 'Público', 'publico', 'Administração e Transparência', 'administracao-e-transparencia', 'Prefeitura', 'prefeitura', true),
(57, 'Público', 'publico', 'Administração e Transparência', 'administracao-e-transparencia', 'Protocolo', 'protocolo', true),
(58, 'Público', 'publico', 'Administração e Transparência', 'administracao-e-transparencia', 'Ouvidoria', 'ouvidoria', true),
(59, 'Público', 'publico', 'Administração e Transparência', 'administracao-e-transparencia', 'Transparência', 'transparencia', true),
(60, 'Público', 'publico', 'Administração e Transparência', 'administracao-e-transparencia', 'Licitações', 'licitacoes', true),
(61, 'Público', 'publico', 'Administração e Transparência', 'administracao-e-transparencia', 'Legislação', 'legislacao', true),
(62, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Restaurantes', 'restaurantes', true),
(63, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Lanchonetes', 'lanchonetes', true),
(64, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Hamburguerias', 'hamburguerias', true),
(65, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Pizzarias', 'pizzarias', true),
(66, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Pastelarias', 'pastelarias', true),
(67, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Bares', 'bares', true),
(68, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Choperias', 'choperias', true),
(69, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Padarias', 'padarias', true),
(70, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Confeitarias', 'confeitarias', true),
(71, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Cafeterias', 'cafeterias', true),
(72, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Sorveterias', 'sorveterias', true),
(73, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Açaiterias', 'acaiterias', true),
(74, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Chocolaterias', 'chocolaterias', true),
(75, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Supermercados', 'supermercados', true),
(76, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Mercearias', 'mercearias', true),
(77, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Hortifrutis', 'hortifrutis', true),
(78, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Açougues', 'acougues', true),
(79, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Peixarias', 'peixarias', true),
(80, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Empórios', 'emporios', true),
(81, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Distribuidoras', 'distribuidoras', true),
(82, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Adegas', 'adegas', true),
(83, 'Privado', 'privado', 'Alimentação', 'alimentacao', 'Conveniências', 'conveniencias', true),
(84, 'Privado', 'privado', 'Saúde', 'saude', 'Clínicas', 'clinicas', true),
(85, 'Privado', 'privado', 'Saúde', 'saude', 'Consultórios', 'consultorios', true),
(86, 'Privado', 'privado', 'Saúde', 'saude', 'Médicos', 'medicos', true),
(87, 'Privado', 'privado', 'Saúde', 'saude', 'Dentistas', 'dentistas', true),
(88, 'Privado', 'privado', 'Saúde', 'saude', 'Fisioterapia', 'fisioterapia', true),
(89, 'Privado', 'privado', 'Saúde', 'saude', 'Psicologia', 'psicologia', true),
(90, 'Privado', 'privado', 'Saúde', 'saude', 'Fonoaudiologia', 'fonoaudiologia', true),
(91, 'Privado', 'privado', 'Saúde', 'saude', 'Nutrição', 'nutricao', true),
(92, 'Privado', 'privado', 'Saúde', 'saude', 'Farmácias', 'farmacias', true),
(93, 'Privado', 'privado', 'Saúde', 'saude', 'Manipulação', 'manipulacao', true),
(94, 'Privado', 'privado', 'Saúde', 'saude', 'Laboratórios', 'laboratorios', true),
(95, 'Privado', 'privado', 'Saúde', 'saude', 'Óticas', 'oticas', true),
(96, 'Privado', 'privado', 'Saúde', 'saude', 'Acupuntura', 'acupuntura', true),
(97, 'Privado', 'privado', 'Saúde', 'saude', 'Quiropraxia', 'quiropraxia', true),
(98, 'Privado', 'privado', 'Saúde', 'saude', 'Pilates', 'pilates', true),
(99, 'Privado', 'privado', 'Saúde', 'saude', 'Spas', 'spas', true),
(100, 'Privado', 'privado', 'Beleza', 'beleza', 'Salões', 'saloes', true),
(101, 'Privado', 'privado', 'Beleza', 'beleza', 'Barbearias', 'barbearias', true),
(102, 'Privado', 'privado', 'Beleza', 'beleza', 'Manicures', 'manicures', true),
(103, 'Privado', 'privado', 'Beleza', 'beleza', 'Sobrancelhas', 'sobrancelhas', true),
(104, 'Privado', 'privado', 'Beleza', 'beleza', 'Depilação', 'depilacao', true),
(105, 'Privado', 'privado', 'Beleza', 'beleza', 'Bronzeamento', 'bronzeamento', true),
(106, 'Privado', 'privado', 'Beleza', 'beleza', 'Tatuagens', 'tatuagens', true),
(107, 'Privado', 'privado', 'Beleza', 'beleza', 'Perfumarias', 'perfumarias', true),
(108, 'Privado', 'privado', 'Beleza', 'beleza', 'Cosméticos', 'cosmeticos', true),
(109, 'Privado', 'privado', 'Moda', 'moda', 'Roupas', 'roupas', true),
(110, 'Privado', 'privado', 'Moda', 'moda', 'Calçados', 'calcados', true),
(111, 'Privado', 'privado', 'Moda', 'moda', 'Bolsas', 'bolsas', true),
(112, 'Privado', 'privado', 'Moda', 'moda', 'Relojoarias', 'relojoarias', true),
(113, 'Privado', 'privado', 'Moda', 'moda', 'Joalherias', 'joalherias', true),
(114, 'Privado', 'privado', 'Moda', 'moda', 'Bijuterias', 'bijuterias', true),
(115, 'Privado', 'privado', 'Moda', 'moda', 'Costureiras', 'costureiras', true),
(116, 'Privado', 'privado', 'Moda', 'moda', 'Alfaiatarias', 'alfaiatarias', true),
(117, 'Privado', 'privado', 'Moda', 'moda', 'Lavanderias', 'lavanderias', true),
(118, 'Privado', 'privado', 'Moda', 'moda', 'Sapatarias', 'sapatarias', true),
(119, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Depósitos', 'depositos', true),
(120, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Madeireiras', 'madeireiras', true),
(121, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Vidraçarias', 'vidracarias', true),
(122, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Marmorarias', 'marmorarias', true),
(123, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Tintas', 'tintas', true),
(124, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Pisos', 'pisos', true),
(125, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Elétrica', 'eletrica', true),
(126, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Hidráulica', 'hidraulica', true),
(127, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Móveis', 'moveis', true),
(128, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Colchões', 'colchoes', true),
(129, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Eletrodomésticos', 'eletrodomesticos', true),
(130, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Utilidades', 'utilidades', true),
(131, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Floriculturas', 'floriculturas', true),
(132, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Jardinagem', 'jardinagem', true),
(133, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Arquitetos', 'arquitetos', true),
(134, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Engenheiros', 'engenheiros', true),
(135, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Empreiteiros', 'empreiteiros', true),
(136, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Pedreiros', 'pedreiros', true),
(137, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Eletricistas', 'eletricistas', true),
(138, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Encanadores', 'encanadores', true),
(139, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Pintores', 'pintores', true),
(140, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Marceneiros', 'marceneiros', true),
(141, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Serralheiros', 'serralheiros', true),
(142, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Dedetizadoras', 'dedetizadoras', true),
(143, 'Privado', 'privado', 'Construção e Casa', 'construcao-e-casa', 'Piscinas', 'piscinas', true),
(144, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Concessionárias', 'concessionarias', true),
(145, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Revendas', 'revendas', true),
(146, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Motos', 'motos', true),
(147, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Bicicletas', 'bicicletas', true),
(148, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Autopeças', 'autopecas', true),
(149, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Motopeças', 'motopecas', true),
(150, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Pneus', 'pneus', true),
(151, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Baterias', 'baterias', true),
(152, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Mecânicas', 'mecanicas', true),
(153, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Autoelétricas', 'autoeletricas', true),
(154, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Funilarias', 'funilarias', true),
(155, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Borracharias', 'borracharias', true),
(156, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Alinhamento', 'alinhamento', true),
(157, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Lava-jatos', 'lava-jatos', true),
(158, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Postos', 'postos', true),
(159, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Estacionamentos', 'estacionamentos', true),
(160, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Guinchos', 'guinchos', true),
(161, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Autoescolas', 'autoescolas', true),
(162, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Despachantes', 'despachantes', true),
(163, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Locadoras', 'locadoras', true),
(164, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Transportadoras', 'transportadoras', true),
(165, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Fretes', 'fretes', true),
(166, 'Privado', 'privado', 'Veículos e Mobilidade', 'veiculos-e-mobilidade', 'Motoboys', 'motoboys', true),
(167, 'Privado', 'privado', 'Tecnologia e Comunicação', 'tecnologia-e-comunicacao', 'Celulares', 'celulares', true),
(168, 'Privado', 'privado', 'Tecnologia e Comunicação', 'tecnologia-e-comunicacao', 'Informática', 'informatica', true),
(169, 'Privado', 'privado', 'Tecnologia e Comunicação', 'tecnologia-e-comunicacao', 'Eletrônicos', 'eletronicos', true),
(170, 'Privado', 'privado', 'Tecnologia e Comunicação', 'tecnologia-e-comunicacao', 'Games', 'games', true),
(171, 'Privado', 'privado', 'Tecnologia e Comunicação', 'tecnologia-e-comunicacao', 'Assistências', 'assistencias', true),
(172, 'Privado', 'privado', 'Tecnologia e Comunicação', 'tecnologia-e-comunicacao', 'Provedores', 'provedores', true),
(173, 'Privado', 'privado', 'Tecnologia e Comunicação', 'tecnologia-e-comunicacao', 'Segurança', 'seguranca', true),
(174, 'Privado', 'privado', 'Tecnologia e Comunicação', 'tecnologia-e-comunicacao', 'Automação', 'automacao', true),
(175, 'Privado', 'privado', 'Tecnologia e Comunicação', 'tecnologia-e-comunicacao', 'Gráficas', 'graficas', true),
(176, 'Privado', 'privado', 'Tecnologia e Comunicação', 'tecnologia-e-comunicacao', 'Placas', 'placas', true),
(177, 'Privado', 'privado', 'Tecnologia e Comunicação', 'tecnologia-e-comunicacao', 'Marketing', 'marketing', true),
(178, 'Privado', 'privado', 'Tecnologia e Comunicação', 'tecnologia-e-comunicacao', 'Produtoras', 'produtoras', true),
(179, 'Privado', 'privado', 'Tecnologia e Comunicação', 'tecnologia-e-comunicacao', 'Rádios', 'radios', true),
(180, 'Privado', 'privado', 'Tecnologia e Comunicação', 'tecnologia-e-comunicacao', 'Portais', 'portais', true),
(181, 'Privado', 'privado', 'Serviços Profissionais e Finanças', 'servicos-profissionais-e-financas', 'Advocacia', 'advocacia', true),
(182, 'Privado', 'privado', 'Serviços Profissionais e Finanças', 'servicos-profissionais-e-financas', 'Contabilidade', 'contabilidade', true),
(183, 'Privado', 'privado', 'Serviços Profissionais e Finanças', 'servicos-profissionais-e-financas', 'Consultoria', 'consultoria', true),
(184, 'Privado', 'privado', 'Serviços Profissionais e Finanças', 'servicos-profissionais-e-financas', 'Recrutamento', 'recrutamento', true),
(185, 'Privado', 'privado', 'Serviços Profissionais e Finanças', 'servicos-profissionais-e-financas', 'Bancos', 'bancos', true),
(186, 'Privado', 'privado', 'Serviços Profissionais e Finanças', 'servicos-profissionais-e-financas', 'Cooperativas', 'cooperativas', true),
(187, 'Privado', 'privado', 'Serviços Profissionais e Finanças', 'servicos-profissionais-e-financas', 'Seguros', 'seguros', true),
(188, 'Privado', 'privado', 'Serviços Profissionais e Finanças', 'servicos-profissionais-e-financas', 'Consórcios', 'consorcios', true),
(189, 'Privado', 'privado', 'Serviços Profissionais e Finanças', 'servicos-profissionais-e-financas', 'Financeiras', 'financeiras', true),
(190, 'Privado', 'privado', 'Serviços Profissionais e Finanças', 'servicos-profissionais-e-financas', 'Imobiliárias', 'imobiliarias', true),
(191, 'Privado', 'privado', 'Serviços Profissionais e Finanças', 'servicos-profissionais-e-financas', 'Corretores', 'corretores', true),
(192, 'Privado', 'privado', 'Serviços Profissionais e Finanças', 'servicos-profissionais-e-financas', 'Condomínios', 'condominios', true),
(193, 'Privado', 'privado', 'Serviços Profissionais e Finanças', 'servicos-profissionais-e-financas', 'Cartórios', 'cartorios', true),
(194, 'Privado', 'privado', 'Serviços Profissionais e Finanças', 'servicos-profissionais-e-financas', 'Tradutores', 'tradutores', true),
(195, 'Privado', 'privado', 'Serviços Profissionais e Finanças', 'servicos-profissionais-e-financas', 'Coworkings', 'coworkings', true),
(196, 'Privado', 'privado', 'Serviços Profissionais e Finanças', 'servicos-profissionais-e-financas', 'Limpeza', 'limpeza', true),
(197, 'Privado', 'privado', 'Serviços Profissionais e Finanças', 'servicos-profissionais-e-financas', 'Vigilância', 'vigilancia', true),
(198, 'Privado', 'privado', 'Educação', 'educacao', 'Escolas', 'escolas', true),
(199, 'Privado', 'privado', 'Educação', 'educacao', 'Faculdades', 'faculdades', true),
(200, 'Privado', 'privado', 'Educação', 'educacao', 'Idiomas', 'idiomas', true),
(201, 'Privado', 'privado', 'Educação', 'educacao', 'Profissionalizantes', 'profissionalizantes', true),
(202, 'Privado', 'privado', 'Educação', 'educacao', 'Reforço', 'reforco', true),
(203, 'Privado', 'privado', 'Educação', 'educacao', 'Música', 'musica', true),
(204, 'Privado', 'privado', 'Educação', 'educacao', 'Artes', 'artes', true),
(205, 'Privado', 'privado', 'Agropecuária e Pets', 'agropecuaria-e-pets', 'Petshops', 'petshops', true),
(206, 'Privado', 'privado', 'Agropecuária e Pets', 'agropecuaria-e-pets', 'Veterinárias', 'veterinarias', true),
(207, 'Privado', 'privado', 'Agropecuária e Pets', 'agropecuaria-e-pets', 'Banho/Tosa', 'banhotosa', true),
(208, 'Privado', 'privado', 'Agropecuária e Pets', 'agropecuaria-e-pets', 'Adestramento', 'adestramento', true),
(209, 'Privado', 'privado', 'Agropecuária e Pets', 'agropecuaria-e-pets', 'Agropecuárias', 'agropecuarias', true),
(210, 'Privado', 'privado', 'Agropecuária e Pets', 'agropecuaria-e-pets', 'Insumos', 'insumos', true),
(211, 'Privado', 'privado', 'Agropecuária e Pets', 'agropecuaria-e-pets', 'Sementes', 'sementes', true),
(212, 'Privado', 'privado', 'Agropecuária e Pets', 'agropecuaria-e-pets', 'Rações', 'racoes', true),
(213, 'Privado', 'privado', 'Agropecuária e Pets', 'agropecuaria-e-pets', 'Maquinários', 'maquinarios', true),
(214, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Academias', 'academias', true),
(215, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Funcional', 'funcional', true),
(216, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Lutas', 'lutas', true),
(217, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Natação', 'natacao', true),
(218, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Quadras', 'quadras', true),
(219, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Esportivos', 'esportivos', true),
(220, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Pesca', 'pesca', true),
(221, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Papelarias', 'papelarias', true),
(222, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Livrarias', 'livrarias', true),
(223, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Bancas', 'bancas', true),
(224, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Brinquedos', 'brinquedos', true),
(225, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Hotéis', 'hoteis', true),
(226, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Pousadas', 'pousadas', true),
(227, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Motéis', 'moteis', true),
(228, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Turismo', 'turismo', true),
(229, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Buffets', 'buffets', true),
(230, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Decoração', 'decoracao', true),
(231, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Sonorização', 'sonorizacao', true),
(232, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Fotógrafos', 'fotografos', true),
(233, 'Privado', 'privado', 'Esporte, Lazer, Turismo e Eventos', 'esporte-lazer-turismo-e-eventos', 'Cerimonialistas', 'cerimonialistas', true),
(234, 'Privado', 'privado', 'Indústria e Atacado', 'industria-e-atacado', 'Fábricas', 'fabricas', true),
(235, 'Privado', 'privado', 'Indústria e Atacado', 'industria-e-atacado', 'Indústrias', 'industrias', true),
(236, 'Privado', 'privado', 'Indústria e Atacado', 'industria-e-atacado', 'Metalúrgicas', 'metalurgicas', true),
(237, 'Privado', 'privado', 'Indústria e Atacado', 'industria-e-atacado', 'Confecções', 'confeccoes', true),
(238, 'Privado', 'privado', 'Indústria e Atacado', 'industria-e-atacado', 'Atacadistas', 'atacadistas', true),
(239, 'Privado', 'privado', 'Indústria e Atacado', 'industria-e-atacado', 'Logística', 'logistica', true)
on conflict (id) do update set
  setor = excluded.setor,
  setor_slug = excluded.setor_slug,
  categoria = excluded.categoria,
  categoria_slug = excluded.categoria_slug,
  subcategoria = excluded.subcategoria,
  subcategoria_slug = excluded.subcategoria_slug,
  ativo = excluded.ativo;

-- Vitrine ganha subcategoria (texto livre, mas escolhida a partir da
-- taxonomia acima nas telas de edição). "categoria" já existia e
-- continua representando o nível "categoria" da taxonomia.
alter table estabelecimentos add column if not exists subcategoria text;

-- Views e RPCs públicas passam a expor subcategoria também, pra filtrar o
-- mapa por categoria + subcategoria (além de setor, via status_vitrine).
create or replace view estabelecimentos_publicos as
  select e.id, e.nome_fantasia, e.categoria, e.subcategoria, e.descricao,
         e.telefone_whatsapp, e.instagram_url, e.website_url,
         e.ecommerce_url, e.logo_url, e.horarios,
         l.lote_id, l.numero_licenca
  from estabelecimentos e
  join licencas l on l.id = e.licenca_id
  where l.status = 'ativa'
    and (l.data_fim is null or l.data_fim >= current_date);

grant select on estabelecimentos_publicos to anon, authenticated;

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
  subcategoria text,
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
    ep.nome_fantasia, ep.categoria, ep.subcategoria, lr.numero_licenca,
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

drop function if exists vitrines_cidade(text);

create function vitrines_cidade(p_cidade text)
returns table (
  lote_id uuid,
  numero_licenca bigint,
  nome_fantasia text,
  categoria text,
  subcategoria text,
  tipo text,
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
  select lo.id, ep.numero_licenca, ep.nome_fantasia, ep.categoria, ep.subcategoria, l.tipo, l.andar, l.sala,
         lo.endereco, lo.numero, lo.bairro, lo.complemento, lo.cep, lo.latitude, lo.longitude
  from lotes lo
  join estabelecimentos_publicos ep on ep.lote_id = lo.id
  join licencas l on l.numero_licenca = ep.numero_licenca
  where lo.cidade = p_cidade
  order by ep.nome_fantasia;
$$;

grant execute on function vitrines_cidade(text) to anon, authenticated;

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
      ep.nome_fantasia, ep.categoria, ep.subcategoria, lr.numero_licenca,
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
      'features', coalesce(jsonb_agg(
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
            'subcategoria', b.subcategoria,
            'numero_licenca', b.numero_licenca,
            'total_vitrines', b.total_vitrines,
            'latitude', b.latitude,
            'longitude', b.longitude
          )
        )
      ), '[]'::jsonb)
    ),
    jsonb_build_object('type', 'FeatureCollection', 'features', '[]'::jsonb)
  )
  from base b;
$$;

grant execute on function lotes_geojson(text, double precision, double precision, double precision, double precision)
  to anon, authenticated;

drop function if exists vitrines_do_lote(uuid);

create function vitrines_do_lote(p_lote_id uuid)
returns table (
  licenca_id uuid,
  numero_licenca bigint,
  andar int,
  sala int,
  nome_fantasia text,
  categoria text,
  subcategoria text
)
language sql stable security invoker set search_path = public as $$
  select l.id, l.numero_licenca, l.andar, l.sala, e.nome_fantasia, e.categoria, e.subcategoria
  from licencas l
  join estabelecimentos e on e.licenca_id = l.id
  where l.lote_id = p_lote_id
    and l.status = 'ativa'
    and (l.data_fim is null or l.data_fim >= current_date)
  order by l.andar nulls first, l.sala nulls first;
$$;

grant execute on function vitrines_do_lote(uuid) to anon, authenticated;
