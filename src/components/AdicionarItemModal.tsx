import { useMemo, useState } from 'react'
import { ImagemProduto } from './ImagemProduto'
import { formatarMoeda } from '../lib/utils'
import { CATEGORIAS, type CategoriaProduto, type Produto } from '../types'

interface AdicionarItemModalProps {
  produtos: Produto[]
  onConfirmar: (produto: Produto, quantidade: number, observacao: string) => Promise<void>
  onFechar: () => void
}

/**
 * Modal de catálogo para lançar um item na comanda: busca + filtro por
 * categoria, seleção do produto e, em seguida, quantidade/observação de
 * preparo antes de confirmar.
 */
export function AdicionarItemModal({ produtos, onConfirmar, onFechar }: AdicionarItemModalProps) {
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<CategoriaProduto | 'Todas'>('Todas')
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [observacao, setObservacao] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const produtosDisponiveis = useMemo(() => produtos.filter((p) => p.disponivel), [produtos])

  const categoriasPresentes = useMemo(
    () => CATEGORIAS.filter((cat) => produtosDisponiveis.some((p) => p.categoria === cat)),
    [produtosDisponiveis],
  )

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return produtosDisponiveis.filter((p) => {
      const bateCategoria = categoria === 'Todas' || p.categoria === categoria
      const bateBusca =
        !termo || p.nome.toLowerCase().includes(termo) || (p.descricao ?? '').toLowerCase().includes(termo)
      return bateCategoria && bateBusca
    })
  }, [produtosDisponiveis, busca, categoria])

  const selecionarProduto = (produto: Produto) => {
    setProdutoSelecionado(produto)
    setQuantidade(1)
    setObservacao('')
    setErro(null)
  }

  const confirmar = async () => {
    if (!produtoSelecionado || confirmando) return
    setConfirmando(true)
    setErro(null)
    try {
      await onConfirmar(produtoSelecionado, quantidade, observacao)
      onFechar()
    } catch {
      setErro('Não foi possível adicionar o item. Tente novamente.')
      setConfirmando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex max-h-[90svh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-zinc-50 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-zinc-900">
            {produtoSelecionado ? produtoSelecionado.nome : '+ Adicionar Item'}
          </h2>
          <button type="button" onClick={onFechar} className="text-2xl leading-none text-zinc-400">
            &times;
          </button>
        </div>

        {!produtoSelecionado ? (
          <>
            <div className="flex flex-col gap-2 border-b border-zinc-200 bg-white px-5 py-3">
              <input
                autoFocus
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setCategoria('Todas')}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                    categoria === 'Todas' ? 'bg-orange-600 text-white' : 'bg-zinc-100 text-zinc-500'
                  }`}
                >
                  Todas
                </button>
                {categoriasPresentes.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoria(cat)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      categoria === cat ? 'bg-orange-600 text-white' : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {produtosFiltrados.length === 0 ? (
                <p className="p-6 text-center text-sm text-zinc-400">
                  {produtosDisponiveis.length === 0
                    ? 'Nenhum produto disponível no cardápio ainda.'
                    : 'Nenhum produto encontrado.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {produtosFiltrados.map((produto) => (
                    <button
                      key={produto.id}
                      type="button"
                      onClick={() => selecionarProduto(produto)}
                      className="flex items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm transition active:scale-95"
                    >
                      {produto.fotoUrl ? (
                        <ImagemProduto
                          src={produto.fotoUrl}
                          alt={produto.nome}
                          className="h-12 w-12 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-300">
                          🍽️
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-zinc-900">{produto.nome}</p>
                        <p className="text-sm text-zinc-400">{formatarMoeda(produto.preco)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
            <button
              type="button"
              onClick={() => setProdutoSelecionado(null)}
              className="self-start text-sm font-semibold text-zinc-400"
            >
              ← Trocar produto
            </button>

            <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
              {produtoSelecionado.fotoUrl ? (
                <ImagemProduto
                  src={produtoSelecionado.fotoUrl}
                  alt={produtoSelecionado.nome}
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-2xl text-zinc-300">
                  🍽️
                </div>
              )}
              <div>
                <p className="font-bold text-zinc-900">{produtoSelecionado.nome}</p>
                <p className="text-sm text-zinc-400">{formatarMoeda(produtoSelecionado.preco)}</p>
                {produtoSelecionado.descricao && (
                  <p className="mt-0.5 text-xs text-zinc-500">{produtoSelecionado.descricao}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500">Quantidade</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                  className="h-10 w-10 rounded-lg bg-zinc-100 text-lg font-bold text-zinc-600"
                >
                  −
                </button>
                <span className="w-8 text-center text-lg font-bold text-zinc-900">{quantidade}</span>
                <button
                  type="button"
                  onClick={() => setQuantidade((q) => q + 1)}
                  className="h-10 w-10 rounded-lg bg-orange-600 text-lg font-bold text-white"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500">Observações de preparo (opcional)</label>
              <textarea
                rows={2}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder='Ex: "ao ponto", "sem gelo"...'
                className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
            </div>

            {erro && <p className="text-xs text-red-500">{erro}</p>}

            <div className="mt-auto flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
              <span className="text-sm font-bold text-zinc-500">Subtotal</span>
              <span className="text-xl font-black text-zinc-900">
                {formatarMoeda(produtoSelecionado.preco * quantidade)}
              </span>
            </div>

            <button
              type="button"
              disabled={confirmando}
              onClick={() => void confirmar()}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60"
            >
              {confirmando ? 'Adicionando...' : '✅ Confirmar e Inserir na Mesa'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
