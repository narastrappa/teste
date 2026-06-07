import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Card, PageHeader, Spinner, ErrorMessage, EmptyState, Badge, Button } from '../components/ui'

interface Edital {
  id: string
  numero: string
  portal_origem: string
  orgao: string
  objeto: string
  modalidade: string
  status: string
  uf?: string
  municipio?: string
  valor_estimado?: number
  data_abertura?: string
  relevancia_score: number
}

interface EditalListResponse {
  items: Edital[]
  total: number
  page: number
  per_page: number
  pages: number
}

const statusColors: Record<string, 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple'> = {
  novo: 'blue',
  em_analise: 'yellow',
  proposta_enviada: 'purple',
  desclassificado: 'red',
  vencedor: 'green',
  perdedor: 'red',
}

function formatCurrency(value?: number) {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR')
}

export default function Editais() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<EditalListResponse>({
    queryKey: ['editais', page, statusFilter],
    queryFn: async () =>
      (
        await api.get('/editais', {
          params: { page, per_page: 20, status: statusFilter || undefined },
        })
      ).data,
  })

  const scraperMutation = useMutation({
    mutationFn: async () => (await api.post('/scraper/run', {})).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editais'] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.patch(`/editais/${id}/status`, { status })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['editais'] }),
  })

  function marcarInteressante(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    statusMutation.mutate({ id, status: 'em_analise' })
  }

  function marcarNaoInteressante(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    statusMutation.mutate({ id, status: 'desclassificado' })
  }

  // Enquanto a busca está em andamento, escondemos a lista antiga para não confundir
  // o usuário com resultados desatualizados — a lista é recarregada ao concluir.
  const buscando = scraperMutation.isPending

  return (
    <div>
      <PageHeader
        title="Editais"
        subtitle="Editais monitorados pelo sistema"
        actions={
          <div className="flex items-center gap-2">
            <Link to="/busca">
              <Button variant="secondary">Configurar perfil de busca</Button>
            </Link>
            <Button onClick={() => scraperMutation.mutate()} disabled={scraperMutation.isPending}>
              {scraperMutation.isPending ? 'Buscando...' : 'Buscar editais agora'}
            </Button>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">Todos os status</option>
              <option value="novo">Novo</option>
              <option value="em_analise">Em análise</option>
              <option value="proposta_enviada">Proposta enviada</option>
              <option value="desclassificado">Desclassificado</option>
              <option value="vencedor">Vencedor</option>
              <option value="perdedor">Perdedor</option>
            </select>
          </div>
        }
      />

      {scraperMutation.isSuccess && !buscando && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Busca concluída — a lista foi atualizada com os editais mais recentes.
        </div>
      )}
      {scraperMutation.isError && (
        <div className="mb-4">
          <ErrorMessage message="Não foi possível iniciar a busca. Verifique se o perfil de busca está configurado e ativo." />
        </div>
      )}

      {buscando && (
        <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
          Buscando novos editais... a lista será atualizada assim que a busca terminar.
        </div>
      )}

      {buscando && <Spinner />}

      {!buscando && isLoading && <Spinner />}
      {!buscando && error && <ErrorMessage message="Não foi possível carregar os editais." />}
      {!buscando && data && data.items.length === 0 && <EmptyState message="Nenhum edital encontrado." />}

      {!buscando && data && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((edital) => (
            <Card
              key={edital.id}
              className="cursor-pointer hover:border-slate-400 transition-colors"
            >
              <div
                className="flex items-start justify-between gap-4"
                onClick={() => navigate(`/editais/${edital.id}`)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-gray-900">{edital.numero}</h3>
                    <Badge color={statusColors[edital.status] ?? 'gray'}>{edital.status}</Badge>
                    <Badge color="gray">{edital.portal_origem}</Badge>
                    <Badge color="purple">relevância {edital.relevancia_score}%</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">{edital.orgao}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{edital.objeto}</p>
                  <div className="flex gap-4 text-xs text-gray-500 mt-2">
                    <span>UF: {edital.uf ?? '—'}</span>
                    <span>Modalidade: {edital.modalidade}</span>
                    <span>Valor estimado: {formatCurrency(edital.valor_estimado)}</span>
                    <span>Abertura: {formatDate(edital.data_abertura)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title="Marcar como interessante"
                    onClick={(e) => marcarInteressante(e, edital.id)}
                    className="rounded-md p-2 text-lg hover:bg-yellow-50 transition-colors"
                  >
                    ⭐
                  </button>
                  <button
                    type="button"
                    title="Marcar como não interessante"
                    onClick={(e) => marcarNaoInteressante(e, edital.id)}
                    className="rounded-md p-2 text-lg hover:bg-red-50 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!buscando && data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Anterior
          </Button>
          <span className="text-sm text-gray-500">
            Página {data.page} de {data.pages} ({data.total} editais)
          </span>
          <Button variant="secondary" onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page >= data.pages}>
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}
