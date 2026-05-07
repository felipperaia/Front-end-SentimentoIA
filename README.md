# frontend-web — SentimentoIA

Visão geral

Este repositório contém a aplicação frontend (SPA) do SentimentoIA, construída com React + Vite. O frontend consome a API FastAPI e apresenta dashboard, ingestão e chat restrito.

Onde está o código

- Código fonte: `apps/web/src`
- Configuração Vite: `vite.config.ts`
- Scripts e dependências: `package.json`
- Variáveis de exemplo: `apps/web/.env.example`

Pré-requisitos

- Node.js 20+ (recomendado)
- pnpm (recomendado) ou npm
- Acesso à API (defina `VITE_API_URL`)

Instalação (local)

No PowerShell (Windows):

```powershell
cd repos-separados-20260506/frontend-web
pnpm install
# copiar exemplo de env
Copy-Item apps\web\.env.example apps\web\.env
# editar apps/web/.env e ajustar VITE_API_URL para http://localhost:8000
pnpm run dev:web
```

Em bash (Linux/macOS):

```bash
cd repos-separados-20260506/frontend-web
pnpm install
cp apps/web/.env.example apps/web/.env
# editar apps/web/.env: VITE_API_URL=http://localhost:8000
pnpm run dev:web
```

Comandos úteis

- Desenvolvimento: `pnpm run dev:web` (Vite dev server)
- Build produção: `pnpm run build`
- Typecheck: `pnpm run check`
- Testes: `pnpm run test`

Build de produção e saída

- Build produz os arquivos em `dist/public` (conforme `vite.config.ts`).
- Ao subir para um provedor de hospedagem estática (Netlify, Vercel), a pasta a publicar é `dist/public`.

Variáveis de ambiente (importantes)

Edite `apps/web/.env` (a partir do `.env.example`):

- `VITE_API_URL` — URL pública do backend FastAPI (ex.: `https://api.seudominio.com`)
- `VITE_APP_NAME` — nome da aplicação (opcional)
- `VITE_DEFAULT_LOCALE` — ex.: `pt-BR`
- `VITE_ENABLE_CHAT` — `true|false`

Observações sobre Vite e Netlify

- No Netlify, defina a variável `VITE_API_URL` nas Environment Variables do site (build-time), pois variáveis VITE_* são incorporadas no build.
- Build command: `pnpm build`
- Publish directory: `dist/public`
- Para single-page app, coloque `_redirects` em `apps/web/public` com a linha: `/* /index.html 200`.

Deploy no Netlify (passo-a-passo)

1. Criar repositório GitHub `frontend-web` e enviar o conteúdo deste diretório para a branch `main`.
2. No Netlify → New site from Git → conectar GitHub → selecionar `frontend-web` → `main`.
3. Build command: `pnpm build`.
4. Publish directory: `dist/public`.
5. Environment variables: adicionar `VITE_API_URL` com a URL do backend.
6. Deploy e validar site.

Smoke tests pós-deploy

- Acesse o site Netlify e abra o console do navegador para verificar erros de CORS e endpoints chamados.
- Teste uma chamada que necessita autenticação ou dados, confirmando que a API responde.

Arquivos-chave e responsabilidades

- `apps/web/src/main.tsx` — ponto de entrada do app React.
- `apps/web/src/lib/api.ts` — configura o cliente HTTP apontando para `VITE_API_URL`.
- `vite.config.ts` — define `root`, `publicDir` e `build.outDir`.

Boas práticas

- Não comite `.env` com segredos.
- Use variáveis de ambiente do provedor (Netlify) para valores de produção.
- Configure domínio customizado e HTTPS via Netlify.

Problemas comuns

- Erro ao construir por falta de `pnpm` — instale `pnpm` globalmente ou use `npm` (ajuste comandos).
- CORS — verifique `FRONTEND_URL` no backend e `CORS_ORIGINS`.

Referências

- `apps/web/.env.example`
- `vite.config.ts`

---
