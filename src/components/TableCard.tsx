import { Link } from 'react-router-dom'
import { formatarMoeda } from '../lib/utils'
import type { MesaComanda } from '../types'

export function TableCard({ mesa }: { mesa: MesaComanda }) {
  const ocupada = mesa.status === 'ocupada'

  return (
    <Link
      to={`/comanda/${mesa.id}`}
      className={`flex flex-col gap-2 rounded-2xl p-5 shadow-md transition active:scale-95 ${
        ocupada ? 'bg-orange-600 text-white' : 'bg-white text-zinc-900'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-black">{mesa.identificador}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
            ocupada ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {ocupada ? 'Ocupada' : 'Livre'}
        </span>
      </div>
      <span className={`text-2xl font-extrabold ${ocupada ? 'text-white' : 'text-zinc-400'}`}>
        {formatarMoeda(mesa.totalAtual)}
      </span>
      <span className={`text-xs ${ocupada ? 'text-orange-100' : 'text-zinc-400'}`}>
        {mesa.itens.length} {mesa.itens.length === 1 ? 'item lançado' : 'itens lançados'}
      </span>
    </Link>
  )
}
