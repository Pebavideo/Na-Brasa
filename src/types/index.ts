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
  /** PIN numérico (4 a 6 dígitos) exigido para acessar Caixa/Admin. */
  pinGerente?: string
}

export interface Produto {
  id: string
  nome: string
  preco: number
  categoria: CategoriaProduto
  disponivel: boolean
  /** Imagem já comprimida (base64 WebP/JPEG, client-side) ou URL. */
  fotoUrl?: string
  /** Ex: ingredientes, acompanhamentos. */
  descricao?: string
}

export interface ItemComanda {
  produtoId: string
  nome: string
  precoUnit: number
  quantidade: number
  origem: OrigemItem
  atendente?: string
  horaLancamento: Timestamp
  /** Ex: "sem cebola", "picanha mal passada". */
  observacao?: string
}

export interface MesaComanda {
  id: string
  identificador: string
  status: StatusMesa
  totalAtual: number
  itens: ItemComanda[]
  ultimaAtualizacao: Timestamp
  /** Garçom/atendente vinculado à mesa no momento da abertura. */
  atendenteResponsavel?: string
}

export interface ItemVenda {
  nome: string
  precoUnit: number
  quantidade: number
  subtotal: number
  observacao?: string
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
