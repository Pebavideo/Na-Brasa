import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import { Loading } from './Loading'
import { autorizarPinNestaSessao, pinAutorizadoNestaSessao } from '../lib/pinGerente'

const TECLAS_NUMERICAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const MAXIMO_TENTATIVAS = 5

/**
 * Protege as rotas sensíveis (Caixa/Admin) com um PIN de gerente separado do
 * login. Fica pendurado sobre o <Outlet/> de AdminRoute — só é exigido de
 * quem já passou pelo crivo de super admin — e a autorização vale para a aba
 * atual do navegador (sessionStorage), então não interrompe o uso contínuo.
 * Se nenhum PIN estiver configurado ainda, libera o acesso normalmente.
 */
export function PinGerenteGate({ children }: { children: ReactNode }) {
  const { config, loading } = useConfiguracoes()
  const [autorizado, setAutorizado] = useState(() => pinAutorizadoNestaSessao())
  const [digitado, setDigitado] = useState('')
  const [erro, setErro] = useState(false)
  const [tentativas, setTentativas] = useState(0)

  const pinConfigurado = config?.pinGerente?.trim() ?? ''
  const bloqueadoPorTentativas = tentativas >= MAXIMO_TENTATIVAS

  useEffect(() => {
    if (!pinConfigurado || autorizado || bloqueadoPorTentativas) return
    if (digitado.length < pinConfigurado.length) return

    if (digitado === pinConfigurado) {
      autorizarPinNestaSessao()
      setAutorizado(true)
      return
    }

    setErro(true)
    setTentativas((t) => t + 1)
    const temporizador = setTimeout(() => {
      setErro(false)
      setDigitado('')
    }, 500)
    return () => clearTimeout(temporizador)
  }, [digitado, pinConfigurado, autorizado, bloqueadoPorTentativas])

  if (loading) return <Loading texto="Verificando permissões..." />
  if (!pinConfigurado || autorizado) return <>{children}</>

  const adicionarDigito = (digito: string) => {
    if (erro || bloqueadoPorTentativas || digitado.length >= pinConfigurado.length) return
    setDigitado((atual) => atual + digito)
  }

  const apagarDigito = () => {
    if (erro || bloqueadoPorTentativas) return
    setDigitado((atual) => atual.slice(0, -1))
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-zinc-100 p-6">
      <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-lg">
        <span className="text-3xl">🔒</span>
        <h1 className="mt-2 text-lg font-bold text-zinc-900">PIN de Gerente</h1>
        <p className="mb-4 text-sm text-zinc-500">Digite o PIN para acessar esta área</p>

        <div className="mb-5 flex justify-center gap-2">
          {Array.from({ length: pinConfigurado.length }).map((_, indice) => (
            <span
              key={indice}
              className={`h-3.5 w-3.5 rounded-full transition-colors ${
                erro
                  ? 'bg-red-500'
                  : indice < digitado.length
                    ? 'bg-orange-600'
                    : 'bg-zinc-200'
              }`}
            />
          ))}
        </div>

        {bloqueadoPorTentativas ? (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            Muitas tentativas incorretas. Peça ao administrador para verificar o PIN em
            Admin → Pix &amp; Loja.
          </p>
        ) : (
          <div className="mb-2 grid grid-cols-3 gap-2">
            {TECLAS_NUMERICAS.map((digito) => (
              <button
                key={digito}
                type="button"
                onClick={() => adicionarDigito(digito)}
                className="rounded-xl bg-zinc-100 py-3 text-lg font-bold text-zinc-800 transition active:scale-95"
              >
                {digito}
              </button>
            ))}
            <div />
            <button
              type="button"
              onClick={() => adicionarDigito('0')}
              className="rounded-xl bg-zinc-100 py-3 text-lg font-bold text-zinc-800 transition active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={apagarDigito}
              className="rounded-xl bg-zinc-100 py-3 text-lg font-bold text-zinc-800 transition active:scale-95"
            >
              ⌫
            </button>
          </div>
        )}

        <Link to="/mesas" className="mt-4 inline-block text-xs font-semibold text-zinc-400">
          ← Voltar para as mesas
        </Link>
      </div>
    </div>
  )
}
