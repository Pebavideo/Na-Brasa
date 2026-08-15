import { useEffect, useState } from 'react'

interface ImagemProdutoProps {
  src: string
  alt: string
  className?: string
}

/**
 * <img> com fallback: se o base64 estiver corrompido ou o link externo
 * quebrado/inacessível, mostra um placeholder no lugar em vez de derrubar o
 * layout com o ícone de imagem quebrada do navegador.
 */
export function ImagemProduto({ src, alt, className }: ImagemProdutoProps) {
  const [quebrada, setQuebrada] = useState(false)

  // Se o admin trocar o link/arquivo, dá uma nova chance de carregar.
  useEffect(() => setQuebrada(false), [src])

  if (quebrada) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-100 text-zinc-300 ${className ?? ''}`}
        title="Não foi possível carregar a imagem"
      >
        <span aria-hidden="true">🖼️</span>
      </div>
    )
  }

  return <img src={src} alt={alt} onError={() => setQuebrada(true)} className={className} />
}
