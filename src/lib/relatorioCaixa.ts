import { formatarDataBR, formatarMoeda } from './utils'
import type { FormaPagamento, Venda } from '../types'

export const LABEL_FORMA_PAGAMENTO: Record<FormaPagamento, string> = {
  PIX: 'Pix',
  DINHEIRO: 'Dinheiro',
  CARTAO_DEBITO: 'Cartão Débito',
  CARTAO_CREDITO: 'Cartão Crédito',
}

export interface TotaisCaixa {
  geral: number
  PIX: number
  DINHEIRO: number
  CARTAO_DEBITO: number
  CARTAO_CREDITO: number
}

/** Soma os totais por forma de pagamento a partir das vendas já fechadas — leitura pura, sem tocar no Firestore. */
export function calcularTotaisCaixa(vendas: Venda[]): TotaisCaixa {
  const totais: TotaisCaixa = { geral: 0, PIX: 0, DINHEIRO: 0, CARTAO_DEBITO: 0, CARTAO_CREDITO: 0 }
  for (const venda of vendas) {
    totais.geral += venda.total
    totais[venda.formaPagamento] += venda.total
  }
  return totais
}

export interface ItemRanking {
  nome: string
  quantidade: number
  faturamento: number
}

export function calcularRankingItens(vendas: Venda[], limite = 10): ItemRanking[] {
  const mapa = new Map<string, ItemRanking>()
  for (const venda of vendas) {
    for (const item of venda.itens) {
      const atual = mapa.get(item.nome) ?? { nome: item.nome, quantidade: 0, faturamento: 0 }
      atual.quantidade += item.quantidade
      atual.faturamento += item.subtotal
      mapa.set(item.nome, atual)
    }
  }
  return [...mapa.values()].sort((a, b) => b.quantidade - a.quantidade).slice(0, limite)
}

export interface DadosRelatorioCaixa {
  nomeLoja: string
  /** Data do fechamento, no formato YYYY-MM-DD */
  dataString: string
  responsavel: string
  vendas: Venda[]
}

export function vendasOrdenadasPorHorario(vendas: Venda[]): Venda[] {
  return [...vendas].sort((a, b) => {
    const horaA = a.dataFechamento?.toMillis?.() ?? 0
    const horaB = b.dataFechamento?.toMillis?.() ?? 0
    return horaA - horaB
  })
}

/** Monta o texto do resumo para compartilhamento (WhatsApp/Web Share). */
export function gerarTextoResumo(dados: DadosRelatorioCaixa): string {
  const { nomeLoja, dataString, vendas } = dados
  const totais = calcularTotaisCaixa(vendas)

  return [
    `📊 *Fechamento de Caixa — ${nomeLoja}*`,
    `📅 ${formatarDataBR(dataString)}`,
    '',
    `💰 Total Geral: ${formatarMoeda(totais.geral)}`,
    `💠 Pix: ${formatarMoeda(totais.PIX)}`,
    `💵 Dinheiro: ${formatarMoeda(totais.DINHEIRO)}`,
    `💳 Cartão Débito: ${formatarMoeda(totais.CARTAO_DEBITO)}`,
    `💳 Cartão Crédito: ${formatarMoeda(totais.CARTAO_CREDITO)}`,
    '',
    `🧾 Comandas atendidas: ${vendas.length}`,
    '',
    '_Gerado automaticamente pelo sistema Na Brasa_',
  ].join('\n')
}

function abrirWhatsApp(texto: string): void {
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Compartilha o resumo do fechamento via Web Share API nativa; se indisponível
 * (ou se falhar por motivo diferente de cancelamento do usuário), cai para um
 * link direto do WhatsApp com o texto pronto.
 */
export async function compartilharResumo(dados: DadosRelatorioCaixa): Promise<void> {
  const texto = gerarTextoResumo(dados)
  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> }

  if (nav.share) {
    try {
      await nav.share({ text: texto, title: `Fechamento de Caixa — ${dados.nomeLoja}` })
      return
    } catch (erro) {
      // Usuário cancelou o compartilhamento nativo: respeita a decisão, sem fallback.
      if (erro instanceof Error && erro.name === 'AbortError') return
    }
  }

  abrirWhatsApp(texto)
}
