import { useEffect, useMemo, useRef, useState } from 'react'
import { ImagemProduto } from './ImagemProduto'
import { formatarMoeda } from '../lib/utils'
import { CATEGORIAS, type CategoriaProduto, type Produto } from '../types'

interface AdicionarItemModalProps {
  produtos: Produto[]
  onConfirmar: (produto: Produto, quantidade: number, observacao: string) => Promise<void>
  onFechar: () => void
}

function CardProduto({ produto, onSelecionar }: { produto: Produto; onSelecionar: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelecionar}
      className="relative flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm transition active:scale-95"
    >
      <div className="aspect-square w-full bg-zinc-100">
        {produto.fotoUrl ? (
          <ImagemProduto src={produto.fotoUrl} alt={produto.nome} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-zinc-300">🍽️</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-3 pr-10">
        <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">{produto.categoria}</p>
        <p className="line-clamp-2 text-sm font-bold text-zinc-900">{produto.nome}</p>
        <p className="mt-auto text-base font-black text-orange-600">{formatarMoeda(produto.preco)}</p>
      </div>
      <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-lg font-bold leading-none text-white shadow-md">
        +
      </span>
    </button>
  )
}

/**
 * Modal de catálogo inspirado no fluxo de totens do McDonald's: chips de
 * categoria (rolam suavemente até a seção) + busca no topo, grade de cards
 * com foto/nome/preço em destaque e, ao tocar num produto, uma tela de
 * customização (quantidade + observação) com botão largo de confirmação.
 * Depois de adicionar, volta para a grade para permitir lançar vários itens
 * na mesma abertura do modal.
 */
export function AdicionarItemModal({ produtos, onConfirmar, onFechar }: AdicionarItemModalProps) {
  const [busca, setBusca] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaProduto | null>(null)
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [observacao, setObservacao] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ultimoAdicionado, setUltimoAdicionado] = useState<string | null>(null)

  const secoesRef = useRef<Partial<Record<CategoriaProduto, HTMLDivElement | null>>>({})

  useEffect(() => {
    if (!ultimoAdicionado) return
    const temporizador = setTimeout(() => setUltimoAdicionado(null), 1800)
    return () => clearTimeout(temporizador)
  }, [ultimoAdicionado])

  const produtosDisponiveis = useMemo(() => produtos.filter((p) => p.disponivel), [produtos])

  const categoriasPresentes = useMemo(
    () => CATEGORIAS.filter((cat) => produtosDisponiveis.some((p) => p.categoria === cat)),
    [produtosDisponiveis],
  )

  const termoBusca = busca.trim().toLowerCase()
  const buscando = termoBusca.length > 0

  const produtosFiltrados = useMemo(() => {
    if (!buscando) return produtosDisponiveis
    return produtosDisponiveis.filter(
      (p) =>
        p.nome.toLowerCase().includes(termoBusca) || (p.descricao ?? '').toLowerCase().includes(termoBusca),
    )
  }, [produtosDisponiveis, buscando, termoBusca])

  const irParaCategoria = (categoria: CategoriaProduto | null) => {
    setBusca('')
    setCategoriaAtiva(categoria)
    if (categoria) {
      // Precisa esperar o próximo frame: se vinha de uma busca, a seção só existe após o re-render.
      requestAnimationFrame(() => {
        secoesRef.current[categoria]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

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
      setUltimoAdicionado(produtoSelecionado.nome)
      setProdutoSelecionado(null)
    } catch {
      setErro('Não foi possível adicionar o item. Tente novamente.')
    } finally {
      setConfirmando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="relative flex h-[92svh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-zinc-50 sm:h-[85svh] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-zinc-900">
            {produtoSelecionado ? produtoSelecionado.nome : 'Cardápio'}
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
                onChange={(e) => {
                  setBusca(e.target.value)
                  setCategoriaAtiva(null)
                }}
                placeholder="🔍 Buscar produto..."
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => irParaCategoria(null)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    categoriaAtiva === null && !buscando
                      ? 'bg-orange-600 text-white'
                      : 'bg-zinc-100 text-zinc-500'
                  }`}
                >
                  Todas
                </button>
                {categoriasPresentes.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => irParaCategoria(cat)}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                      categoriaAtiva === cat ? 'bg-orange-600 text-white' : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {produtosDisponiveis.length === 0 ? (
                <p className="p-6 text-center text-sm text-zinc-400">
                  Nenhum produto disponível no cardápio ainda.
                </p>
              ) : buscando ? (
                produtosFiltrados.length === 0 ? (
                  <p className="p-6 text-center text-sm text-zinc-400">Nenhum produto encontrado.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {produtosFiltrados.map((produto) => (
                      <CardProduto
                        key={produto.id}
                        produto={produto}
                        onSelecionar={() => selecionarProduto(produto)}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="flex flex-col gap-6">
                  {categoriasPresentes.map((cat) => (
                    <div
                      key={cat}
                      ref={(el) => {
                        secoesRef.current[cat] = el
                      }}
                    >
                      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-zinc-400">{cat}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {produtosDisponiveis
                          .filter((p) => p.categoria === cat)
                          .map((produto) => (
                            <CardProduto
                              key={produto.id}
                              produto={produto}
                              onSelecionar={() => selecionarProduto(produto)}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="aspect-[16/9] w-full shrink-0 bg-zinc-100">
              {produtoSelecionado.fotoUrl ? (
                <ImagemProduto
                  src={produtoSelecionado.fotoUrl}
                  alt={produtoSelecionado.nome}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-6xl text-zinc-300">🍽️</div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-4 p-5">
              <button
                type="button"
                onClick={() => setProdutoSelecionado(null)}
                className="self-start text-sm font-semibold text-zinc-400"
              >
                ← Trocar produto
              </button>

              <div>
                <p className="text-xl font-black text-zinc-900">{produtoSelecionado.nome}</p>
                <p className="text-base font-bold text-orange-600">{formatarMoeda(produtoSelecionado.preco)}</p>
                {produtoSelecionado.descricao && (
                  <p className="mt-1 text-sm text-zinc-500">{produtoSelecionado.descricao}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500">Quantidade</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-2xl font-bold text-zinc-600 transition active:scale-95"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-2xl font-black text-zinc-900">{quantidade}</span>
                  <button
                    type="button"
                    onClick={() => setQuantidade((q) => q + 1)}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-2xl font-bold text-white transition active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500">Observação / preparo (opcional)</label>
                <textarea
                  rows={2}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder='Ex: "ao ponto", "sem gelo"...'
                  className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                />
              </div>

              {erro && <p className="text-xs text-red-500">{erro}</p>}
            </div>

            <div className="sticky bottom-0 border-t border-zinc-200 bg-white p-4">
              <button
                type="button"
                disabled={confirmando}
                onClick={() => void confirmar()}
                className="w-full rounded-xl bg-emerald-600 px-5 py-4 text-base font-bold text-white transition active:scale-95 disabled:opacity-60"
              >
                {confirmando
                  ? 'Adicionando...'
                  : `Adicionar à Mesa — ${formatarMoeda(produtoSelecionado.preco * quantidade)}`}
              </button>
            </div>
          </div>
        )}

        {ultimoAdicionado && (
          <div className="pointer-events-none absolute inset-x-4 top-20 z-10 rounded-xl bg-zinc-900 p-3 text-center text-sm font-semibold text-white shadow-lg">
            ✅ {ultimoAdicionado} adicionado! Continue escolhendo ou feche para voltar à comanda.
          </div>
        )}
      </div>
    </div>
  )
}
