import { useState } from 'react';
import { Upload, FileUp, Check, AlertTriangle } from 'lucide-react';
import { importarVitrinePublica } from '../lib/supabase/gestao.js';

// Parser simples de CSV (vírgula, com suporte a campos entre aspas).
function parseCsv(texto) {
  const linhas = texto
    .split(/\r\n|\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (linhas.length === 0) return [];

  function partirLinha(linha) {
    const campos = [];
    let atual = '';
    let dentroAspas = false;
    for (let i = 0; i < linha.length; i++) {
      const c = linha[i];
      if (c === '"') {
        dentroAspas = !dentroAspas;
      } else if (c === ',' && !dentroAspas) {
        campos.push(atual.trim());
        atual = '';
      } else {
        atual += c;
      }
    }
    campos.push(atual.trim());
    return campos;
  }

  const cabecalho = partirLinha(linhas[0]).map((c) => c.toLowerCase());
  return linhas.slice(1).map((linha) => {
    const campos = partirLinha(linha);
    const obj = {};
    cabecalho.forEach((nomeCampo, i) => {
      obj[nomeCampo] = campos[i] ?? '';
    });
    return obj;
  });
}

function mapearTipo(txt) {
  const t = (txt || '').trim().toLowerCase();
  return t.startsWith('com') ? 'comercial' : 'publica';
}

export default function ImportadorVitrines({ aoImportar }) {
  const [linhas, setLinhas] = useState([]);
  const [nomeArquivo, setNomeArquivo] = useState(null);
  const [erroArquivo, setErroArquivo] = useState(null);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState(null); // { ok, falhas: [{linha, erro}] }

  async function aoEscolherArquivo(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    setErroArquivo(null);
    setResultado(null);
    setNomeArquivo(arquivo.name);
    try {
      const texto = await arquivo.text();
      const registros = parseCsv(texto);
      const obrigatorios = ['nome', 'logradouro', 'cidade', 'latitude', 'longitude'];
      const faltando = obrigatorios.filter((c) => !(c in (registros[0] ?? {})));
      if (registros.length === 0 || faltando.length > 0) {
        setErroArquivo(
          `CSV precisa ter as colunas: nome, tipo_licenca, categoria, logradouro, numero, cep, cidade, latitude, longitude.` +
            (faltando.length ? ` Faltando: ${faltando.join(', ')}.` : '')
        );
        setLinhas([]);
        return;
      }
      setLinhas(registros);
    } catch (err) {
      setErroArquivo(`Não foi possível ler o arquivo: ${err.message}`);
      setLinhas([]);
    }
  }

  async function importarTudo() {
    setImportando(true);
    const falhas = [];
    let ok = 0;
    for (const [i, r] of linhas.entries()) {
      const lat = Number(String(r.latitude).replace(',', '.'));
      const lng = Number(String(r.longitude).replace(',', '.'));
      if (!r.nome?.trim() || !r.logradouro?.trim() || !r.cidade?.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        falhas.push({ linha: i + 2, erro: 'Dados obrigatórios ausentes ou coordenadas inválidas' });
        continue;
      }
      try {
        await importarVitrinePublica({
          cidade: r.cidade.trim(),
          endereco: r.logradouro.trim(),
          numero: r.numero?.trim(),
          cep: r.cep?.trim(),
          lat,
          lng,
          nome: r.nome.trim(),
          categoria: r.categoria?.trim(),
          tipo: mapearTipo(r.tipo_licenca),
        });
        ok += 1;
      } catch (err) {
        falhas.push({ linha: i + 2, erro: err.message });
      }
    }
    setImportando(false);
    setResultado({ ok, falhas });
    if (ok > 0) aoImportar?.();
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-2 flex items-center gap-1.5 font-semibold">
        <Upload size={16} /> Importar vitrines por CSV
      </h3>
      <p className="mb-3 text-sm text-slate-500">
        Colunas esperadas: <code>nome, tipo_licenca, categoria, logradouro, numero, cep, cidade, uf, latitude, longitude</code>.
        Cada linha vira um lote (ou reaproveita um já existente no mesmo endereço) com licença já ativa.
      </p>

      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
        <FileUp size={14} /> {nomeArquivo ?? 'Escolher arquivo CSV'}
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={aoEscolherArquivo} />
      </label>

      {erroArquivo && (
        <p className="mt-2 flex items-center gap-1 text-sm text-red-600">
          <AlertTriangle size={14} /> {erroArquivo}
        </p>
      )}

      {linhas.length > 0 && (
        <>
          <div className="mt-3 max-h-64 overflow-auto rounded border">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className="px-2 py-1">Nome</th>
                  <th className="px-2 py-1">Tipo</th>
                  <th className="px-2 py-1">Categoria</th>
                  <th className="px-2 py-1">Endereço</th>
                  <th className="px-2 py-1">Cidade</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {linhas.map((r, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1">{r.nome}</td>
                    <td className="px-2 py-1">{mapearTipo(r.tipo_licenca)}</td>
                    <td className="px-2 py-1">{r.categoria}</td>
                    <td className="px-2 py-1">
                      {r.logradouro}
                      {r.numero ? `, ${r.numero}` : ''}
                    </td>
                    <td className="px-2 py-1">{r.cidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={importarTudo}
            disabled={importando}
            className="mt-3 inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            <Check size={14} /> {importando ? `Importando…` : `Importar ${linhas.length} vitrines`}
          </button>
        </>
      )}

      {resultado && (
        <div className="mt-3 text-sm">
          <p className="text-green-700">{resultado.ok} importadas com sucesso.</p>
          {resultado.falhas.length > 0 && (
            <div className="mt-1 text-red-600">
              <p>{resultado.falhas.length} com erro:</p>
              <ul className="ml-4 list-disc">
                {resultado.falhas.map((f, i) => (
                  <li key={i}>
                    Linha {f.linha}: {f.erro}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
