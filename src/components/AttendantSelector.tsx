import { useNavigate } from 'react-router-dom'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import { useAuth } from '../contexts/AuthContext'
import { Loading } from './Loading'

export function AttendantSelector() {
  const { config, loading } = useConfiguracoes()
  const { setAtendente, logout, isSuperAdmin } = useAuth()
  const navigate = useNavigate()

  if (loading) return <Loading texto="Carregando atendentes..." />

  const atendentes = config?.atendentes ?? []

  const handleSair = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-zinc-100 p-6">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => navigate('/mesas')}
            aria-label="Fechar e acessar o sistema"
            title="Fechar e acessar o sistema"
            className="absolute right-4 top-4 text-2xl leading-none text-zinc-300 hover:text-zinc-500"
          >
            &times;
          </button>
        )}

        <h1 className="mb-1 text-center text-xl font-bold text-zinc-900">
          Quem está lançando?
        </h1>
        <p className="mb-6 text-center text-sm text-zinc-500">
          Selecione seu nome para identificar seus lançamentos
        </p>

        {atendentes.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-700">
              Nenhum atendente cadastrado ainda. Peça ao administrador para cadastrar
              atendentes no Painel Administrativo.
            </p>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition active:scale-95"
            >
              Cadastrar Atendentes no Painel Admin
            </button>
          </div>
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

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => navigate('/mesas')}
            className="mt-4 w-full rounded-xl bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-600 transition active:scale-95"
          >
            Acessar o sistema sem selecionar
          </button>
        )}

        <button
          type="button"
          onClick={() => void handleSair()}
          className="mt-6 w-full text-center text-sm font-medium text-zinc-400"
        >
          Sair da conta
        </button>
      </div>
    </div>
  )
}
