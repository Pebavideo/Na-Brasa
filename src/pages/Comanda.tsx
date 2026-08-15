import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMesa } from '../hooks/useMesa'
import { useProdutos } from '../hooks/useProdutos'
import { useAuth } from '../contexts/AuthContext'
import { Loading } from '../components/Loading'
import { Checkout } from '../components/Checkout'
import {
  adicionarItemMesa,
  editarItemMesa,
  excluirMesa,
  removerLinhaMesa,
  type IdentificadorLinhaItem,
} from '../lib/firestore'
import { formatarMoeda } from '../lib/utils'
import type { ItemComanda } from '../types'

function identificarLinha(item: ItemComanda): IdentificadorLinhaItem {
  return {
    produtoId: item.produtoId,
    origem: item.origem,
    atendente: item.atendente,
    observacao: item.observacao,
  }
}

export function Comanda() {
  const { mesaId } = useParams<{ mesaId: string }>()
  const navigate = useNavigate()
  const { mesa, loading, erro } = useMesa(mesaId)
  const { produtos, loading: carregandoProdutos } = useProdutos()
  const { atendente, isSuperAdmin } = useAuth()

  const [mostrarCheckout, setMostrarCheckout] = useState(false)
  const [excluindoMesa, setExcluindoMesa] = useState(false)

  // Lançamento rápido
  const [buscaProduto, setBuscaProduto] = useState('')
  const [quantidadeNova, setQuantidadeNova] = useState(1)
  const [observacaoNova, setObservacaoNova] = useState('')
  const [adicionando, setAdicionando] = useState(false)
  const [erroForm, setErroForm] = useState<string | null>(null)

  // Edição de linha já lançada
  const [editandoIndice, setEditandoIndice] = useState<number | null>(null)
  const [quantidadeEdicao, setQuantidadeEdicao] = useState(1)
  const [observacaoEdicao, setObservacaoEdicao] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)
  const [removendoIndice, setRemovendoIndice] = useState<number | null>(null)

  const [confirmacaoVisivel, setConfirmacaoVisivel] = useState(false)

  const produtosDisponiveis = useMemo(() => produtos.filter((p) => p.disponivel), [produtos])
  const produtoSelecionado = useMemo(
    () =>
      produtosDisponiveis.find(
        (p) => p.nome.trim().toLowerCase() === buscaProduto.trim().toLowerCase(),
      ) ?? null,
    [produtosDisponiveis, buscaProduto],
  )

  const handleAdicionarPedido = async () => {
    if (!mesaId || !atendente || !produtoSelecionado || adicionando) return
    setAdicionando(true)
    setErroForm(null)
    try {
      await adicionarItemMesa(mesaId, produtoSelecionado, 'GARCOM', atendente, quantidadeNova, observacaoNova)
      setBuscaProduto('')
      setQuantidadeNova(1)
      setObservacaoNova('')
    } catch {
      setErroForm('Não foi possível lançar o pedido. Tente novamente.')
    } finally {
      setAdicionando(false)
    }
  }

  const iniciarEdicao = (indice: number, item: ItemComanda) => {
    setEditandoIndice(indice)
    setQuantidadeEdicao(item.quantidade)
    setObservacaoEdicao(item.observacao ?? '')
    setErroEdicao(null)
  }

  const cancelarEdicaoLinha = () => {
    setEditandoIndice(null)
    setErroEdicao(null)
  }

  const handleSalvarEdicao = async (item: ItemComanda) => {
    if (!mesaId || salvandoEdicao) return
    setSalvandoEdicao(true)
    setErroEdicao(null)
    try {
      await editarItemMesa(mesaId, identificarLinha(item), quantidadeEdicao, observacaoEdicao)
      setEditandoIndice(null)
    } catch {
      setErroEdicao('Não foi possível salvar. Tente novamente.')
    } finally {
      setSalvandoEdicao(false)
    }
  }

  const handleRemoverLinha = async (indice: number, item: ItemComanda) => {
    if (!mesaId || removendoIndice !== null) return
    if (!confirm(`Remover "${item.nome}" da comanda?`)) return
    setRemovendoIndice(indice)
    try {
      await removerLinhaMesa(mesaId, identificarLinha(item))
      if (editandoIndice === indice) setEditandoIndice(null)
    } catch {
      alert('Não foi possível remover o item. Tente novamente.')
    } finally {
      setRemovendoIndice(null)
    }
  }

  const handleConfirmarPedidos = () => {
    setConfirmacaoVisivel(true)
    setTimeout(() => setConfirmacaoVisivel(false), 2500)
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
    <div className="flex flex-col gap-4 pb-52">
      {/* Cabeçalho: mesa, status e total parcial */}
      <div className="flex items-start justify-between">
        <div>
          <button type="button" onClick={() => navigate('/mesas')} className="text-sm text-zinc-400">
            ← Mesas
          </button>
          <div className="mt-0.5 flex items-center gap-2">
            <h1 className="text-2xl font-black text-zinc-900">{mesa.identificador}</h1>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                mesa.status === 'ocupada' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {mesa.status === 'ocupada' ? 'Ocupada' : 'Livre'}
            </span>
          </div>
          <p className="text-sm text-zinc-500">
            Total parcial: <span className="font-bold text-zinc-900">{formatarMoeda(mesa.totalAtual)}</span>
          </p>
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

      {/* Área de Lançamento Rápido */}
      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-500">Lançamento rápido</h2>

        {produtosDisponiveis.length === 0 ? (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            Nenhum produto disponível no cardápio ainda. Peça para o administrador cadastrar
            produtos no Painel Admin.
          </p>
        ) : (
          <>
            <div>
              <label className="text-xs font-semibold text-zinc-500">Produto</label>
              <input
                list="produtos-cardapio"
                value={buscaProduto}
                onChange={(e) => setBuscaProduto(e.target.value)}
                placeholder="Digite ou selecione um produto do cardápio..."
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
              <datalist id="produtos-cardapio">
                {produtosDisponiveis.map((produto) => (
                  <option key={produto.id} value={produto.nome} />
                ))}
              </datalist>
              {buscaProduto.trim() && !produtoSelecionado && (
                <p className="mt-1 text-xs text-red-500">Produto não encontrado no cardápio.</p>
              )}
              {produtoSelecionado && (
                <p className="mt-1 text-xs text-zinc-500">
                  {formatarMoeda(produtoSelecionado.preco)}
                  {produtoSelecionado.descricao ? ` · ${produtoSelecionado.descricao}` : ''}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-500">Quantidade</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantidadeNova((q) => Math.max(1, q - 1))}
                    className="h-9 w-9 rounded-lg bg-zinc-100 font-bold text-zinc-600"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-bold text-zinc-900">{quantidadeNova}</span>
                  <button
                    type="button"
                    onClick={() => setQuantidadeNova((q) => q + 1)}
                    className="h-9 w-9 rounded-lg bg-orange-600 font-bold text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="min-w-[180px] flex-1">
                <label className="text-xs font-semibold text-zinc-500">Observação / preparo (opcional)</label>
                <input
                  value={observacaoNova}
                  onChange={(e) => setObservacaoNova(e.target.value)}
                  placeholder="Ex: carne mal passada, sem cebola..."
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {erroForm && <p className="text-xs text-red-500">{erroForm}</p>}

            <button
              type="button"
              disabled={!produtoSelecionado || adicionando}
              onClick={() => void handleAdicionarPedido()}
              className="self-start rounded-lg bg-orange-600 px-5 py-2 text-sm font-bold text-white transition active:scale-95 disabled:opacity-50"
            >
              {adicionando ? 'Adicionando...' : '+ Adicionar Pedido'}
            </button>
          </>
        )}
      </div>

      {/* Lista de Pedidos da Mesa */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-bold text-zinc-500">Itens na comanda</h2>
        {mesa.itens.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Nenhum item lançado ainda. Use o lançamento rápido acima para começar.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {mesa.itens.map((item, indice) => {
              const emEdicao = editandoIndice === indice
              const removendo = removendoIndice === indice

              if (emEdicao) {
                return (
                  <li
                    key={`${item.produtoId}-${item.origem}-${item.atendente ?? ''}-${item.observacao ?? ''}-${indice}`}
                    className="rounded-lg border border-orange-200 bg-orange-50 p-3"
                  >
                    <p className="mb-2 text-sm font-bold text-zinc-900">{item.nome}</p>
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className="text-xs font-semibold text-zinc-500">Quantidade</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQuantidadeEdicao((q) => Math.max(0, q - 1))}
                            className="h-8 w-8 rounded-lg bg-white font-bold text-zinc-600 shadow-sm"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-bold text-zinc-900">{quantidadeEdicao}</span>
                          <button
                            type="button"
                            onClick={() => setQuantidadeEdicao((q) => q + 1)}
                            className="h-8 w-8 rounded-lg bg-white font-bold text-zinc-600 shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="min-w-[160px] flex-1">
                        <label className="text-xs font-semibold text-zinc-500">Observação</label>
                        <input
                          value={observacaoEdicao}
                          onChange={(e) => setObservacaoEdicao(e.target.value)}
                          placeholder="Sem observação"
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    {erroEdicao && <p className="mt-2 text-xs text-red-500">{erroEdicao}</p>}

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={cancelarEdicaoLinha}
                        className="flex-1 rounded-lg bg-white py-2 text-sm font-semibold text-zinc-600 shadow-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={salvandoEdicao}
                        onClick={() => void handleSalvarEdicao(item)}
                        className={`flex-1 rounded-lg py-2 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60 ${
                          quantidadeEdicao === 0 ? 'bg-red-500' : 'bg-orange-600'
                        }`}
                      >
                        {salvandoEdicao ? 'Salvando...' : quantidadeEdicao === 0 ? 'Remover' : 'Salvar'}
                      </button>
                    </div>
                  </li>
                )
              }

              return (
                <li
                  key={`${item.produtoId}-${item.origem}-${item.atendente ?? ''}-${item.observacao ?? ''}-${indice}`}
                  className="rounded-lg border border-zinc-100 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
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
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={removendo}
                      onClick={() => iniciarEdicao(indice, item)}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600 disabled:opacity-50"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      type="button"
                      disabled={removendo}
                      onClick={() => void handleRemoverLinha(indice, item)}
                      className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500 disabled:opacity-50"
                    >
                      {removendo ? 'Removendo...' : '🗑 Remover'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Botões de Ação na Base */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white p-4">
        <div className="mx-auto flex max-w-5xl flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-zinc-400">Total da comanda</p>
              <p className="text-xl font-black text-zinc-900">{formatarMoeda(mesa.totalAtual)}</p>
            </div>
            <button
              type="button"
              disabled={mesa.itens.length === 0}
              onClick={() => setMostrarCheckout(true)}
              className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition active:scale-95 disabled:opacity-40"
            >
              💳 Fechar Conta / Pagar
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmarPedidos}
              className="flex-1 rounded-lg bg-zinc-100 py-2 text-sm font-semibold text-zinc-700 transition active:scale-95"
            >
              💾 Salvar / Confirmar Pedidos
            </button>
            <button
              type="button"
              onClick={() => navigate('/mesas')}
              className="flex-1 rounded-lg bg-zinc-100 py-2 text-sm font-semibold text-zinc-700 transition active:scale-95"
            >
              ← Cancelar / Voltar para Mesas
            </button>
          </div>
          {confirmacaoVisivel && (
            <p className="text-center text-xs font-bold text-emerald-600">
              ✅ Pedidos confirmados e salvos!
            </p>
          )}
        </div>
      </div>

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
