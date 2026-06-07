import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { Card, PageHeader, Spinner, ErrorMessage } from '../components/ui'

interface DashboardData {
  propostas: {
    em_aberto: number
    enviadas: number
    habilitadas: number
    vencidas: number
    perdidas: number
    total_valor_vencido: number
  }
  editais: {
    novos: number
  }
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard')).data,
  })

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage message="Não foi possível carregar o dashboard." />
  if (!data) return null

  const cards = [
    { label: 'Editais novos', value: data.editais.novos, color: 'text-blue-600' },
    { label: 'Propostas em aberto', value: data.propostas.em_aberto, color: 'text-amber-600' },
    { label: 'Propostas enviadas', value: data.propostas.enviadas, color: 'text-indigo-600' },
    { label: 'Habilitadas', value: data.propostas.habilitadas, color: 'text-cyan-600' },
    { label: 'Vencidas', value: data.propostas.vencidas, color: 'text-green-600' },
    { label: 'Perdidas', value: data.propostas.perdidas, color: 'text-red-600' },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Resumo geral do sistema" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className={`text-3xl font-semibold mt-1 ${c.color}`}>{c.value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <p className="text-sm text-gray-500">Valor total vencido</p>
        <p className="text-3xl font-semibold mt-1 text-emerald-700">
          {formatCurrency(data.propostas.total_valor_vencido)}
        </p>
      </Card>
    </div>
  )
}
