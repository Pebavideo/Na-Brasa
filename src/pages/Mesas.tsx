import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMesas } from '../hooks/useMesas'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import { useAuth } from '../contexts/AuthContext'
import { TableCard } from '../components/TableCard'
import { Loading } from '../components/Loading'
import { criarMesa } from '../lib/firestore'
import { mensagemDeErroFirestore } from '../lib/erros'

export function Mesas() {
  const { mesas, loading } = useMesas()
  const { config } = useConfiguracoes()
  const { atendente } = useAuth()
  const navigate = useNavigate()
  const [criando, setCriando] = useState(false)
  const [identificador, setIdentificador] = useState('')
  const [atendenteResponsavel, setAtendenteResponsavel] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const atendentes = config?.atendentes ?? []

  // Pré-seleciona quem está lançando no momento — é o mais provável responsável pela mesa.
  useEffect(() => {
    if (atendente && !atendenteResponsavel) setAtendenteResponsavel(atendente)
  }, [atendente, atendenteResponsavel])

  const handleCriarMesa = async (event: FormEvent) => {
    event.preventDefault()
    setErro(null)
    const nome = identificador.trim()
    if (!nome) return
    setSalvando(true)
    try {
      const novoId = await criarMesa(nome, atendenteResponsavel)
      // Vai direto para a comanda recém-criada — o garçom não precisa
      // localizar a mesa na grade para começar a lançar pedidos.
      navigate(`/comanda/${novoId}`)
    } catch (erroCriar) {
      setErro(mensagemDeErroFirestore(erroCriar, 'Não foi possível criar a mesa. Tente novamente.'))
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
          className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className="text-xs font-semibold text-zinc-500">Identificador</label>
            <input
              autoFocus
              required
              placeholder="Ex: Mesa 5, Guarda-sol 3..."
              value={identificador}
              onChange={(event) => setIdentificador(event.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
          </div>
          <div className="sm:w-48">
            <label className="text-xs font-semibold text-zinc-500">Garçom responsável</label>
            {atendentes.length > 0 ? (
              <select
                value={atendenteResponsavel}
                onChange={(event) => setAtendenteResponsavel(event.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
              >
                <option value="">Sem vínculo</option>
                {atendentes.map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
                ))}
              </select>
            ) : (
              <input
                placeholder="Nome do garçom"
                value={atendenteResponsavel}
                onChange={(event) => setAtendenteResponsavel(event.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
            )}
          </div>
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
