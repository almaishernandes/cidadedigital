import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { MapPinned, LogOut, Store, ShieldCheck, FileText, Menu, X, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/supabase/AuthContext.jsx';

const linkCls = ({ isActive }) =>
  `px-3 py-1.5 rounded text-sm ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`;

const ROTULO_PERFIL = {
  admin: 'Suporte',
  comerciante: 'Cliente · Consumidor',
  visitante: 'Consumidor',
};

export default function Layout() {
  const { usuario, perfil, ehAdmin, sair } = useAuth();
  const nav = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  // Só fecha pra essa visita (sessão da aba) — não salva no navegador, porque
  // esse aviso é a forma de monetização do app: tem que voltar a aparecer
  // toda vez que um visitante/consumidor entrar, até ele virar comerciante
  // pagante (perfil.funcao deixa de ser 'visitante', e aí some de vez).
  const [avisoFechado, setAvisoFechado] = useState(false);
  const mostrarAviso = usuario && perfil?.funcao === 'visitante' && !avisoFechado;

  function fecharAviso() {
    setAvisoFechado(true);
  }

  async function sairEFechar() {
    setMenuAberto(false);
    await sair();
    nav('/');
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-nowrap items-center gap-2 border-b bg-white px-3 py-2 sm:overflow-x-auto sm:px-4">
        <Link to="/" className="hidden shrink-0 items-center gap-2 font-semibold sm:flex">
          <MapPinned size={18} className="text-blue-600" />
          <span className="hidden sm:inline">Cidade Digital</span>
        </Link>
        <nav className="hidden shrink-0 items-center gap-1 sm:flex">
          <NavLink to="/" className={linkCls} end>
            Mapa
          </NavLink>
          {usuario && perfil?.funcao !== 'visitante' && (
            <NavLink to="/painel" className={linkCls}>
              <span className="inline-flex items-center gap-1">
                <Store size={14} /> Vitrines
              </span>
            </NavLink>
          )}
          {ehAdmin && (
            <NavLink to="/admin/licencas" className={linkCls}>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={14} /> Licenças
              </span>
            </NavLink>
          )}
          {usuario && (
            <NavLink to="/cotacoes" className={linkCls}>
              <span className="inline-flex items-center gap-1">
                <FileText size={14} /> Cotações
              </span>
            </NavLink>
          )}
        </nav>

        <NavLink to="/" end className="shrink-0 px-2 py-1.5 text-sm font-medium text-slate-700 sm:hidden">
          Mapa
        </NavLink>

        {/* Controles contextuais da página atual (ex.: cidade/modo do mapa) */}
        <div id="barra-contextual" className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none" />

        <div className="ml-auto hidden shrink-0 items-center gap-2 text-sm sm:flex sm:gap-3">
          {usuario ? (
            <>
              <span className="hidden max-w-[16rem] truncate text-slate-500 sm:inline">
                {perfil?.funcao && (
                  <span className="mr-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                    {ROTULO_PERFIL[perfil.funcao] ?? perfil.funcao}
                  </span>
                )}
                {perfil?.nome ?? usuario.email}
              </span>
              <button
                onClick={sairEFechar}
                className="inline-flex items-center gap-1 rounded border px-2 py-1 hover:bg-slate-100"
              >
                <LogOut size={14} /> Sair
              </button>
            </>
          ) : (
            <Link to="/entrar" className="shrink-0 rounded bg-blue-600 px-3 py-1.5 text-white">
              Entrar
            </Link>
          )}
        </div>

        {/* Menu "☰" — só no celular, guarda os acessos que somem do cabeçalho principal. */}
        <button
          onClick={() => setMenuAberto(true)}
          className="ml-auto shrink-0 rounded p-1.5 text-slate-600 hover:bg-slate-100 sm:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {mostrarAviso && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b bg-amber-50 px-3 py-1.5 text-xs text-amber-900 sm:px-4 sm:text-sm">
          <Sparkles size={14} className="shrink-0 text-amber-600" />
          <span>
            Você tem livre acesso ao app pra visitar a Cidade Digital e fazer compras através das
            cotações que desejar. A qualquer momento você pode se tornar um comerciante (vender o
            seu produto aqui).
          </span>
          <Link
            to="/como-funciona"
            onClick={fecharAviso}
            className="shrink-0 font-semibold underline hover:no-underline"
          >
            Clique aqui para mais informações
          </Link>
          <button
            onClick={fecharAviso}
            className="ml-auto shrink-0 rounded p-0.5 text-amber-700 hover:bg-amber-100"
            aria-label="Fechar aviso"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {menuAberto && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuAberto(false)} />
          <div className="absolute right-0 top-0 flex h-full w-64 flex-col gap-1 bg-white p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold">
                <MapPinned size={18} className="text-blue-600" /> Cidade Digital
              </span>
              <button
                onClick={() => setMenuAberto(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Fechar menu"
              >
                <X size={18} />
              </button>
            </div>

            {usuario && perfil?.funcao !== 'visitante' && (
              <NavLink to="/painel" className={linkCls} onClick={() => setMenuAberto(false)}>
                <span className="inline-flex items-center gap-1">
                  <Store size={14} /> Vitrines
                </span>
              </NavLink>
            )}
            {ehAdmin && (
              <NavLink to="/admin/licencas" className={linkCls} onClick={() => setMenuAberto(false)}>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck size={14} /> Licenças
                </span>
              </NavLink>
            )}
            {usuario && (
              <NavLink to="/cotacoes" className={linkCls} onClick={() => setMenuAberto(false)}>
                <span className="inline-flex items-center gap-1">
                  <FileText size={14} /> Cotações
                </span>
              </NavLink>
            )}

            <div className="mt-auto border-t pt-3">
              {usuario ? (
                <>
                  <p className="mb-2 truncate text-sm text-slate-500">
                    {perfil?.funcao && (
                      <span className="mr-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                        {ROTULO_PERFIL[perfil.funcao] ?? perfil.funcao}
                      </span>
                    )}
                    {perfil?.nome ?? usuario.email}
                  </p>
                  <button
                    onClick={sairEFechar}
                    className="inline-flex w-full items-center justify-center gap-1 rounded border px-2 py-1.5 hover:bg-slate-100"
                  >
                    <LogOut size={14} /> Sair
                  </button>
                </>
              ) : (
                <Link
                  to="/entrar"
                  onClick={() => setMenuAberto(false)}
                  className="block rounded bg-blue-600 px-3 py-1.5 text-center text-white"
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="relative min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
