import { SourceTierBadge } from "@/components/SourceTierBadge";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import type { AspectSentimentValue, Mention } from "@/lib/api";
import { ASPECT_LABELS, SENTIMENT_COLORS } from "@/lib/aspectLabels";
import { getSourceColor, getSourceLabel } from "@/lib/sourceColors";
import { cn } from "@/lib/utils";

type MentionCardProps = {
  mention: Mention;
  className?: string;
};

type CriticalityVisual = {
  borderClass: string;
  badgeClass: string;
  badgeText: string;
};

function normalizeCriticality(value: string | undefined): "critical" | "high" | "medium" | "low" {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "crítica" || normalized === "critica" || normalized === "critical") {
    return "critical";
  }
  if (normalized === "alta" || normalized === "high") {
    return "high";
  }
  if (normalized === "média" || normalized === "media" || normalized === "medium") {
    return "medium";
  }
  return "low";
}

function resolveCriticalityVisual(level: "critical" | "high" | "medium" | "low", t: (key: any) => string): CriticalityVisual {
  if (level === "critical") {
    return {
      borderClass: "border-l-red-500",
      badgeClass: "bg-red-100 text-red-700",
      badgeText: `⚠ ${t("urgency.critical")}`,
    };
  }

  if (level === "high") {
    return {
      borderClass: "border-l-orange-500",
      badgeClass: "bg-orange-100 text-orange-700",
      badgeText: t("urgency.high"),
    };
  }

  if (level === "medium") {
    return {
      borderClass: "border-l-yellow-500",
      badgeClass: "bg-yellow-100 text-yellow-700",
      badgeText: t("urgency.medium"),
    };
  }

  return {
    borderClass: "border-l-slate-400",
    badgeClass: "bg-slate-100 text-slate-700",
    badgeText: t("urgency.low"),
  };
}

function resolveAspectEntries(aspectSentiment?: Record<string, AspectSentimentValue>) {
  return Object.entries(aspectSentiment ?? {}).filter(([, value]) => value !== null) as Array<
    [string, Exclude<AspectSentimentValue, null>]
  >;
}

export function MentionCard({ mention, className }: Readonly<MentionCardProps>) {
  const { t } = useAppSettings();
  const criticalityLevel = normalizeCriticality(mention.criticality);
  const visual = resolveCriticalityVisual(criticalityLevel, t);
  const urgencyFactors = (mention.urgency_factors || []).filter(Boolean);
  const aspectEntries = resolveAspectEntries(mention.aspect_sentiment);

  const confidenceValue =
    mention.confidence_score === null || mention.confidence_score === undefined
      ? null
      : mention.confidence_score;
  const normalizedConfidence =
    confidenceValue === null
      ? null
      : Math.max(0, Math.min(1, confidenceValue <= 1 ? confidenceValue : confidenceValue / 100));
  const confidencePercent = normalizedConfidence === null ? null : Math.round(normalizedConfidence * 100);

  return (
    <article className={cn("rounded-lg border border-border/70 border-l-4 bg-background p-3", visual.borderClass, className)}>
      <header className="mb-2 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: getSourceColor(mention.source) }}
          >
            {getSourceLabel(mention.source)}
          </span>
          <SourceTierBadge tier={mention.source_tier} />
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-foreground/80">{mention.sentiment}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", visual.badgeClass)}>{visual.badgeText}</span>
        </div>
      </header>

      {mention.url ? (
        <a
          href={mention.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-[color:var(--brand-strong)] hover:underline"
        >
          {mention.author || mention.url}
        </a>
      ) : null}

      {mention.text ? <p className="mt-1 text-sm text-foreground">{mention.text}</p> : null}

      {urgencyFactors.length > 0 ? (
        <div className="mt-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{t("mention.urgencyFactors")}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {urgencyFactors.map((factor) => (
              <span key={`${mention.id}-${factor}`} className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                {factor}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {aspectEntries.length > 0 ? (
        <div className="mt-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{t("mention.aspectSentiment")}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {aspectEntries.map(([aspectKey, aspectSentiment]) => (
              <span
                key={`${mention.id}-aspect-${aspectKey}`}
                className={cn("rounded border px-2 py-0.5 text-xs", SENTIMENT_COLORS[aspectSentiment] || SENTIMENT_COLORS.neutro)}
              >
                {ASPECT_LABELS[aspectKey] ?? aspectKey}: {aspectSentiment}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {confidencePercent !== null ? (
        <footer className="mt-2 text-xs text-muted-foreground">
          {t("mention.confidence")}: {confidencePercent}%
        </footer>
      ) : null}
    </article>
  );
}
