import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useConfiguracoes } from '../hooks/useConfiguracoes'

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-orange-600 text-white' : 'text-zinc-600 hover:bg-zinc-100'
  }`

export function Layout() {
  const { isSuperAdmin, atendente, limparAtendente, logout } = useAuth()
  const { config } = useConfiguracoes()

  return (
    <div className="flex min-h-svh flex-col bg-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight text-orange-600">
              {config?.nomeLoja ?? 'Na Brasa'}
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <NavLink to="/mesas" className={linkClasses}>
              Mesas
            </NavLink>
            {isSuperAdmin && (
              <>
                <NavLink to="/caixa" className={linkClasses}>
                  Caixa
                </NavLink>
                <NavLink to="/admin" className={linkClasses}>
                  Admin
                </NavLink>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {atendente && (
              <button
                type="button"
                onClick={limparAtendente}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600"
                title="Trocar atendente"
              >
                👤 {atendente}
              </button>
            )}
            <button
              type="button"
              onClick={() => void logout()}
              className="text-xs font-semibold text-zinc-400 hover:text-red-500"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4">
        <Outlet />
      </main>
    </div>
  )
}
