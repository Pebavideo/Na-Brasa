import { useMemo, useState } from 'react'
import { useVendasDoDia } from '../hooks/useVendasDoDia'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import { useAuth } from '../contexts/AuthContext'
import { Loading } from '../components/Loading'
import { formatarMoeda, formatarDataBR, formatarDataHora, getDataString } from '../lib/utils'
import {
  LABEL_FORMA_PAGAMENTO,
  calcularRankingItens,
  calcularTotaisCaixa,
  compartilharResumo,
} from '../lib/relatorioCaixa'

const CARTOES_RESUMO: { chave: 'PIX' | 'DINHEIRO' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO'; icone: string }[] = [
  { chave: 'PIX', icone: '💠' },
  { chave: 'DINHEIRO', icone: '💵' },
  { chave: 'CARTAO_DEBITO', icone: '💳' },
  { chave: 'CARTAO_CREDITO', icone: '💳' },
]

export function Caixa() {
  const [dataString, setDataString] = useState(getDataString())
  const { vendas, loading } = useVendasDoDia(dataString)
  const { config } = useConfiguracoes()
  const { atendente } = useAuth()

  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [compartilhando, setCompartilhando] = useState(false)
  const [avisoCompartilhar, setAvisoCompartilhar] = useState<string | null>(null)
  const [avisoPdf, setAvisoPdf] = useState<string | null>(null)

  const totais = useMemo(() => calcularTotaisCaixa(vendas), [vendas])
  const ranking = useMemo(() => calcularRankingItens(vendas), [vendas])

  const nomeLoja = config?.nomeLoja ?? 'Na Brasa'
  const responsavel = atendente ?? 'Administrador'

  const handleBaixarPdf = async () => {
    if (gerandoPdf) return
    setGerandoPdf(true)
    setAvisoPdf(null)
    try {
      const { gerarPdfRelatorioCaixa } = await import('../lib/pdfCaixa')
      gerarPdfRelatorioCaixa({ nomeLoja, dataString, responsavel, vendas })
    } catch {
      setAvisoPdf('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setGerandoPdf(false)
    }
  }

  const handleImprimir = () => {
    window.print()
  }

  const handleCompartilhar = async () => {
    if (compartilhando) return
    setCompartilhando(true)
    setAvisoCompartilhar(null)
    try {
      await compartilharResumo({ nomeLoja, dataString, responsavel, vendas })
    } catch {
      setAvisoCompartilhar('Não foi possível compartilhar o resumo. Tente novamente.')
    } finally {
      setCompartilhando(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-xl font-bold text-zinc-900">Fechamento de Caixa</h1>
        <input
          type="date"
          value={dataString}
          onChange={(event) => setDataString(event.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          disabled={loading || gerandoPdf}
          onClick={() => void handleBaixarPdf()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60"
        >
          📄 {gerandoPdf ? 'Gerando PDF...' : 'Baixar PDF'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={handleImprimir}
          className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 transition active:scale-95 disabled:opacity-60"
        >
          🖨️ Imprimir Relatório
        </button>
        <button
          type="button"
          disabled={loading || compartilhando}
          onClick={() => void handleCompartilhar()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60"
        >
          📲 {compartilhando ? 'Compartilhando...' : 'Compartilhar Resumo'}
        </button>
      </div>

      {(avisoPdf ?? avisoCompartilhar) && (
        <p className="rounded-lg bg-red-50 p-2 text-center text-sm text-red-600 print:hidden">
          {avisoPdf ?? avisoCompartilhar}
        </p>
      )}

      {loading ? (
        <Loading texto="Carregando vendas do dia..." />
      ) : (
        <div id="relatorio-impressao" className="flex flex-col gap-4">
          <div className="hidden print:block">
            <h1 className="text-center text-xl font-black">{nomeLoja}</h1>
            <p className="text-center text-sm">Relatório de Fechamento de Caixa</p>
            <div className="mt-2 flex justify-between text-xs text-zinc-600">
              <span>Data do fechamento: {formatarDataBR(dataString)}</span>
              <span>Emitido em: {formatarDataHora(new Date())}</span>
            </div>
            <p className="text-xs text-zinc-600">Responsável: {responsavel}</p>
            <hr className="my-3 border-zinc-300" />
          </div>

          <div className="rounded-2xl bg-zinc-900 p-6 text-center text-white shadow-md print:rounded-none print:bg-white print:p-0 print:text-black print:shadow-none">
            <p className="text-sm text-zinc-300 print:text-zinc-600">Faturamento do dia</p>
            <p className="text-4xl font-black">{formatarMoeda(totais.geral)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-1 print:gap-1">
            {CARTOES_RESUMO.map(({ chave, icone }) => (
              <div key={chave} className="rounded-xl bg-white p-3 text-center shadow-sm print:border print:border-zinc-300 print:shadow-none">
                <p className="text-xs font-semibold uppercase text-zinc-400 print:text-zinc-600">
                  {icone} {LABEL_FORMA_PAGAMENTO[chave]}
                </p>
                <p className="text-lg font-bold text-zinc-900">{formatarMoeda(totais[chave])}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm print:border print:border-zinc-300 print:shadow-none">
            <h2 className="mb-3 text-sm font-bold text-zinc-500">🏆 Mais vendidos</h2>
            {ranking.length === 0 ? (
              <p className="text-sm text-zinc-400">Nenhuma venda registrada neste dia.</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {ranking.map((item, index) => (
                  <li key={item.nome} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700">
                      <span className="font-bold text-zinc-400">{index + 1}.</span> {item.nome}
                    </span>
                    <span className="font-bold text-zinc-900">
                      {item.quantidade}× · {formatarMoeda(item.faturamento)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm print:border print:border-zinc-300 print:shadow-none">
            <h2 className="mb-3 text-sm font-bold text-zinc-500">Histórico de comandas</h2>
            {vendas.length === 0 ? (
              <p className="text-sm text-zinc-400">Nenhuma comanda fechada neste dia.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-zinc-100">
                {vendas.map((venda) => (
                  <li key={venda.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-semibold text-zinc-900">{venda.identificadorMesa}</p>
                      <p className="text-xs text-zinc-400">
                        {venda.dataFechamento?.toDate
                          ? formatarDataHora(venda.dataFechamento.toDate())
                          : ''}{' '}
                        · {LABEL_FORMA_PAGAMENTO[venda.formaPagamento]} · {venda.atendenteFechamento}
                      </p>
                    </div>
                    <span className="font-bold text-zinc-900">{formatarMoeda(venda.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
