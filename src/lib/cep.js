/**
 * Consulta de CEP via ViaCEP (base de dados dos Correios) — gratuito, sem chave.
 */
export async function buscarCep(cep) {
  const limpo = String(cep ?? '').replace(/\D/g, '');
  if (limpo.length !== 8) throw new Error('CEP deve ter 8 dígitos');

  const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
  if (!res.ok) throw new Error('Falha ao consultar o CEP');
  const dados = await res.json();
  if (dados.erro) return null;

  return {
    cep: dados.cep,
    logradouro: dados.logradouro || '',
    bairro: dados.bairro || '',
    cidade: dados.localidade || '',
    uf: dados.uf || '',
  };
}

export function formatarCep(valor) {
  const d = String(valor ?? '').replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}
