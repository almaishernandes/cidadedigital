import { Link } from 'react-router-dom';
import { MapPinned, Search, FileText, Store, ShieldCheck, Sparkles } from 'lucide-react';

const PASSOS = [
  {
    Icone: FileText,
    titulo: '1. Solicite uma licença',
    texto:
      'Em "Minha vitrine", escolha o tipo Comercial e informe o endereço do seu negócio (ou localize no mapa). O pedido fica pendente até o Suporte confirmar.',
  },
  {
    Icone: ShieldCheck,
    titulo: '2. Aguarde a ativação',
    texto:
      'O Suporte confirma o pagamento e ativa sua licença. A partir daí seu espaço já aparece marcado no mapa físico da cidade.',
  },
  {
    Icone: Store,
    titulo: '3. Monte sua vitrine',
    texto:
      'Preencha nome fantasia, categoria, WhatsApp, Instagram, site e logo. É o que os visitantes veem ao clicar no seu espaço no mapa.',
  },
  {
    Icone: Sparkles,
    titulo: '4. Cadastre seu catálogo',
    texto:
      'Adicione produtos ou serviços com nome, preço, foto e descrição. Eles ficam visíveis pra quem visitar sua vitrine.',
  },
  {
    Icone: FileText,
    titulo: '5. Receba cotações',
    texto:
      'Consumidores podem pedir cotação dos seus produtos direto pela vitrine. Você responde com preço e condições, tudo dentro do app.',
  },
];

export default function ComoFunciona() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <MapPinned className="text-blue-600" size={22} /> O que é a Cidade Digital
        </h1>
        <p className="mt-2 text-slate-600">
          A Cidade Digital é o mapa online da sua cidade: cada lote físico pode ter uma vitrine
          digital — a versão online do comércio, do serviço público ou do profissional que ocupa
          aquele espaço. Qualquer pessoa pode navegar pelo mapa, conhecer os estabelecimentos e
          pedir cotação de produtos, sem precisar de cadastro de comerciante.
        </p>
      </div>

      <div>
        <h2 className="mb-1 flex items-center gap-2 font-semibold">
          <Search size={18} className="text-blue-600" /> Como visitante
        </h2>
        <p className="text-slate-600">
          Você já tem acesso livre: explore o mapa (modo Físico ou Digital), veja os detalhes de
          cada vitrine e peça cotação dos produtos que quiser. Não tem custo nenhum.
        </p>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <Store size={18} className="text-blue-600" /> Como criar sua vitrine (virar comerciante)
        </h2>
        <ul className="space-y-3">
          {PASSOS.map(({ Icone, titulo, texto }) => (
            <li key={titulo} className="flex gap-3 rounded-lg border p-3">
              <Icone size={18} className="mt-0.5 shrink-0 text-blue-600" />
              <div>
                <p className="font-medium">{titulo}</p>
                <p className="text-sm text-slate-600">{texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Link
        to="/painel"
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        <Store size={16} /> Quero criar minha vitrine
      </Link>
    </div>
  );
}
