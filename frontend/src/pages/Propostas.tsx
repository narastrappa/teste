import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Card, PageHeader, Spinner, ErrorMessage, Badge, Button } from '../components/ui'

interface Proposta {
  id: string
  edital_id: string
  versao: number
  status: string
  valor_proposto?: number
  descricao_tecnica?: string
  revisao_ia_score?: number
  revisao_ia_detalhes?: unknown
  enviada_em?: string
  protocolo_envio?: string
  imutavel: boolean
  alerta_inexequibilidade: boolean
}

const statusColors: Record<string, 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple'> = {
  rascunho: 'gray',
  revisao_ia: 'yellow',
  aprovada: 'blue',
  enviada: 'purple',
  habilitada: 'blue',
  desclassificada: 'red',
  vencedora: 'green',
  perdida: 'red',
}

function formatCurrency(value?: number) {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Propostas() {
  const [lookupId, setLookupId] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const [editalId, setEditalId] = useState('')
  const [valorProposto, setValorProposto] = useState('')
  const [descricaoTecnica, setDescricaoTecnica] = useState('')

  const { data, isLoading, error } = useQuery<Proposta>({
    queryKey: ['proposta', activeId],
    queryFn: async () => (await api.get(`/propostas/${activeId}`)).data,
    enabled: !!activeId,
  })

  const createMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post('/propostas', {
          edital_id: editalId,
          valor_proposto: valorProposto ? Number(valorProposto) : undefined,
          descricao_tecnica: descricaoTecnica || undefined,
        })
      ).data as Proposta,
    onSuccess: (proposta) => {
      setFormError(null)
      setActiveId(proposta.id)
      setLookupId(proposta.id)
      queryClient.invalidateQueries({ queryKey: ['proposta'] })
    },
    onError: () => setFormError('Não foi possível criar a proposta. Verifique o ID do edital.'),
  })

  const actionMutation = useMutation({
    mutationFn: async (action: 'revisar' | 'empacotar' | 'enviar') =>
      (await api.post(`/propostas/${activeId}/${action}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposta', activeId] }),
  })

  function handleLookup(e: FormEvent) {
    e.preventDefault()
    if (lookupId.trim()) setActiveId(lookupId.trim())
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    createMutation.mutate()
  }

  return (
    <div>
      <PageHeader title="Propostas" subtitle="Crie, revise e acompanhe propostas para editais" />

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="font-medium text-gray-900 mb-3">Buscar proposta por ID</h3>
          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="UUID da proposta"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <Button type="submit">Buscar</Button>
          </form>
        </Card>

        <Card>
          <h3 className="font-medium text-gray-900 mb-3">Nova proposta</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              required
              value={editalId}
              onChange={(e) => setEditalId(e.target.value)}
              placeholder="UUID do edital"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <input
              value={valorProposto}
              onChange={(e) => setValorProposto(e.target.value)}
              placeholder="Valor proposto (opcional)"
              type="number"
              step="0.01"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <textarea
              value={descricaoTecnica}
              onChange={(e) => setDescricaoTecnica(e.target.value)}
              placeholder="Descrição técnica (opcional)"
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {formError && <ErrorMessage message={formError} />}
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Criando...' : 'Criar proposta'}
            </Button>
          </form>
        </Card>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorMessage message="Proposta não encontrada." />}

      {data && (
        <Card>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-gray-900">Proposta v{data.versao}</h3>
              <Badge color={statusColors[data.status] ?? 'gray'}>{data.status}</Badge>
              {data.imutavel && <Badge color="gray">imutável</Badge>}
              {data.alerta_inexequibilidade && <Badge color="red">alerta de inexequibilidade</Badge>}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => actionMutation.mutate('revisar')} disabled={actionMutation.isPending}>
                Revisar com IA
              </Button>
              <Button variant="secondary" onClick={() => actionMutation.mutate('empacotar')} disabled={actionMutation.isPending}>
                Empacotar
              </Button>
              <Button onClick={() => actionMutation.mutate('enviar')} disabled={actionMutation.isPending}>
                Enviar
              </Button>
            </div>
          </div>

          {actionMutation.isError && <ErrorMessage message="Ação não pôde ser concluída — verifique as regras de negócio (ex.: pontuação mínima, documentos vencidos)." />}

          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Edital</dt>
              <dd className="font-medium text-gray-900 break-all">{data.edital_id}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Valor proposto</dt>
              <dd className="font-medium text-gray-900">{formatCurrency(data.valor_proposto)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Pontuação IA</dt>
              <dd className="font-medium text-gray-900">{data.revisao_ia_score != null ? `${data.revisao_ia_score}/100` : '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Protocolo de envio</dt>
              <dd className="font-medium text-gray-900">{data.protocolo_envio ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Enviada em</dt>
              <dd className="font-medium text-gray-900">
                {data.enviada_em ? new Date(data.enviada_em).toLocaleString('pt-BR') : '—'}
              </dd>
            </div>
          </dl>
          {data.descricao_tecnica && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-1">Descrição técnica</p>
              <p className="text-sm text-gray-800">{data.descricao_tecnica}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
