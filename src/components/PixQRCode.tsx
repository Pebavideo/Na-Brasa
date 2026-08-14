import { useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { gerarPayloadPix } from '../lib/pix'
import { formatarMoeda } from '../lib/utils'
import type { Configuracoes } from '../types'

interface PixQRCodeProps {
  config: Configuracoes
  valor: number
  identificador: string
}

export function PixQRCode({ config, valor, identificador }: PixQRCodeProps) {
  const [copiado, setCopiado] = useState(false)

  const payload = useMemo(
    () =>
      gerarPayloadPix({
        chave: config.chavePix,
        nomeTitular: config.titularPix,
        cidade: config.cidadePix,
        valor,
        identificador,
      }),
    [config.chavePix, config.titularPix, config.cidadePix, valor, identificador],
  )

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(payload)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow-md">
      <div className="rounded-xl border-4 border-emerald-600 p-3">
        <QRCodeSVG value={payload} size={220} level="M" />
      </div>
      <p className="text-2xl font-bold text-zinc-900">{formatarMoeda(valor)}</p>
      <p className="text-center text-sm text-zinc-500">
        Escaneie o QR Code no app do seu banco ou copie o código Pix Copia e Cola.
      </p>
      <button
        type="button"
        onClick={copiar}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition active:scale-95"
      >
        {copiado ? 'Código copiado!' : 'Copiar código Pix'}
      </button>
      <textarea
        readOnly
        value={payload}
        rows={3}
        className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-500"
        onFocus={(e) => e.currentTarget.select()}
      />
    </div>
  )
}
