import type { TipoChavePix } from '../types'

function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

// ---------- Moeda (BRL) ----------

/**
 * Máscara "mask-as-you-type" para valores em Real: interpreta o texto digitado
 * como centavos, descarta qualquer caractere não numérico e formata como
 * "1.234,56". Nunca produz NaN — string vazia quando não há dígitos.
 */
export function formatarMoedaInput(valorBruto: string): string {
  const digitos = somenteDigitos(valorBruto)
  if (!digitos) return ''
  const centavos = Number(digitos)
  return (centavos / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Converte o valor mascarado (ex: "12,50") para number (ex: 12.5). Nunca retorna NaN. */
export function paraNumeroMoeda(valorMascarado: string): number {
  const digitos = somenteDigitos(valorMascarado)
  return digitos ? Number(digitos) / 100 : 0
}

// ---------- Documentos / chave Pix ----------

export function maskCPF(valor: string): string {
  return somenteDigitos(valor)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskCNPJ(valor: string): string {
  return somenteDigitos(valor)
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function maskTelefone(valor: string): string {
  return somenteDigitos(valor)
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Aplica a máscara visual correta enquanto o usuário digita a chave Pix. */
export function aplicarMascaraChavePix(tipo: TipoChavePix, valorDigitado: string): string {
  switch (tipo) {
    case 'CPF':
      return maskCPF(valorDigitado)
    case 'CNPJ':
      return maskCNPJ(valorDigitado)
    case 'TELEFONE':
      return maskTelefone(valorDigitado)
    case 'EMAIL':
    case 'ALEATORIA':
      return valorDigitado
  }
}

/** Converte o valor exibido/mascarado para o formato canônico salvo no Firestore. */
export function normalizarChavePix(tipo: TipoChavePix, valorExibicao: string): string {
  switch (tipo) {
    case 'CPF':
    case 'CNPJ':
      return somenteDigitos(valorExibicao)
    case 'TELEFONE': {
      const digitos = somenteDigitos(valorExibicao)
      return digitos ? `+55${digitos}` : ''
    }
    case 'EMAIL':
      return valorExibicao.trim().toLowerCase()
    case 'ALEATORIA':
      return valorExibicao.trim()
  }
}

/** Reconstrói o valor mascarado para exibição a partir do valor canônico salvo. */
export function formatarExibicaoChavePix(tipo: TipoChavePix, valorArmazenado: string): string {
  switch (tipo) {
    case 'CPF':
      return maskCPF(valorArmazenado)
    case 'CNPJ':
      return maskCNPJ(valorArmazenado)
    case 'TELEFONE':
      return maskTelefone(valorArmazenado.replace(/^\+55/, ''))
    case 'EMAIL':
    case 'ALEATORIA':
      return valorArmazenado
  }
}

/** Valida a chave Pix conforme o tipo selecionado. Retorna a mensagem de erro ou null se válida. */
export function validarChavePix(tipo: TipoChavePix, valorExibicao: string): string | null {
  switch (tipo) {
    case 'CPF':
      return somenteDigitos(valorExibicao).length === 11
        ? null
        : 'Digite um CPF válido com 11 números.'
    case 'CNPJ':
      return somenteDigitos(valorExibicao).length === 14
        ? null
        : 'Digite um CNPJ válido com 14 números.'
    case 'TELEFONE':
      return somenteDigitos(valorExibicao).length === 11
        ? null
        : 'Digite o telefone completo: DDD + 9 dígitos.'
    case 'EMAIL':
      return REGEX_EMAIL.test(valorExibicao.trim()) ? null : 'Digite um e-mail válido.'
    case 'ALEATORIA':
      return valorExibicao.trim().length >= 8
        ? null
        : 'A chave aleatória deve ter pelo menos 8 caracteres.'
  }
}
