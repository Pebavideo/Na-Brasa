import { Link, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loading } from './Loading'

export function AdminRoute() {
  const { user, loading, isSuperAdmin } = useAuth()

  if (loading) return <Loading texto="Verificando sessão..." />
  if (!user) return <Navigate to="/login" replace />

  // A rota /admin nunca é bloqueada por falta de atendente selecionado —
  // o único requisito aqui é ser o super admin da loja.
  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="text-4xl">🔒</span>
        <h1 className="text-lg font-bold text-zinc-900">Acesso restrito</h1>
        <p className="max-w-xs text-sm text-zinc-500">
          Esta área é exclusiva do administrador da loja.
        </p>
        <Link
          to="/mesas"
          className="mt-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Voltar para as mesas
        </Link>
      </div>
    )
  }

  return <Outlet />
}
