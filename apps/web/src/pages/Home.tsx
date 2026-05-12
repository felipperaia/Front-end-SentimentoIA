import { useAuth } from "@/_core/hooks/useAuth";
import { BrandMark } from "@/components/BrandMark";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { BarChart3, CheckCircle2, FileText, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { loading, isAuthenticated, user } = useAuth();
  const { t } = useAppSettings();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      setLocation("/search");
    }
  }, [isAuthenticated, loading, setLocation, user]);

  if (loading || (isAuthenticated && user)) {
    return (
      <div className="app-bg flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">{t("loading.initializing")}</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: MessageSquareText,
      title: t("home.featureCollectionTitle"),
      text: t("home.featureCollectionText"),
    },
    {
      icon: Sparkles,
      title: t("home.featureAiTitle"),
      text: t("home.featureAiText"),
    },
    {
      icon: FileText,
      title: t("home.featureReportTitle"),
      text: t("home.featureReportText"),
    },
  ];

  const workflow = [
    [t("home.workflowSearchTitle"), t("home.workflowSearchText")],
    [t("home.workflowAnalyzeTitle"), t("home.workflowAnalyzeText")],
    [t("home.workflowActTitle"), t("home.workflowActText")],
  ];

  const plans = [
    [t("home.planStarter"), t("home.planStarterText")],
    [t("home.planGrowth"), t("home.planGrowthText")],
    [t("home.planEnterprise"), t("home.planEnterpriseText")],
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/88 backdrop-blur">
        <div className="container flex items-center justify-between gap-4 py-4">
          <a href="/" className="inline-flex items-center">
            <BrandMark size="md" />
          </a>
          <div className="flex items-center gap-2">
            <LanguageSelector compact />
            <a href="/login" className="secondary-btn hidden sm:inline-flex">
              {t("nav.login")}
            </a>
            <a href="/register" className="primary-btn">
              {t("nav.register")}
            </a>
          </div>
        </div>
      </nav>

      <main>
        <section className="commercial-hero">
          <div className="hero-dashboard" aria-hidden="true">
            <div className="hero-dashboard-topline" />
            <div className="hero-dashboard-grid">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="hero-dashboard-bars">
              <span style={{ height: "58%" }} />
              <span style={{ height: "82%" }} />
              <span style={{ height: "44%" }} />
              <span style={{ height: "68%" }} />
              <span style={{ height: "36%" }} />
            </div>
          </div>

          <div className="container relative z-10 py-16 md:py-24">
            <div className="max-w-3xl">
              <p className="section-eyebrow">{t("home.badge")}</p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-6xl">
                {t("home.title")}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                {t("home.subtitle")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/register" className="primary-btn">
                  <CheckCircle2 size={18} />
                  <span>{t("home.primaryCta")}</span>
                </a>
                <a href="/login" className="secondary-btn">
                  {t("home.secondaryCta")}
                </a>
              </div>
            </div>

            <div className="mt-12 grid gap-3 sm:grid-cols-3">
              <HeroMetric label={t("home.metricMentions")} value="Reclame Aqui · Reddit · Mastodon" />
              <HeroMetric label={t("home.metricInsights")} value="LLM" />
              <HeroMetric label={t("home.metricReports")} value="CSV · PDF" />
            </div>
          </div>
        </section>

        <section className="section-band">
          <div className="container">
            <div className="max-w-2xl">
              <p className="section-eyebrow">{t("common.productLine")}</p>
              <h2 className="mt-3 text-3xl font-semibold">{t("home.featuresTitle")}</h2>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.title} className="app-panel p-6">
                  <feature.icon className="mb-5 h-9 w-9 text-[color:var(--brand)]" />
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-band bg-card/45">
          <div className="container grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
            <div>
              <p className="section-eyebrow">{t("home.dashboardPreviewTitle")}</p>
              <h2 className="mt-3 text-3xl font-semibold">{t("home.workflowTitle")}</h2>
              <p className="mt-4 text-muted-foreground">{t("home.dashboardPreviewSubtitle")}</p>
            </div>

            <div className="grid gap-4">
              {workflow.map(([title, text]) => (
                <article key={title} className="workflow-row">
                  <ShieldCheck className="h-5 w-5 text-[color:var(--brand)]" />
                  <div>
                    <h3 className="text-base font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-band">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
              <div>
                <p className="section-eyebrow">{t("home.plansTitle")}</p>
                <h2 className="mt-3 text-3xl font-semibold">{t("home.finalCtaTitle")}</h2>
                <p className="mt-4 text-muted-foreground">{t("home.plansSubtitle")}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {plans.map(([title, text]) => (
                  <article key={title} className="app-panel p-5">
                    <BarChart3 className="mb-4 h-7 w-7 text-[color:var(--brand)]" />
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section-band pt-0">
          <div className="container">
            <div className="cta-band">
              <div>
                <h2 className="text-3xl font-semibold">{t("home.finalCtaTitle")}</h2>
                <p className="mt-3 text-sm text-muted-foreground">{t("home.finalCtaText")}</p>
              </div>
              <a href="/register" className="primary-btn">
                {t("home.primaryCta")}
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="hero-metric">
      <span className="text-xs font-medium uppercase text-muted-foreground">{label}</span>
      <strong className="mt-2 block text-lg font-semibold">{value}</strong>
    </div>
  );
}
