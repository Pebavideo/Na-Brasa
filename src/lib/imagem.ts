const LARGURA_MAXIMA_PADRAO = 600
const QUALIDADE_INICIAL_PADRAO = 0.7
const TAMANHO_MAXIMO_BYTES_PADRAO = 300 * 1024
const TAMANHO_ORIGINAL_MAXIMO_BYTES = 20 * 1024 * 1024

let suporteWebpCache: boolean | null = null

function suportaWebp(): boolean {
  if (suporteWebpCache !== null) return suporteWebpCache
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  suporteWebpCache = canvas.toDataURL('image/webp').startsWith('data:image/webp')
  return suporteWebpCache
}

/** Tamanho aproximado em bytes de uma data URL base64. */
export function tamanhoBase64EmBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.ceil((base64.length * 3) / 4)
}

export function ehDataUrl(valor: string): boolean {
  return valor.startsWith('data:')
}

/** Aceita apenas links http(s) bem formados — usado para o campo "Link da imagem". */
export function pareceUrlDeImagem(valor: string): boolean {
  try {
    const url = new URL(valor)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

interface OpcoesCompressao {
  larguraMaxima?: number
  qualidadeInicial?: number
  tamanhoMaximoBytes?: number
}

/**
 * Redimensiona (max-width 600px) e comprime (WebP, com fallback para JPEG,
 * qualidade inicial 0.7) uma imagem no client-side via Canvas, reduzindo a
 * qualidade progressivamente até caber no limite de bytes — mantendo o
 * arquivo bem abaixo do limite de 1MB por documento do Firestore.
 */
export async function comprimirImagem(
  arquivo: File,
  opcoes: OpcoesCompressao = {},
): Promise<string> {
  if (!arquivo.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem válido.')
  }
  if (arquivo.size > TAMANHO_ORIGINAL_MAXIMO_BYTES) {
    throw new Error('Imagem muito grande. Escolha um arquivo de até 20MB.')
  }

  const larguraMaxima = opcoes.larguraMaxima ?? LARGURA_MAXIMA_PADRAO
  const tamanhoMaximoBytes = opcoes.tamanhoMaximoBytes ?? TAMANHO_MAXIMO_BYTES_PADRAO

  const bitmap = await createImageBitmap(arquivo)
  try {
    const escala = Math.min(1, larguraMaxima / bitmap.width)
    const largura = Math.max(1, Math.round(bitmap.width * escala))
    const altura = Math.max(1, Math.round(bitmap.height * escala))

    const canvas = document.createElement('canvas')
    canvas.width = largura
    canvas.height = altura
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Não foi possível processar a imagem.')
    ctx.drawImage(bitmap, 0, 0, largura, altura)

    const formato = suportaWebp() ? 'image/webp' : 'image/jpeg'
    let qualidade = opcoes.qualidadeInicial ?? QUALIDADE_INICIAL_PADRAO
    let dataUrl = canvas.toDataURL(formato, qualidade)

    while (tamanhoBase64EmBytes(dataUrl) > tamanhoMaximoBytes && qualidade > 0.3) {
      qualidade -= 0.1
      dataUrl = canvas.toDataURL(formato, qualidade)
    }

    if (tamanhoBase64EmBytes(dataUrl) > tamanhoMaximoBytes) {
      throw new Error('Não foi possível reduzir a imagem o suficiente. Tente outra foto.')
    }

    return dataUrl
  } finally {
    bitmap.close()
  }
}
