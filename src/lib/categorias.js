// Categorias por tipo de licença — são a divisão (dentro de comercial/pública)
// que ajuda a identificar o tipo de estabelecimento. Residencial não tem
// licença/vitrine, então não entra aqui.
export const CATEGORIAS_POR_TIPO = {
  comercial: [
    'Alimentação',
    'Vestuário e Calçados',
    'Beleza e Estética',
    'Saúde e Bem-estar',
    'Serviços Profissionais',
    'Comércio em Geral',
    'Construção e Reforma',
    'Tecnologia',
    'Automotivo',
    'Educação Particular',
    'Pet Shop e Veterinária',
    'Lazer e Entretenimento',
    'Imobiliária',
    'Agropecuária',
  ],
  publica: [
    'Administração Pública',
    'Justiça',
    'Segurança',
    'Serviços Públicos',
    'Saúde',
    'Educação',
    'Transporte',
    'Lazer e Cultura',
    'Esporte e Lazer',
    'Assistência Social',
  ],
};

export function categoriasDoTipo(tipo) {
  return CATEGORIAS_POR_TIPO[tipo] ?? CATEGORIAS_POR_TIPO.comercial;
}
