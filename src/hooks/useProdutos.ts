import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import type { Produto } from '../types'

const produtosRef = collection(db, 'produtos')

export function useProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(produtosRef, orderBy('nome'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProdutos(
        snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Produto),
      )
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { produtos, loading }
}
