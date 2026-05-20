# SentimentoIA Frontend

Aplicação web do SentimentoIA construída com React + Vite, focada em análise de reputação digital, dashboards de sentimento, insights e relatórios.

Este repositório contém o frontend em modo backend-only: toda inteligência e persistência de dados ficam no backend.

## Sumário

- Visão geral
- Tecnologias
- Requisitos
- Como executar localmente
- Variáveis de ambiente
- Scripts disponíveis
- Estrutura do projeto
- Integração com backend
- PWA
- Deploy
- Segurança
- Roteiro de apresentação
- Troubleshooting

## Visão Geral

O frontend foi projetado para:

- autenticação e sessão de usuário
- busca de menções por fonte
- dashboard com distribuição por fonte e métricas de reputação
- geração e gestão de insights
- exportação de relatórios
- NPS contextual e consentimento LGPD
- experiência PWA (manifest + service worker)

Princípios arquiteturais:

- frontend nunca chama provedor de LLM diretamente
- frontend nunca carrega API key sensível de IA
- frontend consome apenas endpoints do backend via VITE_API_URL
- token JWT é utilizado nas rotas protegidas

## Tecnologias

- React 19
- TypeScript 5
- Vite 7
- Tailwind CSS 4
- wouter
- React Query
- Recharts

## Requisitos

- Node.js 20+
- npm 10+ ou pnpm 10+
- backend da plataforma SentimentoIA disponível

## Como Executar Localmente

### 1) Instalar dependências

Com npm:

```bash
npm install
```

Com pnpm:

```bash
pnpm install
```

### 2) Configurar ambiente

Copie o arquivo de exemplo para o ambiente local:

Linux/macOS:

```bash
cp apps/web/.env.example apps/web/.env
```

Windows PowerShell:

```powershell
Copy-Item apps/web/.env.example apps/web/.env
```

### 3) Ajustar URL do backend

No arquivo apps/web/.env, configure:

```env
VITE_API_URL=http://localhost:8000
```

### 4) Subir o frontend

Com npm:

```bash
npm run dev
```

Com pnpm:

```bash
pnpm dev
```

O Vite exibirá a URL local (normalmente http://localhost:5173).

### 5) Validar tipos

```bash
npm run check
```

## Variáveis de Ambiente

Arquivo: apps/web/.env

Base recomendada:

```env
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT_MS=20000
VITE_API_RETRY_ATTEMPTS=2
VITE_API_RETRY_DELAY_MS=700
VITE_ENABLE_CHAT=true
VITE_ENABLE_NPS=true
VITE_ENABLE_PWA=true
VITE_PRIVACY_POLICY_URL=/api/privacy/policy
```

Descrição das principais variáveis:

- VITE_API_URL: URL pública do backend
- VITE_API_TIMEOUT_MS: timeout por requisição (ms)
- VITE_API_RETRY_ATTEMPTS: tentativas extras para falhas transitórias
- VITE_API_RETRY_DELAY_MS: atraso base entre retentativas
- VITE_ENABLE_CHAT: habilita/desabilita o widget de chat
- VITE_ENABLE_NPS: habilita/desabilita o modal de NPS
- VITE_ENABLE_PWA: habilita/desabilita registro do service worker
- VITE_PRIVACY_POLICY_URL: URL da política de privacidade

## Scripts Disponíveis

| Script | Finalidade |
| --- | --- |
| npm run dev | Executa frontend em modo desenvolvimento |
| npm run preview | Sobe o build local para validacao pre-deploy |
| npm run start | Alias de preview para ambiente de runtime estatico |
| npm run build | Gera build de produção |
| npm run check | Verifica tipos TypeScript sem emitir arquivos |
| npm run type-check | Alias de check |
| npm run test | Executa testes (Vitest) |
| npm run format | Formata código com Prettier |

## Estrutura do Projeto

```text
frontend-web/
├─ apps/
│  └─ web/
│     ├─ public/
│     │  ├─ manifest.json
│     │  ├─ sw.js
│     │  ├─ icon-192.png
│     │  └─ icon-512.png
│     ├─ src/
│     │  ├─ components/
│     │  ├─ contexts/
│     │  ├─ lib/
│     │  └─ pages/
│     ├─ .env.example
│     └─ index.html
├─ vite.config.ts
├─ netlify.toml
└─ package.json
```

Pontos centrais do código:

- apps/web/src/lib/api.ts: cliente HTTP, autenticação, retry e integração com backend
- apps/web/src/pages/Dashboard.tsx: métricas, fontes, status e menções
- apps/web/src/pages/Search.tsx: fluxo de busca e gatilho de NPS pós-busca
- apps/web/src/components/NpsModal.tsx: coleta de NPS
- apps/web/src/components/CookieBanner.tsx: consentimento LGPD

## Integração com Backend

O frontend consome endpoints no formato:

```text
{VITE_API_URL}/api/...
```

Principais rotas utilizadas:

- autenticação: /api/auth/*
- dashboard e menções: /api/dashboard, /api/mentions
- busca: /api/search
- insights: /api/insights/*
- chat: /api/chat/*
- NPS: /api/nps/*
- privacidade: /api/privacy/*

## PWA

Implementação ativa com:

- manifest em apps/web/public/manifest.json
- service worker em apps/web/public/sw.js
- registro do SW em produção no bootstrap do frontend

Comportamento principal do service worker:

- cache de assets estáticos essenciais
- limpeza de caches antigos no activate
- bypass explícito para chamadas /api/

## Deploy

### Netlify

Configuração já incluída em netlify.toml:

- command: npm run build
- publish: dist/public
- redirect SPA: /* -> /index.html

Passos:

1. Conectar o repositório no Netlify
2. Definir Node 20 (quando necessário)
3. Configurar variável `VITE_API_URL` apontando para o backend em hostingguru.io (ex.: `https://api.seu-dominio.com`)
4. Publicar

### Outros provedores estáticos

Para Vercel, Cloudflare Pages, S3+CloudFront e similares:

- publicar a pasta dist/public
- habilitar fallback SPA para index.html
- configurar VITE_API_URL apontando para backend público

## Segurança

Regras importantes do frontend:

- sem chave de IA em variáveis públicas do browser
- sem chamada direta a gateway/provedor de LLM
- sessão de usuário protegida com token
- escopo de dados orientado ao usuário autenticado

## Roteiro de Apresentação

Fluxo recomendado para demo:

1. Login na aplicação
2. Executar busca por marca
3. Mostrar Dashboard com distribuição por fonte e status
4. Navegar em Insights e filtros
5. Exportar relatório
6. Exibir NPS pós-busca
7. Exibir banner LGPD e política

## Troubleshooting

- Erro VITE_API_URL não definido:
	- conferir apps/web/.env
- CORS, 401 ou timeout:
	- validar backend disponível e URL correta
	- validar token/sessão
- Build falhando:
	- executar npm install novamente
	- executar npm run check para localizar erro de tipo
- PWA não atualiza:
	- limpar cache do navegador e service worker antigo

## Licença

MIT (conforme package.json).
