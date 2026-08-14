# Na Brasa — Gestão de Comandas & Autoatendimento

Aplicativo web mobile-first para bares, restaurantes e espetinhos, com operação
tradicional (garçom lançando pelo celular) e autoatendimento do cliente via QR
Code na mesa.

**Stack:** React + TypeScript + Vite + Tailwind CSS + Firebase (Auth, Firestore, Hosting).

## Como rodar localmente

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — ambiente de desenvolvimento
- `npm run build` — build de produção (`tsc -b && vite build`)
- `npm run preview` — pré-visualiza o build de produção
- `npm run lint` — checagem de lint (oxlint)

## Estrutura

```
src/
  firebase.ts           # inicialização do Firebase (Auth + Firestore)
  types/                # tipos do domínio (Produto, MesaComanda, Venda...)
  contexts/AuthContext   # login único da equipe + seletor de atendente + super admin
  hooks/                 # leitura em tempo real do Firestore (onSnapshot)
  lib/firestore.ts       # escrita no Firestore (transactions/batches)
  lib/pix.ts              # gerador de payload Pix (EMVCo / BR Code)
  components/             # Layout, rotas protegidas, Checkout, QR Code Pix...
  pages/                  # Login, Mesas, Comanda, MesaPublica, Caixa, Admin
```

## Módulos

1. **Grade de Mesas** (`/mesas`) — cards de mesas livres/ocupadas com total em tempo real.
2. **Comanda do garçom** (`/comanda/:mesaId`) — lançamento rápido de itens por categoria.
3. **Autoatendimento do cliente** (`/mesa/:mesaId`, rota pública) — cardápio, carrinho e
   envio de pedido direto para a mesa, sem login.
4. **Checkout** — Pix (QR Code + copia e cola), Débito/Crédito (confirmação na maquininha)
   e Dinheiro (com cálculo de troco).
5. **Caixa** (`/caixa`, super admin) — faturamento do dia por forma de pagamento, histórico
   de comandas e ranking dos itens mais vendidos.
6. **Painel Administrativo** (`/admin`, super admin) — cardápio, chave Pix, atendentes e
   gerador de QR Codes das mesas para impressão.

## Acesso

- Login único da equipe via Firebase Auth (e-mail/senha), com seletor de atendente por
  aparelho para identificar quem lançou cada item.
- Super admin (Caixa, Admin, exclusão de mesas): `jjoserobertorocharocha@gmail.com`.

## Firebase

Projeto: `na-brasa-ff2e0`. As regras de segurança estão em [firestore.rules](firestore.rules)
e os índices necessários em [firestore.indexes.json](firestore.indexes.json).

Deploy (Firebase CLI):

```bash
npm run build
firebase deploy
```
