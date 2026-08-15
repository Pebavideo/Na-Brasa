const CHAVE_SESSAO = 'na-brasa:pin-gerente-autorizado'

/** Verdadeiro se o PIN de gerente já foi validado nesta aba/sessão do navegador. */
export function pinAutorizadoNestaSessao(): boolean {
  return sessionStorage.getItem(CHAVE_SESSAO) === 'true'
}

export function autorizarPinNestaSessao(): void {
  sessionStorage.setItem(CHAVE_SESSAO, 'true')
}

export function revogarAutorizacaoPin(): void {
  sessionStorage.removeItem(CHAVE_SESSAO)
}

/** PIN numérico de 4 a 6 dígitos. */
export function formatoPinValido(pin: string): boolean {
  return /^\d{4,6}$/.test(pin)
}
