import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Card, PageHeader, Spinner, ErrorMessage, Button } from '../components/ui'

interface FiltroConfig {
  id: string
  palavras_chave: string[]
  palavras_excluir: string[]
  valor_minimo?: number
  valor_maximo?: number
  modalidades: string[]
  ufs: string[]
  portais: string[]
  ativo: boolean
}

const ufsDisponiveis = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
]

const modalidadesDisponiveis = [
  { value: 'pregao', label: 'Pregão' },
  { value: 'concorrencia', label: 'Concorrência' },
  { value: 'tomada_de_precos', label: 'Tomada de preços' },
  { value: 'convite', label: 'Convite' },
  { value: 'leilao', label: 'Leilão' },
  { value: 'dispensa', label: 'Dispensa' },
]

const portaisDisponiveis = [
  { value: 'pncp', label: 'PNCP (Portal Nacional de Contratações Públicas)' },
  { value: 'comprasnet', label: 'ComprasNet (legado)' },
  { value: 'bec', label: 'BEC SP' },
]

function toCsv(items: string[]) {
  return items.join(', ')
}

function fromCsv(value: string) {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export default function BuscaConfig() {
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)

  const [palavrasChave, setPalavrasChave] = useState('')
  const [palavrasExcluir, setPalavrasExcluir] = useState('')
  const [cnaes, setCnaes] = useState('')
  const [valorMinimo, setValorMinimo] = useState('')
  const [valorMaximo, setValorMaximo] = useState('')
  const [modalidades, setModalidades] = useState<string[]>([])
  const [ufs, setUfs] = useState<string[]>([])
  const [portais, setPortais] = useState<string[]>([])
  const [ativo, setAtivo] = useState(true)

  const { data, isLoading, error } = useQuery<FiltroConfig | null>({
    queryKey: ['filtro-busca'],
    queryFn: async () => (await api.get('/filtros')).data,
  })

  useEffect(() => {
    if (!data) return
    setPalavrasChave(toCsv(data.palavras_chave))
    setPalavrasExcluir(toCsv(data.palavras_excluir))
    setValorMinimo(data.valor_minimo != null ? String(data.valor_minimo) : '')
    setValorMaximo(data.valor_maximo != null ? String(data.valor_maximo) : '')
    setModalidades(data.modalidades)
    setUfs(data.ufs)
    setPortais(data.portais)
    setAtivo(data.ativo)
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const palavras = [...fromCsv(palavrasChave), ...fromCsv(cnaes)]
      return (
        await api.put('/filtros', {
          palavras_chave: palavras,
          palavras_excluir: fromCsv(palavrasExcluir),
          valor_minimo: valorMinimo ? Number(valorMinimo) : undefined,
          valor_maximo: valorMaximo ? Number(valorMaximo) : undefined,
          modalidades,
          ufs,
          portais,
          ativo,
        })
      ).data
    },
    onSuccess: () => {
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['filtro-busca'] })
    },
    onError: () => setSaved(false),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaved(false)
    saveMutation.mutate()
  }

  return (
    <div>
      <PageHeader
        title="Perfil de busca de editais"
        subtitle="Defina o que o sistema deve procurar: localização, serviços, produtos e palavras-chave"
      />

      {isLoading && <Spinner />}
      {error && <ErrorMessage message="Não foi possível carregar o perfil de busca." />}

      {!isLoading && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serviços / produtos / palavras-chave
              </label>
              <textarea
                value={palavrasChave}
                onChange={(e) => setPalavrasChave(e.target.value)}
                placeholder="Ex.: terceirização, serviços terceirizados, fornecimento de itens, fornecimento de materiais, prestação de serviços"
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <p className="text-xs text-gray-500 mt-1">Separe os termos por vírgula. Eles serão usados para calcular a relevância dos editais encontrados.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNAEs de interesse (opcional)</label>
              <input
                value={cnaes}
                onChange={(e) => setCnaes(e.target.value)}
                placeholder="Ex.: 8121-4/00, 4120-4/00"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <p className="text-xs text-gray-500 mt-1">Os códigos/descrições informados também entram na busca por palavras-chave.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Palavras a excluir (opcional)</label>
              <input
                value={palavrasExcluir}
                onChange={(e) => setPalavrasExcluir(e.target.value)}
                placeholder="Ex.: obra, construção civil"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Localização (UF)</label>
              <div className="flex flex-wrap gap-2">
                {ufsDisponiveis.map((uf) => (
                  <button
                    type="button"
                    key={uf}
                    onClick={() => setUfs((prev) => toggle(prev, uf))}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium border transition-colors ${
                      ufs.includes(uf)
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {uf}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Nenhuma UF selecionada = busca em todos os estados.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Modalidades</label>
              <div className="flex flex-wrap gap-2">
                {modalidadesDisponiveis.map((m) => (
                  <button
                    type="button"
                    key={m.value}
                    onClick={() => setModalidades((prev) => toggle(prev, m.value))}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium border transition-colors ${
                      modalidades.includes(m.value)
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Portais monitorados</label>
              <div className="flex flex-wrap gap-2">
                {portaisDisponiveis.map((p) => (
                  <button
                    type="button"
                    key={p.value}
                    onClick={() => setPortais((prev) => toggle(prev, p.value))}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium border transition-colors ${
                      portais.includes(p.value)
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor estimado mínimo (opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={valorMinimo}
                  onChange={(e) => setValorMinimo(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor estimado máximo (opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={valorMaximo}
                  onChange={(e) => setValorMaximo(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
              Perfil ativo (usado nas próximas buscas)
            </label>

            {saveMutation.isError && <ErrorMessage message="Não foi possível salvar o perfil de busca." />}
            {saved && saveMutation.isSuccess && (
              <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                Perfil de busca salvo com sucesso. Ele será usado nas próximas execuções da busca de editais.
              </div>
            )}

            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : 'Salvar perfil de busca'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  )
}
