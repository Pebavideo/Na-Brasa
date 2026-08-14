import { useConfiguracoes } from '../hooks/useConfiguracoes'
import { useAuth } from '../contexts/AuthContext'
import { Loading } from './Loading'

export function AttendantSelector() {
  const { config, loading } = useConfiguracoes()
  const { setAtendente, logout } = useAuth()

  if (loading) return <Loading texto="Carregando atendentes..." />

  const atendentes = config?.atendentes ?? []

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-zinc-100 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="mb-1 text-center text-xl font-bold text-zinc-900">
          Quem está lançando?
        </h1>
        <p className="mb-6 text-center text-sm text-zinc-500">
          Selecione seu nome para identificar seus lançamentos
        </p>

        {atendentes.length === 0 ? (
          <p className="rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-700">
            Nenhum atendente cadastrado ainda. Peça ao administrador para cadastrar
            atendentes no Painel Administrativo.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {atendentes.map((nome) => (
              <button
                key={nome}
                type="button"
                onClick={() => setAtendente(nome)}
                className="rounded-xl bg-orange-600 px-4 py-4 text-lg font-bold text-white shadow transition active:scale-95"
              >
                {nome}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => void logout()}
          className="mt-6 w-full text-center text-sm font-medium text-zinc-400"
        >
          Sair da conta
        </button>
      </div>
    </div>
  )
}
