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

interface LinhaCarrinho {
  chave: string
  produto: Produto
  quantidade: number
  observacao: string
}

function gerarChave(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function MesaPublica() {
  const { mesaId } = useParams<{ mesaId: string }>()
  const { mesa, loading, erro } = useMesa(mesaId)
  const { produtos, loading: carregandoProdutos } = useProdutos()
  const { config } = useConfiguracoes()

  const [aba, setAba] = useState<Aba>('cardapio')
  const [carrinho, setCarrinho] = useState<LinhaCarrinho[]>([])
  const [mostrarSacola, setMostrarSacola] = useState(false)
  const [produtoComObservacaoAberta, setProdutoComObservacaoAberta] = useState<string | null>(null)
  const [textoObservacao, setTextoObservacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const [pedidoEnviado, setPedidoEnviado] = useState(false)

  const categorias = useMemo(() => agruparPorCategoria(produtos), [produtos])

  const totalCarrinho = useMemo(
    () => carrinho.reduce((soma, linha) => soma + linha.produto.preco * linha.quantidade, 0),
    [carrinho],
  )
  const itensCarrinho = useMemo(
    () => carrinho.reduce((soma, linha) => soma + linha.quantidade, 0),
    [carrinho],
  )

  const quantidadeRapida = (produtoId: string) =>
    carrinho.find((linha) => linha.produto.id === produtoId && linha.observacao === '')?.quantidade ?? 0

  const quantidadeComObservacao = (produtoId: string) =>
    carrinho
      .filter((linha) => linha.produto.id === produtoId && linha.observacao !== '')
      .reduce((soma, linha) => soma + linha.quantidade, 0)

  const adicionarRapido = (produto: Produto) => {
    setCarrinho((atual) => {
      const indice = atual.findIndex((linha) => linha.produto.id === produto.id && linha.observacao === '')
      if (indice >= 0) {
        const copia = [...atual]
        copia[indice] = { ...copia[indice], quantidade: copia[indice].quantidade + 1 }
        return copia
      }
      return [...atual, { chave: gerarChave(), produto, quantidade: 1, observacao: '' }]
    })
  }

  const removerRapido = (produtoId: string) => {
    setCarrinho((atual) => {
      const indice = atual.findIndex((linha) => linha.produto.id === produtoId && linha.observacao === '')
      if (indice < 0) return atual
      const linha = atual[indice]
      if (linha.quantidade <= 1) return atual.filter((_, i) => i !== indice)
      const copia = [...atual]
      copia[indice] = { ...linha, quantidade: linha.quantidade - 1 }
      return copia
    })
  }

  const confirmarAdicionarComObservacao = (produto: Produto) => {
    const texto = textoObservacao.trim()
    setCarrinho((atual) => {
      const indice = atual.findIndex((linha) => linha.produto.id === produto.id && linha.observacao === texto)
      if (indice >= 0) {
        const copia = [...atual]
        copia[indice] = { ...copia[indice], quantidade: copia[indice].quantidade + 1 }
        return copia
      }
      return [...atual, { chave: gerarChave(), produto, quantidade: 1, observacao: texto }]
    })
    setProdutoComObservacaoAberta(null)
    setTextoObservacao('')
  }

  const alterarQuantidadeLinha = (chave: string, delta: number) => {
    setCarrinho((atual) =>
      atual
        .map((linha) => (linha.chave === chave ? { ...linha, quantidade: linha.quantidade + delta } : linha))
        .filter((linha) => linha.quantidade > 0),
    )
  }

  const editarObservacaoLinha = (chave: string, observacao: string) => {
    setCarrinho((atual) => atual.map((linha) => (linha.chave === chave ? { ...linha, observacao } : linha)))
  }

  const removerLinha = (chave: string) => {
    setCarrinho((atual) => atual.filter((linha) => linha.chave !== chave))
  }

  const confirmarEnvio = async () => {
    if (!mesaId || carrinho.length === 0) return
    setEnviando(true)
    setErroEnvio(null)
    try {
      await enviarPedidoCliente(
        mesaId,
        carrinho.map((linha) => ({
          produto: linha.produto,
          quantidade: linha.quantidade,
          observacao: linha.observacao.trim() || undefined,
        })),
      )
      setCarrinho([])
      setMostrarSacola(false)
      setPedidoEnviado(true)
      setTimeout(() => setPedidoEnviado(false), 3000)
    } catch {
      setErroEnvio('Não foi possível enviar o pedido. Tente novamente.')
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
                    const quantidade = quantidadeRapida(produto.id)
                    const comNota = quantidadeComObservacao(produto.id)
                    const observacaoAberta = produtoComObservacaoAberta === produto.id
                    return (
                      <div key={produto.id} className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {produto.fotoUrl && (
                              <img
                                src={produto.fotoUrl}
                                alt={produto.nome}
                                className="h-12 w-12 shrink-0 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <p className="font-semibold text-zinc-900">{produto.nome}</p>
                              <p className="text-sm text-zinc-400">{formatarMoeda(produto.preco)}</p>
                              {produto.descricao && (
                                <p className="mt-0.5 max-w-[220px] text-xs text-zinc-500">{produto.descricao}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={quantidade === 0}
                              onClick={() => removerRapido(produto.id)}
                              className="h-8 w-8 rounded-lg bg-zinc-100 font-bold text-zinc-600 disabled:opacity-40"
                            >
                              −
                            </button>
                            <span className="w-5 text-center font-bold text-zinc-900">{quantidade}</span>
                            <button
                              type="button"
                              onClick={() => adicionarRapido(produto)}
                              className="h-8 w-8 rounded-lg bg-orange-600 font-bold text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {comNota > 0 && (
                          <p className="text-xs font-medium text-amber-700">
                            📝 + {comNota} {comNota === 1 ? 'unidade' : 'unidades'} com observação na sacola
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setProdutoComObservacaoAberta(observacaoAberta ? null : produto.id)
                            setTextoObservacao('')
                          }}
                          className="self-start text-xs font-semibold text-orange-600"
                        >
                          {observacaoAberta ? 'Cancelar' : '📝 Adicionar com observação'}
                        </button>

                        {observacaoAberta && (
                          <div className="flex gap-2">
                            <input
                              autoFocus
                              value={textoObservacao}
                              onChange={(e) => setTextoObservacao(e.target.value)}
                              placeholder="Ex: sem cebola, trocar por rúcula..."
                              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                            />
                            <button
                              type="button"
                              onClick={() => confirmarAdicionarComObservacao(produto)}
                              className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white"
                            >
                              Adicionar
                            </button>
                          </div>
                        )}
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
                      key={`${item.produtoId}-${item.origem}-${item.observacao ?? ''}-${index}`}
                      className="flex items-start justify-between gap-2 text-sm"
                    >
                      <div>
                        <span className="text-zinc-700">
                          <span className="font-bold text-zinc-900">{item.quantidade}×</span> {item.nome}
                        </span>
                        {item.observacao && (
                          <p className="mt-0.5 text-xs font-medium text-amber-700">📝 {item.observacao}</p>
                        )}
                      </div>
                      <span className="shrink-0 font-semibold text-zinc-900">
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
              <p className="text-xs text-zinc-400">{itensCarrinho} itens na sacola</p>
              <p className="text-lg font-black text-zinc-900">{formatarMoeda(totalCarrinho)}</p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarSacola(true)}
              className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition active:scale-95"
            >
              🛍️ Ver sacola
            </button>
          </div>
        </div>
      )}

      {mostrarSacola && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="flex max-h-[90svh] w-full max-w-md flex-col overflow-y-auto rounded-t-2xl bg-zinc-50 p-5 sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Sua sacola</h2>
              <button
                type="button"
                onClick={() => setMostrarSacola(false)}
                className="text-2xl leading-none text-zinc-400"
              >
                &times;
              </button>
            </div>

            {carrinho.length === 0 ? (
              <p className="rounded-xl bg-white p-4 text-center text-sm text-zinc-400 shadow-sm">
                Sua sacola está vazia.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {carrinho.map((linha) => (
                  <div key={linha.chave} className="rounded-xl bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-zinc-900">{linha.produto.nome}</p>
                        <p className="text-xs text-zinc-400">{formatarMoeda(linha.produto.preco)} un.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removerLinha(linha.chave)}
                        className="text-xs font-semibold text-red-500"
                      >
                        🗑 Remover
                      </button>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => alterarQuantidadeLinha(linha.chave, -1)}
                        className="h-7 w-7 rounded-lg bg-zinc-100 font-bold text-zinc-600"
                      >
                        −
                      </button>
                      <span className="w-5 text-center font-bold text-zinc-900">{linha.quantidade}</span>
                      <button
                        type="button"
                        onClick={() => alterarQuantidadeLinha(linha.chave, 1)}
                        className="h-7 w-7 rounded-lg bg-orange-600 font-bold text-white"
                      >
                        +
                      </button>
                      <span className="ml-auto font-bold text-zinc-900">
                        {formatarMoeda(linha.produto.preco * linha.quantidade)}
                      </span>
                    </div>

                    <input
                      value={linha.observacao}
                      onChange={(e) => editarObservacaoLinha(linha.chave, e.target.value)}
                      placeholder="Adicionar observação (ex: sem cebola)"
                      className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                ))}

                <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
                  <span className="font-bold text-zinc-500">Total</span>
                  <span className="text-xl font-black text-zinc-900">{formatarMoeda(totalCarrinho)}</span>
                </div>
              </div>
            )}

            {erroEnvio && (
              <p className="mt-3 rounded-lg bg-red-50 p-2 text-center text-sm text-red-600">{erroEnvio}</p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={enviando}
                onClick={() => setMostrarSacola(false)}
                className="flex-1 rounded-xl bg-zinc-200 px-4 py-3 font-semibold text-zinc-700 disabled:opacity-60"
              >
                Continuar comprando
              </button>
              <button
                type="button"
                disabled={enviando || carrinho.length === 0}
                onClick={() => void confirmarEnvio()}
                className="flex-[2] rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white transition active:scale-95 disabled:opacity-60"
              >
                {enviando ? 'Enviando...' : 'Confirmar e Enviar Pedido'}
              </button>
            </div>
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
