import { Link, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loading } from './Loading'
import { PinGerenteGate } from './PinGerenteGate'

/**
 * Guarda de acesso do Caixa: além de autenticado, exige ser o super admin da
 * loja (dados financeiros consolidados) — mais estrita que AdminRoute, que
 * libera qualquer usuário autenticado (protegido só pelo PIN de Gerente).
 */
export function CaixaRoute() {
  const { user, loading, isSuperAdmin } = useAuth()

  if (loading) return <Loading texto="Verificando sessão..." />
  if (!user) return <Navigate to="/login" replace />

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="text-4xl">🔒</span>
        <h1 className="text-lg font-bold text-zinc-900">Acesso restrito</h1>
        <p className="max-w-xs text-sm text-zinc-500">
          O Caixa é uma área exclusiva do administrador da loja.
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

  return (
    <PinGerenteGate>
      <Outlet />
    </PinGerenteGate>
  )
}
