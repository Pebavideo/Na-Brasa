import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMesa } from '../hooks/useMesa'
import { useProdutos } from '../hooks/useProdutos'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import { Loading } from '../components/Loading'
import { PixQRCode } from '../components/PixQRCode'
import { enviarPedidoCliente } from '../lib/firestore'
import { agruparPorCategoria, formatarMoeda } from '../lib/utils'
import type { Produto } from '../types'

type Aba = 'cardapio' | 'conta'

export function MesaPublica() {
  const { mesaId } = useParams<{ mesaId: string }>()
  const { mesa, loading, erro } = useMesa(mesaId)
  const { produtos, loading: carregandoProdutos } = useProdutos()
  const { config } = useConfiguracoes()

  const [aba, setAba] = useState<Aba>('cardapio')
  const [carrinho, setCarrinho] = useState<Record<string, number>>({})
  const [enviando, setEnviando] = useState(false)
  const [pedidoEnviado, setPedidoEnviado] = useState(false)

  const categorias = useMemo(() => agruparPorCategoria(produtos), [produtos])
  const produtosPorId = useMemo(
    () => new Map(produtos.map((produto) => [produto.id, produto])),
    [produtos],
  )

  const totalCarrinho = useMemo(
    () =>
      Object.entries(carrinho).reduce((soma, [produtoId, quantidade]) => {
        const produto = produtosPorId.get(produtoId)
        return soma + (produto ? produto.preco * quantidade : 0)
      }, 0),
    [carrinho, produtosPorId],
  )

  const itensCarrinho = Object.values(carrinho).reduce((a, b) => a + b, 0)

  const alterarQuantidade = (produto: Produto, delta: number) => {
    setCarrinho((atual) => {
      const quantidadeAtual = atual[produto.id] ?? 0
      const nova = Math.max(0, quantidadeAtual + delta)
      const copia = { ...atual }
      if (nova === 0) {
        delete copia[produto.id]
      } else {
        copia[produto.id] = nova
      }
      return copia
    })
  }

  const enviarPedido = async () => {
    if (!mesaId || itensCarrinho === 0) return
    setEnviando(true)
    try {
      const carrinhoArray = Object.entries(carrinho)
        .map(([produtoId, quantidade]) => {
          const produto = produtosPorId.get(produtoId)
          return produto ? { produto, quantidade } : null
        })
        .filter((item): item is { produto: Produto; quantidade: number } => item !== null)

      await enviarPedidoCliente(mesaId, carrinhoArray)
      setCarrinho({})
      setPedidoEnviado(true)
      setTimeout(() => setPedidoEnviado(false), 3000)
    } finally {
      setEnviando(false)
    }
  }

  if (loading || carregandoProdutos) return <Loading texto="Carregando cardápio..." />

  if (erro || !mesa) {
    return (
      <div className="flex min-h-svh items-center justify-center p-8 text-center text-zinc-500">
        {erro ?? 'Mesa não encontrada. Confira o QR Code e tente novamente.'}
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-zinc-100 pb-24">
      <header className="sticky top-0 z-10 bg-orange-600 px-4 py-3 text-white shadow">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-100">
          {config?.nomeLoja ?? 'Na Brasa'}
        </p>
        <h1 className="text-lg font-black">{mesa.identificador}</h1>
      </header>

      <div className="sticky top-[60px] z-10 flex gap-2 bg-zinc-100 p-3">
        <button
          type="button"
          onClick={() => setAba('cardapio')}
          className={`flex-1 rounded-lg py-2 text-sm font-bold ${
            aba === 'cardapio' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500'
          }`}
        >
          Cardápio
        </button>
        <button
          type="button"
          onClick={() => setAba('conta')}
          className={`flex-1 rounded-lg py-2 text-sm font-bold ${
            aba === 'conta' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500'
          }`}
        >
          Minha Conta {mesa.itens.length > 0 && `(${formatarMoeda(mesa.totalAtual)})`}
        </button>
      </div>

      <main className="flex flex-1 flex-col gap-4 px-4">
        {aba === 'cardapio' &&
          categorias.map(([categoria, itensCategoria]) => (
            <div key={categoria}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-zinc-400">
                {categoria}
              </h2>
              <div className="flex flex-col gap-2">
                {itensCategoria
                  .filter((produto) => produto.disponivel)
                  .map((produto) => {
                    const quantidade = carrinho[produto.id] ?? 0
                    return (
                      <div
                        key={produto.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm"
                      >
                        <div>
                          <p className="font-semibold text-zinc-900">{produto.nome}</p>
                          <p className="text-sm text-zinc-400">{formatarMoeda(produto.preco)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={quantidade === 0}
                            onClick={() => alterarQuantidade(produto, -1)}
                            className="h-8 w-8 rounded-lg bg-zinc-100 font-bold text-zinc-600 disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="w-5 text-center font-bold text-zinc-900">{quantidade}</span>
                          <button
                            type="button"
                            onClick={() => alterarQuantidade(produto, 1)}
                            className="h-8 w-8 rounded-lg bg-orange-600 font-bold text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}

        {aba === 'conta' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-bold text-zinc-500">Itens já pedidos</h2>
              {mesa.itens.length === 0 ? (
                <p className="text-sm text-zinc-400">Nenhum item lançado ainda.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {mesa.itens.map((item, index) => (
                    <li
                      key={`${item.produtoId}-${item.origem}-${index}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-zinc-700">
                        <span className="font-bold text-zinc-900">{item.quantidade}×</span> {item.nome}
                      </span>
                      <span className="font-semibold text-zinc-900">
                        {formatarMoeda(item.precoUnit * item.quantidade)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3">
                <span className="font-bold text-zinc-500">Total</span>
                <span className="text-xl font-black text-zinc-900">{formatarMoeda(mesa.totalAtual)}</span>
              </div>
            </div>

            {mesa.totalAtual > 0 && config?.chavePix && (
              <div>
                <p className="mb-2 text-center text-sm text-zinc-500">
                  Pague via Pix e mostre esta tela ao atendente para confirmar e fechar a mesa.
                </p>
                <PixQRCode config={config} valor={mesa.totalAtual} identificador={mesa.identificador} />
              </div>
            )}
          </div>
        )}
      </main>

      {aba === 'cardapio' && itensCarrinho > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-zinc-400">{itensCarrinho} itens selecionados</p>
              <p className="text-lg font-black text-zinc-900">{formatarMoeda(totalCarrinho)}</p>
            </div>
            <button
              type="button"
              disabled={enviando}
              onClick={() => void enviarPedido()}
              className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition active:scale-95 disabled:opacity-60"
            >
              {enviando ? 'Enviando...' : 'Enviar pedido para a mesa'}
            </button>
          </div>
        </div>
      )}

      {pedidoEnviado && (
        <div className="fixed inset-x-4 bottom-24 z-20 rounded-xl bg-zinc-900 p-3 text-center text-sm font-semibold text-white shadow-lg">
          ✅ Pedido enviado para a mesa!
        </div>
      )}
    </div>
  )
}
