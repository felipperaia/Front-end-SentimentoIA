import type { AppLocale } from "@/lib/api";

type LocaleMap = Record<AppLocale, string>;

export type TranslationValues = Record<string, string | number>;

export const TRANSLATIONS = {
  "common.appName": {
    "pt-BR": "Sentimento AI",
    "en-US": "Sentimento AI",
  },
  "common.brand": {
    "pt-BR": "[Sentimento AI]",
    "en-US": "[Sentimento AI]",
  },
  "common.productLine": {
    "pt-BR": "InteligÃªncia de reputaÃ§Ã£o com IA",
    "en-US": "AI reputation intelligence",
  },
  "common.loading": {
    "pt-BR": "Carregando...",
    "en-US": "Loading...",
  },
  "common.processing": {
    "pt-BR": "Processando...",
    "en-US": "Processing...",
  },
  "common.saving": {
    "pt-BR": "Salvando...",
    "en-US": "Saving...",
  },
  "common.save": {
    "pt-BR": "Salvar",
    "en-US": "Save",
  },
  "common.refresh": {
    "pt-BR": "Atualizar",
    "en-US": "Refresh",
  },
  "common.close": {
    "pt-BR": "Fechar",
    "en-US": "Close",
  },
  "common.new": {
    "pt-BR": "Novo",
    "en-US": "New",
  },
  "common.status": {
    "pt-BR": "Status",
    "en-US": "Status",
  },
  "common.email": {
    "pt-BR": "E-mail",
    "en-US": "Email",
  },
  "common.password": {
    "pt-BR": "Senha",
    "en-US": "Password",
  },
  "common.name": {
    "pt-BR": "Nome completo",
    "en-US": "Full name",
  },
  "common.phone": {
    "pt-BR": "Telefone",
    "en-US": "Phone",
  },
  "common.confirmPassword": {
    "pt-BR": "Confirmar senha",
    "en-US": "Confirm password",
  },
  "common.optional": {
    "pt-BR": "opcional",
    "en-US": "optional",
  },
  "common.notAvailable": {
    "pt-BR": "IndisponÃ­vel",
    "en-US": "Unavailable",
  },
  "common.none": {
    "pt-BR": "Nenhum",
    "en-US": "None",
  },
  "common.goHome": {
    "pt-BR": "Ir para a pÃ¡gina inicial",
    "en-US": "Go home",
  },
  "common.language": {
    "pt-BR": "Idioma",
    "en-US": "Language",
  },
  "common.portugueseBrazil": {
    "pt-BR": "PortuguÃªs (Brasil)",
    "en-US": "Portuguese (Brazil)",
  },
  "common.englishUs": {
    "pt-BR": "InglÃªs (EUA)",
    "en-US": "English (US)",
  },
  "common.days": {
    "pt-BR": "{count} dias",
    "en-US": "{count} days",
  },
  "nav.home": {
    "pt-BR": "InÃ­cio",
    "en-US": "Home",
  },
  "nav.search": {
    "pt-BR": "Busca",
    "en-US": "Search",
  },
  "nav.dashboard": {
    "pt-BR": "Dashboard",
    "en-US": "Dashboard",
  },
  "nav.insights": {
    "pt-BR": "Insights",
    "en-US": "Insights",
  },
  "nav.reports": {
    "pt-BR": "RelatÃ³rios",
    "en-US": "Reports",
  },
  "nav.metrics": {
    "pt-BR": "MÃ©tricas",
    "en-US": "Metrics",
  },
  "nav.settings": {
    "pt-BR": "ConfiguraÃ§Ãµes",
    "en-US": "Settings",
  },
  "nav.login": {
    "pt-BR": "Entrar",
    "en-US": "Log in",
  },
  "nav.register": {
    "pt-BR": "Criar conta",
    "en-US": "Create account",
  },
  "nav.logout": {
    "pt-BR": "Sair",
    "en-US": "Sign out",
  },
  "shell.mobileMenu": {
    "pt-BR": "Menu",
    "en-US": "Menu",
  },
  "loading.initializing": {
    "pt-BR": "Inicializando Sentimento AI...",
    "en-US": "Starting Sentimento AI...",
  },
  "loading.validatingSession": {
    "pt-BR": "Validando sessÃ£o...",
    "en-US": "Validating session...",
  },
  "home.badge": {
    "pt-BR": "Monitoramento de reputaÃ§Ã£o para times comerciais e executivos",
    "en-US": "Reputation monitoring for commercial and executive teams",
  },
  "home.title": {
    "pt-BR": "Entenda a reputaÃ§Ã£o da sua marca antes que pequenos sinais virem crise.",
    "en-US": "Understand your brand reputation before small signals become a crisis.",
  },
  "home.subtitle": {
    "pt-BR": "Colete menÃ§Ãµes reais, identifique criticidade, gere insights com IA e transforme ruÃ­do digital em decisÃµes comerciais claras.",
    "en-US": "Collect real mentions, identify criticality, generate AI insights, and turn digital noise into clear business decisions.",
  },
  "home.primaryCta": {
    "pt-BR": "ComeÃ§ar agora",
    "en-US": "Get started",
  },
  "home.secondaryCta": {
    "pt-BR": "Entrar na conta",
    "en-US": "Log in",
  },
  "home.metricMentions": {
    "pt-BR": "Fontes monitoradas",
    "en-US": "Monitored sources",
  },
  "home.metricMentionsValue": {
    "pt-BR": "Reclame Aqui Â· Reddit Â· YouTube Â· App Store Â· Google Play Â· Glassdoor Â· Trustpilot Â· Web",
    "en-US": "Reclame Aqui Â· Reddit Â· YouTube Â· App Store Â· Google Play Â· Glassdoor Â· Trustpilot Â· Web",
  },
  "home.metricInsights": {
    "pt-BR": "Insights acionÃ¡veis",
    "en-US": "Actionable insights",
  },
  "home.metricReports": {
    "pt-BR": "ExportaÃ§Ã£o executiva",
    "en-US": "Executive export",
  },
  "home.dashboardPreviewTitle": {
    "pt-BR": "Sinais de reputaÃ§Ã£o em tempo real",
    "en-US": "Real-time reputation signals",
  },
  "home.dashboardPreviewSubtitle": {
    "pt-BR": "Uma visÃ£o unificada de menÃ§Ãµes, riscos e oportunidades para acelerar respostas.",
    "en-US": "A unified view of mentions, risks, and opportunities to accelerate responses.",
  },
  "home.previewPositive": {
    "pt-BR": "Positivo",
    "en-US": "Positive",
  },
  "home.previewNeutral": {
    "pt-BR": "Neutro",
    "en-US": "Neutral",
  },
  "home.previewCritical": {
    "pt-BR": "CrÃ­tico",
    "en-US": "Critical",
  },
  "home.previewAction": {
    "pt-BR": "AÃ§Ã£o sugerida",
    "en-US": "Suggested action",
  },
  "home.previewActionText": {
    "pt-BR": "Priorizar respostas pÃºblicas e mapear causas recorrentes nas menÃ§Ãµes negativas.",
    "en-US": "Prioritize public responses and map recurring causes in negative mentions.",
  },
  "home.featuresTitle": {
    "pt-BR": "Tudo que um time precisa para operar reputaÃ§Ã£o com cadÃªncia.",
    "en-US": "Everything teams need to run reputation with cadence.",
  },
  "home.featureCollectionTitle": {
    "pt-BR": "Coleta nas fontes monitoradas",
    "en-US": "Collection on monitored sources",
  },
  "home.featureCollectionText": {
    "pt-BR": "Monitore as fontes ativas com coleta incremental.",
    "en-US": "Monitor active sources with incremental collection.",
  },
  "home.featureAiTitle": {
    "pt-BR": "Leitura de criticidade",
    "en-US": "Criticality reading",
  },
  "home.featureAiText": {
    "pt-BR": "Classifique sentimento, urgÃªncia, aspectos e prÃ³ximos passos com apoio da IA.",
    "en-US": "Classify sentiment, urgency, aspects, and next steps with AI support.",
  },
  "home.featureReportTitle": {
    "pt-BR": "RelatÃ³rios para decisÃ£o",
    "en-US": "Decision-ready reports",
  },
  "home.featureReportText": {
    "pt-BR": "Exporte CSV ou PDF para auditoria, reuniÃµes executivas e histÃ³rico da marca.",
    "en-US": "Export CSV or PDF for audits, executive meetings, and brand history.",
  },
  "home.workflowTitle": {
    "pt-BR": "Do sinal ao plano de aÃ§Ã£o em minutos.",
    "en-US": "From signal to action plan in minutes.",
  },
  "home.workflowSearchTitle": {
    "pt-BR": "1. Pesquise uma marca",
    "en-US": "1. Search a brand",
  },
  "home.workflowSearchText": {
    "pt-BR": "Defina fontes, perÃ­odo e localidade para iniciar uma coleta objetiva.",
    "en-US": "Choose sources, period, and location to start a focused collection.",
  },
  "home.workflowAnalyzeTitle": {
    "pt-BR": "2. Analise o impacto",
    "en-US": "2. Analyze impact",
  },
  "home.workflowAnalyzeText": {
    "pt-BR": "Veja distribuiÃ§Ã£o de sentimento, tÃ³picos recorrentes e menÃ§Ãµes recentes.",
    "en-US": "See sentiment distribution, recurring topics, and recent mentions.",
  },
  "home.workflowActTitle": {
    "pt-BR": "3. Aja com clareza",
    "en-US": "3. Act with clarity",
  },
  "home.workflowActText": {
    "pt-BR": "Gere insights, baixe relatÃ³rios e alinhe o time com prioridades.",
    "en-US": "Generate insights, download reports, and align the team around priorities.",
  },
  "home.plansTitle": {
    "pt-BR": "Planos preparados para evoluir com seu time.",
    "en-US": "Plans ready to evolve with your team.",
  },
  "home.plansSubtitle": {
    "pt-BR": "A contrataÃ§Ã£o real de planos serÃ¡ conectada em uma etapa futura do backend. Hoje, estes blocos orientam a proposta comercial.",
    "en-US": "Real plan checkout will be connected in a future backend step. For now, these blocks guide the commercial offer.",
  },
  "home.planStarter": {
    "pt-BR": "Starter",
    "en-US": "Starter",
  },
  "home.planStarterText": {
    "pt-BR": "Para primeiras buscas e validaÃ§Ã£o de reputaÃ§Ã£o.",
    "en-US": "For initial searches and reputation validation.",
  },
  "home.planGrowth": {
    "pt-BR": "Growth",
    "en-US": "Growth",
  },
  "home.planGrowthText": {
    "pt-BR": "Para operaÃ§Ã£o recorrente com relatÃ³rios e insights.",
    "en-US": "For recurring operations with reports and insights.",
  },
  "home.planEnterprise": {
    "pt-BR": "Enterprise",
    "en-US": "Enterprise",
  },
  "home.planEnterpriseText": {
    "pt-BR": "Para times que exigem governanÃ§a, integraÃ§Ãµes e suporte.",
    "en-US": "For teams that need governance, integrations, and support.",
  },
  "home.finalCtaTitle": {
    "pt-BR": "Pronto para transformar reputaÃ§Ã£o em vantagem comercial?",
    "en-US": "Ready to turn reputation into commercial advantage?",
  },
  "home.finalCtaText": {
    "pt-BR": "Crie sua conta e comece pela busca de marca para alimentar o dashboard.",
    "en-US": "Create your account and start with a brand search to populate the dashboard.",
  },
  "auth.loginTitle": {
    "pt-BR": "Entrar na plataforma",
    "en-US": "Log in to the platform",
  },
  "auth.loginSubtitle": {
    "pt-BR": "Acesse sua operaÃ§Ã£o de reputaÃ§Ã£o e continue de onde parou.",
    "en-US": "Access your reputation operation and pick up where you left off.",
  },
  "auth.loginButton": {
    "pt-BR": "Entrar",
    "en-US": "Log in",
  },
  "auth.loginLoading": {
    "pt-BR": "Autenticando...",
    "en-US": "Signing in...",
  },
  "auth.noAccount": {
    "pt-BR": "Ainda nÃ£o tem conta?",
    "en-US": "Do not have an account yet?",
  },
  "auth.hasAccount": {
    "pt-BR": "JÃ¡ tem conta?",
    "en-US": "Already have an account?",
  },
  "auth.registerTitle": {
    "pt-BR": "Criar conta",
    "en-US": "Create account",
  },
  "auth.registerSubtitle": {
    "pt-BR": "Configure seu acesso para comeÃ§ar a monitorar reputaÃ§Ã£o.",
    "en-US": "Set up your access to start monitoring reputation.",
  },
  "auth.registerButton": {
    "pt-BR": "Criar conta",
    "en-US": "Create account",
  },
  "auth.registerLoading": {
    "pt-BR": "Criando conta...",
    "en-US": "Creating account...",
  },
  "auth.registerSuccess": {
    "pt-BR": "Cadastro realizado com sucesso.",
    "en-US": "Account created successfully.",
  },
  "auth.loginLink": {
    "pt-BR": "Fazer login",
    "en-US": "Log in",
  },
  "auth.createLink": {
    "pt-BR": "Criar conta",
    "en-US": "Create account",
  },
  "auth.emailPlaceholder": {
    "pt-BR": "seu@email.com",
    "en-US": "you@example.com",
  },
  "auth.namePlaceholder": {
    "pt-BR": "Ana Silva",
    "en-US": "Alex Morgan",
  },
  "auth.phonePlaceholder": {
    "pt-BR": "(11) 99999-9999",
    "en-US": "+1 555 123 4567",
  },
  "auth.passwordPlaceholder": {
    "pt-BR": "Sua senha",
    "en-US": "Your password",
  },
  "auth.confirmPasswordPlaceholder": {
    "pt-BR": "Repita sua senha",
    "en-US": "Repeat your password",
  },
  "auth.requiredEmailPassword": {
    "pt-BR": "E-mail e senha sÃ£o obrigatÃ³rios.",
    "en-US": "Email and password are required.",
  },
  "auth.loginError": {
    "pt-BR": "Erro ao fazer login.",
    "en-US": "Unable to log in.",
  },
  "auth.loginMfaRequired": {
    "pt-BR": "CÃ³digo MFA necessÃ¡rio para concluir o login.",
    "en-US": "MFA code is required to complete sign-in.",
  },
  "auth.forgotPassword": {
    "pt-BR": "Esqueceu a senha?",
    "en-US": "Forgot password?",
  },
  "auth.backHome": {
    "pt-BR": "Voltar para o inÃ­cio",
    "en-US": "Back to home",
  },
  "auth.backToLogin": {
    "pt-BR": "Voltar para login",
    "en-US": "Back to login",
  },
  "auth.forgotTitle": {
    "pt-BR": "Recuperar senha",
    "en-US": "Recover password",
  },
  "auth.forgotSubtitle": {
    "pt-BR": "Informe seu e-mail para receber o link de redefiniÃ§Ã£o.",
    "en-US": "Enter your email to receive a password reset link.",
  },
  "auth.forgotButton": {
    "pt-BR": "Enviar link de recuperaÃ§Ã£o",
    "en-US": "Send recovery link",
  },
  "auth.forgotSuccess": {
    "pt-BR": "E-mail enviado com sucesso. Se o endereÃ§o estiver cadastrado, vocÃª receberÃ¡ instruÃ§Ãµes de recuperaÃ§Ã£o.",
    "en-US": "Email sent successfully. If the address exists, you will receive recovery instructions.",
  },
  "auth.resetTitle": {
    "pt-BR": "Redefinir senha",
    "en-US": "Reset password",
  },
  "auth.resetSubtitle": {
    "pt-BR": "Cadastre uma nova senha para sua conta.",
    "en-US": "Set a new password for your account.",
  },
  "auth.resetButton": {
    "pt-BR": "Salvar nova senha",
    "en-US": "Save new password",
  },
  "auth.resetSuccess": {
    "pt-BR": "Senha redefinida com sucesso.",
    "en-US": "Password reset successfully.",
  },
  "auth.resetInvalidToken": {
    "pt-BR": "Token de recuperaÃ§Ã£o invÃ¡lido ou ausente.",
    "en-US": "Recovery token is invalid or missing.",
  },
  "auth.newPassword": {
    "pt-BR": "Nova senha",
    "en-US": "New password",
  },
  "auth.confirmNewPassword": {
    "pt-BR": "Confirmar nova senha",
    "en-US": "Confirm new password",
  },
  "auth.nameRequired": {
    "pt-BR": "Nome Ã© obrigatÃ³rio.",
    "en-US": "Name is required.",
  },
  "auth.emailInvalid": {
    "pt-BR": "Informe um e-mail vÃ¡lido.",
    "en-US": "Enter a valid email.",
  },
  "auth.phoneRequired": {
    "pt-BR": "Telefone Ã© obrigatÃ³rio.",
    "en-US": "Phone is required.",
  },
  "auth.passwordMin": {
    "pt-BR": "Use no mÃ­nimo 8 caracteres.",
    "en-US": "Use at least 8 characters.",
  },
  "auth.passwordMismatch": {
    "pt-BR": "As senhas nÃ£o coincidem.",
    "en-US": "Passwords do not match.",
  },
  "auth.registerError": {
    "pt-BR": "Erro ao registrar. Tente novamente.",
    "en-US": "Unable to register. Try again.",
  },
  "auth.footer": {
    "pt-BR": "Â© 2026 Sentimento AI. Todos os direitos reservados.",
    "en-US": "Â© 2026 Sentimento AI. All rights reserved.",
  },
  "mfa.title": {
    "pt-BR": "VerificaÃ§Ã£o MFA",
    "en-US": "MFA verification",
  },
  "mfa.subtitle": {
    "pt-BR": "Digite o cÃ³digo de 6 dÃ­gitos do seu aplicativo autenticador.",
    "en-US": "Enter the 6-digit code from your authenticator app.",
  },
  "mfa.codeLabel": {
    "pt-BR": "CÃ³digo autenticador",
    "en-US": "Authenticator code",
  },
  "mfa.verify": {
    "pt-BR": "Verificar",
    "en-US": "Verify",
  },
  "mfa.verifying": {
    "pt-BR": "Verificando...",
    "en-US": "Verifying...",
  },
  "mfa.success": {
    "pt-BR": "VerificaÃ§Ã£o bem-sucedida.",
    "en-US": "Verification successful.",
  },
  "mfa.codeLength": {
    "pt-BR": "O cÃ³digo deve ter 6 dÃ­gitos.",
    "en-US": "The code must have 6 digits.",
  },
  "mfa.sessionExpired": {
    "pt-BR": "SessÃ£o expirada. FaÃ§a login novamente.",
    "en-US": "Session expired. Please log in again.",
  },
  "mfa.error": {
    "pt-BR": "Erro ao verificar cÃ³digo.",
    "en-US": "Unable to verify code.",
  },
  "mfa.help": {
    "pt-BR": "Use o cÃ³digo atual do autenticador vinculado Ã  sua conta.",
    "en-US": "Use the current code from the authenticator linked to your account.",
  },
  "protected.signInTitle": {
    "pt-BR": "Entre para continuar",
    "en-US": "Sign in to continue",
  },
  "protected.signInText": {
    "pt-BR": "O dashboard exige autenticaÃ§Ã£o. FaÃ§a login para acessar sua operaÃ§Ã£o.",
    "en-US": "This dashboard requires authentication. Log in to access your operation.",
  },
  "search.title": {
    "pt-BR": "Busca de menÃ§Ãµes",
    "en-US": "Mention search",
  },
  "search.subtitle": {
    "pt-BR": "Colete dados reais de mÃºltiplas fontes para alimentar dashboard, insights e relatÃ³rios.",
    "en-US": "Collect real data from multiple sources to power dashboards, insights, and reports.",
  },
  "search.goToDashboard": {
    "pt-BR": "Ir para dashboard",
    "en-US": "Go to dashboard",
  },
  "search.brandLabel": {
    "pt-BR": "Marca ou empresa",
    "en-US": "Brand or company",
  },
  "search.brandPlaceholder": {
    "pt-BR": "Digite o nome da marca",
    "en-US": "Enter the brand name",
  },
  "search.brandHelp": {
    "pt-BR": "A coleta utiliza integraÃ§Ãµes reais, sem preenchimento artificial.",
    "en-US": "Collection uses real integrations, with no artificial filler data.",
  },
  "search.sources": {
    "pt-BR": "Fontes",
    "en-US": "Sources",
  },
  "search.parameters": {
    "pt-BR": "ParÃ¢metros da busca",
    "en-US": "Search parameters",
  },
  "search.period": {
    "pt-BR": "PerÃ­odo",
    "en-US": "Period",
  },
  "search.last7": {
    "pt-BR": "Ãšltimos 7 dias",
    "en-US": "Last 7 days",
  },
  "search.last30": {
    "pt-BR": "Ãšltimos 30 dias",
    "en-US": "Last 30 days",
  },
  "search.last90": {
    "pt-BR": "Ãšltimos 90 dias",
    "en-US": "Last 90 days",
  },
  "search.lastYear": {
    "pt-BR": "Ãšltimo ano",
    "en-US": "Last year",
  },
  "search.locality": {
    "pt-BR": "Localidade",
    "en-US": "Location",
  },
  "search.localityPlaceholder": {
    "pt-BR": "Brasil, SÃ£o Paulo",
    "en-US": "United States, New York",
  },
  "search.summary": {
    "pt-BR": "Resumo da operaÃ§Ã£o",
    "en-US": "Operation summary",
  },
  "search.summaryBrand": {
    "pt-BR": "Marca",
    "en-US": "Brand",
  },
  "search.summarySources": {
    "pt-BR": "Fontes",
    "en-US": "Sources",
  },
  "search.summaryPeriod": {
    "pt-BR": "PerÃ­odo",
    "en-US": "Period",
  },
  "search.start": {
    "pt-BR": "Iniciar busca",
    "en-US": "Start search",
  },
  "search.lastRun": {
    "pt-BR": "Ãšltima execuÃ§Ã£o",
    "en-US": "Last run",
  },
  "search.found": {
    "pt-BR": "Encontradas",
    "en-US": "Found",
  },
  "search.selectSource": {
    "pt-BR": "Selecione pelo menos uma fonte para iniciar a busca.",
    "en-US": "Select at least one source to start the search.",
  },
  "search.emptyResult": {
    "pt-BR": "Busca concluida, mas nenhuma fonte retornou dados novos. Verifique Reddit, Reclame Aqui ou Web aberto.",
    "en-US": "Search completed, but no source returned new data. Check Reddit, Reclame Aqui, or open Web.",
  },
  "search.error": {
    "pt-BR": "Erro na busca.",
    "en-US": "Search failed.",
  },
  "search.scrapingMode": {
    "pt-BR": "Fontes operam via scraping interno com deduplicaÃ§Ã£o incremental no Mongo.",
    "en-US": "Sources run through internal scraping with incremental Mongo deduplication.",
  },
  "search.limitPerSource": {
    "pt-BR": "Limite por fonte",
    "en-US": "Per-source limit",
  },
  "search.limitHelp": {
    "pt-BR": "Para evitar sobrecarga, o scraping retorna poucos itens por fonte.",
    "en-US": "To avoid overload, scraping returns only a few items per source.",
  },
  "search.loadingHint": {
    "pt-BR": "Coletando dados por scraping. Isso pode levar alguns segundos.",
    "en-US": "Collecting data via scraping. This may take a few seconds.",
  },
  "search.resultsBySource": {
    "pt-BR": "Resultados por fonte",
    "en-US": "Results by source",
  },
  "search.noSourceResults": {
    "pt-BR": "Sem resultados para esta fonte.",
    "en-US": "No results for this source.",
  },
  "search.sourceErrors": {
    "pt-BR": "Falhas de fontes",
    "en-US": "Source failures",
  },
  "mention.urgencyFactors": {
    "pt-BR": "Fatores de risco detectados",
    "en-US": "Detected risk factors",
  },
  "mention.aspectSentiment": {
    "pt-BR": "Sentimento por aspecto",
    "en-US": "Aspect sentiment",
  },
  "mention.confidence": {
    "pt-BR": "ConfianÃ§a da IA",
    "en-US": "AI confidence",
  },
  "mention.confidenceHigh": {
    "pt-BR": "Alta confianÃ§a",
    "en-US": "High confidence",
  },
  "mention.confidenceMedium": {
    "pt-BR": "ConfianÃ§a moderada",
    "en-US": "Moderate confidence",
  },
  "mention.confidenceLow": {
    "pt-BR": "Baixa confianÃ§a â€” revisar",
    "en-US": "Low confidence â€” review",
  },
  "urgency.critical": {
    "pt-BR": "CrÃ­tica",
    "en-US": "Critical",
  },
  "urgency.high": {
    "pt-BR": "Alta",
    "en-US": "High",
  },
  "urgency.medium": {
    "pt-BR": "MÃ©dia",
    "en-US": "Medium",
  },
  "urgency.low": {
    "pt-BR": "Baixa",
    "en-US": "Low",
  },
  "dashboard.loading": {
    "pt-BR": "Carregando dashboard...",
    "en-US": "Loading dashboard...",
  },
  "metrics.title": {
    "pt-BR": "MÃ©tricas de ClassificaÃ§Ã£o",
    "en-US": "Classification Metrics",
  },
  "metrics.period": {
    "pt-BR": "PerÃ­odo",
    "en-US": "Period",
  },
  "metrics.totalAnalyzed": {
    "pt-BR": "Total analisado",
    "en-US": "Total analyzed",
  },
  "metrics.avgUrgency": {
    "pt-BR": "UrgÃªncia mÃ©dia",
    "en-US": "Average urgency",
  },
  "metrics.avgConfidence": {
    "pt-BR": "ConfianÃ§a do modelo",
    "en-US": "Model confidence",
  },
  "metrics.criticalCount": {
    "pt-BR": "MenÃ§Ãµes crÃ­ticas",
    "en-US": "Critical mentions",
  },
  "metrics.bySentiment": {
    "pt-BR": "DistribuiÃ§Ã£o de sentimento",
    "en-US": "Sentiment distribution",
  },
  "metrics.byCriticality": {
    "pt-BR": "DistribuiÃ§Ã£o por criticidade",
    "en-US": "Criticality distribution",
  },
  "metrics.topFactors": {
    "pt-BR": "Principais fatores de urgÃªncia",
    "en-US": "Top urgency factors",
  },
  "metrics.topNegativeAspects": {
    "pt-BR": "Aspectos mais negativos",
    "en-US": "Top negative aspects",
  },
  "metrics.sourcesCoverage": {
    "pt-BR": "Cobertura por fonte",
    "en-US": "Coverage by source",
  },
  "dashboard.subtitleBatch": {
    "pt-BR": "Batch atual: {batchId}",
    "en-US": "Current batch: {batchId}",
  },
  "dashboard.subtitleEmpty": {
    "pt-BR": "Execute uma busca para preencher indicadores e recomendaÃ§Ãµes da IA.",
    "en-US": "Run a search to populate indicators and AI recommendations.",
  },
  "dashboard.newSearch": {
    "pt-BR": "Nova busca",
    "en-US": "New search",
  },
  "dashboard.error": {
    "pt-BR": "Erro ao carregar dashboard.",
    "en-US": "Unable to load dashboard.",
  },
  "dashboard.emptyTitle": {
    "pt-BR": "Nenhum dado no dashboard",
    "en-US": "No dashboard data",
  },
  "dashboard.emptyText": {
    "pt-BR": "Inicie uma busca para gerar mÃ©tricas, grÃ¡ficos e insights de reputaÃ§Ã£o em tempo real.",
    "en-US": "Start a search to generate real-time reputation metrics, charts, and insights.",
  },
  "dashboard.emptyAction": {
    "pt-BR": "Iniciar busca",
    "en-US": "Start search",
  },
  "dashboard.metricMentions": {
    "pt-BR": "MenÃ§Ãµes",
    "en-US": "Mentions",
  },
  "dashboard.metricReputation": {
    "pt-BR": "ReputaÃ§Ã£o",
    "en-US": "Reputation",
  },
  "dashboard.metricCritical": {
    "pt-BR": "CrÃ­ticas",
    "en-US": "Critical",
  },
  "dashboard.metricUrgency": {
    "pt-BR": "UrgÃªncia mÃ©dia",
    "en-US": "Avg. urgency",
  },
  "dashboard.sentiments": {
    "pt-BR": "Sentimentos",
    "en-US": "Sentiments",
  },
  "dashboard.sources": {
    "pt-BR": "Fontes",
    "en-US": "Sources",
  },
  "dashboard.aspects": {
    "pt-BR": "Aspectos mais citados",
    "en-US": "Most cited aspects",
  },
  "dashboard.noAspects": {
    "pt-BR": "Nenhum aspecto detectado.",
    "en-US": "No aspects detected.",
  },
  "dashboard.recentMentions": {
    "pt-BR": "MenÃ§Ãµes recentes",
    "en-US": "Recent mentions",
  },
  "analysis.title": {
    "pt-BR": "Insights de IA",
    "en-US": "AI insights",
  },
  "analysis.subtitle": {
    "pt-BR": "GestÃ£o de insights gerados a partir dos lotes processados no pipeline de menÃ§Ãµes.",
    "en-US": "Manage insights generated from batches processed in the mention pipeline.",
  },
  "analysis.generate": {
    "pt-BR": "Gerar insight",
    "en-US": "Generate insight",
  },
  "analysis.generating": {
    "pt-BR": "Gerando...",
    "en-US": "Generating...",
  },
  "analysis.showArchived": {
    "pt-BR": "Mostrar insights arquivados",
    "en-US": "Show archived insights",
  },
  "analysis.loading": {
    "pt-BR": "Carregando insights...",
    "en-US": "Loading insights...",
  },
  "analysis.loadError": {
    "pt-BR": "Erro ao carregar insights.",
    "en-US": "Unable to load insights.",
  },
  "analysis.generateError": {
    "pt-BR": "Erro ao gerar insight.",
    "en-US": "Unable to generate insight.",
  },
  "analysis.actionError": {
    "pt-BR": "Erro ao executar aÃ§Ã£o no insight.",
    "en-US": "Unable to run insight action.",
  },
  "analysis.emptyTitle": {
    "pt-BR": "Nenhum insight encontrado",
    "en-US": "No insights found",
  },
  "analysis.emptyText": {
    "pt-BR": "Processe menÃ§Ãµes no pipeline e clique em gerar insight para criar o primeiro.",
    "en-US": "Process mentions in the pipeline and generate the first insight.",
  },
  "analysis.emptyAction": {
    "pt-BR": "Gerar agora",
    "en-US": "Generate now",
  },
  "analysis.untitled": {
    "pt-BR": "Insight sem resumo",
    "en-US": "Insight without summary",
  },
  "analysis.undefinedTrend": {
    "pt-BR": "indefinido",
    "en-US": "undefined",
  },
  "analysis.batch": {
    "pt-BR": "batch",
    "en-US": "batch",
  },
  "analysis.trigger": {
    "pt-BR": "gatilho",
    "en-US": "trigger",
  },
  "analysis.manual": {
    "pt-BR": "manual",
    "en-US": "manual",
  },
  "analysis.archived": {
    "pt-BR": "arquivado",
    "en-US": "archived",
  },
  "analysis.sentimentOverview": {
    "pt-BR": "VisÃ£o de sentimento",
    "en-US": "Sentiment overview",
  },
  "analysis.noSentimentOverview": {
    "pt-BR": "Sem visÃ£o consolidada.",
    "en-US": "No consolidated overview.",
  },
  "analysis.risks": {
    "pt-BR": "Riscos",
    "en-US": "Risks",
  },
  "analysis.noRisks": {
    "pt-BR": "Sem riscos mapeados.",
    "en-US": "No mapped risks.",
  },
  "analysis.actions": {
    "pt-BR": "AÃ§Ãµes recomendadas",
    "en-US": "Recommended actions",
  },
  "analysis.noActions": {
    "pt-BR": "Sem aÃ§Ãµes recomendadas.",
    "en-US": "No recommended actions.",
  },
  "analysis.guidance": {
    "pt-BR": "Direcionamento de decisÃ£o",
    "en-US": "Decision guidance",
  },
  "analysis.confidenceTooltip": {
    "pt-BR": "Este score indica a certeza mÃ©dia do modelo ao classificar as menÃ§Ãµes que geraram este insight.",
    "en-US": "This score indicates the model's average certainty when classifying mentions that generated this insight.",
  },
  "analysis.noGuidance": {
    "pt-BR": "Sem direcionamento disponÃ­vel.",
    "en-US": "No guidance available.",
  },
  "analysis.regenerate": {
    "pt-BR": "Regenerar",
    "en-US": "Regenerate",
  },
  "analysis.archive": {
    "pt-BR": "Arquivar",
    "en-US": "Archive",
  },
  "analysis.delete": {
    "pt-BR": "Apagar",
    "en-US": "Delete",
  },
  "analysis.dateUnavailable": {
    "pt-BR": "Data indisponÃ­vel",
    "en-US": "Date unavailable",
  },
  "analysis.dateInvalid": {
    "pt-BR": "Data invÃ¡lida",
    "en-US": "Invalid date",
  },
  "reports.title": {
    "pt-BR": "RelatÃ³rios e exportaÃ§Ãµes",
    "en-US": "Reports and exports",
  },
  "reports.subtitle": {
    "pt-BR": "Exporte dados consolidados para auditoria, compartilhamento executivo e histÃ³rico de reputaÃ§Ã£o.",
    "en-US": "Export consolidated data for audits, executive sharing, and reputation history.",
  },
  "reports.csvTitle": {
    "pt-BR": "ExportaÃ§Ã£o CSV",
    "en-US": "CSV export",
  },
  "reports.csvText": {
    "pt-BR": "Arquivo tabular com marca, fonte, sentimento, criticidade, aspectos e texto da menÃ§Ã£o.",
    "en-US": "Tabular file with brand, source, sentiment, criticality, aspects, and mention text.",
  },
  "reports.csvButton": {
    "pt-BR": "Baixar CSV",
    "en-US": "Download CSV",
  },
  "reports.pdfTitle": {
    "pt-BR": "RelatÃ³rio PDF",
    "en-US": "PDF report",
  },
  "reports.pdfText": {
    "pt-BR": "Resumo executivo com mÃ©tricas agregadas e lista de menÃ§Ãµes crÃ­ticas e recentes.",
    "en-US": "Executive summary with aggregated metrics and critical or recent mentions.",
  },
  "reports.pdfButton": {
    "pt-BR": "Baixar PDF",
    "en-US": "Download PDF",
  },
  "reports.error": {
    "pt-BR": "Erro ao gerar relatÃ³rio.",
    "en-US": "Unable to generate report.",
  },
  "settings.title": {
    "pt-BR": "ConfiguraÃ§Ãµes",
    "en-US": "Settings",
  },
  "settings.subtitle": {
    "pt-BR": "Gerencie perfil, aparÃªncia e seguranÃ§a da conta com salvamento explÃ­cito.",
    "en-US": "Manage profile, appearance, and account security with explicit save.",
  },
  "settings.theme": {
    "pt-BR": "Tema",
    "en-US": "Theme",
  },
  "settings.language": {
    "pt-BR": "Idioma",
    "en-US": "Language",
  },
  "settings.threshold": {
    "pt-BR": "Limiar mÃ­nimo da LLM",
    "en-US": "LLM minimum threshold",
  },
  "settings.save": {
    "pt-BR": "Salvar configuraÃ§Ãµes",
    "en-US": "Save settings",
  },
  "settings.saved": {
    "pt-BR": "ConfiguraÃ§Ãµes salvas.",
    "en-US": "Settings saved.",
  },
  "settings.saveError": {
    "pt-BR": "Falha ao salvar configuraÃ§Ãµes.",
    "en-US": "Unable to save settings.",
  },
  "settings.thresholdHelp": {
    "pt-BR": "Quantidade mÃ­nima de comentÃ¡rios para acionar geraÃ§Ã£o automÃ¡tica de insight por LLM.",
    "en-US": "Minimum number of comments required before automatic LLM insight generation.",
  },
  "settings.activeTheme": {
    "pt-BR": "Tema ativo",
    "en-US": "Active theme",
  },
  "settings.activeLanguage": {
    "pt-BR": "Idioma ativo",
    "en-US": "Active language",
  },
  "settings.currentThreshold": {
    "pt-BR": "Limiar atual",
    "en-US": "Current threshold",
  },
  "settings.lastUpdate": {
    "pt-BR": "Ãšltima atualizaÃ§Ã£o",
    "en-US": "Last update",
  },
  "settings.mfaTitle": {
    "pt-BR": "AutenticaÃ§Ã£o multifator (MFA)",
    "en-US": "Multi-factor authentication (MFA)",
  },
  "settings.mfaSubtitle": {
    "pt-BR": "Aumente a seguranÃ§a da conta com cÃ³digo de aplicativo autenticador.",
    "en-US": "Increase account security with an authenticator app code.",
  },
  "settings.mfaEnabled": {
    "pt-BR": "MFA habilitado",
    "en-US": "MFA enabled",
  },
  "settings.mfaDisabled": {
    "pt-BR": "MFA desabilitado",
    "en-US": "MFA disabled",
  },
  "settings.mfaSetupButton": {
    "pt-BR": "Configurar MFA",
    "en-US": "Set up MFA",
  },
  "settings.mfaSetupReady": {
    "pt-BR": "QR Code gerado. Escaneie e confirme com o cÃ³digo de 6 dÃ­gitos.",
    "en-US": "QR Code generated. Scan it and confirm with the 6-digit code.",
  },
  "settings.mfaSetupError": {
    "pt-BR": "NÃ£o foi possÃ­vel iniciar a configuraÃ§Ã£o de MFA.",
    "en-US": "Unable to start MFA setup.",
  },
  "settings.mfaSetupHelp": {
    "pt-BR": "Escaneie o QR Code no autenticador (Google Authenticator, Authy, etc.).",
    "en-US": "Scan the QR code in your authenticator app (Google Authenticator, Authy, etc.).",
  },
  "settings.mfaSecret": {
    "pt-BR": "Chave secreta",
    "en-US": "Secret key",
  },
  "settings.mfaQrAlt": {
    "pt-BR": "QR Code para ativar MFA",
    "en-US": "QR Code to enable MFA",
  },
  "settings.mfaEnableButton": {
    "pt-BR": "Habilitar MFA",
    "en-US": "Enable MFA",
  },
  "settings.mfaEnableError": {
    "pt-BR": "NÃ£o foi possÃ­vel habilitar o MFA.",
    "en-US": "Unable to enable MFA.",
  },
  "settings.mfaEnabledSuccess": {
    "pt-BR": "MFA habilitado com sucesso.",
    "en-US": "MFA enabled successfully.",
  },
  "settings.mfaDisableHelp": {
    "pt-BR": "Para desabilitar o MFA, confirme sua senha atual.",
    "en-US": "To disable MFA, confirm your current password.",
  },
  "settings.mfaDisablePasswordPlaceholder": {
    "pt-BR": "Digite sua senha atual",
    "en-US": "Enter your current password",
  },
  "settings.mfaDisablePasswordRequired": {
    "pt-BR": "Informe sua senha para desabilitar o MFA.",
    "en-US": "Enter your password to disable MFA.",
  },
  "settings.mfaDisableButton": {
    "pt-BR": "Desabilitar MFA",
    "en-US": "Disable MFA",
  },
  "settings.mfaDisableError": {
    "pt-BR": "NÃ£o foi possÃ­vel desabilitar o MFA.",
    "en-US": "Unable to disable MFA.",
  },
  "settings.mfaDisabledSuccess": {
    "pt-BR": "MFA desabilitado com sucesso.",
    "en-US": "MFA disabled successfully.",
  },
  "settings.profileTab": {
    "pt-BR": "Perfil",
    "en-US": "Profile",
  },
  "settings.appearanceTab": {
    "pt-BR": "AparÃªncia",
    "en-US": "Appearance",
  },
  "settings.securityTab": {
    "pt-BR": "SeguranÃ§a",
    "en-US": "Security",
  },
  "settings.mfaTab": {
    "pt-BR": "MFA",
    "en-US": "MFA",
  },
  "settings.profileTitle": {
    "pt-BR": "Editar perfil",
    "en-US": "Edit profile",
  },
  "settings.profileSubtitle": {
    "pt-BR": "Atualize dados bÃ¡sicos da sua conta. As mudanÃ§as sÃ³ serÃ£o aplicadas ao salvar.",
    "en-US": "Update basic account data. Changes are applied only after saving.",
  },
  "settings.username": {
    "pt-BR": "Nome de usuÃ¡rio",
    "en-US": "Username",
  },
  "settings.emailReadonly": {
    "pt-BR": "O e-mail Ã© apenas leitura nesta versÃ£o.",
    "en-US": "Email is read-only in this version.",
  },
  "settings.appearanceTitle": {
    "pt-BR": "PreferÃªncias de aparÃªncia",
    "en-US": "Appearance preferences",
  },
  "settings.appearanceSubtitle": {
    "pt-BR": "Escolha tema e limiar da LLM. Nada Ã© salvo atÃ© confirmar.",
    "en-US": "Choose theme and LLM threshold. Nothing is saved until confirmed.",
  },
  "settings.darkMode": {
    "pt-BR": "Modo escuro",
    "en-US": "Dark mode",
  },
  "settings.darkModeHelp": {
    "pt-BR": "Ative para usar a interface com contraste escuro.",
    "en-US": "Enable to use the interface with dark contrast.",
  },
  "settings.securityTitle": {
    "pt-BR": "Alterar senha",
    "en-US": "Change password",
  },
  "settings.securitySubtitle": {
    "pt-BR": "Informe sua senha atual e defina uma nova senha segura.",
    "en-US": "Provide your current password and set a new secure password.",
  },
  "settings.currentPassword": {
    "pt-BR": "Senha atual",
    "en-US": "Current password",
  },
  "settings.newPassword": {
    "pt-BR": "Nova senha",
    "en-US": "New password",
  },
  "settings.confirmNewPassword": {
    "pt-BR": "Confirmar nova senha",
    "en-US": "Confirm new password",
  },
  "settings.passwordHelp": {
    "pt-BR": "Se preencher um campo de senha, preencha os trÃªs campos antes de salvar.",
    "en-US": "If you fill one password field, fill all three before saving.",
  },
  "settings.fillAllPasswordFields": {
    "pt-BR": "Preencha todos os campos de senha para concluir a alteraÃ§Ã£o.",
    "en-US": "Fill all password fields to complete the change.",
  },
  "settings.passwordMismatch": {
    "pt-BR": "A confirmaÃ§Ã£o da nova senha nÃ£o confere.",
    "en-US": "New password confirmation does not match.",
  },
  "settings.unsavedChanges": {
    "pt-BR": "Existem alteraÃ§Ãµes pendentes. Clique em salvar para aplicar.",
    "en-US": "There are pending changes. Click save to apply.",
  },
  "settings.noPendingChanges": {
    "pt-BR": "Nenhuma alteraÃ§Ã£o pendente.",
    "en-US": "No pending changes.",
  },
  "settings.saveAll": {
    "pt-BR": "Salvar alteraÃ§Ãµes",
    "en-US": "Save changes",
  },
  "settings.noChanges": {
    "pt-BR": "Nenhuma alteraÃ§Ã£o para salvar.",
    "en-US": "No changes to save.",
  },
  "settings.profileLoadError": {
    "pt-BR": "Falha ao carregar dados do perfil.",
    "en-US": "Unable to load profile data.",
  },
  "theme.light": {
    "pt-BR": "Claro",
    "en-US": "Light",
  },
  "theme.dark": {
    "pt-BR": "Escuro",
    "en-US": "Dark",
  },
  "chat.title": {
    "pt-BR": "Assistente de Reputacao",
    "en-US": "Reputation Assistant",
  },
  "chat.placeholder": {
    "pt-BR": "Pergunte sobre dashboard, insights, navegaÃ§Ã£o e configuraÃ§Ãµes...",
    "en-US": "Ask about dashboard, insights, navigation, and settings...",
  },
  "chat.domainLocked": {
    "pt-BR": "Contexto autorizado",
    "en-US": "Authorized context",
  },
  "chat.refreshContext": {
    "pt-BR": "Atualizar contexto",
    "en-US": "Refresh context",
  },
  "chat.newConversation": {
    "pt-BR": "Nova conversa",
    "en-US": "New conversation",
  },
  "chat.openError": {
    "pt-BR": "Falha ao abrir chat.",
    "en-US": "Unable to open chat.",
  },
  "chat.loadError": {
    "pt-BR": "Falha ao carregar mensagens.",
    "en-US": "Unable to load messages.",
  },
  "chat.createError": {
    "pt-BR": "Falha ao criar nova conversa.",
    "en-US": "Unable to create a new conversation.",
  },
  "chat.sendError": {
    "pt-BR": "Erro ao enviar mensagem.",
    "en-US": "Unable to send message.",
  },
  "chat.threadFallback": {
    "pt-BR": "Nova conversa",
    "en-US": "New conversation",
  },
  "chat.launcher": {
    "pt-BR": "Chat IA",
    "en-US": "AI chat",
  },
  "chat.promptCritical": {
    "pt-BR": "Como interpreto as menÃ§Ãµes crÃ­ticas?",
    "en-US": "How do I read critical mentions?",
  },
  "chat.promptSettings": {
    "pt-BR": "Onde altero idioma e tema?",
    "en-US": "Where can I change language settings?",
  },
  "chat.promptScore": {
    "pt-BR": "Como o score de reputaÃ§Ã£o Ã© calculado?",
    "en-US": "How is the reputation score calculated?",
  },
  "chat.emptyState": {
    "pt-BR": "Posso ajudar com funcionalidades do Sentimento AI e dados autorizados da sua conta.",
    "en-US": "I can help with Sentimento AI features and your authorized account data.",
  },
  "notFound.title": {
    "pt-BR": "PÃ¡gina nÃ£o encontrada",
    "en-US": "Page not found",
  },
  "notFound.text": {
    "pt-BR": "A pÃ¡gina que vocÃª procura nÃ£o existe ou foi movida.",
    "en-US": "The page you are looking for does not exist or was moved.",
  },
  "errorBoundary.title": {
    "pt-BR": "Ocorreu um erro inesperado.",
    "en-US": "An unexpected error occurred.",
  },
  "errorBoundary.reload": {
    "pt-BR": "Recarregar pÃ¡gina",
    "en-US": "Reload page",
  },
  "api.requestError": {
    "pt-BR": "Erro na requisiÃ§Ã£o",
    "en-US": "Request failed",
  },
  "api.authExpired": {
    "pt-BR": "Sua sessÃ£o expirou. FaÃ§a login novamente.",
    "en-US": "Your session has expired. Please sign in again.",
  },
  "api.timeout": {
    "pt-BR": "A requisiÃ§Ã£o excedeu o tempo limite. Tente novamente.",
    "en-US": "The request timed out. Please try again.",
  },
  "api.aiUnavailable": {
    "pt-BR": "A IA estÃ¡ temporariamente indisponÃ­vel. Tente novamente em instantes.",
    "en-US": "AI is temporarily unavailable. Please try again shortly.",
  },
  "api.aiFallback": {
    "pt-BR": "Nao foi possivel concluir a resposta de IA no momento. Tente novamente em instantes.",
    "en-US": "Unable to complete the AI response right now. Please try again shortly.",
  },
  "api.reportError": {
    "pt-BR": "Erro ao gerar relatÃ³rio",
    "en-US": "Unable to generate report",
  },
  "api.missingBaseUrl": {
    "pt-BR": "VITE_API_URL nÃ£o estÃ¡ definido. Configure o endpoint pÃºblico do backend.",
    "en-US": "VITE_API_URL is not set. Configure the backend public endpoint.",
  },
} as const satisfies Record<string, LocaleMap>;

export type TranslationKey = keyof typeof TRANSLATIONS;

export function translate(locale: AppLocale, key: TranslationKey, values?: TranslationValues) {
  const template = TRANSLATIONS[key][locale] ?? TRANSLATIONS[key]["pt-BR"];

  if (!values) return template;

  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = values[name];
    return value === undefined ? match : String(value);
  });
}

