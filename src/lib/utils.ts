import { CATEGORIAS, type CategoriaProduto, type Produto } from '../types'

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Agrupa produtos por categoria, respeitando a ordem oficial de categorias. */
export function agruparPorCategoria(produtos: Produto[]): [CategoriaProduto, Produto[]][] {
  return CATEGORIAS.map((categoria) => [
    categoria,
    produtos.filter((produto) => produto.categoria === categoria),
  ]).filter(([, itens]) => itens.length > 0) as [CategoriaProduto, Produto[]][]
}

/** Retorna a data de hoje (ou a informada) no formato YYYY-MM-DD, no fuso de Brasília. */
export function getDataString(data: Date = new Date()): string {
  return data.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export function formatarDataHora(data: Date): string {
  return data.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
