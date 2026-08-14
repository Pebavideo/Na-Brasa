import { useMemo, useState } from 'react'
import { useVendasDoDia } from '../hooks/useVendasDoDia'
import { Loading } from '../components/Loading'
import { formatarMoeda, formatarDataHora, getDataString } from '../lib/utils'

const LABEL_PAGAMENTO: Record<string, string> = {
  PIX: 'Pix',
  DINHEIRO: 'Dinheiro',
  CARTAO_DEBITO: 'Cartão',
  CARTAO_CREDITO: 'Cartão',
}

export function Caixa() {
  const [dataString, setDataString] = useState(getDataString())
  const { vendas, loading } = useVendasDoDia(dataString)

  const totais = useMemo(() => {
    const porForma: Record<string, number> = { Pix: 0, Dinheiro: 0, Cartão: 0 }
    let total = 0
    for (const venda of vendas) {
      total += venda.total
      const label = LABEL_PAGAMENTO[venda.formaPagamento] ?? venda.formaPagamento
      porForma[label] = (porForma[label] ?? 0) + venda.total
    }
    return { total, porForma }
  }, [vendas])

  const ranking = useMemo(() => {
    const contagem = new Map<string, number>()
    for (const venda of vendas) {
      for (const item of venda.itens) {
        contagem.set(item.nome, (contagem.get(item.nome) ?? 0) + item.quantidade)
      }
    }
    return [...contagem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [vendas])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-zinc-900">Fechamento de Caixa</h1>
        <input
          type="date"
          value={dataString}
          onChange={(event) => setDataString(event.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <Loading texto="Carregando vendas do dia..." />
      ) : (
        <>
          <div className="rounded-2xl bg-zinc-900 p-6 text-center text-white shadow-md">
            <p className="text-sm text-zinc-300">Faturamento do dia</p>
            <p className="text-4xl font-black">{formatarMoeda(totais.total)}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {Object.entries(totais.porForma).map(([label, valor]) => (
              <div key={label} className="rounded-xl bg-white p-3 text-center shadow-sm">
                <p className="text-xs font-semibold uppercase text-zinc-400">{label}</p>
                <p className="text-lg font-bold text-zinc-900">{formatarMoeda(valor)}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-zinc-500">🏆 Mais vendidos</h2>
            {ranking.length === 0 ? (
              <p className="text-sm text-zinc-400">Nenhuma venda registrada neste dia.</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {ranking.map(([nome, quantidade], index) => (
                  <li key={nome} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700">
                      <span className="font-bold text-zinc-400">{index + 1}.</span> {nome}
                    </span>
                    <span className="font-bold text-zinc-900">{quantidade}×</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
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
                        · {LABEL_PAGAMENTO[venda.formaPagamento] ?? venda.formaPagamento} ·{' '}
                        {venda.atendenteFechamento}
                      </p>
                    </div>
                    <span className="font-bold text-zinc-900">{formatarMoeda(venda.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
