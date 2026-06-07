import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Card, PageHeader, Spinner, ErrorMessage, EmptyState, Badge, Button } from '../components/ui'

interface Documento {
  id: string
  tipo: string
  descricao: string
  status: string
  nome_arquivo?: string
  versao: number
  data_emissao?: string
  data_vencimento?: string
  ocr_confianca?: number
  ocr_confirmado: boolean
  auto_renovavel: boolean
}

interface StatusResponse {
  total: number
  validos: number
  a_vencer: number
  vencidos: number
  em_renovacao: number
}

const statusColors: Record<string, 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple'> = {
  valido: 'green',
  a_vencer: 'yellow',
  vencido: 'red',
  em_renovacao: 'blue',
}

const tipos = [
  'certidao_federal', 'certidao_estadual', 'certidao_municipal', 'certidao_trabalhista',
  'certidao_fgts', 'contrato_social', 'balanco', 'atestado_capacidade', 'procuracao', 'outros',
]

function formatDate(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR')
}

export default function Documentos() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [tipo, setTipo] = useState(tipos[0])
  const [descricao, setDescricao] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const { data: status } = useQuery<StatusResponse>({
    queryKey: ['documentos-status'],
    queryFn: async () => (await api.get('/documentos/status')).data,
  })

  const { data: documentos, isLoading, error } = useQuery<Documento[]>({
    queryKey: ['documentos'],
    queryFn: async () => (await api.get('/documentos')).data,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append('tipo', tipo)
      formData.append('descricao', descricao)
      if (dataVencimento) formData.append('data_vencimento', dataVencimento)
      return (await api.post('/documentos', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data
    },
    onSuccess: () => {
      setFormError(null)
      setDescricao('')
      setDataVencimento('')
      setShowForm(false)
      queryClient.invalidateQueries({ queryKey: ['documentos'] })
      queryClient.invalidateQueries({ queryKey: ['documentos-status'] })
    },
    onError: () => setFormError('Não foi possível cadastrar o documento.'),
  })

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    createMutation.mutate()
  }

  const statusCards = status
    ? [
        { label: 'Total', value: status.total, color: 'text-gray-700' },
        { label: 'Válidos', value: status.validos, color: 'text-green-600' },
        { label: 'A vencer', value: status.a_vencer, color: 'text-amber-600' },
        { label: 'Vencidos', value: status.vencidos, color: 'text-red-600' },
        { label: 'Em renovação', value: status.em_renovacao, color: 'text-blue-600' },
      ]
    : []

  return (
    <div>
      <PageHeader
        title="Documentos"
        subtitle="Documentos habilitatórios e seus vencimentos"
        actions={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancelar' : 'Novo documento'}</Button>}
      />

      {status && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {statusCards.map((c) => (
            <Card key={c.label}>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className={`text-2xl font-semibold mt-1 ${c.color}`}>{c.value}</p>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Cadastrar documento</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {tipos.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <input
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição do documento"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {formError && <ErrorMessage message={formError} />}
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Enviando...' : 'Cadastrar'}
            </Button>
          </form>
        </Card>
      )}

      {isLoading && <Spinner />}
      {error && <ErrorMessage message="Não foi possível carregar os documentos." />}
      {documentos && documentos.length === 0 && <EmptyState message="Nenhum documento cadastrado." />}

      {documentos && documentos.length > 0 && (
        <div className="space-y-3">
          {documentos.map((doc) => (
            <Card key={doc.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-gray-900">{doc.descricao}</h3>
                    <Badge color={statusColors[doc.status] ?? 'gray'}>{doc.status}</Badge>
                    <Badge color="gray">{doc.tipo}</Badge>
                    <Badge color="gray">v{doc.versao}</Badge>
                    {doc.auto_renovavel && <Badge color="purple">auto-renovável</Badge>}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 mt-2">
                    <span>Emissão: {formatDate(doc.data_emissao)}</span>
                    <span>Vencimento: {formatDate(doc.data_vencimento)}</span>
                    {doc.ocr_confianca != null && <span>Confiança OCR: {(doc.ocr_confianca * 100).toFixed(0)}%</span>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
