import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatarDataBR, formatarHora, formatarMoeda } from './utils'
import {
  LABEL_FORMA_PAGAMENTO,
  calcularRankingItens,
  calcularTotaisCaixa,
  vendasOrdenadasPorHorario,
  type DadosRelatorioCaixa,
} from './relatorioCaixa'

function obterFinalY(doc: jsPDF, padrao: number): number {
  const comLastAutoTable = doc as unknown as { lastAutoTable?: { finalY?: number } }
  return comLastAutoTable.lastAutoTable?.finalY ?? padrao
}

function garantirEspaco(doc: jsPDF, y: number, alturaMinima = 40): number {
  const alturaPagina = doc.internal.pageSize.getHeight()
  if (y > alturaPagina - alturaMinima) {
    doc.addPage()
    return 18
  }
  return y
}

/**
 * Gera e baixa automaticamente o PDF do fechamento de caixa do dia.
 * Não lê nem grava nada no Firestore — trabalha só com os dados já carregados na tela.
 * jsPDF/jspdf-autotable são pesados (arrastam html2canvas + DOMPurify), então este
 * módulo é sempre importado dinamicamente, só quando o lojista clica em "Baixar PDF".
 */
export function gerarPdfRelatorioCaixa(dados: DadosRelatorioCaixa): void {
  const { nomeLoja, dataString, responsavel, vendas } = dados
  const totais = calcularTotaisCaixa(vendas)
  const ranking = calcularRankingItens(vendas)
  const vendasOrdenadas = vendasOrdenadasPorHorario(vendas)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const largura = doc.internal.pageSize.getWidth()
  const margem = 14
  let y = 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(nomeLoja, largura / 2, y, { align: 'center' })

  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Relatório de Fechamento de Caixa', largura / 2, y, { align: 'center' })

  y += 9
  doc.setFontSize(9)
  doc.setTextColor(110)
  doc.text(`Data do fechamento: ${formatarDataBR(dataString)}`, margem, y)
  const emitidoEm = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  doc.text(`Emitido em: ${emitidoEm}`, largura - margem, y, { align: 'right' })
  y += 5
  doc.text(`Responsável: ${responsavel}`, margem, y)
  doc.setTextColor(0)

  y += 6

  autoTable(doc, {
    startY: y,
    margin: { left: margem, right: margem },
    head: [['Resumo Financeiro', 'Valor']],
    body: [
      ['Total em Pix', formatarMoeda(totais.PIX)],
      ['Total em Dinheiro', formatarMoeda(totais.DINHEIRO)],
      ['Total em Cartão Débito', formatarMoeda(totais.CARTAO_DEBITO)],
      ['Total em Cartão Crédito', formatarMoeda(totais.CARTAO_CREDITO)],
      ['Total Geral Faturado', formatarMoeda(totais.geral)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [234, 88, 12] },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 1: { halign: 'right' } },
    didParseCell: (celula) => {
      if (celula.section === 'body' && celula.row.index === 4) {
        celula.cell.styles.fontStyle = 'bold'
      }
    },
  })

  y = garantirEspaco(doc, obterFinalY(doc, y) + 10)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Detalhamento de Vendas', margem, y)
  y += 3

  if (vendasOrdenadas.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Nenhuma comanda fechada neste dia.', margem, y + 5)
    y += 10
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margem, right: margem },
      head: [['Mesa/Comanda', 'Horário', 'Forma de Pagamento', 'Valor']],
      body: vendasOrdenadas.map((venda) => [
        venda.identificadorMesa,
        venda.dataFechamento?.toDate ? formatarHora(venda.dataFechamento.toDate()) : '—',
        LABEL_FORMA_PAGAMENTO[venda.formaPagamento],
        formatarMoeda(venda.total),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [39, 39, 42] },
      styles: { fontSize: 9 },
      columnStyles: { 3: { halign: 'right' } },
    })
    y = garantirEspaco(doc, obterFinalY(doc, y) + 10)
  }

  if (ranking.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Itens Mais Vendidos', margem, y)
    y += 3

    autoTable(doc, {
      startY: y,
      margin: { left: margem, right: margem },
      head: [['#', 'Produto', 'Quantidade', 'Faturamento']],
      body: ranking.map((item, index) => [
        String(index + 1),
        item.nome,
        `${item.quantidade}×`,
        formatarMoeda(item.faturamento),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [39, 39, 42] },
      styles: { fontSize: 9 },
      columnStyles: { 3: { halign: 'right' } },
    })
  }

  doc.save(`fechamento-caixa-${dataString}.pdf`)
}
