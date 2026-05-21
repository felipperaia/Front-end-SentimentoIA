# SentimentoIA Frontend

Frontend web do SentimentoIA para consulta de menções, dashboard, análise por IA e relatórios.

Este projeto é frontend-only: os dados e regras de negócio ficam no backend.

## Entendimento rápido do sistema

O fluxo principal funciona assim:

1. Usuário faz login.
2. O frontend chama o backend via VITE_API_URL.
3. As páginas exibem dados de busca, dashboard, análise e métricas.
4. O token de sessão é salvo localmente para rotas protegidas.

Recursos opcionais no frontend:

- chat
- NPS
- PWA
- mapa (Google Maps, quando a chave é configurada)

## Requisitos

- Node.js 20+
- pnpm 10+ (ou npm)
- backend do SentimentoIA disponível e acessível

## Configuração de ambiente

O Vite deste projeto lê variáveis em apps/web.

1. Copie o arquivo de exemplo:

Windows PowerShell:

```powershell
Copy-Item apps/web/.env.example apps/web/.env
```

Linux/macOS:

```bash
cp apps/web/.env.example apps/web/.env
```

2. Edite o arquivo apps/web/.env e ajuste principalmente:

```env
VITE_API_URL=https://seu-backend-publico.exemplo.com
```

## Rodando localmente

Instalar dependências:

```bash
pnpm install
```

Subir em desenvolvimento:

```bash
pnpm dev
```

## Build

Validar tipagem:

```bash
pnpm check
```

Gerar build de produção:

```bash
pnpm build
```

Testar build localmente:

```bash
pnpm preview
```

Saída do build: dist/public

## Variáveis principais

- VITE_API_URL: URL pública do backend
- VITE_API_TIMEOUT_MS: timeout das requisições
- VITE_API_RETRY_ATTEMPTS: tentativas extras em erro transitório
- VITE_API_RETRY_DELAY_MS: atraso entre tentativas
- VITE_ENABLE_CHAT: liga/desliga chat
- VITE_ENABLE_NPS: liga/desliga NPS
- VITE_ENABLE_PWA: liga/desliga service worker
- VITE_PRIVACY_POLICY_URL: URL da política de privacidade
- VITE_DEFAULT_LOCALE: idioma inicial (pt-BR ou en-US)
- VITE_GOOGLE_MAPS_API_KEY: chave de mapa (opcional)
