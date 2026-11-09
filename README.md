# Rifas

App para gerenciar rifas (do terreiro e outras): cria rifas por faixas de números,
registra vendas/pagamentos clicando nos números e acompanha a arrecadação.

- **Offline / PWA**: instalável no celular, funciona sem internet.
- **Dados no servidor** (`../rifas-api`, FastAPI + Postgres na VPS): cadastro aberto com confirmação do e-mail por código, cada rifa tem dono e membros. Sem internet, o app abre o último estado em modo só leitura (cache no `localStorage`).
- **Backup**: exporta/importa um arquivo `.json` (faça isso de vez em quando — os dados
  vivem só no navegador deste aparelho).

## Stack

React 18 + Vite + TypeScript + Tailwind CSS (tema escuro) + `vite-plugin-pwa`.

## Comandos

```bash
npm install        # instala dependências
npm run dev        # ambiente de desenvolvimento
npm run build      # checagem de tipos (tsc) + build de produção
npm run preview    # serve o build (testa PWA / service worker)
npm run deploy     # build + publica em GitHub Pages (branch gh-pages)
```

## Como funciona

- Cada rifa tem um **preço por número** e uma ou mais **faixas** (ex.: `551–560`,
  depois `1–50`). Os números existentes são a união das faixas, ordenada.
- Cada número pode estar **livre**, **reservado** (vendido, aguardando pagamento) ou
  **pago**. Clique num número para registrar comprador, contato e marcar como pago.
- O painel mostra total, vendidos, livres, **arrecadado** (pagos × preço) e
  **pendente** (reservados × preço).

## Estrutura

```
src/
├── App.tsx              # navegação por estado: lista | form | detalhe
├── types.ts             # modelo de dados (Rifa, Faixa, Bilhete)
├── lib/
│   ├── api.ts           # cliente da rifas-api (token, erros)
│   ├── storage.ts       # cache offline + legado rifas.v1 + export/import backup
│   ├── rifa.ts          # números das faixas, status, resumo, validação, id()
│   └── format.ts        # formatBRL
├── hooks/useRifas.ts    # estado + persistência + CRUD
└── components/          # RifaList, RifaForm, RangeEditor, RifaDetail,
                         # ResumoPainel, NumberGrid, NumberCell, TicketModal, ui/
```

## API

`VITE_API_URL` define a API (dev: `.env.development` → `http://localhost:8000`; build sem a variável → `https://rifas.api.jaopd.dev`).

## Deploy (GitHub Pages)

`vite.config.ts` usa `base: './'` (relativa), então funciona em qualquer subpasta do
GitHub Pages. Publique com `npm run deploy`.
