import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { Card, PageHeader, ErrorMessage, Badge, Button } from '../components/ui'

interface Folha {
  id: string
  competencia: string
  sufixo_revisao: number
  status: string
  total_bruto?: number
  total_descontos?: number
  total_liquido?: number
  cnab_s3?: string
  aprovada_em?: string
  enviada_banco_em?: string
  paga_em?: string
}

const statusColors: Record<string, 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple'> = {
  rascunho: 'gray',
  calculada: 'yellow',
  aprovada: 'blue',
  enviada_banco: 'purple',
  paga: 'green',
}

function formatCurrency(value?: number) {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Folhas() {
  const [formError, setFormError] = useState<string | null>(null)

  const [competencia, setCompetencia] = useState('')
  const [sufixoRevisao, setSufixoRevisao] = useState('0')

  const createMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post('/folhas', {
          competencia,
          sufixo_revisao: Number(sufixoRevisao) || 0,
        })
      ).data as Folha,
    onSuccess: () => {
      setFormError(null)
    },
    onError: () => setFormError('Não foi possível criar a folha. Verifique a competência (formato AAAA-MM) e se já existe uma folha para o período.'),
  })

  const calcularMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/folhas/${id}/calcular`)).data,
  })
  const aprovarMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/folhas/${id}/aprovar`)).data,
  })
  const cnabMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/folhas/${id}/gerar-cnab`)).data,
  })
  const envioBancoMutation = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/folhas/${id}/confirmar-envio-banco`)).data,
  })
  const pagamentoMutation = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/folhas/${id}/confirmar-pagamento`)).data,
  })

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    createMutation.mutate()
  }

  const folha = createMutation.data
  const anyActionPending =
    calcularMutation.isPending || aprovarMutation.isPending || cnabMutation.isPending || envioBancoMutation.isPending || pagamentoMutation.isPending

  return (
    <div>
      <PageHeader title="Folha de Pagamento" subtitle="Gere, aprove e processe folhas de pagamento" />

      <Card className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Nova folha de pagamento</h3>
        <form onSubmit={handleCreate} className="grid md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Competência (AAAA-MM)</label>
            <input
              required
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              placeholder="2026-06"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sufixo de revisão</label>
            <input
              type="number"
              value={sufixoRevisao}
              onChange={(e) => setSufixoRevisao(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Criando...' : 'Criar folha'}
          </Button>
        </form>
        {formError && <div className="mt-3"><ErrorMessage message={formError} /></div>}
      </Card>

      {folha && (
        <Card>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-gray-900">
                Folha {folha.competencia}{folha.sufixo_revisao > 0 ? ` (rev. ${folha.sufixo_revisao})` : ''}
              </h3>
              <Badge color={statusColors[folha.status] ?? 'gray'}>{folha.status}</Badge>
            </div>
          </div>

          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <dt className="text-gray-500">Total bruto</dt>
              <dd className="font-medium text-gray-900">{formatCurrency(folha.total_bruto)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Total descontos</dt>
              <dd className="font-medium text-gray-900">{formatCurrency(folha.total_descontos)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Total líquido</dt>
              <dd className="font-medium text-gray-900">{formatCurrency(folha.total_liquido)}</dd>
            </div>
          </dl>

          <p className="text-sm text-gray-500 mb-2">
            Fluxo: calcular → aprovar (gestor) → gerar CNAB → confirmar envio ao banco → confirmar pagamento (dispara comprovantes)
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => calcularMutation.mutate(folha.id)} disabled={anyActionPending}>
              Calcular
            </Button>
            <Button variant="secondary" onClick={() => aprovarMutation.mutate(folha.id)} disabled={anyActionPending}>
              Aprovar
            </Button>
            <Button variant="secondary" onClick={() => cnabMutation.mutate(folha.id)} disabled={anyActionPending}>
              Gerar CNAB
            </Button>
            <Button variant="secondary" onClick={() => envioBancoMutation.mutate(folha.id)} disabled={anyActionPending}>
              Confirmar envio ao banco
            </Button>
            <Button onClick={() => pagamentoMutation.mutate(folha.id)} disabled={anyActionPending}>
              Confirmar pagamento
            </Button>
          </div>

          {[calcularMutation, aprovarMutation, cnabMutation, envioBancoMutation, pagamentoMutation].some((m) => m.isError) && (
            <div className="mt-4">
              <ErrorMessage message="Ação não pôde ser concluída — verifique se a folha está no status correto para esta operação." />
            </div>
          )}
          {[calcularMutation, aprovarMutation, cnabMutation, envioBancoMutation, pagamentoMutation].some((m) => m.isSuccess) && (
            <div className="mt-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              Ação concluída com sucesso.
            </div>
          )}
        </Card>
      )}

      {!folha && (
        <p className="text-sm text-gray-500">
          Crie uma folha acima para começar — a API não permite buscar folhas existentes diretamente sem o ID retornado na criação.
        </p>
      )}
    </div>
  )
}
