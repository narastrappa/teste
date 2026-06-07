import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Card, PageHeader, Spinner, ErrorMessage, Badge, Button } from '../components/ui'

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
  data_publicacao?: string
  url_edital?: string
  url_portal?: string
  relevancia_score: number
  historico_status: { status_anterior: string; status_novo: string; motivo?: string; timestamp: string }[]
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

function formatDateTime(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

export default function EditalDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: edital, isLoading, error } = useQuery<Edital>({
    queryKey: ['edital', id],
    queryFn: async () => (await api.get(`/editais/${id}`)).data,
    enabled: !!id,
  })

  const statusMutation = useMutation({
    mutationFn: async (status: string) => (await api.patch(`/editais/${id}/status`, { status })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edital', id] })
      queryClient.invalidateQueries({ queryKey: ['editais'] })
    },
  })

  return (
    <div>
      <PageHeader
        title="Detalhes do edital"
        subtitle={edital ? `${edital.numero} — ${edital.orgao}` : undefined}
        actions={
          <Button variant="secondary" onClick={() => navigate('/editais')}>
            Voltar
          </Button>
        }
      />

      {isLoading && <Spinner />}
      {error && <ErrorMessage message="Não foi possível carregar o edital." />}

      {edital && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h2 className="text-lg font-semibold text-gray-900">{edital.numero}</h2>
              <Badge color={statusColors[edital.status] ?? 'gray'}>{edital.status}</Badge>
              <Badge color="gray">{edital.portal_origem}</Badge>
              <Badge color="purple">relevância {edital.relevancia_score}%</Badge>
            </div>
            <p className="text-sm text-gray-700 font-medium">{edital.orgao}</p>
            <p className="text-sm text-gray-600 mt-1">{edital.objeto}</p>

            <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600 mt-4">
              <span>UF / Município: {edital.uf ?? '—'} / {edital.municipio ?? '—'}</span>
              <span>Modalidade: {edital.modalidade}</span>
              <span>Valor estimado: {formatCurrency(edital.valor_estimado)}</span>
              <span>Publicação: {formatDateTime(edital.data_publicacao)}</span>
              <span>Abertura / prazo: {formatDateTime(edital.data_abertura)}</span>
            </div>

            <div className="flex gap-3 mt-3 text-sm">
              {edital.url_edital && (
                <a href={edital.url_edital} target="_blank" rel="noreferrer" className="text-slate-900 underline">
                  Ver edital
                </a>
              )}
              {edital.url_portal && (
                <a href={edital.url_portal} target="_blank" rel="noreferrer" className="text-slate-900 underline">
                  Abrir no portal de origem
                </a>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="font-medium text-gray-900 mb-3">Ações</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => navigate(`/propostas?edital_id=${edital.id}`)}>Inscrever-se (criar proposta)</Button>
              <Button variant="secondary" onClick={() => statusMutation.mutate('em_analise')} disabled={statusMutation.isPending}>
                ⭐ Marcar como interessante
              </Button>
              <Button variant="secondary" onClick={() => statusMutation.mutate('desclassificado')} disabled={statusMutation.isPending}>
                🗑️ Marcar como não interessante
              </Button>
            </div>
            {statusMutation.isError && (
              <div className="mt-3">
                <ErrorMessage message="Não foi possível atualizar o status do edital." />
              </div>
            )}
          </Card>

          {edital.historico_status?.length > 0 && (
            <Card>
              <h3 className="font-medium text-gray-900 mb-3">Histórico de status</h3>
              <div className="space-y-2">
                {edital.historico_status.map((h, i) => (
                  <div key={i} className="text-sm text-gray-600 border-l-2 border-gray-200 pl-3">
                    <span className="font-medium text-gray-800">{h.status_anterior} → {h.status_novo}</span>
                    {h.motivo && <span> — {h.motivo}</span>}
                    <div className="text-xs text-gray-400">{formatDateTime(h.timestamp)}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
