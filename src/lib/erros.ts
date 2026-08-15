import { FirebaseError } from 'firebase/app'

/**
 * Converte um erro (do Firebase ou não) numa mensagem amigável em português.
 * Garante que uma falha de permissão nunca vire um botão "sem ação" —
 * sempre existe uma explicação visível do que aconteceu.
 */
export function mensagemDeErroFirestore(erro: unknown, mensagemPadrao: string): string {
  if (erro instanceof FirebaseError) {
    if (erro.code === 'permission-denied') {
      return 'Acesso restrito: você não tem permissão para realizar esta ação.'
    }
    if (erro.code === 'unavailable') {
      return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.'
    }
  }
  if (erro instanceof Error && erro.message) return erro.message
  return mensagemPadrao
}
