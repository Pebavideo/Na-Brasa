import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Mesas } from './pages/Mesas'
import { Comanda } from './pages/Comanda'
import { MesaPublica } from './pages/MesaPublica'
import { Caixa } from './pages/Caixa'
import { Admin } from './pages/Admin'
import { PrivacyPolicy } from './pages/PrivacyPolicy'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/mesa/:mesaId" element={<MesaPublica />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />

          {/* Rotas operacionais (equipe autenticada) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/mesas" element={<Mesas />} />
              <Route path="/comanda/:mesaId" element={<Comanda />} />
            </Route>
          </Route>

          {/* Rotas exclusivas do super admin */}
          <Route element={<AdminRoute />}>
            <Route element={<Layout />}>
              <Route path="/caixa" element={<Caixa />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/mesas" replace />} />
          <Route path="*" element={<Navigate to="/mesas" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
