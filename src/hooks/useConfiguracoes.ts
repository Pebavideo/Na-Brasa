import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import type { Configuracoes } from '../types'

const configDocRef = doc(db, 'configuracoes', 'loja')

export function useConfiguracoes() {
  const [config, setConfig] = useState<Configuracoes | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(configDocRef, (snapshot) => {
      setConfig(snapshot.exists() ? (snapshot.data() as Configuracoes) : null)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { config, loading }
}
