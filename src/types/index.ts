import type { Timestamp } from 'firebase/firestore'

export type CategoriaProduto = 'Espetos' | 'Bebidas' | 'Porções' | 'Outros'

export const CATEGORIAS: CategoriaProduto[] = [
  'Espetos',
  'Bebidas',
  'Porções',
  'Outros',
]

export type TipoChavePix = 'CNPJ' | 'CPF' | 'TELEFONE' | 'EMAIL' | 'ALEATORIA'

export type FormaPagamento = 'PIX' | 'DINHEIRO' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO'

export type OrigemItem = 'GARCOM' | 'CLIENTE'

export type StatusMesa = 'livre' | 'ocupada'

export interface Configuracoes {
  nomeLoja: string
  chavePix: string
  tipoChavePix: TipoChavePix
  titularPix: string
  cidadePix: string
  atendentes: string[]
}

export interface Produto {
  id: string
  nome: string
  preco: number
  categoria: CategoriaProduto
  disponivel: boolean
}

export interface ItemComanda {
  produtoId: string
  nome: string
  precoUnit: number
  quantidade: number
  origem: OrigemItem
  atendente?: string
  horaLancamento: Timestamp
}

export interface MesaComanda {
  id: string
  identificador: string
  status: StatusMesa
  totalAtual: number
  itens: ItemComanda[]
  ultimaAtualizacao: Timestamp
}

export interface ItemVenda {
  nome: string
  precoUnit: number
  quantidade: number
  subtotal: number
}

export interface Venda {
  id: string
  identificadorMesa: string
  total: number
  formaPagamento: FormaPagamento
  valorRecebido?: number
  troco?: number
  itens: ItemVenda[]
  atendenteFechamento: string
  dataFechamento: Timestamp
  dataString: string
}

export const SUPER_ADMIN_EMAIL = 'jjoserobertorocharocha@gmail.com'
