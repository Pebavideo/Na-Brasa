import { useState } from 'react'
import { formatarMoeda } from '../lib/utils'
import type { ItemComanda } from '../types'

interface EditarItemModalProps {
  item: ItemComanda
  onSalvar: (novaQuantidade: number, novaObservacao: string) => Promise<void>
  onFechar: () => void
}

/** Modal rápido para ajustar quantidade e observação de um item já lançado na comanda. */
export function EditarItemModal({ item, onSalvar, onFechar }: EditarItemModalProps) {
  const [quantidade, setQuantidade] = useState(item.quantidade)
  const [observacao, setObservacao] = useState(item.observacao ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const salvar = async () => {
    if (salvando) return
    setSalvando(true)
    setErro(null)
    try {
      await onSalvar(quantidade, observacao)
      onFechar()
    } catch {
      setErro('Não foi possível salvar. Tente novamente.')
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900">✏️ Editar item</h2>
          <button type="button" onClick={onFechar} className="text-2xl leading-none text-zinc-400">
            &times;
          </button>
        </div>
        <p className="mb-4 text-sm font-semibold text-zinc-700">{item.nome}</p>

        <label className="text-xs font-semibold text-zinc-500">Quantidade</label>
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantidade((q) => Math.max(0, q - 1))}
            className="h-9 w-9 rounded-lg bg-zinc-100 font-bold text-zinc-600"
          >
            −
          </button>
          <span className="w-8 text-center font-bold text-zinc-900">{quantidade}</span>
          <button
            type="button"
            onClick={() => setQuantidade((q) => q + 1)}
            className="h-9 w-9 rounded-lg bg-zinc-100 font-bold text-zinc-600"
          >
            +
          </button>
          <span className="ml-auto font-bold text-zinc-900">
            {formatarMoeda(item.precoUnit * quantidade)}
          </span>
        </div>

        <label className="text-xs font-semibold text-zinc-500">Observação de preparo</label>
        <input
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder='Ex: "ao ponto", "sem gelo"...'
          className="mb-4 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
        />

        {quantidade === 0 && (
          <p className="mb-3 text-xs text-amber-700">Quantidade 0 remove o item da comanda.</p>
        )}
        {erro && <p className="mb-3 text-xs text-red-500">{erro}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 rounded-lg bg-zinc-100 py-2 text-sm font-semibold text-zinc-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={salvando}
            onClick={() => void salvar()}
            className={`flex-1 rounded-lg py-2 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60 ${
              quantidade === 0 ? 'bg-red-500' : 'bg-orange-600'
            }`}
          >
            {salvando ? 'Salvando...' : quantidade === 0 ? 'Remover' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
