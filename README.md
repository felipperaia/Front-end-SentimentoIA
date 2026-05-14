# Sentimento AI Frontend

Frontend web React/Vite da plataforma Sentimento AI.

## Objetivo arquitetural

Este frontend opera em modo backend-only:

- Nunca chama Ollama diretamente.
- Nunca envia API keys de LLM no browser.
- Consome somente a API backend via `VITE_API_URL`.
- Mantem fluxo user-scoped via token JWT (`Authorization: Bearer ...`).
- Pode ser publicado como site estatico (Netlify ou equivalente).

## Stack

- React 19 + TypeScript
- Vite 7
- wouter
- Tailwind CSS
- Recharts

## Estrutura principal

- `apps/web/src/lib/api.ts`: cliente HTTP unico (auth, timeout, retry, downloads).
- `apps/web/src/components/DomainChatWidget.tsx`: chat com backend (`/api/chat/*`).
- `apps/web/src/pages/Dashboard.tsx`: metricas e dados por usuario autenticado.
- `apps/web/src/pages/Analysis.tsx`: insights persistidos, filtros e acoes.
- `apps/web/src/pages/Reports.tsx`: exportacoes CSV/PDF e insights Markdown/PDF com filtros.

## Contrato frontend -> backend

Todas as chamadas abaixo sao feitas com `VITE_API_URL` + path.

### Autenticacao e sessao

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Dashboard, busca e mencoes

- `GET /api/dashboard`
- `POST /api/search`
- `POST /api/scrape`
- `GET /api/mentions`

### Insights

- `GET /api/insights` (filtros: `priority`, `resolution`, `include_archived`, `limit`)
- `POST /api/insights/generate`
- `POST /api/insights/{insight_id}/regenerate`
- `DELETE /api/insights/{insight_id}`
- `GET /api/insights/export/markdown`
- `GET /api/insights/export/pdf`

### Chat

- `GET /api/chat/threads`
- `POST /api/chat/threads`
- `GET /api/chat/threads/{thread_id}/messages`
- `POST /api/chat/threads/{thread_id}/messages`
- `DELETE /api/chat/threads/{thread_id}`
- `DELETE /api/chat/threads/{thread_id}/messages/{message_id}`
- `DELETE /api/chat/threads`

## Variaveis de ambiente (apps/web/.env)

Obrigatorias para operacao correta:

- `VITE_API_URL`: URL publica da API backend.
- `VITE_API_TIMEOUT_MS`: timeout por requisicao HTTP.
- `VITE_API_RETRY_ATTEMPTS`: tentativas de retry para falhas de rede/5xx/429.
- `VITE_API_RETRY_DELAY_MS`: delay base entre retries.

O arquivo `apps/web/.env` foi ajustado para manter o valor antigo comentado e usar endpoint publico por padrao.

Exemplo atual:

```env
# VITE_API_URL=http://localhost:8000
VITE_API_URL=https://api.seudominio.com
VITE_API_TIMEOUT_MS=20000
VITE_API_RETRY_ATTEMPTS=2
VITE_API_RETRY_DELAY_MS=700
```

## Execucao local

No diretorio `frontend-web`:

```bash
npm install
npm run dev
```

Build de producao:

```bash
npm run build
```

## Deploy estatico (Netlify)

Arquivo incluido: `netlify.toml`.

Configuracao definida:

- Build command: `npm run build`
- Publish directory: `dist/public`
- SPA redirect: `/* -> /index.html` (200)

Passos no painel Netlify:

1. Conectar o repositorio.
2. Definir root/base para `frontend-web` (se estiver fazendo deploy do monorepo raiz).
3. Definir variavel `VITE_API_URL` com a URL publica da API backend.
4. Executar deploy.

## Deploy em outros hosts estaticos

Em Vercel, Cloudflare Pages, S3+CloudFront ou similares:

- Publicar a pasta gerada `dist/public`.
- Garantir rewrite SPA para `index.html`.
- Definir `VITE_API_URL` para backend publico.

## Regras de seguranca e escopo de usuario

- Sem chave de LLM no frontend.
- Sem chamadas diretas para Ollama no browser.
- Sem dependencia de localhost em producao.
- Token JWT anexado automaticamente em todas as chamadas protegidas.
- Operacoes de chat, insights, dashboard e exportacao seguem escopo do usuario autenticado no backend.

## UX e resiliencia

- Estados de loading para consultas e exportacoes.
- Estados de erro com acao de retry.
- Estados vazios para dashboards/insights sem dados.
- Retry automatico no cliente API para erros transientes.

## Troubleshooting rapido

- Erro `VITE_API_URL nao esta definido`: revisar `apps/web/.env`.
- CORS/401 em producao: validar URL publica backend e token de sessao.
- Exportacao falhando: verificar permissao/autenticacao do usuario e disponibilidade da API backend.
