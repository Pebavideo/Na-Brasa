import { useState, type FormEvent } from 'react'
import { useProdutos } from '../../hooks/useProdutos'
import { Loading } from '../../components/Loading'
import { atualizarProduto, criarProduto, excluirProduto } from '../../lib/firestore'
import { formatarMoeda } from '../../lib/utils'
import { formatarMoedaInput, paraNumeroMoeda } from '../../lib/mascaras'
import { CATEGORIAS, type CategoriaProduto } from '../../types'

const produtoVazio = {
  nome: '',
  preco: '',
  categoria: CATEGORIAS[0] as CategoriaProduto,
}

export function AdminCardapio() {
  const { produtos, loading } = useProdutos()
  const [novo, setNovo] = useState(produtoVazio)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [processandoId, setProcessandoId] = useState<string | null>(null)

  const handleCriar = async (event: FormEvent) => {
    event.preventDefault()
    setErro(null)

    const nome = novo.nome.trim()
    const preco = paraNumeroMoeda(novo.preco)

    if (!nome) {
      setErro('Informe o nome do produto.')
      return
    }
    if (preco <= 0) {
      setErro('Informe um preço maior que zero.')
      return
    }

    setSalvando(true)
    try {
      await criarProduto({
        nome,
        preco,
        categoria: novo.categoria,
        disponivel: true,
      })
      setNovo(produtoVazio)
    } catch {
      setErro('Não foi possível salvar o produto. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const handleAlternarDisponibilidade = async (produtoId: string, disponivel: boolean) => {
    if (processandoId) return
    setProcessandoId(produtoId)
    try {
      await atualizarProduto(produtoId, { disponivel: !disponivel })
    } catch {
      setErro('Não foi possível atualizar o produto. Tente novamente.')
    } finally {
      setProcessandoId(null)
    }
  }

  const handleExcluir = async (produtoId: string, nome: string) => {
    if (processandoId) return
    if (!confirm(`Excluir "${nome}"?`)) return
    setProcessandoId(produtoId)
    try {
      await excluirProduto(produtoId)
    } catch {
      setErro('Não foi possível excluir o produto. Tente novamente.')
    } finally {
      setProcessandoId(null)
    }
  }

  if (loading) return <Loading texto="Carregando cardápio..." />

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={(e) => void handleCriar(e)} className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="text-xs font-semibold text-zinc-500">Nome do produto</label>
          <input
            required
            value={novo.nome}
            onChange={(e) => setNovo((n) => ({ ...n, nome: e.target.value }))}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
            placeholder="Ex: Espeto de Picanha"
          />
        </div>
        <div className="w-32">
          <label className="text-xs font-semibold text-zinc-500">Preço</label>
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 focus-within:border-orange-500">
            <span className="text-sm text-zinc-400">R$</span>
            <input
              required
              inputMode="decimal"
              value={novo.preco}
              onChange={(e) => setNovo((n) => ({ ...n, preco: formatarMoedaInput(e.target.value) }))}
              className="w-full text-sm outline-none"
              placeholder="0,00"
            />
          </div>
        </div>
        <div className="w-40">
          <label className="text-xs font-semibold text-zinc-500">Categoria</label>
          <select
            value={novo.categoria}
            onChange={(e) => setNovo((n) => ({ ...n, categoria: e.target.value as CategoriaProduto }))}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
          >
            {CATEGORIAS.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {salvando ? 'Salvando...' : 'Adicionar'}
        </button>
      </form>

      {erro && (
        <p className="rounded-lg bg-red-50 p-2 text-center text-sm text-red-600">{erro}</p>
      )}

      <div className="rounded-xl bg-white shadow-sm">
        {produtos.length === 0 ? (
          <p className="p-4 text-center text-sm text-zinc-400">Nenhum produto cadastrado.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {produtos.map((produto) => {
              const processando = processandoId === produto.id
              return (
                <li key={produto.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div>
                    <p className="font-semibold text-zinc-900">{produto.nome}</p>
                    <p className="text-xs text-zinc-400">
                      {produto.categoria} · {formatarMoeda(produto.preco)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={processando}
                      onClick={() => void handleAlternarDisponibilidade(produto.id, produto.disponivel)}
                      className={`rounded-full px-3 py-1 text-xs font-bold disabled:opacity-50 ${
                        produto.disponivel ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-400'
                      }`}
                    >
                      {produto.disponivel ? 'Disponível' : 'Indisponível'}
                    </button>
                    <button
                      type="button"
                      disabled={processando}
                      onClick={() => void handleExcluir(produto.id, produto.nome)}
                      className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500 disabled:opacity-50"
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
