# Sentimentos AI - Frontend

Este é o frontend da plataforma Sentimentos AI, construído para fornecer uma experiência visual premium, rápida e acessível.

## Características

- React 18 + Vite para build instantâneo.
- Dark mode dinâmico atrelado às configurações do sistema/usuário.
- Gráficos integrados com Recharts (pizza, barras empilhadas).
- Modais e sidebars responsivos (AppShell).
- Integração RAG e IA via Chat no `AIChatBox` e `DomainChatWidget`.

## Stack

- **Framework**: React.js
- **Tooling**: Vite, TypeScript, pnpm
- **Roteamento**: wouter
- **Estilização**: TailwindCSS + lucide-react

## Configuração Local

1. Instale as dependências:
```bash
pnpm install
```

2. Configure o `.env` (ou utilize as vars no VITE):
```env
VITE_API_URL=http://localhost:8000
```

3. Inicie o servidor:
```bash
pnpm dev
```

## Páginas Principais

- **Dashboard (`/dashboard`)**: Visão geral de métricas, reputação, sentimentos e modal de Gerenciamento de Dados.
- **Search (`/search`)**: Configuração e disparo de scraping sob demanda de múltiplas fontes.
- **Insights (`/insights`)**: Resumos gerados pelo Ollama baseados no texto coletado.

## Comunicação com Backend

Toda a interação de rede ocorre em `src/lib/api.ts`. Gerenciamento de token e Roteamento Autenticado são automáticos.

## Segurança e UX

Os dados dos usuários são sensíveis. Por isso, oferecemos um modal completo de exclusão de dados na própria interface (GDPR e LGPD compliant). O usuário decide o que armazenar.
