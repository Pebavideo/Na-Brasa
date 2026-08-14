import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import type { MesaComanda } from '../types'

export function useMesa(mesaId: string | undefined) {
  const [mesa, setMesa] = useState<MesaComanda | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!mesaId) {
      setMesa(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const mesaDocRef = doc(db, 'mesas_comandas', mesaId)
    const unsubscribe = onSnapshot(
      mesaDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setMesa({ id: snapshot.id, ...snapshot.data() } as MesaComanda)
          setErro(null)
        } else {
          setMesa(null)
          setErro('Mesa não encontrada')
        }
        setLoading(false)
      },
      () => {
        setErro('Não foi possível carregar a mesa')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [mesaId])

  return { mesa, loading, erro }
}
