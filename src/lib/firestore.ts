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
import { ehDataUrl, tamanhoBase64EmBytes } from './imagem'
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

/** O Firestore rejeita valores `undefined` — remove esses campos antes de gravar. */
function removerCamposIndefinidos<T extends object>(dados: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(dados).filter(([, valor]) => valor !== undefined),
  ) as Partial<T>
}

// ---------- Mesas / Comandas ----------

export async function criarMesa(identificador: string): Promise<string> {
  const nome = identificador.trim()
  if (!nome) throw new Error('Identificador da mesa é obrigatório')

  const novaMesa = doc(mesasRef)
  await setDoc(novaMesa, {
    identificador: nome,
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

/**
 * Lança um item na comanda. Itens do mesmo produto/origem/atendente COM A MESMA
 * observação são somados numa única linha; uma observação diferente sempre vira
 * uma linha nova, já que representa um pedido distinto (ex: "sem cebola").
 */
export async function adicionarItemMesa(
  mesaId: string,
  produto: Produto,
  origem: OrigemItem,
  atendente?: string,
  quantidade = 1,
  observacao?: string,
): Promise<void> {
  const mesaDocRef = doc(mesasRef, mesaId)
  const observacaoLimpa = observacao?.trim() || undefined

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(mesaDocRef)
    if (!snapshot.exists()) throw new Error('Mesa não encontrada')

    const mesa = snapshot.data() as MesaComanda
    const itens = [...(mesa.itens ?? [])]

    const indiceExistente = itens.findIndex(
      (item) =>
        item.produtoId === produto.id &&
        item.origem === origem &&
        item.atendente === atendente &&
        (item.observacao ?? undefined) === observacaoLimpa,
    )

    if (indiceExistente >= 0) {
      itens[indiceExistente] = {
        ...itens[indiceExistente],
        quantidade: itens[indiceExistente].quantidade + quantidade,
        horaLancamento: Timestamp.now(),
      }
    } else {
      itens.push({
        produtoId: produto.id,
        nome: produto.nome,
        precoUnit: produto.preco,
        quantidade,
        origem,
        ...(atendente ? { atendente } : {}),
        ...(observacaoLimpa ? { observacao: observacaoLimpa } : {}),
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

export interface LinhaCarrinhoCliente {
  produto: Produto
  quantidade: number
  observacao?: string
}

/**
 * Usado pelo autoatendimento: envia toda a sacola do cliente de uma só vez.
 * Assim como no lançamento do garçom, linhas com a mesma observação são
 * somadas; observações diferentes viram linhas separadas na comanda.
 */
export async function enviarPedidoCliente(
  mesaId: string,
  carrinho: LinhaCarrinhoCliente[],
): Promise<void> {
  if (carrinho.length === 0) return
  const mesaDocRef = doc(mesasRef, mesaId)

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(mesaDocRef)
    if (!snapshot.exists()) throw new Error('Mesa não encontrada')

    const mesa = snapshot.data() as MesaComanda
    const itens = [...(mesa.itens ?? [])]
    const agora = Timestamp.now()

    for (const { produto, quantidade, observacao } of carrinho) {
      const observacaoLimpa = observacao?.trim() || undefined
      const indiceExistente = itens.findIndex(
        (item) =>
          item.produtoId === produto.id &&
          item.origem === 'CLIENTE' &&
          (item.observacao ?? undefined) === observacaoLimpa,
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
          ...(observacaoLimpa ? { observacao: observacaoLimpa } : {}),
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
  observacao?: string,
): Promise<void> {
  const mesaDocRef = doc(mesasRef, mesaId)
  const observacaoLimpa = observacao?.trim() || undefined

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(mesaDocRef)
    if (!snapshot.exists()) throw new Error('Mesa não encontrada')

    const mesa = snapshot.data() as MesaComanda
    const itens = [...(mesa.itens ?? [])]

    const indiceExistente = itens.findIndex(
      (item) =>
        item.produtoId === produtoId &&
        item.origem === origem &&
        item.atendente === atendente &&
        (item.observacao ?? undefined) === observacaoLimpa,
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

export interface IdentificadorLinhaItem {
  produtoId: string
  origem: OrigemItem
  atendente?: string
  observacao?: string
}

function encontrarIndiceLinha(itens: ItemComanda[], alvo: IdentificadorLinhaItem): number {
  const observacaoAlvo = alvo.observacao?.trim() || undefined
  return itens.findIndex(
    (item) =>
      item.produtoId === alvo.produtoId &&
      item.origem === alvo.origem &&
      item.atendente === alvo.atendente &&
      (item.observacao ?? undefined) === observacaoAlvo,
  )
}

/** Remove a linha inteira da comanda (todas as unidades daquele lançamento), não apenas uma unidade. */
export async function removerLinhaMesa(mesaId: string, alvo: IdentificadorLinhaItem): Promise<void> {
  const mesaDocRef = doc(mesasRef, mesaId)

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(mesaDocRef)
    if (!snapshot.exists()) throw new Error('Mesa não encontrada')

    const mesa = snapshot.data() as MesaComanda
    const itens = [...(mesa.itens ?? [])]
    const indice = encontrarIndiceLinha(itens, alvo)
    if (indice < 0) return

    itens.splice(indice, 1)

    transaction.update(mesaDocRef, {
      itens,
      totalAtual: calcularTotal(itens),
      status: itens.length > 0 ? 'ocupada' : 'livre',
      ultimaAtualizacao: serverTimestamp(),
    })
  })
}

/** Edita quantidade e/ou observação de uma linha já lançada. Quantidade 0 remove a linha. */
export async function editarItemMesa(
  mesaId: string,
  alvo: IdentificadorLinhaItem,
  novaQuantidade: number,
  novaObservacao?: string,
): Promise<void> {
  if (!Number.isFinite(novaQuantidade) || novaQuantidade < 0) {
    throw new Error('Quantidade inválida')
  }
  const mesaDocRef = doc(mesasRef, mesaId)
  const observacaoLimpa = novaObservacao?.trim() || undefined

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(mesaDocRef)
    if (!snapshot.exists()) throw new Error('Mesa não encontrada')

    const mesa = snapshot.data() as MesaComanda
    const itens = [...(mesa.itens ?? [])]
    const indice = encontrarIndiceLinha(itens, alvo)
    if (indice < 0) throw new Error('Item não encontrado na comanda')

    if (novaQuantidade === 0) {
      itens.splice(indice, 1)
    } else {
      const itemAtualizado: ItemComanda = {
        ...itens[indice],
        quantidade: novaQuantidade,
        horaLancamento: Timestamp.now(),
      }
      if (observacaoLimpa) {
        itemAtualizado.observacao = observacaoLimpa
      } else {
        delete itemAtualizado.observacao
      }
      itens[indice] = itemAtualizado
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
  if (!atendenteFechamento.trim()) throw new Error('Atendente responsável é obrigatório')
  if (!mesa.itens.length || mesa.totalAtual <= 0) throw new Error('Comanda vazia não pode ser fechada')

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
      ...(item.observacao ? { observacao: item.observacao } : {}),
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

/** Limite de segurança bem acima do que a compressão client-side produz (~300KB). */
const TAMANHO_MAXIMO_FOTO_BYTES = 700 * 1024
/** Limite generoso para uma URL colada — nada a ver com o peso da imagem em si. */
const TAMANHO_MAXIMO_LINK_CARACTERES = 2048

function validarFotoUrl(fotoUrl: string | undefined): void {
  if (!fotoUrl) return

  // fotoUrl guarda tanto base64 comprimido (upload) quanto link externo (URL):
  // o limite de bytes só faz sentido para o primeiro caso.
  if (ehDataUrl(fotoUrl)) {
    if (tamanhoBase64EmBytes(fotoUrl) > TAMANHO_MAXIMO_FOTO_BYTES) {
      throw new Error('Imagem do produto muito grande. Escolha outra foto.')
    }
  } else if (fotoUrl.length > TAMANHO_MAXIMO_LINK_CARACTERES) {
    throw new Error('Link da imagem muito longo.')
  }
}

export async function criarProduto(produto: Omit<Produto, 'id'>): Promise<void> {
  const nome = produto.nome.trim()
  if (!nome) throw new Error('Nome do produto é obrigatório')
  if (!Number.isFinite(produto.preco) || produto.preco <= 0) {
    throw new Error('Preço do produto deve ser maior que zero')
  }
  validarFotoUrl(produto.fotoUrl)
  await addDoc(produtosRef, removerCamposIndefinidos({ ...produto, nome }))
}

export async function atualizarProduto(
  produtoId: string,
  dados: Partial<Omit<Produto, 'id'>>,
): Promise<void> {
  if (dados.nome !== undefined && !dados.nome.trim()) {
    throw new Error('Nome do produto é obrigatório')
  }
  if (dados.preco !== undefined && (!Number.isFinite(dados.preco) || dados.preco <= 0)) {
    throw new Error('Preço do produto deve ser maior que zero')
  }
  validarFotoUrl(dados.fotoUrl)
  await updateDoc(doc(produtosRef, produtoId), removerCamposIndefinidos(dados))
}

export async function excluirProduto(produtoId: string): Promise<void> {
  await deleteDoc(doc(produtosRef, produtoId))
}

// ---------- Configurações ----------

export async function atualizarConfiguracoes(
  dados: Partial<Configuracoes>,
): Promise<void> {
  await setDoc(configDocRef, removerCamposIndefinidos(dados), { merge: true })
}
