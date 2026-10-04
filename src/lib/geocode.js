/**
 * Geocodificação via Nominatim (OpenStreetMap) — gratuito, sem chave de API.
 * Uso respeitoso: no máximo ~1 requisição por segundo (uso humano, não em lote).
 */
export async function geocodarEndereco(consulta) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', consulta);
  url.searchParams.set('countrycodes', 'br');
  url.searchParams.set('limit', '1');

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Falha ao consultar geocodificação');
  const dados = await res.json();
  if (!dados.length) return null;

  const { lat, lon, display_name } = dados[0];
  return { lat: Number(lat), lng: Number(lon), nomeExibicao: display_name };
}

// Títulos comuns no nome oficial dos Correios que costumam faltar no OpenStreetMap
// (ex.: CEP diz "Rua Engenheiro Hans Klotz", OSM só tem "Rua Hans Klotz").
const TITULOS = [
  'Engenheiro', 'Doutor', 'Dr', 'Professor', 'Prof', 'Capitão', 'Coronel', 'Cel',
  'Comendador', 'Monsenhor', 'Major', 'General', 'Padre', 'Tenente', 'Sargento',
];
const REGEX_TITULO = new RegExp(
  `^(Rua|Avenida|Av\\.?|Travessa|Alameda|Estrada)\\s+(${TITULOS.join('|')})\\.?\\s+`,
  'i'
);

function semTitulo(endereco) {
  const sem = endereco.replace(REGEX_TITULO, '$1 ');
  return sem !== endereco ? sem : null;
}

/**
 * Tenta geocodificar um endereço com variações progressivamente mais simples,
 * já que nomes oficiais (Correios) às vezes não batem exatamente com o OSM.
 */
export async function geocodarComFallback({ endereco, numero, bairro, cidade, uf }) {
  const base = [endereco, cidade, uf].filter(Boolean).join(', ');
  const semTit = semTitulo(endereco);

  const tentativas = [
    [endereco, numero, bairro, cidade, uf],
    [endereco, numero, cidade, uf],
    [endereco, cidade, uf],
    semTit && [semTit, numero, cidade, uf],
    semTit && [semTit, cidade, uf],
  ]
    .filter(Boolean)
    .map((partes) => partes.filter(Boolean).join(', '));

  // remove duplicadas mantendo a ordem (da mais precisa pra mais simples)
  const unicas = [...new Set(tentativas)];

  for (const consulta of unicas) {
    const r = await geocodarEndereco(consulta);
    if (r) return r;
    // respeita o limite de ~1 req/s do Nominatim entre tentativas
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }
  return null;
}
