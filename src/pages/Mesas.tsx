import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMesas } from '../hooks/useMesas'
import { TableCard } from '../components/TableCard'
import { Loading } from '../components/Loading'
import { criarMesa } from '../lib/firestore'

export function Mesas() {
  const { mesas, loading } = useMesas()
  const navigate = useNavigate()
  const [criando, setCriando] = useState(false)
  const [identificador, setIdentificador] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const handleCriarMesa = async (event: FormEvent) => {
    event.preventDefault()
    setErro(null)
    const nome = identificador.trim()
    if (!nome) return
    setSalvando(true)
    try {
      const novoId = await criarMesa(nome)
      // Vai direto para a comanda recém-criada — o garçom não precisa
      // localizar a mesa na grade para começar a lançar pedidos.
      navigate(`/comanda/${novoId}`)
    } catch {
      setErro('Não foi possível criar a mesa. Tente novamente.')
      setSalvando(false)
    }
  }

  if (loading) return <Loading texto="Carregando mesas..." />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Mesas &amp; Comandas</h1>
        <button
          type="button"
          onClick={() => setCriando((v) => !v)}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white"
        >
          {criando ? 'Cancelar' : '+ Nova mesa'}
        </button>
      </div>

      {criando && (
        <form
          onSubmit={(event) => void handleCriarMesa(event)}
          className="flex gap-2 rounded-xl bg-white p-3 shadow-sm"
        >
          <input
            autoFocus
            required
            placeholder="Ex: Mesa 5, Guarda-sol 3..."
            value={identificador}
            onChange={(event) => setIdentificador(event.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            disabled={salvando}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {salvando ? 'Abrindo...' : 'Criar'}
          </button>
        </form>
      )}

      {erro && (
        <p className="rounded-lg bg-red-50 p-2 text-center text-sm text-red-600">{erro}</p>
      )}

      {mesas.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-zinc-400">
          Nenhuma mesa cadastrada. Clique em "+ Nova mesa" para começar.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {mesas.map((mesa) => (
            <TableCard key={mesa.id} mesa={mesa} />
          ))}
        </div>
      )}
    </div>
  )
}
