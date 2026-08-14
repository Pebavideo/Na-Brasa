import { useState, type FormEvent } from 'react'
import { useConfiguracoes } from '../../hooks/useConfiguracoes'
import { Loading } from '../../components/Loading'
import { atualizarConfiguracoes } from '../../lib/firestore'

export function AdminAtendentes() {
  const { config, loading } = useConfiguracoes()
  const [nome, setNome] = useState('')
  const [salvando, setSalvando] = useState(false)

  const atendentes = config?.atendentes ?? []

  const adicionar = async (event: FormEvent) => {
    event.preventDefault()
    const nomeLimpo = nome.trim()
    if (!nomeLimpo || atendentes.includes(nomeLimpo)) return
    setSalvando(true)
    try {
      await atualizarConfiguracoes({ atendentes: [...atendentes, nomeLimpo] })
      setNome('')
    } finally {
      setSalvando(false)
    }
  }

  const remover = async (alvo: string) => {
    await atualizarConfiguracoes({ atendentes: atendentes.filter((n) => n !== alvo) })
  }

  if (loading) return <Loading texto="Carregando atendentes..." />

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={(e) => void adicionar(e)} className="flex gap-2 rounded-xl bg-white p-4 shadow-sm">
        <input
          required
          placeholder="Nome do atendente"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
        />
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          Adicionar
        </button>
      </form>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        {atendentes.length === 0 ? (
          <p className="text-center text-sm text-zinc-400">Nenhum atendente cadastrado.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {atendentes.map((atendente) => (
              <li
                key={atendente}
                className="flex items-center gap-2 rounded-full bg-zinc-100 py-1 pl-3 pr-1 text-sm font-semibold text-zinc-700"
              >
                {atendente}
                <button
                  type="button"
                  onClick={() => void remover(atendente)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-red-500"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
