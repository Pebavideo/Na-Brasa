import { useState } from 'react'
import { AdminCardapio } from './admin/AdminCardapio'
import { AdminConfig } from './admin/AdminConfig'
import { AdminAtendentes } from './admin/AdminAtendentes'
import { AdminQrCodes } from './admin/AdminQrCodes'

const ABAS = [
  { id: 'cardapio', label: 'Cardápio' },
  { id: 'config', label: 'Pix & Loja' },
  { id: 'atendentes', label: 'Atendentes' },
  { id: 'qrcodes', label: 'QR Codes' },
] as const

type AbaId = (typeof ABAS)[number]['id']

export function Admin() {
  const [aba, setAba] = useState<AbaId>('cardapio')

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-zinc-900">Painel Administrativo</h1>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setAba(item.id)}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
              aba === item.id ? 'bg-orange-600 text-white' : 'text-zinc-500'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {aba === 'cardapio' && <AdminCardapio />}
      {aba === 'config' && <AdminConfig />}
      {aba === 'atendentes' && <AdminAtendentes />}
      {aba === 'qrcodes' && <AdminQrCodes />}
    </div>
  )
}
