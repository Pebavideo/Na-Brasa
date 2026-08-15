import { useEffect, useState, type FormEvent } from 'react'
import { useConfiguracoes } from '../../hooks/useConfiguracoes'
import { Loading } from '../../components/Loading'
import { atualizarConfiguracoes } from '../../lib/firestore'
import {
  aplicarMascaraChavePix,
  formatarExibicaoChavePix,
  normalizarChavePix,
  validarChavePix,
} from '../../lib/mascaras'
import type { TipoChavePix } from '../../types'

const TIPOS_CHAVE: TipoChavePix[] = ['CPF', 'CNPJ', 'TELEFONE', 'EMAIL', 'ALEATORIA']

const PLACEHOLDER_POR_TIPO: Record<TipoChavePix, string> = {
  CPF: '000.000.000-00',
  CNPJ: '00.000.000/0000-00',
  TELEFONE: '(00) 00000-0000',
  EMAIL: 'nome@exemplo.com',
  ALEATORIA: 'Chave aleatória (UUID)',
}

const vazio = {
  nomeLoja: '',
  tipoChavePix: 'CPF' as TipoChavePix,
  chavePixExibicao: '',
  titularPix: '',
  cidadePix: '',
}

export function AdminConfig() {
  const { config, loading } = useConfiguracoes()
  const [form, setForm] = useState(vazio)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (config) {
      setForm({
        nomeLoja: config.nomeLoja ?? '',
        tipoChavePix: config.tipoChavePix ?? 'CPF',
        chavePixExibicao: config.chavePix
          ? formatarExibicaoChavePix(config.tipoChavePix ?? 'CPF', config.chavePix)
          : '',
        titularPix: config.titularPix ?? '',
        cidadePix: config.cidadePix ?? '',
      })
    }
  }, [config])

  const handleTrocarTipo = (tipo: TipoChavePix) => {
    // Formatos diferentes não são compatíveis entre si — evita carregar uma
    // máscara antiga (ex: CPF) sobre um novo tipo (ex: telefone).
    setForm((f) => ({ ...f, tipoChavePix: tipo, chavePixExibicao: '' }))
  }

  const handleChavePixChange = (valorDigitado: string) => {
    setForm((f) => ({ ...f, chavePixExibicao: aplicarMascaraChavePix(f.tipoChavePix, valorDigitado) }))
  }

  const handleSalvar = async (event: FormEvent) => {
    event.preventDefault()
    setErro(null)

    const nomeLoja = form.nomeLoja.trim()
    const titularPix = form.titularPix.trim()
    const cidadePix = form.cidadePix.trim()

    if (!nomeLoja || !titularPix || !cidadePix) {
      setErro('Preencha nome da loja, titular e cidade.')
      return
    }

    const erroChave = validarChavePix(form.tipoChavePix, form.chavePixExibicao)
    if (erroChave) {
      setErro(erroChave)
      return
    }

    setSalvando(true)
    try {
      await atualizarConfiguracoes({
        nomeLoja,
        tipoChavePix: form.tipoChavePix,
        chavePix: normalizarChavePix(form.tipoChavePix, form.chavePixExibicao),
        titularPix,
        cidadePix,
      })
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2000)
    } catch {
      setErro('Não foi possível salvar as configurações. Tente novamente.')
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
            onChange={(e) => handleTrocarTipo(e.target.value as TipoChavePix)}
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
            type={form.tipoChavePix === 'EMAIL' ? 'email' : 'text'}
            inputMode={
              form.tipoChavePix === 'CPF' || form.tipoChavePix === 'CNPJ' || form.tipoChavePix === 'TELEFONE'
                ? 'numeric'
                : 'text'
            }
            value={form.chavePixExibicao}
            onChange={(e) => handleChavePixChange(e.target.value)}
            placeholder={PLACEHOLDER_POR_TIPO[form.tipoChavePix]}
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

      {erro && (
        <p className="rounded-lg bg-red-50 p-2 text-center text-sm text-red-600">{erro}</p>
      )}

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
