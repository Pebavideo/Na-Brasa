import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMesa } from '../hooks/useMesa'
import { useProdutos } from '../hooks/useProdutos'
import { useAuth } from '../contexts/AuthContext'
import { Loading } from '../components/Loading'
import { Checkout } from '../components/Checkout'
import { ImagemProduto } from '../components/ImagemProduto'
import { adicionarItemMesa, excluirMesa, removerItemMesa } from '../lib/firestore'
import { agruparPorCategoria, formatarMoeda } from '../lib/utils'

export function Comanda() {
  const { mesaId } = useParams<{ mesaId: string }>()
  const navigate = useNavigate()
  const { mesa, loading, erro } = useMesa(mesaId)
  const { produtos, loading: carregandoProdutos } = useProdutos()
  const { atendente, isSuperAdmin } = useAuth()
  const [mostrarCheckout, setMostrarCheckout] = useState(false)
  const [processandoItem, setProcessandoItem] = useState<string | null>(null)
  const [excluindoMesa, setExcluindoMesa] = useState(false)
  const [produtoComObservacaoAberta, setProdutoComObservacaoAberta] = useState<string | null>(null)
  const [textoObservacao, setTextoObservacao] = useState('')

  const categorias = useMemo(() => agruparPorCategoria(produtos), [produtos])

  const quantidadeLancada = (produtoId: string) =>
    mesa?.itens
      .filter((item) => item.produtoId === produtoId && item.origem === 'GARCOM' && item.atendente === atendente)
      .reduce((soma, item) => soma + item.quantidade, 0) ?? 0

  const handleAdicionar = async (produto: (typeof produtos)[number]) => {
    if (!mesaId || !atendente) return
    setProcessandoItem(produto.id)
    try {
      await adicionarItemMesa(mesaId, produto, 'GARCOM', atendente)
    } finally {
      setProcessandoItem(null)
    }
  }

  const handleRemover = async (produtoId: string) => {
    if (!mesaId || !atendente) return
    setProcessandoItem(produtoId)
    try {
      await removerItemMesa(mesaId, produtoId, 'GARCOM', atendente)
    } finally {
      setProcessandoItem(null)
    }
  }

  const handleAdicionarComObservacao = async (produto: (typeof produtos)[number]) => {
    if (!mesaId || !atendente) return
    setProcessandoItem(produto.id)
    try {
      await adicionarItemMesa(mesaId, produto, 'GARCOM', atendente, 1, textoObservacao)
      setProdutoComObservacaoAberta(null)
      setTextoObservacao('')
    } finally {
      setProcessandoItem(null)
    }
  }

  const handleExcluirMesa = async () => {
    if (!mesaId || excluindoMesa) return
    if (!confirm('Excluir esta mesa permanentemente?')) return
    setExcluindoMesa(true)
    try {
      await excluirMesa(mesaId)
      navigate('/mesas')
    } catch {
      alert('Não foi possível excluir a mesa. Tente novamente.')
      setExcluindoMesa(false)
    }
  }

  if (loading || carregandoProdutos) return <Loading texto="Carregando comanda..." />

  if (erro || !mesa) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-zinc-500">{erro ?? 'Mesa não encontrada.'}</p>
        <button
          type="button"
          onClick={() => navigate('/mesas')}
          className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white"
        >
          Voltar para mesas
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-28">
      <div className="flex items-center justify-between">
        <div>
          <button type="button" onClick={() => navigate('/mesas')} className="text-sm text-zinc-400">
            ← Mesas
          </button>
          <h1 className="text-xl font-bold text-zinc-900">{mesa.identificador}</h1>
        </div>
        {isSuperAdmin && mesa.status === 'livre' && (
          <button
            type="button"
            disabled={excluindoMesa}
            onClick={() => void handleExcluirMesa()}
            className="text-xs font-semibold text-red-500 disabled:opacity-50"
          >
            {excluindoMesa ? 'Excluindo...' : 'Excluir mesa'}
          </button>
        )}
      </div>

      {mesa.itens.length > 0 && (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-zinc-500">Itens na comanda</h2>
          <ul className="flex flex-col gap-2">
            {mesa.itens.map((item, index) => (
              <li
                key={`${item.produtoId}-${item.origem}-${item.atendente ?? ''}-${item.observacao ?? ''}-${index}`}
                className="flex items-start justify-between gap-2 text-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900">{item.quantidade}×</span>
                    <span className="text-zinc-700">{item.nome}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        item.origem === 'CLIENTE' ? 'bg-sky-100 text-sky-700' : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {item.origem === 'CLIENTE' ? 'Cliente' : item.atendente}
                    </span>
                  </div>
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
        </div>
      )}

      <div className="flex flex-col gap-4">
        {categorias.map(([categoria, itensCategoria]) => (
          <div key={categoria}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-zinc-400">{categoria}</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {itensCategoria
                .filter((produto) => produto.disponivel)
                .map((produto) => {
                  const quantidade = quantidadeLancada(produto.id)
                  const processando = processandoItem === produto.id
                  const observacaoAberta = produtoComObservacaoAberta === produto.id
                  return (
                    <div key={produto.id} className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {produto.fotoUrl && (
                            <ImagemProduto
                              src={produto.fotoUrl}
                              alt={produto.nome}
                              className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-zinc-900">{produto.nome}</p>
                            <p className="text-sm text-zinc-400">{formatarMoeda(produto.preco)}</p>
                            {produto.descricao && (
                              <p className="mt-0.5 max-w-[200px] text-xs text-zinc-400">{produto.descricao}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={processando || quantidade === 0}
                            onClick={() => void handleRemover(produto.id)}
                            className="h-8 w-8 rounded-lg bg-zinc-100 font-bold text-zinc-600 disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="w-5 text-center font-bold text-zinc-900">{quantidade}</span>
                          <button
                            type="button"
                            disabled={processando}
                            onClick={() => void handleAdicionar(produto)}
                            className="h-8 w-8 rounded-lg bg-orange-600 font-bold text-white disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      </div>

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
                            placeholder="Ex: sem cebola, mal passada..."
                            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                          />
                          <button
                            type="button"
                            disabled={processando}
                            onClick={() => void handleAdicionarComObservacao(produto)}
                            className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
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
      </div>

      {mesa.status === 'ocupada' && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white p-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <div>
              <p className="text-xs text-zinc-400">Total da comanda</p>
              <p className="text-xl font-black text-zinc-900">{formatarMoeda(mesa.totalAtual)}</p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarCheckout(true)}
              className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition active:scale-95"
            >
              Fechar comanda
            </button>
          </div>
        </div>
      )}

      {mostrarCheckout && atendente && (
        <Checkout
          mesa={mesa}
          atendenteFechamento={atendente}
          onCancelar={() => setMostrarCheckout(false)}
          onFechado={() => {
            setMostrarCheckout(false)
            navigate('/mesas')
          }}
        />
      )}
    </div>
  )
}
