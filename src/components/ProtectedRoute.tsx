import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loading } from './Loading'
import { AttendantSelector } from './AttendantSelector'

export function ProtectedRoute() {
  const { user, loading, atendente } = useAuth()

  if (loading) return <Loading texto="Verificando sessão..." />
  if (!user) return <Navigate to="/login" replace />
  if (!atendente) return <AttendantSelector />

  return <Outlet />
}
