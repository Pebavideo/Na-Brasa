import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import type { MesaComanda } from '../types'

const mesasRef = collection(db, 'mesas_comandas')

export function useMesas() {
  const [mesas, setMesas] = useState<MesaComanda[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(mesasRef, orderBy('identificador'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMesas(
        snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as MesaComanda),
      )
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { mesas, loading }
}
