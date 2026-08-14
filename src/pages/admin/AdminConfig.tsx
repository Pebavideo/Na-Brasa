import { useEffect, useState, type FormEvent } from 'react'
import { useConfiguracoes } from '../../hooks/useConfiguracoes'
import { Loading } from '../../components/Loading'
import { atualizarConfiguracoes } from '../../lib/firestore'
import type { Configuracoes, TipoChavePix } from '../../types'

const TIPOS_CHAVE: TipoChavePix[] = ['CPF', 'CNPJ', 'TELEFONE', 'EMAIL', 'ALEATORIA']

const vazio: Omit<Configuracoes, 'atendentes'> = {
  nomeLoja: '',
  chavePix: '',
  tipoChavePix: 'CPF',
  titularPix: '',
  cidadePix: '',
}

export function AdminConfig() {
  const { config, loading } = useConfiguracoes()
  const [form, setForm] = useState(vazio)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    if (config) {
      setForm({
        nomeLoja: config.nomeLoja ?? '',
        chavePix: config.chavePix ?? '',
        tipoChavePix: config.tipoChavePix ?? 'CPF',
        titularPix: config.titularPix ?? '',
        cidadePix: config.cidadePix ?? '',
      })
    }
  }, [config])

  const handleSalvar = async (event: FormEvent) => {
    event.preventDefault()
    setSalvando(true)
    try {
      await atualizarConfiguracoes(form)
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2000)
    } finally {
      setSalvando(false)
    }
  }

  if (loading) return <Loading texto="Carregando configurações..." />

  return (
    <form onSubmit={(e) => void handleSalvar(e)} className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
      <div>
        <label className="text-xs font-semibold text-zinc-500">Nome da loja</label>
        <input
          required
          value={form.nomeLoja}
          onChange={(e) => setForm((f) => ({ ...f, nomeLoja: e.target.value }))}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-zinc-500">Tipo de chave Pix</label>
          <select
            value={form.tipoChavePix}
            onChange={(e) => setForm((f) => ({ ...f, tipoChavePix: e.target.value as TipoChavePix }))}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
          >
            {TIPOS_CHAVE.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-500">Chave Pix</label>
          <input
            required
            value={form.chavePix}
            onChange={(e) => setForm((f) => ({ ...f, chavePix: e.target.value }))}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-zinc-500">Titular da chave</label>
          <input
            required
            value={form.titularPix}
            onChange={(e) => setForm((f) => ({ ...f, titularPix: e.target.value }))}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-500">Cidade</label>
          <input
            required
            value={form.cidadePix}
            onChange={(e) => setForm((f) => ({ ...f, cidadePix: e.target.value }))}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={salvando}
        className="mt-2 rounded-lg bg-orange-600 px-4 py-3 font-bold text-white disabled:opacity-60"
      >
        {salvo ? 'Salvo!' : salvando ? 'Salvando...' : 'Salvar configurações'}
      </button>
    </form>
  )
}
