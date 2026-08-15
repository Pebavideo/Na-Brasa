import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConfiguracoes } from '../hooks/useConfiguracoes'

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-bold text-zinc-900">{titulo}</h2>
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-zinc-600">{children}</div>
    </section>
  )
}

export function PrivacyPolicy() {
  const navigate = useNavigate()
  const { config } = useConfiguracoes()
  const nomeLoja = config?.nomeLoja ?? 'Na Brasa'

  return (
    <div className="min-h-svh bg-zinc-100 px-4 py-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="self-start text-sm font-semibold text-zinc-500 hover:text-zinc-700"
        >
          ← Voltar
        </button>

        <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <header>
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
              {nomeLoja}
            </p>
            <h1 className="mt-1 text-2xl font-black text-zinc-900">
              Política de Privacidade e Termos de Uso
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Este documento explica, de forma simples e em conformidade com a Lei Geral de
              Proteção de Dados (Lei nº 13.709/2018 — LGPD), como o sistema de comandas e
              autoatendimento do {nomeLoja} coleta, usa e protege os dados tratados durante o seu
              atendimento.
            </p>
          </header>

          <Secao titulo="1. Quais dados coletamos">
            <p>Coletamos apenas o mínimo necessário para o seu atendimento:</p>
            <ul className="list-disc pl-5">
              <li>
                <strong>Identificação da mesa/comanda:</strong> um identificador da mesa (ex:
                "Mesa 5") usado para associar os pedidos lançados a ela.
              </li>
              <li>
                <strong>Itens do pedido:</strong> produtos, quantidades e observações (ex: "sem
                cebola") que você ou o atendente registrarem na comanda.
              </li>
              <li>
                <strong>Nome do atendente:</strong> usado internamente apenas para identificar
                quem realizou cada lançamento, e não é vinculado a dados do cliente.
              </li>
              <li>
                <strong>Forma de pagamento:</strong> registro de qual meio (Pix, dinheiro,
                cartão) foi usado para o fechamento da comanda.
              </li>
            </ul>
            <p>
              Não exigimos cadastro, login, e-mail, CPF ou qualquer outro dado pessoal do cliente
              para pedir pela mesa. O acesso ao cardápio digital (rota <code>/mesa/:mesaId</code>)
              é público e não requer identificação.
            </p>
          </Secao>

          <Secao titulo="2. Para que usamos esses dados">
            <ul className="list-disc pl-5">
              <li>Processar e organizar os pedidos lançados na comanda da mesa.</li>
              <li>
                Gerar a cobrança e o QR Code de pagamento via Pix, no padrão do Banco Central,
                com o valor exato da comanda.
              </li>
              <li>Emitir o fechamento de caixa e relatórios internos de vendas do dia.</li>
              <li>Manter o controle operacional do estabelecimento (cardápio, mesas e equipe).</li>
            </ul>
          </Secao>

          <Secao titulo="3. Compartilhamento de dados">
            <p>
              <strong>Não vendemos nem compartilhamos seus dados com terceiros para fins
              publicitários ou de marketing.</strong> As informações registradas ficam
              armazenadas na infraestrutura do Firebase (Google Cloud), usada exclusivamente como
              provedora técnica de hospedagem e banco de dados do sistema, e só são
              disponibilizadas à equipe operacional do próprio estabelecimento.
            </p>
            <p>
              Dados podem ser divulgados a autoridades competentes caso exigido por lei, ordem
              judicial ou processo legal aplicável.
            </p>
          </Secao>

          <Secao titulo="4. Armazenamento e segurança">
            <p>
              Os dados trafegam de forma criptografada (HTTPS) e ficam armazenados no Firestore
              (Google Firebase), protegidos por regras de acesso que restringem leitura e escrita
              conforme o papel de cada usuário (cliente, atendente ou administrador).
            </p>
          </Secao>

          <Secao titulo="5. Seus direitos como titular de dados">
            <p>Nos termos da LGPD, você tem direito a:</p>
            <ul className="list-disc pl-5">
              <li>Confirmar a existência de tratamento de dados e obter acesso a eles;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários;</li>
              <li>Solicitar a portabilidade dos dados a outro fornecedor de serviço;</li>
              <li>Revogar o consentimento e solicitar a eliminação de dados tratados com base nele;</li>
              <li>Obter informações sobre com quem seus dados foram compartilhados.</li>
            </ul>
          </Secao>

          <Secao titulo="6. Como falar conosco">
            <p>
              Para dúvidas, solicitações ou exercício dos direitos acima relacionados aos seus
              dados, entre em contato diretamente com a equipe do {nomeLoja} no balcão do
              estabelecimento ou pelos canais de atendimento habitualmente divulgados pela loja.
            </p>
          </Secao>

          <Secao titulo="7. Alterações desta política">
            <p>
              Esta política pode ser atualizada periodicamente para refletir melhorias no
              sistema ou mudanças na legislação. Recomendamos consultá-la sempre que utilizar o
              autoatendimento.
            </p>
          </Secao>

          <p className="border-t border-zinc-100 pt-4 text-xs text-zinc-400">
            Última atualização: agosto de 2026.
          </p>
        </div>
      </div>
    </div>
  )
}
