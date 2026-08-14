import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { Venda } from '../types'

const vendasRef = collection(db, 'vendas')

export function useVendasDoDia(dataString: string) {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const q = query(
      vendasRef,
      where('dataString', '==', dataString),
      orderBy('dataFechamento', 'desc'),
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVendas(
        snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Venda),
      )
      setLoading(false)
    })
    return unsubscribe
  }, [dataString])

  return { vendas, loading }
}
