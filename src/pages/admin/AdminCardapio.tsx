import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useProdutos } from '../../hooks/useProdutos'
import { Loading } from '../../components/Loading'
import { ImagemProduto } from '../../components/ImagemProduto'
import { atualizarProduto, criarProduto, excluirProduto } from '../../lib/firestore'
import { formatarMoeda } from '../../lib/utils'
import { formatarMoedaInput, paraNumeroMoeda } from '../../lib/mascaras'
import { comprimirImagem, ehDataUrl, pareceUrlDeImagem } from '../../lib/imagem'
import { mensagemDeErroFirestore } from '../../lib/erros'
import { CATEGORIAS, type CategoriaProduto, type Produto } from '../../types'

interface FormularioProduto {
  nome: string
  preco: string
  categoria: CategoriaProduto
  descricao: string
  disponivel: boolean
}

type ModoFoto = 'upload' | 'link'

const FORM_VAZIO: FormularioProduto = {
  nome: '',
  preco: '',
  categoria: CATEGORIAS[0] as CategoriaProduto,
  descricao: '',
  disponivel: true,
}

export function AdminCardapio() {
  const { produtos, loading } = useProdutos()
  const [form, setForm] = useState<FormularioProduto>(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [comprimindoFoto, setComprimindoFoto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [processandoId, setProcessandoId] = useState<string | null>(null)

  // Foto: upload (base64 comprimido) e link (URL externa) ficam em estados
  // separados para não se sobrescreverem ao trocar de aba; fotoAtual é o que
  // realmente vale, conforme o modo selecionado.
  const [modoFoto, setModoFoto] = useState<ModoFoto>('upload')
  const [fotoArquivo, setFotoArquivo] = useState('')
  const [fotoLink, setFotoLink] = useState('')
  const inputFotoRef = useRef<HTMLInputElement>(null)

  const emEdicao = editandoId !== null
  const fotoAtual = modoFoto === 'upload' ? fotoArquivo : fotoLink
  const linkInvalido = modoFoto === 'link' && fotoLink.trim() !== '' && !pareceUrlDeImagem(fotoLink.trim())

  const limparFoto = () => {
    setFotoArquivo('')
    setFotoLink('')
    if (inputFotoRef.current) inputFotoRef.current.value = ''
  }

  const iniciarEdicao = (produto: Produto) => {
    setEditandoId(produto.id)
    setForm({
      nome: produto.nome,
      preco: formatarMoedaInput(String(Math.round(produto.preco * 100))),
      categoria: produto.categoria,
      descricao: produto.descricao ?? '',
      disponivel: produto.disponivel,
    })
    // Reabre no modo em que a foto foi originalmente cadastrada.
    if (produto.fotoUrl && !ehDataUrl(produto.fotoUrl)) {
      setModoFoto('link')
      setFotoLink(produto.fotoUrl)
      setFotoArquivo('')
    } else {
      setModoFoto('upload')
      setFotoArquivo(produto.fotoUrl ?? '')
      setFotoLink('')
    }
    setErro(null)
  }

  const cancelarEdicao = () => {
    setEditandoId(null)
    setForm(FORM_VAZIO)
    setModoFoto('upload')
    limparFoto()
    setErro(null)
  }

  const handleFotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0]
    event.target.value = ''
    if (!arquivo) return

    setComprimindoFoto(true)
    setErro(null)
    try {
      const dataUrl = await comprimirImagem(arquivo)
      setFotoArquivo(dataUrl)
    } catch (erroCompressao) {
      setErro(
        erroCompressao instanceof Error
          ? erroCompressao.message
          : 'Não foi possível processar a imagem.',
      )
    } finally {
      setComprimindoFoto(false)
    }
  }

  const handleSalvar = async (event: FormEvent) => {
    event.preventDefault()
    setErro(null)

    const nome = form.nome.trim()
    const preco = paraNumeroMoeda(form.preco)
    const descricao = form.descricao.trim()

    if (!nome) {
      setErro('Informe o nome do produto.')
      return
    }
    if (preco <= 0) {
      setErro('Informe um preço maior que zero.')
      return
    }
    if (linkInvalido) {
      setErro('Cole um link válido começando com http:// ou https://')
      return
    }

    const fotoUrl = fotoAtual.trim()

    setSalvando(true)
    try {
      if (editandoId) {
        await atualizarProduto(editandoId, {
          nome,
          preco,
          categoria: form.categoria,
          disponivel: form.disponivel,
          descricao,
          fotoUrl,
        })
        cancelarEdicao()
      } else {
        await criarProduto({
          nome,
          preco,
          categoria: form.categoria,
          disponivel: true,
          ...(descricao ? { descricao } : {}),
          ...(fotoUrl ? { fotoUrl } : {}),
        })
        setForm(FORM_VAZIO)
        setModoFoto('upload')
        limparFoto()
      }
    } catch (erroSalvar) {
      setErro(mensagemDeErroFirestore(erroSalvar, 'Não foi possível salvar o produto.'))
    } finally {
      setSalvando(false)
    }
  }

  const handleAlternarDisponibilidade = async (produtoId: string, disponivel: boolean) => {
    if (processandoId) return
    setProcessandoId(produtoId)
    try {
      await atualizarProduto(produtoId, { disponivel: !disponivel })
    } catch (erroAlternar) {
      setErro(mensagemDeErroFirestore(erroAlternar, 'Não foi possível atualizar o produto. Tente novamente.'))
    } finally {
      setProcessandoId(null)
    }
  }

  const handleExcluir = async (produtoId: string, nome: string) => {
    if (processandoId) return
    if (!confirm(`Excluir "${nome}"? Essa ação não pode ser desfeita.`)) return
    setProcessandoId(produtoId)
    try {
      await excluirProduto(produtoId)
      if (editandoId === produtoId) cancelarEdicao()
    } catch (erroExcluir) {
      setErro(mensagemDeErroFirestore(erroExcluir, 'Não foi possível excluir o produto. Tente novamente.'))
    } finally {
      setProcessandoId(null)
    }
  }

  if (loading) return <Loading texto="Carregando cardápio..." />

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={(e) => void handleSalvar(e)} className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
        {emEdicao && (
          <div className="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
            <span>Editando produto</span>
            <button type="button" onClick={cancelarEdicao} className="underline">
              Cancelar edição
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-zinc-500">Nome do produto</label>
            <input
              required
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
              placeholder="Ex: Espeto de Picanha"
            />
          </div>
          <div className="w-32">
            <label className="text-xs font-semibold text-zinc-500">Preço</label>
            <div className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 focus-within:border-orange-500">
              <span className="text-sm text-zinc-400">R$</span>
              <input
                required
                inputMode="decimal"
                value={form.preco}
                onChange={(e) => setForm((f) => ({ ...f, preco: formatarMoedaInput(e.target.value) }))}
                className="w-full text-sm outline-none"
                placeholder="0,00"
              />
            </div>
          </div>
          <div className="w-40">
            <label className="text-xs font-semibold text-zinc-500">Categoria</label>
            <select
              value={form.categoria}
              onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as CategoriaProduto }))}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
            >
              {CATEGORIAS.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500">Descrição (opcional)</label>
          <textarea
            rows={2}
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            placeholder="Ex: ingredientes, acompanhamentos..."
            className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500">Foto (opcional)</label>

          <div className="mb-2 flex gap-1 rounded-lg bg-zinc-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setModoFoto('upload')}
              className={`flex-1 rounded-md py-1.5 transition ${
                modoFoto === 'upload' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
              }`}
            >
              📁 Enviar arquivo
            </button>
            <button
              type="button"
              onClick={() => setModoFoto('link')}
              className={`flex-1 rounded-md py-1.5 transition ${
                modoFoto === 'link' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
              }`}
            >
              🔗 Link da imagem
            </button>
          </div>

          <div className="flex items-center gap-3">
            {fotoAtual && (
              <ImagemProduto
                src={fotoAtual}
                alt="Pré-visualização"
                className="h-14 w-14 shrink-0 rounded-lg border border-zinc-200 object-cover"
              />
            )}
            <div className="flex-1">
              {modoFoto === 'upload' ? (
                <input
                  ref={inputFotoRef}
                  type="file"
                  accept="image/*"
                  disabled={comprimindoFoto}
                  onChange={(e) => void handleFotoChange(e)}
                  className="w-full text-xs text-zinc-500 file:mr-2 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-zinc-700"
                />
              ) : (
                <input
                  type="url"
                  inputMode="url"
                  value={fotoLink}
                  onChange={(e) => setFotoLink(e.target.value)}
                  placeholder="https://exemplo.com/foto.jpg"
                  aria-invalid={linkInvalido ? 'true' : 'false'}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-orange-500 ${
                    linkInvalido ? 'border-red-300' : 'border-zinc-200'
                  }`}
                />
              )}

              <div className="mt-1 flex items-center gap-3">
                {fotoAtual && (
                  <button
                    type="button"
                    onClick={limparFoto}
                    className="text-xs font-semibold text-red-500"
                  >
                    Remover foto
                  </button>
                )}
                {comprimindoFoto && <span className="text-xs text-zinc-400">Comprimindo imagem...</span>}
                {linkInvalido && (
                  <span className="text-xs text-red-500">Link inválido — use http:// ou https://</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {erro && (
          <p className="rounded-lg bg-red-50 p-2 text-center text-sm text-red-600">{erro}</p>
        )}

        <button
          type="submit"
          disabled={salvando || comprimindoFoto || linkInvalido}
          className="self-start rounded-lg bg-orange-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {salvando ? 'Salvando...' : emEdicao ? 'Salvar alterações' : 'Adicionar produto'}
        </button>
      </form>

      <div className="rounded-xl bg-white shadow-sm">
        {produtos.length === 0 ? (
          <p className="p-4 text-center text-sm text-zinc-400">Nenhum produto cadastrado.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {produtos.map((produto) => {
              const processando = processandoId === produto.id
              return (
                <li key={produto.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div className="flex items-center gap-3">
                    {produto.fotoUrl && (
                      <ImagemProduto
                        src={produto.fotoUrl}
                        alt={produto.nome}
                        className="h-12 w-12 shrink-0 rounded-lg border border-zinc-200 object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-zinc-900">{produto.nome}</p>
                      <p className="text-xs text-zinc-400">
                        {produto.categoria} · {formatarMoeda(produto.preco)}
                      </p>
                      {produto.descricao && (
                        <p className="mt-0.5 max-w-xs text-xs text-zinc-500">{produto.descricao}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={processando}
                      onClick={() => void handleAlternarDisponibilidade(produto.id, produto.disponivel)}
                      className={`rounded-full px-3 py-1 text-xs font-bold disabled:opacity-50 ${
                        produto.disponivel ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-400'
                      }`}
                    >
                      {produto.disponivel ? 'Disponível' : 'Indisponível'}
                    </button>
                    <button
                      type="button"
                      disabled={processando}
                      onClick={() => iniciarEdicao(produto)}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600 disabled:opacity-50"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      type="button"
                      disabled={processando}
                      onClick={() => void handleExcluir(produto.id, produto.nome)}
                      className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500 disabled:opacity-50"
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
