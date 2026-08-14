import { QRCodeSVG } from 'qrcode.react'
import { useMesas } from '../../hooks/useMesas'
import { Loading } from '../../components/Loading'

export function AdminQrCodes() {
  const { mesas, loading } = useMesas()

  if (loading) return <Loading texto="Carregando mesas..." />

  if (mesas.length === 0) {
    return (
      <p className="rounded-xl bg-white p-6 text-center text-sm text-zinc-400">
        Nenhuma mesa cadastrada ainda. Crie mesas na tela "Mesas" para gerar os QR Codes.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Imprima e cole o QR Code de cada mesa para o autoatendimento do cliente.
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white print:hidden"
        >
          Imprimir
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {mesas.map((mesa) => {
          const url = `${window.location.origin}/mesa/${mesa.id}`
          return (
            <div
              key={mesa.id}
              className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 text-center shadow-sm"
            >
              <QRCodeSVG value={url} size={140} level="M" />
              <p className="font-bold text-zinc-900">{mesa.identificador}</p>
              <p className="break-all text-[10px] text-zinc-400">{url}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
