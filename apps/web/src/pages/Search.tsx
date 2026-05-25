import { AppShell } from "@/components/AppShell";
import { MentionCard } from "@/components/MentionCard";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import {
  sentimentApi,
  type Mention,
  type ScrapeItem,
  type ScrapeResponse,
  type ScrapeSource,
  type SearchResponse,
} from "@/lib/api";
import { getSourceLabel } from "@/lib/sourceColors";
import { AlertTriangle, Loader2, Search, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const SEARCH_COMPLETED_EVENT = "sentimentoia:search-completed";
const LAST_SEARCH_ID_KEY = "sentimentoia_last_search_id";

type SourceOption = {
  id: ScrapeSource;
  name: string;
  icon: string;
};

const FALLBACK_SOURCE_OPTIONS: SourceOption[] = [
  { id: "reddit", name: getSourceLabel("reddit"), icon: "R" },
  { id: "youtube", name: getSourceLabel("youtube"), icon: "Y" },
  { id: "appstore", name: getSourceLabel("appstore"), icon: "A" },
  { id: "playstore", name: getSourceLabel("playstore"), icon: "P" },
  { id: "trustpilot", name: getSourceLabel("trustpilot"), icon: "T" },
  { id: "glassdoor", name: getSourceLabel("glassdoor"), icon: "G" },
  { id: "reclameaqui", name: getSourceLabel("reclameaqui"), icon: "RA" },
  { id: "mastodon", name: getSourceLabel("mastodon"), icon: "M" },
  { id: "web", name: getSourceLabel("web"), icon: "W" },
];

const SOURCE_TYPE_GUARD: Record<ScrapeSource, true> = {
  reclameaqui: true,
  reddit: true,
  youtube: true,
  appstore: true,
  playstore: true,
  glassdoor: true,
  trustpilot: true,
  mastodon: true,
  web: true,
  google: true,
  x: true,
  twitter: true,
};

function asScrapeSource(source: string): ScrapeSource | null {
  const normalized = String(source || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "") as ScrapeSource;

  if (SOURCE_TYPE_GUARD[normalized]) {
    return normalized;
  }

  return null;
}

function iconFromSourceName(name: string): string {
  const normalized = String(name || "").trim().toUpperCase();
  if (normalized.startsWith("RECLAME")) return "RA";
  return normalized.slice(0, 1) || "?";
}

function resolveSelectedSources(current: ScrapeSource[], dynamicOptions: SourceOption[]): ScrapeSource[] {
  const dynamicSourceIds = new Set(dynamicOptions.map((item) => item.id));
  const validCurrent = current.filter((source) => dynamicSourceIds.has(source));

  if (validCurrent.length > 0) {
    return validCurrent;
  }

  return dynamicOptions.slice(0, 3).map((item) => item.id);
}

function normalizeSource(source: string): ScrapeSource | null {
  return asScrapeSource(
    String(source || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
  );
}

function scrapeItemTitle(item: ScrapeItem): string {
  if (item.title) return item.title;
  if (item.author) return item.author;
  return item.url || "Resultado";
}

function searchStatusLabel(status: SearchResponse["status"] | undefined): string {
  if (status === "partial_success") return "Parcial";
  if (status === "failed") return "Falhou";
  if (status === "empty") return "Sem resultados";
  return "Concluida";
}

function searchStatusClass(status: SearchResponse["status"] | undefined): string {
  if (status === "partial_success") return "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200";
  if (status === "failed") return "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200";
  if (status === "empty") return "border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900/20 dark:text-slate-200";
  return "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200";
}

function getSearchProgressMessage(elapsedSeconds: number): string {
  if (elapsedSeconds < 15) {
    return "Coletando menções nas fontes selecionadas...";
  }

  if (elapsedSeconds < 45) {
    return "Analisando sentimentos (pode levar até 2 min)...";
  }

  return "Finalizando e agregando resultados...";
}

export default function SearchPage() {
  const { t } = useAppSettings();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [sourceOptions, setSourceOptions] = useState<SourceOption[]>(FALLBACK_SOURCE_OPTIONS);
  const [selectedSources, setSelectedSources] = useState<ScrapeSource[]>(
    FALLBACK_SOURCE_OPTIONS.slice(0, 3).map((item) => item.id)
  );
  const [limitPerSource, setLimitPerSource] = useState(5);
  const [periodDays, setPeriodDays] = useState(30);
  const [locality, setLocality] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchElapsedSeconds, setSearchElapsedSeconds] = useState(0);
  const [lastResult, setLastResult] = useState<SearchResponse | null>(null);
  const [lastScrape, setLastScrape] = useState<ScrapeResponse | null>(null);

  useEffect(() => {
    const options = FALLBACK_SOURCE_OPTIONS;
    setSourceOptions(options);
    setSelectedSources((current) => resolveSelectedSources(current, options));
  }, []);

  useEffect(() => {
    if (!isSearching) {
      setSearchElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const intervalId = globalThis.setInterval(() => {
      setSearchElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => {
      globalThis.clearInterval(intervalId);
    };
  }, [isSearching]);

  const groupedMentions = useMemo(() => {
    const groups: Record<string, Mention[]> = {};

    for (const mention of lastResult?.mentions ?? []) {
      const source = normalizeSource(mention.source);
      if (!source) continue;
      if (!groups[source]) {
        groups[source] = [];
      }
      groups[source].push(mention);
    }

    return groups;
  }, [lastResult?.mentions]);

  const groupedScrape = useMemo(() => {
    const groups: Record<string, ScrapeItem[]> = {};
    const payload = lastScrape?.results || {};

    for (const [source, items] of Object.entries(payload)) {
      const normalized = normalizeSource(source);
      if (!normalized) continue;
      groups[normalized] = Array.isArray(items) ? items : [];
    }

    return groups;
  }, [lastScrape?.results]);

  const searchErrors = [...(lastScrape?.errors ?? []), ...(lastResult?.errors ?? [])];
  const effectiveStatus: SearchResponse["status"] | undefined = lastResult?.status || lastScrape?.status;
  const effectiveStatusSummary = lastResult?.status_summary || lastScrape?.status_summary;
  const effectiveTotal = lastResult?.total ?? lastScrape?.total ?? 0;
  const hasRunData = Boolean(lastResult || lastScrape);
  const sourceStatusItems = effectiveStatusSummary?.source_status || [];
  const timeoutSourceSet = new Set([
    ...sourceStatusItems.filter((item) => item.timeout).map((item) => item.source),
    ...(effectiveStatusSummary?.timeout_sources || []),
  ]);
  const successfulSources = sourceStatusItems.filter((item) => item.ok).map((item) => item.source);
  const failedSources = sourceStatusItems
    .filter((item) => !item.ok && !timeoutSourceSet.has(item.source))
    .map((item) => item.source);
  const timeoutSources = Array.from(timeoutSourceSet);
  const searchingHint = getSearchProgressMessage(searchElapsedSeconds);
  const loadingPanel = (() => {
    if (isSearching) {
      return (
        <article className="app-panel p-6 md:p-7">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={18} />
            <span>{searchingHint}</span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full animate-pulse rounded-full bg-[color:var(--brand)]/80" />
          </div>
        </article>
      );
    }

    if (loading) {
      return (
        <article className="app-panel p-6 md:p-7">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={18} />
            <span>{t("search.loadingHint")}</span>
          </div>
        </article>
      );
    }

    return null;
  })();

  const sources = sourceOptions;

  const toggleSource = (sourceId: ScrapeSource) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    toast.info("Coleta externa desativada. Use o fluxo de seed em Configuracoes.");
    setLastResult(null);
    setLastScrape(null);
    setLoading(false);
    setIsSearching(false);
    setLocation("/settings#seeds");
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
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="search-period-days">Janela (dias)</label>
                <input
                  id="search-period-days"
                  type="number"
                  min={1}
                  max={365}
                  value={periodDays}
                  onChange={(event) => setPeriodDays(Math.max(1, Math.min(365, Number(event.target.value || 30))))}
                  className="field-input"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="search-locality">Localidade (opcional)</label>
                <input
                  id="search-locality"
                  type="text"
                  value={locality}
                  onChange={(event) => setLocality(event.target.value)}
                  placeholder="Brasil, Sao Paulo, etc"
                  className="field-input"
                  disabled={loading}
                />
              </div>
            </div>

            <label className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(event) => setReplaceExisting(event.target.checked)}
                disabled={loading}
              />
              <span>Forcar nova coleta (sem cache)</span>
            </label>

            <p className="mt-2 text-xs text-muted-foreground">{t("search.scrapingMode")}</p>
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

          {loadingPanel}

          {hasRunData ? (
            <article className="app-panel p-6 md:p-7">
              <h3 className="text-lg font-semibold">{t("search.resultsBySource")}</h3>
              <div className="mt-4 space-y-4">
                {sources.map((source) => {
                  const mentionItems = groupedMentions[source.id] || [];
                  const scrapeItems = groupedScrape[source.id] || [];
                  const visibleMentions = mentionItems.slice(0, limitPerSource);
                  const visibleScrapeItems = scrapeItems.slice(0, limitPerSource);
                  const totalBySource = scrapeItems.length > 0 ? scrapeItems.length : mentionItems.length;
                  const renderItems =
                    visibleScrapeItems.length > 0
                      ? visibleScrapeItems.map((item, index) => (
                          <li key={`${source.id}-scrape-${index}`} className="rounded-lg border border-border/70 bg-background p-3">
                            {item.url ? (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-semibold text-[color:var(--brand-strong)] hover:underline"
                              >
                                {scrapeItemTitle(item)}
                              </a>
                            ) : (
                              <p className="text-sm font-semibold text-[color:var(--brand-strong)]">{scrapeItemTitle(item)}</p>
                            )}
                            {item.snippet ? <p className="mt-1 text-sm text-muted-foreground">{item.snippet}</p> : null}
                          </li>
                        ))
                      : visibleMentions.map((item, index) => (
                          <li key={`${source.id}-mention-${index}`}>
                            <MentionCard mention={item} />
                          </li>
                        ));

                  return (
                    <section key={source.id} className="rounded-xl border border-border/80 p-4">
                      <header className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold">{source.name}</h4>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {totalBySource}
                        </span>
                      </header>
                      {visibleScrapeItems.length === 0 && visibleMentions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t("search.noSourceResults")}</p>
                      ) : (
                        <ul className="space-y-3">{renderItems}</ul>
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
              <p>
                <span className="text-muted-foreground">Janela:</span> {periodDays} dias
              </p>
              <p>
                <span className="text-muted-foreground">Localidade:</span> {locality || "-"}
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

          {hasRunData && (
            <article className="app-panel p-6">
              <h3 className="text-lg font-semibold">{t("search.lastRun")}</h3>
              <p className="mt-3 text-sm">
                {t("search.found")}: <strong>{effectiveTotal}</strong>
              </p>
              <div className={`mt-3 rounded-xl border px-3 py-2 text-xs font-medium ${searchStatusClass(effectiveStatus)}`}>
                Status: {searchStatusLabel(effectiveStatus)}
                {effectiveStatusSummary?.message ? <span className="ml-1">- {effectiveStatusSummary.message}</span> : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Search ID: {lastResult?.search_id || "-"}
              </p>
              {sourceStatusItems.length > 0 || timeoutSources.length > 0 ? (
                <div className="mt-3 space-y-1 rounded-xl border border-border/70 bg-muted/30 p-3 text-xs">
                  <p className="font-semibold uppercase text-muted-foreground">Status por fonte</p>
                  <p>
                    <span className="text-muted-foreground">Sucesso:</span> {successfulSources.length > 0 ? successfulSources.join(", ") : "-"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Falha:</span> {failedSources.length > 0 ? failedSources.join(", ") : "-"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Timeout:</span> {timeoutSources.length > 0 ? timeoutSources.join(", ") : "-"}
                  </p>
                </div>
              ) : null}
              {searchErrors.length > 0 ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t("search.sourceErrors")}</p>
                  {searchErrors.map((err) => {
                    const errorKey =
                      typeof err === "string"
                        ? err
                        : `${err.source || "fonte"}-${err.error || "erro desconhecido"}`;

                    const timeoutHint =
                      typeof err !== "string" && err.timeout
                        ? " (timeout)"
                        : "";

                    const reasonHint =
                      typeof err !== "string" && err.reason && err.reason !== "timeout"
                        ? ` (${err.reason})`
                        : "";

                    return (
                    <div key={errorKey} className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <span>
                          {typeof err === "string"
                            ? err
                            : `${err.source || "fonte"}: ${err.error || "erro desconhecido"}${timeoutHint}${reasonHint}`}
                        </span>
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : null}
            </article>
          )}
        </aside>
      </form>
    </AppShell>
  );
}
