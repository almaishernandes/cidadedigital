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
