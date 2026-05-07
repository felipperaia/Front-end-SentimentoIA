import { AppShell } from "@/components/AppShell";
import { sentimentApi } from "@/lib/api";
import { AlertTriangle, Filter, Search, WandSparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const [brandName, setBrandName] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>(["google", "reddit"]);
  const [locality, setLocality] = useState("");
  const [periodDays, setPeriodDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const sources = [
    { id: "google", name: "Google", icon: "G" },
    { id: "reddit", name: "Reddit", icon: "R" },
    { id: "x", name: "X (Twitter)", icon: "X" },
  ];

  const toggleSource = (sourceId: string) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSources.length === 0) {
      alert("Selecione pelo menos uma fonte para iniciar a busca.");
      return;
    }

    setLoading(true);

    try {
      const result = await sentimentApi.search({
        brand_name: brandName,
        sources: selectedSources,
        period_days: periodDays,
        locality: locality || undefined,
      });
      setLastResult(result);
      if ((result.total ?? result.mentions?.length ?? 0) > 0) {
        setLocation("/dashboard");
      } else {
        alert("Busca concluida, mas nenhuma fonte retornou dados. Verifique Google Places, Reddit ou X/snscrape.");
      }
    } catch (err) {
      console.error("Erro na busca", err);
      alert(err instanceof Error ? err.message : "Erro na busca");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Busca de mencoes"
      subtitle="Colete dados reais de multiplas fontes para abastecer dashboard, insights e relatorios."
      actions={
        <button
          onClick={() => setLocation("/dashboard")}
          className="secondary-btn"
          type="button"
        >
          Ir para dashboard
        </button>
      }
    >
      <form onSubmit={handleSearch} className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="space-y-5">
          <article className="app-panel p-6 md:p-7">
            <label className="field-label">Marca ou empresa</label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-3.5 text-muted-foreground" size={18} />
              <input
                type="text"
                value={brandName}
                onChange={(event) => setBrandName(event.target.value)}
                placeholder="Digite o nome da marca"
                className="field-input pl-10"
                disabled={loading}
                required
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              A coleta utiliza integracoes reais (Google Places, Reddit e X/snscrape quando disponivel), sem preenchimento artificial.
            </p>
          </article>

          <article className="app-panel p-6 md:p-7">
            <label className="field-label">Fontes</label>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
          </article>

          <article className="app-panel p-6 md:p-7">
            <label className="field-label flex items-center gap-2">
              <Filter size={16} /> Parametros da busca
            </label>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <label className="field-label">Periodo</label>
                <select
                  value={periodDays}
                  onChange={(event) => setPeriodDays(Number(event.target.value))}
                  className="field-input"
                  disabled={loading}
                >
                  <option value={7}>Ultimos 7 dias</option>
                  <option value={30}>Ultimos 30 dias</option>
                  <option value={90}>Ultimos 90 dias</option>
                  <option value={365}>Ultimo ano</option>
                </select>
              </div>

              <div>
                <label className="field-label">Localidade (opcional)</label>
                <input
                  type="text"
                  value={locality}
                  onChange={(event) => setLocality(event.target.value)}
                  placeholder="Brasil, Sao Paulo"
                  className="field-input"
                  disabled={loading}
                />
              </div>
            </div>
          </article>
        </section>

        <aside className="space-y-5">
          <article className="app-panel p-6">
            <h3 className="text-lg font-semibold">Resumo da operacao</h3>
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Marca:</span> {brandName || "-"}
              </p>
              <p>
                <span className="text-muted-foreground">Fontes:</span> {selectedSources.length}
              </p>
              <p>
                <span className="text-muted-foreground">Periodo:</span> {periodDays} dias
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || !brandName || selectedSources.length === 0}
              className="primary-btn mt-5 w-full justify-center"
            >
              <WandSparkles size={16} />
              <span>{loading ? "Processando..." : "Iniciar busca"}</span>
            </button>
          </article>

          {lastResult && (
            <article className="app-panel p-6">
              <h3 className="text-lg font-semibold">Ultima execucao</h3>
              <p className="mt-3 text-sm">
                Encontradas: <strong>{lastResult.total ?? lastResult.mentions?.length ?? 0}</strong>
              </p>
              {lastResult.llm_analysis?.error ? (
                <p className="mt-3 rounded-xl border border-amber-400/60 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                  LLM: {lastResult.llm_analysis.error}
                </p>
              ) : null}
              {lastResult?.errors?.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {lastResult.errors.map((err: any, idx: number) => (
                    <div key={idx} className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <span>{typeof err === "string" ? err : `${err.source}: ${err.error}`}</span>
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
