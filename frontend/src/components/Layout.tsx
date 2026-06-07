import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/editais', label: 'Editais' },
  { to: '/busca', label: 'Perfil de busca' },
  { to: '/propostas', label: 'Propostas' },
  { to: '/impugnacoes', label: 'Impugnações' },
  { to: '/documentos', label: 'Documentos' },
  { to: '/folhas', label: 'Folha de Pagamento' },
]

export default function Layout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-slate-800">
          <h1 className="text-lg font-semibold">Licitações</h1>
          <p className="text-xs text-slate-400">Painel de automação</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white text-left"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
