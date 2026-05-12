import { AppShell } from "@/components/AppShell";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { sentimentApi, type ScrapeResponse, type ScrapeSource } from "@/lib/api";
import { AlertTriangle, Loader2, Search, WandSparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function SearchPage() {
  const { t } = useAppSettings();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [selectedSources, setSelectedSources] = useState<ScrapeSource[]>(["reclameaqui", "reddit", "mastodon"]);
  const [limitPerSource, setLimitPerSource] = useState(5);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ScrapeResponse | null>(null);

  const sources: Array<{ id: ScrapeSource; name: string; icon: string }> = [
    { id: "reclameaqui", name: "Reclame Aqui", icon: "RA" },
    { id: "reddit", name: "Reddit", icon: "R" },
    { id: "mastodon", name: "Mastodon", icon: "M" },
    { id: "web", name: "Web Aberto", icon: "W" },
  ];

  const toggleSource = (sourceId: ScrapeSource) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSources.length === 0) {
      toast.error(t("search.selectSource"));
      return;
    }

    setLoading(true);

    try {
      const result = await sentimentApi.scrape({
        query,
        sources: selectedSources,
        limit_per_source: limitPerSource,
      });

      setLastResult(result);
      if (result.total === 0) {
        toast.warning(t("search.emptyResult"));
      }
    } catch (err) {
      console.error(t("search.error"), err);
      toast.error(err instanceof Error ? err.message : t("search.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title={t("search.title")}
      subtitle={t("search.subtitle")}
      actions={
        <button
          onClick={() => setLocation("/dashboard")}
          className="secondary-btn"
          type="button"
        >
          {t("search.goToDashboard")}
        </button>
      }
    >
      <form onSubmit={handleSearch} className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="space-y-5">
          <article className="app-panel p-6 md:p-7">
            <label className="field-label" htmlFor="brand-name">{t("search.brandLabel")}</label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-3.5 text-muted-foreground" size={18} />
              <input
                id="brand-name"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("search.brandPlaceholder")}
                className="field-input pl-10"
                disabled={loading}
                required
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("search.brandHelp")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("search.scrapingMode")}
            </p>
          </article>

          <article className="app-panel p-6 md:p-7">
            <label className="field-label">{t("search.sources")}</label>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {sources.map((source) => {
                const selected = selectedSources.includes(source.id);
                return (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => toggleSource(source.id)}
                    disabled={loading}
                    className={`chip-btn ${selected ? "chip-btn-active" : ""}`}
                  >
                    <span className="chip-letter">{source.icon}</span>
                    <span>{source.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5">
              <label className="field-label" htmlFor="limit-per-source">{t("search.limitPerSource")}</label>
              <input
                id="limit-per-source"
                type="number"
                min={1}
                max={10}
                value={limitPerSource}
                onChange={(event) => setLimitPerSource(Math.max(1, Math.min(10, Number(event.target.value || 1))))}
                className="field-input max-w-[180px]"
                disabled={loading}
              />
              <p className="mt-2 text-xs text-muted-foreground">{t("search.limitHelp")}</p>
            </div>
          </article>

          {loading ? (
            <article className="app-panel p-6 md:p-7">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="animate-spin" size={18} />
                <span>{t("search.loadingHint")}</span>
              </div>
            </article>
          ) : null}

          {lastResult ? (
            <article className="app-panel p-6 md:p-7">
              <h3 className="text-lg font-semibold">{t("search.resultsBySource")}</h3>
              <div className="mt-4 space-y-4">
                {sources.map((source) => {
                  const items = lastResult.results[source.id] || [];
                  return (
                    <section key={source.id} className="rounded-xl border border-border/80 p-4">
                      <header className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold">{source.name}</h4>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {items.length}
                        </span>
                      </header>
                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t("search.noSourceResults")}</p>
                      ) : (
                        <ul className="space-y-3">
                          {items.map((item, index) => (
                            <li key={`${source.id}-${index}`} className="rounded-lg border border-border/70 bg-background p-3">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-semibold text-[color:var(--brand-strong)] hover:underline"
                              >
                                {item.title || item.url}
                              </a>
                              {item.snippet ? (
                                <p className="mt-1 text-sm text-muted-foreground">{item.snippet}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  );
                })}
              </div>
            </article>
          ) : null}
        </section>

        <aside className="space-y-5">
          <article className="app-panel p-6">
            <h3 className="text-lg font-semibold">{t("search.summary")}</h3>
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">{t("search.summaryBrand")}:</span> {query || "-"}
              </p>
              <p>
                <span className="text-muted-foreground">{t("search.summarySources")}:</span> {selectedSources.length}
              </p>
              <p>
                <span className="text-muted-foreground">{t("search.limitPerSource")}:</span> {limitPerSource}
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || !query || selectedSources.length === 0}
              className="primary-btn mt-5 w-full justify-center"
            >
              <WandSparkles size={16} />
              <span>{loading ? t("common.processing") : t("search.start")}</span>
            </button>
          </article>

          {lastResult && (
            <article className="app-panel p-6">
              <h3 className="text-lg font-semibold">{t("search.lastRun")}</h3>
              <p className="mt-3 text-sm">
                {t("search.found")}: <strong>{lastResult.total ?? 0}</strong>
              </p>
              {lastResult?.errors?.length > 0 ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t("search.sourceErrors")}</p>
                  {lastResult.errors.map((err, idx) => (
                    <div key={idx} className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <span>{`${err.source}: ${err.error}`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          )}
        </aside>
      </form>
    </AppShell>
  );
}
