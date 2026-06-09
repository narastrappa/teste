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

interface Stats {
  por_status: Record<string, number>
  taxa_ganho: number
  taxa_perda: number
  total_finalizadas: number
  recomendados: Edital[]
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

type Tab = 'novos' | 'estrela' | 'lixeira' | 'submetidos' | 'analise'

function EditalCard({
  edital,
  onStar,
  onTrash,
}: {
  edital: Edital
  onStar?: (e: React.MouseEvent) => void
  onTrash?: (e: React.MouseEvent) => void
}) {
  const navigate = useNavigate()
  return (
    <Card className="cursor-pointer hover:border-slate-400 transition-colors">
      <div className="flex items-start justify-between gap-4" onClick={() => navigate(`/editais/${edital.id}`)}>
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
            <span>Valor: {formatCurrency(edital.valor_estimado)}</span>
            <span>Abertura: {formatDate(edital.data_abertura)}</span>
          </div>
        </div>
        {(onStar || onTrash) && (
          <div className="flex items-center gap-1 shrink-0">
            {onStar && (
              <button type="button" title="Marcar como interessante" onClick={onStar}
                className="rounded-md p-2 text-lg hover:bg-yellow-50 transition-colors">⭐</button>
            )}
            {onTrash && (
              <button type="button" title="Marcar como não interessante" onClick={onTrash}
                className="rounded-md p-2 text-lg hover:bg-red-50 transition-colors">🗑️</button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

function BarChart({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-4">
        <div className={`h-4 rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  )
}

function EditalList({
  statusFilter,
  triage = true,
  queryClient,
}: {
  statusFilter: string
  triage?: boolean
  queryClient: ReturnType<typeof useQueryClient>
}) {
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery<EditalListResponse>({
    queryKey: ['editais', page, statusFilter],
    queryFn: async () =>
      (await api.get('/editais', { params: { page, per_page: 20, status: statusFilter } })).data,
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.patch(`/editais/${id}/status`, { status })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editais'] })
      queryClient.invalidateQueries({ queryKey: ['editais-stats'] })
    },
  })

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage message="Não foi possível carregar os editais." />
  if (!data || data.items.length === 0) return <EmptyState message="Nenhum edital nesta categoria." />

  return (
    <div>
      <div className="space-y-3">
        {data.items.map((edital) => (
          <EditalCard
            key={edital.id}
            edital={edital}
            onStar={triage ? (e) => { e.stopPropagation(); statusMutation.mutate({ id: edital.id, status: 'em_analise' }) } : undefined}
            onTrash={triage ? (e) => { e.stopPropagation(); statusMutation.mutate({ id: edital.id, status: 'desclassificado' }) } : undefined}
          />
        ))}
      </div>
      {data.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
          <span className="text-sm text-gray-500">Página {data.page} de {data.pages} ({data.total} editais)</span>
          <Button variant="secondary" onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page >= data.pages}>Próxima</Button>
        </div>
      )}
    </div>
  )
}

export default function Editais() {
  const [tab, setTab] = useState<Tab>('novos')
  const queryClient = useQueryClient()

  const scraperMutation = useMutation({
    mutationFn: async () => (await api.post('/scraper/run', {})).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editais'] })
      queryClient.invalidateQueries({ queryKey: ['editais-stats'] })
    },
  })

  const { data: stats } = useQuery<Stats>({
    queryKey: ['editais-stats'],
    queryFn: async () => (await api.get('/editais/stats')).data,
  })

  const tabs: { key: Tab; label: string }[] = [
    { key: 'novos', label: 'Novos' },
    { key: 'estrela', label: '⭐ Interessantes' },
    { key: 'lixeira', label: '🗑️ Descartados' },
    { key: 'submetidos', label: 'Submetidos' },
    { key: 'analise', label: '📊 Análise' },
  ]

  const statusMap: Record<Tab, string> = {
    novos: 'novo',
    estrela: 'em_analise',
    lixeira: 'desclassificado',
    submetidos: 'proposta_enviada',
    analise: '',
  }

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
          </div>
        }
      />

      {scraperMutation.isPending && (
        <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
          Buscando novos editais — a lista será atualizada automaticamente ao concluir...
        </div>
      )}
      {scraperMutation.isSuccess && !scraperMutation.isPending && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Busca concluída — lista atualizada com os editais mais recentes.
        </div>
      )}
      {scraperMutation.isError && (
        <div className="mb-4">
          <ErrorMessage message="Não foi possível iniciar a busca. Verifique se o perfil de busca está configurado e ativo." />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.label}
            {stats && t.key !== 'analise' && (stats.por_status[statusMap[t.key]] ?? 0) > 0 && (
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                {stats.por_status[statusMap[t.key]]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Aba de análise */}
      {tab === 'analise' && (
        <div className="space-y-6">
          {stats && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <h3 className="font-medium text-gray-900 mb-4">Taxa de ganho / perda de propostas</h3>
                  {stats.total_finalizadas === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma proposta finalizada ainda.</p>
                  ) : (
                    <div className="space-y-4">
                      <BarChart label="Taxa de ganho" value={stats.taxa_ganho} color="bg-green-500" />
                      <BarChart label="Taxa de perda" value={stats.taxa_perda} color="bg-red-400" />
                      <p className="text-xs text-gray-400 mt-2">
                        Baseado em {stats.total_finalizadas} proposta{stats.total_finalizadas !== 1 ? 's' : ''} finalizadas.
                      </p>
                    </div>
                  )}
                </Card>

                <Card>
                  <h3 className="font-medium text-gray-900 mb-4">Editais por status</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.por_status).map(([s, n]) => (
                      <div key={s} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{s.replace('_', ' ')}</span>
                        <span className="font-semibold text-gray-900">{n}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <Card>
                <h3 className="font-medium text-gray-900 mb-1">Editais com maior chance de vitória</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Baseado no padrão de órgãos, modalidades e UFs das propostas vencedoras anteriores.
                </p>
                {stats.recomendados.length === 0 ? (
                  <EmptyState message="Sem histórico de vitórias suficiente para gerar recomendações. Após vencer as primeiras licitações, este painel será preenchido automaticamente." />
                ) : (
                  <div className="space-y-3">
                    {stats.recomendados.map((edital) => (
                      <EditalCard key={edital.id} edital={edital} />
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
          {!stats && <Spinner />}
        </div>
      )}

      {/* Abas de listagem */}
      {tab !== 'analise' && (
        <EditalList
          statusFilter={statusMap[tab]}
          triage={tab === 'novos'}
          queryClient={queryClient}
        />
      )}
    </div>
  )
}
