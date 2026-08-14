import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '../firebase'
import { SUPER_ADMIN_EMAIL } from '../types'

const ATENDENTE_STORAGE_KEY = 'na-brasa:atendente'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isSuperAdmin: boolean
  atendente: string | null
  setAtendente: (nome: string) => void
  limparAtendente: () => void
  login: (email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [atendente, setAtendenteState] = useState<string | null>(() =>
    localStorage.getItem(ATENDENTE_STORAGE_KEY),
  )

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const setAtendente = (nome: string) => {
    localStorage.setItem(ATENDENTE_STORAGE_KEY, nome)
    setAtendenteState(nome)
  }

  const limparAtendente = () => {
    localStorage.removeItem(ATENDENTE_STORAGE_KEY)
    setAtendenteState(null)
  }

  const login = async (email: string, senha: string) => {
    await signInWithEmailAndPassword(auth, email, senha)
  }

  const logout = async () => {
    limparAtendente()
    await signOut(auth)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isSuperAdmin: user?.email === SUPER_ADMIN_EMAIL,
      atendente,
      setAtendente,
      limparAtendente,
      login,
      logout,
    }),
    [user, loading, atendente],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
