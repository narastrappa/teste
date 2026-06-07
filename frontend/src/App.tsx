import { type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Editais from './pages/Editais'
import BuscaConfig from './pages/BuscaConfig'
import Propostas from './pages/Propostas'
import Impugnacoes from './pages/Impugnacoes'
import Documentos from './pages/Documentos'
import Folhas from './pages/Folhas'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="editais" element={<Editais />} />
          <Route path="busca" element={<BuscaConfig />} />
          <Route path="propostas" element={<Propostas />} />
          <Route path="impugnacoes" element={<Impugnacoes />} />
          <Route path="documentos" element={<Documentos />} />
          <Route path="folhas" element={<Folhas />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
