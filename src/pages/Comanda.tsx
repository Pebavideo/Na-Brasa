import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMesa } from '../hooks/useMesa'
import { useProdutos } from '../hooks/useProdutos'
import { useAuth } from '../contexts/AuthContext'
import { Loading } from '../components/Loading'
import { Checkout } from '../components/Checkout'
import { AdicionarItemModal } from '../components/AdicionarItemModal'
import { EditarItemModal } from '../components/EditarItemModal'
import {
  adicionarItemMesa,
  editarItemMesa,
  excluirMesa,
  removerLinhaMesa,
  type IdentificadorLinhaItem,
} from '../lib/firestore'
import { formatarMoeda } from '../lib/utils'
import { mensagemDeErroFirestore } from '../lib/erros'
import type { ItemComanda, Produto } from '../types'

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
  const [mostrarModalAdicionar, setMostrarModalAdicionar] = useState(false)
  const [excluindoMesa, setExcluindoMesa] = useState(false)
  const [confirmacaoVisivel, setConfirmacaoVisivel] = useState(false)

  // Edição de linha já lançada (modal)
  const [itemEditando, setItemEditando] = useState<{ indice: number; item: ItemComanda } | null>(null)
  const [removendoIndice, setRemovendoIndice] = useState<number | null>(null)

  const handleAdicionarPedido = async (produto: Produto, quantidade: number, observacao: string) => {
    if (!mesaId || !atendente) throw new Error('Selecione um atendente antes de lançar itens.')
    await adicionarItemMesa(mesaId, produto, 'GARCOM', atendente, quantidade, observacao)
  }

  const handleSalvarEdicao = async (novaQuantidade: number, novaObservacao: string) => {
    if (!mesaId || !itemEditando) return
    await editarItemMesa(mesaId, identificarLinha(itemEditando.item), novaQuantidade, novaObservacao)
  }

  const handleRemoverLinha = async (indice: number, item: ItemComanda) => {
    if (!mesaId || removendoIndice !== null) return
    if (!confirm(`Remover "${item.nome}" da comanda?`)) return
    setRemovendoIndice(indice)
    try {
      await removerLinhaMesa(mesaId, identificarLinha(item))
    } catch (erroRemover) {
      alert(mensagemDeErroFirestore(erroRemover, 'Não foi possível remover o item. Tente novamente.'))
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
    } catch (erroExcluirMesa) {
      alert(mensagemDeErroFirestore(erroExcluirMesa, 'Não foi possível excluir a mesa. Tente novamente.'))
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

  const totalItens = mesa.itens.reduce((soma, item) => soma + item.quantidade, 0)

  return (
    <div className="flex flex-col gap-4 pb-52">
      {/* Cabeçalho: mesa, status, garçom responsável e total parcial */}
      <div className="flex items-start justify-between">
        <div>
          <button type="button" onClick={() => navigate('/mesas')} className="text-sm text-zinc-400">
            ← Mesas
          </button>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-zinc-900">{mesa.identificador}</h1>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                mesa.status === 'ocupada' ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {mesa.status === 'ocupada' ? 'Ocupada' : 'Livre'}
            </span>
            {mesa.atendenteResponsavel && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-500">
                👤 {mesa.atendenteResponsavel}
              </span>
            )}
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

      {/* Botão de destaque para lançar pedidos */}
      <button
        type="button"
        onClick={() => setMostrarModalAdicionar(true)}
        className="rounded-xl bg-orange-600 px-5 py-4 text-base font-bold text-white shadow-md transition active:scale-95"
      >
        + Adicionar Item
      </button>

      {/* Lista de Pedidos da Mesa */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-bold text-zinc-500">Itens na comanda</h2>
        {mesa.itens.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Nenhum item lançado ainda. Toque em "+ Adicionar Item" para começar.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {mesa.itens.map((item, indice) => {
              const removendo = removendoIndice === indice
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
                      onClick={() => setItemEditando({ indice, item })}
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
              <p className="text-xs text-zinc-400">
                {totalItens} {totalItens === 1 ? 'item' : 'itens'} · Total da comanda
              </p>
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
              💾 Salvar / Enviar Pedido
            </button>
            <button
              type="button"
              onClick={() => navigate('/mesas')}
              className="flex-1 rounded-lg bg-zinc-100 py-2 text-sm font-semibold text-zinc-700 transition active:scale-95"
            >
              ⬅️ Voltar para Mesas
            </button>
          </div>
          {confirmacaoVisivel && (
            <p className="text-center text-xs font-bold text-emerald-600">
              ✅ Pedidos salvos! A mesa continua aberta no salão.
            </p>
          )}
        </div>
      </div>

      {mostrarModalAdicionar && (
        <AdicionarItemModal
          produtos={produtos}
          onConfirmar={handleAdicionarPedido}
          onFechar={() => setMostrarModalAdicionar(false)}
        />
      )}

      {itemEditando && (
        <EditarItemModal
          item={itemEditando.item}
          onSalvar={handleSalvarEdicao}
          onFechar={() => setItemEditando(null)}
        />
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
