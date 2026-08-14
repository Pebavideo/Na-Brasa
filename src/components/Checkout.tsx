import { useMemo, useState } from 'react'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import { fecharComanda } from '../lib/firestore'
import { formatarMoeda } from '../lib/utils'
import { PixQRCode } from './PixQRCode'
import { Loading } from './Loading'
import type { FormaPagamento, MesaComanda } from '../types'

const OPCOES_PAGAMENTO: { valor: FormaPagamento; label: string; icone: string }[] = [
  { valor: 'PIX', label: 'Pix', icone: '💠' },
  { valor: 'DINHEIRO', label: 'Dinheiro', icone: '💵' },
  { valor: 'CARTAO_DEBITO', label: 'Cartão Débito', icone: '💳' },
  { valor: 'CARTAO_CREDITO', label: 'Cartão Crédito', icone: '💳' },
]

interface CheckoutProps {
  mesa: MesaComanda
  atendenteFechamento: string
  onFechado: () => void
  onCancelar: () => void
}

export function Checkout({ mesa, atendenteFechamento, onFechado, onCancelar }: CheckoutProps) {
  const { config, loading: carregandoConfig } = useConfiguracoes()
  const [forma, setForma] = useState<FormaPagamento | null>(null)
  const [valorRecebido, setValorRecebido] = useState('')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const troco = useMemo(() => {
    const recebido = Number(valorRecebido.replace(',', '.'))
    if (Number.isNaN(recebido)) return 0
    return Math.max(0, recebido - mesa.totalAtual)
  }, [valorRecebido, mesa.totalAtual])

  const confirmarFechamento = async () => {
    if (!forma) return
    setProcessando(true)
    setErro(null)
    try {
      const recebido = forma === 'DINHEIRO' ? Number(valorRecebido.replace(',', '.')) : undefined
      if (forma === 'DINHEIRO' && (!recebido || recebido < mesa.totalAtual)) {
        setErro('Valor recebido é menor que o total da comanda.')
        setProcessando(false)
        return
      }
      await fecharComanda({
        mesa,
        formaPagamento: forma,
        atendenteFechamento,
        valorRecebido: recebido,
      })
      onFechado()
    } catch {
      setErro('Não foi possível concluir o pagamento. Tente novamente.')
      setProcessando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex max-h-[90svh] w-full max-w-md flex-col overflow-y-auto rounded-t-2xl bg-zinc-50 p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900">Fechar comanda — {mesa.identificador}</h2>
          <button type="button" onClick={onCancelar} className="text-2xl leading-none text-zinc-400">
            &times;
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-sm text-zinc-500">Total a pagar</p>
          <p className="text-3xl font-black text-zinc-900">{formatarMoeda(mesa.totalAtual)}</p>
        </div>

        {!forma && (
          <div className="grid grid-cols-2 gap-3">
            {OPCOES_PAGAMENTO.map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                onClick={() => setForma(opcao.valor)}
                className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 font-semibold text-zinc-700 shadow-sm transition active:scale-95"
              >
                <span className="text-2xl">{opcao.icone}</span>
                {opcao.label}
              </button>
            ))}
          </div>
        )}

        {forma === 'PIX' &&
          (carregandoConfig ? (
            <Loading texto="Carregando dados do Pix..." />
          ) : !config?.chavePix ? (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              Chave Pix não configurada. Acesse o Painel Administrativo para configurá-la.
            </p>
          ) : (
            <PixQRCode config={config} valor={mesa.totalAtual} identificador={mesa.identificador} />
          ))}

        {forma === 'DINHEIRO' && (
          <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
            <label className="text-sm font-semibold text-zinc-600">Valor recebido</label>
            <input
              autoFocus
              inputMode="decimal"
              placeholder="0,00"
              value={valorRecebido}
              onChange={(event) => setValorRecebido(event.target.value)}
              className="rounded-lg border border-zinc-200 px-3 py-3 text-lg outline-none focus:border-orange-500"
            />
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Troco</span>
              <span className="text-lg font-bold text-emerald-600">{formatarMoeda(troco)}</span>
            </div>
          </div>
        )}

        {(forma === 'CARTAO_DEBITO' || forma === 'CARTAO_CREDITO') && (
          <p className="rounded-xl bg-white p-4 text-center text-sm text-zinc-600 shadow-sm">
            Confirme o pagamento na maquininha física e clique em confirmar abaixo.
          </p>
        )}

        {erro && (
          <p className="mt-3 rounded-lg bg-red-50 p-2 text-center text-sm text-red-600">{erro}</p>
        )}

        {forma && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setForma(null)}
              className="flex-1 rounded-xl bg-zinc-200 px-4 py-3 font-semibold text-zinc-700"
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={processando}
              onClick={() => void confirmarFechamento()}
              className="flex-[2] rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white transition active:scale-95 disabled:opacity-60"
            >
              {processando ? 'Confirmando...' : 'Confirmar pagamento'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
