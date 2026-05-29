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
    "pt-BR": "Inteligência de reputação com IA",
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
    "pt-BR": "Indisponível",
    "en-US": "Unavailable",
  },
  "common.none": {
    "pt-BR": "Nenhum",
    "en-US": "None",
  },
  "common.goHome": {
    "pt-BR": "Ir para a página inicial",
    "en-US": "Go home",
  },
  "common.language": {
    "pt-BR": "Idioma",
    "en-US": "Language",
  },
  "common.portugueseBrazil": {
    "pt-BR": "Português (Brasil)",
    "en-US": "Portuguese (Brazil)",
  },
  "common.englishUs": {
    "pt-BR": "Inglês (EUA)",
    "en-US": "English (US)",
  },
  "common.days": {
    "pt-BR": "{count} dias",
    "en-US": "{count} days",
  },
  "nav.home": {
    "pt-BR": "Início",
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
    "pt-BR": "Relatórios",
    "en-US": "Reports",
  },
  "nav.metrics": {
    "pt-BR": "Métricas",
    "en-US": "Metrics",
  },
  "nav.settings": {
    "pt-BR": "Configurações",
    "en-US": "Settings",
  },
  "nav.alerts": {
    "pt-BR": "Alertas",
    "en-US": "Alerts",
  },
  "nav.privacy": {
    "pt-BR": "Privacidade",
    "en-US": "Privacy",
  },
  "nav.diagnostics": {
    "pt-BR": "Diagnóstico",
    "en-US": "Diagnostics",
  },
  "nav.admin": {
    "pt-BR": "Administração",
    "en-US": "Admin",
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
    "pt-BR": "Validando sessão...",
    "en-US": "Validating session...",
  },
  "home.badge": {
    "pt-BR": "Monitoramento de reputação para times comerciais e executivos",
    "en-US": "Reputation monitoring for commercial and executive teams",
  },
  "home.title": {
    "pt-BR": "Entenda a reputação da sua marca antes que pequenos sinais virem crise.",
    "en-US": "Understand your brand reputation before small signals become a crisis.",
  },
  "home.subtitle": {
    "pt-BR": "Colete menções reais, identifique criticidade, gere insights com IA e transforme ruído digital em decisões comerciais claras.",
    "en-US": "Collect real mentions, identify criticality, generate AI insights, and turn digital noise into clear business decisions.",
  },
  "home.primaryCta": {
    "pt-BR": "Começar agora",
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
    "pt-BR": "Reclame Aqui · Reddit · YouTube · App Store · Google Play · Glassdoor · Trustpilot · Web",
    "en-US": "Reclame Aqui · Reddit · YouTube · App Store · Google Play · Glassdoor · Trustpilot · Web",
  },
  "home.metricInsights": {
    "pt-BR": "Insights acionáveis",
    "en-US": "Actionable insights",
  },
  "home.metricReports": {
    "pt-BR": "Exportação executiva",
    "en-US": "Executive export",
  },
  "home.dashboardPreviewTitle": {
    "pt-BR": "Sinais de reputação em tempo real",
    "en-US": "Real-time reputation signals",
  },
  "home.dashboardPreviewSubtitle": {
    "pt-BR": "Uma visão unificada de menções, riscos e oportunidades para acelerar respostas.",
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
    "pt-BR": "Crítico",
    "en-US": "Critical",
  },
  "home.previewAction": {
    "pt-BR": "Ação sugerida",
    "en-US": "Suggested action",
  },
  "home.previewActionText": {
    "pt-BR": "Priorizar respostas públicas e mapear causas recorrentes nas menções negativas.",
    "en-US": "Prioritize public responses and map recurring causes in negative mentions.",
  },
  "home.featuresTitle": {
    "pt-BR": "Tudo que um time precisa para operar reputação com cadência.",
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
    "pt-BR": "Classifique sentimento, urgência, aspectos e próximos passos com apoio da IA.",
    "en-US": "Classify sentiment, urgency, aspects, and next steps with AI support.",
  },
  "home.featureReportTitle": {
    "pt-BR": "Relatórios para decisão",
    "en-US": "Decision-ready reports",
  },
  "home.featureReportText": {
    "pt-BR": "Exporte CSV ou PDF para auditoria, reuniões executivas e histórico da marca.",
    "en-US": "Export CSV or PDF for audits, executive meetings, and brand history.",
  },
  "home.workflowTitle": {
    "pt-BR": "Do sinal ao plano de ação em minutos.",
    "en-US": "From signal to action plan in minutes.",
  },
  "home.workflowSearchTitle": {
    "pt-BR": "1. Pesquise uma marca",
    "en-US": "1. Search a brand",
  },
  "home.workflowSearchText": {
    "pt-BR": "Defina fontes, período e localidade para iniciar uma coleta objetiva.",
    "en-US": "Choose sources, period, and location to start a focused collection.",
  },
  "home.workflowAnalyzeTitle": {
    "pt-BR": "2. Analise o impacto",
    "en-US": "2. Analyze impact",
  },
  "home.workflowAnalyzeText": {
    "pt-BR": "Veja distribuição de sentimento, tópicos recorrentes e menções recentes.",
    "en-US": "See sentiment distribution, recurring topics, and recent mentions.",
  },
  "home.workflowActTitle": {
    "pt-BR": "3. Aja com clareza",
    "en-US": "3. Act with clarity",
  },
  "home.workflowActText": {
    "pt-BR": "Gere insights, baixe relatórios e alinhe o time com prioridades.",
    "en-US": "Generate insights, download reports, and align the team around priorities.",
  },
  "home.plansTitle": {
    "pt-BR": "Planos preparados para evoluir com seu time.",
    "en-US": "Plans ready to evolve with your team.",
  },
  "home.plansSubtitle": {
    "pt-BR": "A contratação real de planos será conectada em uma etapa futura do backend. Hoje, estes blocos orientam a proposta comercial.",
    "en-US": "Real plan checkout will be connected in a future backend step. For now, these blocks guide the commercial offer.",
  },
  "home.planStarter": {
    "pt-BR": "Starter",
    "en-US": "Starter",
  },
  "home.planStarterText": {
    "pt-BR": "Para primeiras buscas e validação de reputação.",
    "en-US": "For initial searches and reputation validation.",
  },
  "home.planGrowth": {
    "pt-BR": "Growth",
    "en-US": "Growth",
  },
  "home.planGrowthText": {
    "pt-BR": "Para operação recorrente com relatórios e insights.",
    "en-US": "For recurring operations with reports and insights.",
  },
  "home.planEnterprise": {
    "pt-BR": "Enterprise",
    "en-US": "Enterprise",
  },
  "home.planEnterpriseText": {
    "pt-BR": "Para times que exigem governança, integrações e suporte.",
    "en-US": "For teams that need governance, integrations, and support.",
  },
  "home.finalCtaTitle": {
    "pt-BR": "Pronto para transformar reputação em vantagem comercial?",
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
    "pt-BR": "Acesse sua operação de reputação e continue de onde parou.",
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
    "pt-BR": "Ainda não tem conta?",
    "en-US": "Do not have an account yet?",
  },
  "auth.hasAccount": {
    "pt-BR": "Já tem conta?",
    "en-US": "Already have an account?",
  },
  "auth.registerTitle": {
    "pt-BR": "Criar conta",
    "en-US": "Create account",
  },
  "auth.registerSubtitle": {
    "pt-BR": "Configure seu acesso para começar a monitorar reputação.",
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
    "pt-BR": "E-mail e senha são obrigatórios.",
    "en-US": "Email and password are required.",
  },
  "auth.loginError": {
    "pt-BR": "Erro ao fazer login.",
    "en-US": "Unable to log in.",
  },
  "auth.loginMfaRequired": {
    "pt-BR": "Código MFA necessário para concluir o login.",
    "en-US": "MFA code is required to complete sign-in.",
  },
  "auth.forgotPassword": {
    "pt-BR": "Esqueceu a senha?",
    "en-US": "Forgot password?",
  },
  "auth.backHome": {
    "pt-BR": "Voltar para o início",
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
    "pt-BR": "Informe seu e-mail para receber o link de redefinição.",
    "en-US": "Enter your email to receive a password reset link.",
  },
  "auth.forgotButton": {
    "pt-BR": "Enviar link de recuperação",
    "en-US": "Send recovery link",
  },
  "auth.forgotSuccess": {
    "pt-BR": "E-mail enviado com sucesso. Se o endereço estiver cadastrado, você receberá instruções de recuperação.",
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
    "pt-BR": "Token de recuperação inválido ou ausente.",
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
    "pt-BR": "Nome é obrigatório.",
    "en-US": "Name is required.",
  },
  "auth.emailInvalid": {
    "pt-BR": "Informe um e-mail válido.",
    "en-US": "Enter a valid email.",
  },
  "auth.phoneRequired": {
    "pt-BR": "Telefone é obrigatório.",
    "en-US": "Phone is required.",
  },
  "auth.passwordMin": {
    "pt-BR": "Use no mínimo 8 caracteres.",
    "en-US": "Use at least 8 characters.",
  },
  "auth.passwordMismatch": {
    "pt-BR": "As senhas não coincidem.",
    "en-US": "Passwords do not match.",
  },
  "auth.registerError": {
    "pt-BR": "Erro ao registrar. Tente novamente.",
    "en-US": "Unable to register. Try again.",
  },
  "auth.footer": {
    "pt-BR": "© 2026 Sentimento AI. Todos os direitos reservados.",
    "en-US": "© 2026 Sentimento AI. All rights reserved.",
  },
  "mfa.title": {
    "pt-BR": "Verificação MFA",
    "en-US": "MFA verification",
  },
  "mfa.subtitle": {
    "pt-BR": "Digite o código de 6 dígitos do seu aplicativo autenticador.",
    "en-US": "Enter the 6-digit code from your authenticator app.",
  },
  "mfa.codeLabel": {
    "pt-BR": "Código autenticador",
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
    "pt-BR": "Verificação bem-sucedida.",
    "en-US": "Verification successful.",
  },
  "mfa.codeLength": {
    "pt-BR": "O código deve ter 6 dígitos.",
    "en-US": "The code must have 6 digits.",
  },
  "mfa.sessionExpired": {
    "pt-BR": "Sessão expirada. Faça login novamente.",
    "en-US": "Session expired. Please log in again.",
  },
  "mfa.error": {
    "pt-BR": "Erro ao verificar código.",
    "en-US": "Unable to verify code.",
  },
  "mfa.help": {
    "pt-BR": "Use o código atual do autenticador vinculado à sua conta.",
    "en-US": "Use the current code from the authenticator linked to your account.",
  },
  "protected.signInTitle": {
    "pt-BR": "Entre para continuar",
    "en-US": "Sign in to continue",
  },
  "protected.signInText": {
    "pt-BR": "O dashboard exige autenticação. Faça login para acessar sua operação.",
    "en-US": "This dashboard requires authentication. Log in to access your operation.",
  },
  "search.title": {
    "pt-BR": "Busca de menções",
    "en-US": "Mention search",
  },
  "search.subtitle": {
    "pt-BR": "Colete dados reais de múltiplas fontes para alimentar dashboard, insights e relatórios.",
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
    "pt-BR": "A coleta utiliza integrações reais, sem preenchimento artificial.",
    "en-US": "Collection uses real integrations, with no artificial filler data.",
  },
  "search.sources": {
    "pt-BR": "Fontes",
    "en-US": "Sources",
  },
  "search.parameters": {
    "pt-BR": "Parâmetros da busca",
    "en-US": "Search parameters",
  },
  "search.period": {
    "pt-BR": "Período",
    "en-US": "Period",
  },
  "search.last7": {
    "pt-BR": "Últimos 7 dias",
    "en-US": "Last 7 days",
  },
  "search.last30": {
    "pt-BR": "Últimos 30 dias",
    "en-US": "Last 30 days",
  },
  "search.last90": {
    "pt-BR": "Últimos 90 dias",
    "en-US": "Last 90 days",
  },
  "search.lastYear": {
    "pt-BR": "Último ano",
    "en-US": "Last year",
  },
  "search.locality": {
    "pt-BR": "Localidade",
    "en-US": "Location",
  },
  "search.localityPlaceholder": {
    "pt-BR": "Brasil, São Paulo",
    "en-US": "United States, New York",
  },
  "search.summary": {
    "pt-BR": "Resumo da operação",
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
    "pt-BR": "Período",
    "en-US": "Period",
  },
  "search.start": {
    "pt-BR": "Iniciar busca",
    "en-US": "Start search",
  },
  "search.lastRun": {
    "pt-BR": "Última execução",
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
  "search.canonicalMode": {
    "pt-BR": "Busca executada apenas pelo fluxo canônico de importacao do secundario para o primario.",
    "en-US": "Search runs only through the canonical import flow from secondary to primary.",
  },
  "search.limitPerSource": {
    "pt-BR": "Limite por fonte",
    "en-US": "Per-source limit",
  },
  "search.limitHelp": {
    "pt-BR": "Define o teto de menções consideradas por fonte na operacao.",
    "en-US": "Sets the maximum mentions considered per source in the operation.",
  },
  "search.loadingHint": {
    "pt-BR": "Executando busca e importando dados. Isso pode levar alguns segundos.",
    "en-US": "Running search and importing data. This may take a few seconds.",
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
    "pt-BR": "Confiança da IA",
    "en-US": "AI confidence",
  },
  "mention.confidenceHigh": {
    "pt-BR": "Alta confiança",
    "en-US": "High confidence",
  },
  "mention.confidenceMedium": {
    "pt-BR": "Confiança moderada",
    "en-US": "Moderate confidence",
  },
  "mention.confidenceLow": {
    "pt-BR": "Baixa confiança - revisar",
    "en-US": "Low confidence - review",
  },
  "urgency.critical": {
    "pt-BR": "Crítica",
    "en-US": "Critical",
  },
  "urgency.high": {
    "pt-BR": "Alta",
    "en-US": "High",
  },
  "urgency.medium": {
    "pt-BR": "Média",
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
    "pt-BR": "Métricas de Classificação",
    "en-US": "Classification Metrics",
  },
  "metrics.period": {
    "pt-BR": "Período",
    "en-US": "Period",
  },
  "metrics.totalAnalyzed": {
    "pt-BR": "Total analisado",
    "en-US": "Total analyzed",
  },
  "metrics.avgUrgency": {
    "pt-BR": "Urgência média",
    "en-US": "Average urgency",
  },
  "metrics.avgConfidence": {
    "pt-BR": "Confiança do modelo",
    "en-US": "Model confidence",
  },
  "metrics.criticalCount": {
    "pt-BR": "Menções críticas",
    "en-US": "Critical mentions",
  },
  "metrics.bySentiment": {
    "pt-BR": "Distribuição de sentimento",
    "en-US": "Sentiment distribution",
  },
  "metrics.byCriticality": {
    "pt-BR": "Distribuição por criticidade",
    "en-US": "Criticality distribution",
  },
  "metrics.topFactors": {
    "pt-BR": "Principais fatores de urgência",
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
    "pt-BR": "Execute uma busca para preencher indicadores e recomendações da IA.",
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
    "pt-BR": "Inicie uma busca para gerar métricas, gráficos e insights de reputação em tempo real.",
    "en-US": "Start a search to generate real-time reputation metrics, charts, and insights.",
  },
  "dashboard.emptyAction": {
    "pt-BR": "Iniciar busca",
    "en-US": "Start search",
  },
  "dashboard.metricMentions": {
    "pt-BR": "Menções",
    "en-US": "Mentions",
  },
  "dashboard.metricReputation": {
    "pt-BR": "Reputação",
    "en-US": "Reputation",
  },
  "dashboard.metricCritical": {
    "pt-BR": "Críticas",
    "en-US": "Critical",
  },
  "dashboard.metricUrgency": {
    "pt-BR": "Urgência média",
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
    "pt-BR": "Menções recentes",
    "en-US": "Recent mentions",
  },
  "analysis.title": {
    "pt-BR": "Insights de IA",
    "en-US": "AI insights",
  },
  "analysis.subtitle": {
    "pt-BR": "Gestão de insights gerados a partir dos lotes processados no pipeline de menções.",
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
    "pt-BR": "Erro ao executar ação no insight.",
    "en-US": "Unable to run insight action.",
  },
  "analysis.emptyTitle": {
    "pt-BR": "Nenhum insight encontrado",
    "en-US": "No insights found",
  },
  "analysis.emptyText": {
    "pt-BR": "Processe menções no pipeline e clique em gerar insight para criar o primeiro.",
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
    "pt-BR": "Visão de sentimento",
    "en-US": "Sentiment overview",
  },
  "analysis.noSentimentOverview": {
    "pt-BR": "Sem visão consolidada.",
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
    "pt-BR": "Ações recomendadas",
    "en-US": "Recommended actions",
  },
  "analysis.noActions": {
    "pt-BR": "Sem ações recomendadas.",
    "en-US": "No recommended actions.",
  },
  "analysis.guidance": {
    "pt-BR": "Direcionamento de decisão",
    "en-US": "Decision guidance",
  },
  "analysis.confidenceTooltip": {
    "pt-BR": "Este score indica a certeza média do modelo ao classificar as menções que geraram este insight.",
    "en-US": "This score indicates the model's average certainty when classifying mentions that generated this insight.",
  },
  "analysis.noGuidance": {
    "pt-BR": "Sem direcionamento disponível.",
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
    "pt-BR": "Data indisponível",
    "en-US": "Date unavailable",
  },
  "analysis.dateInvalid": {
    "pt-BR": "Data inválida",
    "en-US": "Invalid date",
  },
  "reports.title": {
    "pt-BR": "Relatórios e exportações",
    "en-US": "Reports and exports",
  },
  "reports.subtitle": {
    "pt-BR": "Exporte dados consolidados para auditoria, compartilhamento executivo e histórico de reputação.",
    "en-US": "Export consolidated data for audits, executive sharing, and reputation history.",
  },
  "reports.csvTitle": {
    "pt-BR": "Exportação CSV",
    "en-US": "CSV export",
  },
  "reports.csvText": {
    "pt-BR": "Arquivo tabular com marca, fonte, sentimento, criticidade, aspectos e texto da menção.",
    "en-US": "Tabular file with brand, source, sentiment, criticality, aspects, and mention text.",
  },
  "reports.csvButton": {
    "pt-BR": "Baixar CSV",
    "en-US": "Download CSV",
  },
  "reports.pdfTitle": {
    "pt-BR": "Relatório PDF",
    "en-US": "PDF report",
  },
  "reports.pdfText": {
    "pt-BR": "Resumo executivo com métricas agregadas e lista de menções críticas e recentes.",
    "en-US": "Executive summary with aggregated metrics and critical or recent mentions.",
  },
  "reports.pdfButton": {
    "pt-BR": "Baixar PDF",
    "en-US": "Download PDF",
  },
  "reports.error": {
    "pt-BR": "Erro ao gerar relatório.",
    "en-US": "Unable to generate report.",
  },
  "settings.title": {
    "pt-BR": "Configurações",
    "en-US": "Settings",
  },
  "settings.subtitle": {
    "pt-BR": "Gerencie perfil, aparência e segurança da conta com salvamento explícito.",
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
    "pt-BR": "Limiar mínimo da LLM",
    "en-US": "LLM minimum threshold",
  },
  "settings.save": {
    "pt-BR": "Salvar configurações",
    "en-US": "Save settings",
  },
  "settings.saved": {
    "pt-BR": "Configurações salvas.",
    "en-US": "Settings saved.",
  },
  "settings.saveError": {
    "pt-BR": "Falha ao salvar configurações.",
    "en-US": "Unable to save settings.",
  },
  "settings.thresholdHelp": {
    "pt-BR": "Quantidade mínima de comentários para acionar geração automática de insight por LLM.",
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
    "pt-BR": "Última atualização",
    "en-US": "Last update",
  },
  "settings.mfaTitle": {
    "pt-BR": "Autenticação multifator (MFA)",
    "en-US": "Multi-factor authentication (MFA)",
  },
  "settings.mfaSubtitle": {
    "pt-BR": "Aumente a segurança da conta com código de aplicativo autenticador.",
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
    "pt-BR": "QR Code gerado. Escaneie e confirme com o código de 6 dígitos.",
    "en-US": "QR Code generated. Scan it and confirm with the 6-digit code.",
  },
  "settings.mfaSetupError": {
    "pt-BR": "Não foi possível iniciar a configuração de MFA.",
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
    "pt-BR": "Não foi possível habilitar o MFA.",
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
    "pt-BR": "Não foi possível desabilitar o MFA.",
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
    "pt-BR": "Aparência",
    "en-US": "Appearance",
  },
  "settings.securityTab": {
    "pt-BR": "Segurança",
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
    "pt-BR": "Atualize dados básicos da sua conta. As mudanças só serão aplicadas ao salvar.",
    "en-US": "Update basic account data. Changes are applied only after saving.",
  },
  "settings.username": {
    "pt-BR": "Nome de usuário",
    "en-US": "Username",
  },
  "settings.emailReadonly": {
    "pt-BR": "O e-mail é apenas leitura nesta versão.",
    "en-US": "Email is read-only in this version.",
  },
  "settings.appearanceTitle": {
    "pt-BR": "Preferências de aparência",
    "en-US": "Appearance preferences",
  },
  "settings.appearanceSubtitle": {
    "pt-BR": "Escolha tema e limiar da LLM. Nada é salvo até confirmar.",
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
    "pt-BR": "Se preencher um campo de senha, preencha os três campos antes de salvar.",
    "en-US": "If you fill one password field, fill all three before saving.",
  },
  "settings.fillAllPasswordFields": {
    "pt-BR": "Preencha todos os campos de senha para concluir a alteração.",
    "en-US": "Fill all password fields to complete the change.",
  },
  "settings.passwordMismatch": {
    "pt-BR": "A confirmação da nova senha não confere.",
    "en-US": "New password confirmation does not match.",
  },
  "settings.unsavedChanges": {
    "pt-BR": "Existem alterações pendentes. Clique em salvar para aplicar.",
    "en-US": "There are pending changes. Click save to apply.",
  },
  "settings.noPendingChanges": {
    "pt-BR": "Nenhuma alteração pendente.",
    "en-US": "No pending changes.",
  },
  "settings.saveAll": {
    "pt-BR": "Salvar alterações",
    "en-US": "Save changes",
  },
  "settings.noChanges": {
    "pt-BR": "Nenhuma alteração para salvar.",
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
    "pt-BR": "Pergunte sobre dashboard, insights, navegação e configurações...",
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
    "pt-BR": "Como interpreto as menções críticas?",
    "en-US": "How do I read critical mentions?",
  },
  "chat.promptSettings": {
    "pt-BR": "Onde altero idioma e tema?",
    "en-US": "Where can I change language settings?",
  },
  "chat.promptScore": {
    "pt-BR": "Como o score de reputação é calculado?",
    "en-US": "How is the reputation score calculated?",
  },
  "chat.emptyState": {
    "pt-BR": "Posso ajudar com funcionalidades do Sentimento AI e dados autorizados da sua conta.",
    "en-US": "I can help with Sentimento AI features and your authorized account data.",
  },
  "notFound.title": {
    "pt-BR": "Página não encontrada",
    "en-US": "Page not found",
  },
  "notFound.text": {
    "pt-BR": "A página que você procura não existe ou foi movida.",
    "en-US": "The page you are looking for does not exist or was moved.",
  },
  "errorBoundary.title": {
    "pt-BR": "Ocorreu um erro inesperado.",
    "en-US": "An unexpected error occurred.",
  },
  "errorBoundary.reload": {
    "pt-BR": "Recarregar página",
    "en-US": "Reload page",
  },
  "api.requestError": {
    "pt-BR": "Erro na requisição",
    "en-US": "Request failed",
  },
  "api.authExpired": {
    "pt-BR": "Sua sessão expirou. Faça login novamente.",
    "en-US": "Your session has expired. Please sign in again.",
  },
  "api.timeout": {
    "pt-BR": "A requisição excedeu o tempo limite. Tente novamente.",
    "en-US": "The request timed out. Please try again.",
  },
  "api.aiUnavailable": {
    "pt-BR": "A IA está temporariamente indisponível. Tente novamente em instantes.",
    "en-US": "AI is temporarily unavailable. Please try again shortly.",
  },
  "api.aiUpstreamError": {
    "pt-BR": "Não foi possível concluir a resposta de IA no momento. Tente novamente em instantes.",
    "en-US": "Unable to complete the AI response right now. Please try again shortly.",
  },
  "api.reportError": {
    "pt-BR": "Erro ao gerar relatório",
    "en-US": "Unable to generate report",
  },
  "api.missingBaseUrl": {
    "pt-BR": "VITE_API_URL não está definido. Configure o endpoint público do backend.",
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


