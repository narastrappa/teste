import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Card, PageHeader, Spinner, ErrorMessage, Badge, Button } from '../components/ui'

interface Impugnacao {
  id: string
  edital_id: string
  status: string
  motivos: string
  minuta_docx_s3?: string
  prazo_impugnacao?: string
  alerta_prazo_enviado: boolean
  enviada_em?: string
  resposta_orgao?: string
}

const statusColors: Record<string, 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple'> = {
  rascunho: 'gray',
  revisao_ia: 'yellow',
  aprovada: 'blue',
  enviada: 'purple',
  respondida: 'green',
  indeferida: 'red',
}

export default function Impugnacoes() {
  const [lookupId, setLookupId] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const [editalId, setEditalId] = useState('')
  const [motivos, setMotivos] = useState('')

  const { data, isLoading, error } = useQuery<Impugnacao>({
    queryKey: ['impugnacao', activeId],
    queryFn: async () => (await api.get(`/impugnacoes/${activeId}`)).data,
    enabled: !!activeId,
  })

  const createMutation = useMutation({
    mutationFn: async () =>
      (await api.post('/impugnacoes', { edital_id: editalId, motivos })).data as Impugnacao,
    onSuccess: (impugnacao) => {
      setFormError(null)
      setActiveId(impugnacao.id)
      setLookupId(impugnacao.id)
      queryClient.invalidateQueries({ queryKey: ['impugnacao'] })
    },
    onError: () => setFormError('Não foi possível criar a impugnação. Verifique o ID do edital.'),
  })

  const minutaMutation = useMutation({
    mutationFn: async () => (await api.post(`/impugnacoes/${activeId}/gerar-minuta`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impugnacao', activeId] }),
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
      <PageHeader title="Impugnações" subtitle="Conteste editais e gere minutas com apoio de IA" />

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="font-medium text-gray-900 mb-3">Buscar impugnação por ID</h3>
          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="UUID da impugnação"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <Button type="submit">Buscar</Button>
          </form>
        </Card>

        <Card>
          <h3 className="font-medium text-gray-900 mb-3">Nova impugnação</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              required
              value={editalId}
              onChange={(e) => setEditalId(e.target.value)}
              placeholder="UUID do edital"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <textarea
              required
              value={motivos}
              onChange={(e) => setMotivos(e.target.value)}
              placeholder="Motivos da impugnação"
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {formError && <ErrorMessage message={formError} />}
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Criando...' : 'Criar impugnação'}
            </Button>
          </form>
        </Card>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorMessage message="Impugnação não encontrada." />}

      {data && (
        <Card>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-gray-900">Impugnação</h3>
              <Badge color={statusColors[data.status] ?? 'gray'}>{data.status}</Badge>
              {data.alerta_prazo_enviado && <Badge color="red">alerta de prazo enviado</Badge>}
            </div>
            <Button variant="secondary" onClick={() => minutaMutation.mutate()} disabled={minutaMutation.isPending}>
              Gerar minuta (DOCX)
            </Button>
          </div>

          {minutaMutation.isError && <ErrorMessage message="Não foi possível gerar a minuta agora." />}
          {minutaMutation.isSuccess && (
            <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 mb-4">
              Minuta gerada com sucesso.
            </div>
          )}

          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <dt className="text-gray-500">Edital</dt>
              <dd className="font-medium text-gray-900 break-all">{data.edital_id}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Prazo</dt>
              <dd className="font-medium text-gray-900">
                {data.prazo_impugnacao ? new Date(data.prazo_impugnacao).toLocaleDateString('pt-BR') : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Enviada em</dt>
              <dd className="font-medium text-gray-900">
                {data.enviada_em ? new Date(data.enviada_em).toLocaleString('pt-BR') : '—'}
              </dd>
            </div>
          </dl>
          <div>
            <p className="text-sm text-gray-500 mb-1">Motivos</p>
            <p className="text-sm text-gray-800">{data.motivos}</p>
          </div>
          {data.resposta_orgao && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-1">Resposta do órgão</p>
              <p className="text-sm text-gray-800">{data.resposta_orgao}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
