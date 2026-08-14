// Gerador de payload PIX no padrao EMVCo / BR Code (Banco Central do Brasil).

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9 ]/g, '') // apenas alfanumerico e espaco
    .toUpperCase()
    .trim()
}

function campo(id: string, valor: string): string {
  const tamanho = valor.length.toString().padStart(2, '0')
  return `${id}${tamanho}${valor}`
}

function crc16(payload: string): string {
  let crc = 0xffff
  const polinomio = 0x1021

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polinomio) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export interface DadosPix {
  chave: string
  nomeTitular: string
  cidade: string
  valor: number
  identificador?: string
  descricao?: string
}

/**
 * Gera o payload "Copia e Cola" (BR Code) exato para um pagamento PIX,
 * seguindo o padrao EMVCo utilizado pelo Banco Central.
 */
export function gerarPayloadPix({
  chave,
  nomeTitular,
  cidade,
  valor,
  identificador,
  descricao,
}: DadosPix): string {
  const nome = normalizar(nomeTitular).slice(0, 25) || 'RECEBEDOR'
  const cidadeNormalizada = normalizar(cidade).slice(0, 15) || 'BRASIL'
  const txid = (identificador ? normalizar(identificador).replace(/\s/g, '') : '').slice(0, 25) || '***'

  const merchantAccountInfo =
    campo('00', 'br.gov.bcb.pix') +
    campo('01', chave.trim()) +
    (descricao ? campo('02', normalizar(descricao).slice(0, 40)) : '')

  const additionalData = campo('05', txid)

  let payload =
    campo('00', '01') + // Payload Format Indicator
    campo('01', '12') + // Point of Initiation Method (dinamico)
    campo('26', merchantAccountInfo) + // Merchant Account Info - Pix
    campo('52', '0000') + // Merchant Category Code
    campo('53', '986') + // Transaction Currency (BRL)
    campo('54', valor.toFixed(2)) + // Transaction Amount
    campo('58', 'BR') + // Country Code
    campo('59', nome) + // Merchant Name
    campo('60', cidadeNormalizada) + // Merchant City
    campo('62', additionalData) // Additional Data Field Template

  payload += '6304'
  const checksum = crc16(payload)

  return payload + checksum
}
