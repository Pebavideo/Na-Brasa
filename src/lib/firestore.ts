import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import { getDataString } from './utils'
import type {
  Configuracoes,
  FormaPagamento,
  ItemComanda,
  MesaComanda,
  OrigemItem,
  Produto,
} from '../types'

const mesasRef = collection(db, 'mesas_comandas')
const produtosRef = collection(db, 'produtos')
const vendasRef = collection(db, 'vendas')
const configDocRef = doc(db, 'configuracoes', 'loja')

function calcularTotal(itens: ItemComanda[]): number {
  return itens.reduce((soma, item) => soma + item.precoUnit * item.quantidade, 0)
}

// ---------- Mesas / Comandas ----------

export async function criarMesa(identificador: string): Promise<string> {
  const novaMesa = doc(mesasRef)
  await setDoc(novaMesa, {
    identificador,
    status: 'livre',
    totalAtual: 0,
    itens: [],
    ultimaAtualizacao: serverTimestamp(),
  })
  return novaMesa.id
}

export async function excluirMesa(mesaId: string): Promise<void> {
  await deleteDoc(doc(mesasRef, mesaId))
}

export async function adicionarItemMesa(
  mesaId: string,
  produto: Produto,
  origem: OrigemItem,
  atendente?: string,
): Promise<void> {
  const mesaDocRef = doc(mesasRef, mesaId)

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(mesaDocRef)
    if (!snapshot.exists()) throw new Error('Mesa não encontrada')

    const mesa = snapshot.data() as MesaComanda
    const itens = [...(mesa.itens ?? [])]

    const indiceExistente = itens.findIndex(
      (item) =>
        item.produtoId === produto.id &&
        item.origem === origem &&
        item.atendente === atendente,
    )

    if (indiceExistente >= 0) {
      itens[indiceExistente] = {
        ...itens[indiceExistente],
        quantidade: itens[indiceExistente].quantidade + 1,
        horaLancamento: Timestamp.now(),
      }
    } else {
      itens.push({
        produtoId: produto.id,
        nome: produto.nome,
        precoUnit: produto.preco,
        quantidade: 1,
        origem,
        ...(atendente ? { atendente } : {}),
        horaLancamento: Timestamp.now(),
      })
    }

    transaction.update(mesaDocRef, {
      itens,
      totalAtual: calcularTotal(itens),
      status: 'ocupada',
      ultimaAtualizacao: serverTimestamp(),
    })
  })
}

/** Usado pelo autoatendimento: envia todo o carrinho do cliente de uma só vez. */
export async function enviarPedidoCliente(
  mesaId: string,
  carrinho: { produto: Produto; quantidade: number }[],
): Promise<void> {
  if (carrinho.length === 0) return
  const mesaDocRef = doc(mesasRef, mesaId)

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(mesaDocRef)
    if (!snapshot.exists()) throw new Error('Mesa não encontrada')

    const mesa = snapshot.data() as MesaComanda
    const itens = [...(mesa.itens ?? [])]
    const agora = Timestamp.now()

    for (const { produto, quantidade } of carrinho) {
      const indiceExistente = itens.findIndex(
        (item) => item.produtoId === produto.id && item.origem === 'CLIENTE',
      )
      if (indiceExistente >= 0) {
        itens[indiceExistente] = {
          ...itens[indiceExistente],
          quantidade: itens[indiceExistente].quantidade + quantidade,
          horaLancamento: agora,
        }
      } else {
        itens.push({
          produtoId: produto.id,
          nome: produto.nome,
          precoUnit: produto.preco,
          quantidade,
          origem: 'CLIENTE',
          horaLancamento: agora,
        })
      }
    }

    transaction.update(mesaDocRef, {
      itens,
      totalAtual: calcularTotal(itens),
      status: 'ocupada',
      ultimaAtualizacao: serverTimestamp(),
    })
  })
}

export async function removerItemMesa(
  mesaId: string,
  produtoId: string,
  origem: OrigemItem,
  atendente?: string,
): Promise<void> {
  const mesaDocRef = doc(mesasRef, mesaId)

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(mesaDocRef)
    if (!snapshot.exists()) throw new Error('Mesa não encontrada')

    const mesa = snapshot.data() as MesaComanda
    const itens = [...(mesa.itens ?? [])]

    const indiceExistente = itens.findIndex(
      (item) =>
        item.produtoId === produtoId &&
        item.origem === origem &&
        item.atendente === atendente,
    )
    if (indiceExistente < 0) return

    const itemAtual = itens[indiceExistente]
    if (itemAtual.quantidade <= 1) {
      itens.splice(indiceExistente, 1)
    } else {
      itens[indiceExistente] = {
        ...itemAtual,
        quantidade: itemAtual.quantidade - 1,
      }
    }

    transaction.update(mesaDocRef, {
      itens,
      totalAtual: calcularTotal(itens),
      status: itens.length > 0 ? 'ocupada' : 'livre',
      ultimaAtualizacao: serverTimestamp(),
    })
  })
}

interface FecharComandaParams {
  mesa: MesaComanda
  formaPagamento: FormaPagamento
  atendenteFechamento: string
  valorRecebido?: number
}

export async function fecharComanda({
  mesa,
  formaPagamento,
  atendenteFechamento,
  valorRecebido,
}: FecharComandaParams): Promise<void> {
  const batch = writeBatch(db)

  const novaVendaRef = doc(vendasRef)
  const agora = new Date()

  const troco =
    formaPagamento === 'DINHEIRO' && valorRecebido !== undefined
      ? Number((valorRecebido - mesa.totalAtual).toFixed(2))
      : undefined

  batch.set(novaVendaRef, {
    identificadorMesa: mesa.identificador,
    total: mesa.totalAtual,
    formaPagamento,
    ...(valorRecebido !== undefined ? { valorRecebido } : {}),
    ...(troco !== undefined ? { troco } : {}),
    itens: mesa.itens.map((item) => ({
      nome: item.nome,
      precoUnit: item.precoUnit,
      quantidade: item.quantidade,
      subtotal: Number((item.precoUnit * item.quantidade).toFixed(2)),
    })),
    atendenteFechamento,
    dataFechamento: serverTimestamp(),
    dataString: getDataString(agora),
  })

  const mesaDocRef = doc(mesasRef, mesa.id)
  batch.update(mesaDocRef, {
    status: 'livre',
    totalAtual: 0,
    itens: [],
    ultimaAtualizacao: serverTimestamp(),
  })

  await batch.commit()
}

// ---------- Produtos ----------

export async function criarProduto(produto: Omit<Produto, 'id'>): Promise<void> {
  await addDoc(produtosRef, produto)
}

export async function atualizarProduto(
  produtoId: string,
  dados: Partial<Omit<Produto, 'id'>>,
): Promise<void> {
  await updateDoc(doc(produtosRef, produtoId), dados)
}

export async function excluirProduto(produtoId: string): Promise<void> {
  await deleteDoc(doc(produtosRef, produtoId))
}

// ---------- Configurações ----------

export async function atualizarConfiguracoes(
  dados: Partial<Configuracoes>,
): Promise<void> {
  await setDoc(configDocRef, dados, { merge: true })
}
