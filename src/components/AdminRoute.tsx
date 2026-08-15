import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loading } from './Loading'
import { PinGerenteGate } from './PinGerenteGate'

/**
 * Guarda de acesso do Painel Admin: qualquer usuário autenticado no Firebase
 * pode entrar (independente de ser o e-mail do super admin ou um operador),
 * já que é aqui que a loja é configurada no primeiro uso — cardápio, Pix e
 * atendentes. A proteção fica a cargo do PIN de Gerente (PinGerenteGate),
 * que só é exigido se já houver um PIN configurado no documento da loja;
 * sem PIN configurado, o acesso é liberado direto para permitir a
 * configuração inicial. O Caixa (dados financeiros consolidados) continua
 * exclusivo do super admin — ver CaixaRoute.
 */
export function AdminRoute() {
  const { user, loading } = useAuth()

  if (loading) return <Loading texto="Verificando sessão..." />
  if (!user) return <Navigate to="/login" replace />

  return (
    <PinGerenteGate>
      <Outlet />
    </PinGerenteGate>
  )
}
