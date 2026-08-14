import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { FirebaseError } from 'firebase/app'
import { useAuth } from '../contexts/AuthContext'

function mensagemDeErro(erro: unknown): string {
  if (erro instanceof FirebaseError) {
    switch (erro.code) {
      case 'auth/invalid-email':
        return 'E-mail inválido.'
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'E-mail ou senha incorretos.'
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Aguarde um momento e tente novamente.'
      default:
        return 'Não foi possível entrar. Tente novamente.'
    }
  }
  return 'Não foi possível entrar. Tente novamente.'
}

export function Login() {
  const { user, loading, login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (!loading && user) return <Navigate to="/mesas" replace />

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await login(email.trim(), senha)
    } catch (error) {
      setErro(mensagemDeErro(error))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-zinc-100 p-6">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg"
      >
        <h1 className="mb-1 text-center text-2xl font-black text-orange-600">Na Brasa</h1>
        <p className="mb-6 text-center text-sm text-zinc-500">
          Acesso da equipe — informe o e-mail e senha da loja
        </p>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            required
            autoComplete="username"
            placeholder="E-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-xl border border-zinc-200 px-4 py-3 text-base outline-none focus:border-orange-500"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Senha"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            className="rounded-xl border border-zinc-200 px-4 py-3 text-base outline-none focus:border-orange-500"
          />
        </div>

        {erro && (
          <p className="mt-3 rounded-lg bg-red-50 p-2 text-center text-sm text-red-600">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="mt-6 w-full rounded-xl bg-orange-600 px-4 py-3 font-bold text-white transition active:scale-95 disabled:opacity-60"
        >
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
