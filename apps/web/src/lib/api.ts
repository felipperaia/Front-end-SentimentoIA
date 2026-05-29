import { translate, type TranslationKey } from "@/lib/i18n";

const configuredApiBaseUrl = String(import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");
const configuredApiTimeoutMs = Number(import.meta.env.VITE_API_TIMEOUT_MS || 90000);
const configuredRetryAttempts = Number(import.meta.env.VITE_API_RETRY_ATTEMPTS || 2);
const configuredRetryDelayMs = Number(import.meta.env.VITE_API_RETRY_DELAY_MS || 1000);
const configuredApiIngestPath = String(import.meta.env.VITE_API_INGEST_PATH || "api/ingestion/comments").trim();

export const API_BASE_URL = configuredApiBaseUrl;
export const AUTH_TOKEN_KEY = "sentimentoia_access_token";
export const AUTH_USER_KEY = "sentimentoia_user";
export const AUTH_SESSION_CHANGED_EVENT = "sentimentoia-auth-session-changed";
const REFRESH_TOKEN_KEY = "sentimentoia_refresh_token";
const SETTINGS_STORAGE_KEY = "sentimentoia_preferences";
const THEME_STORAGE_KEY = "theme";
const LOCAL_STORAGE_KEYS_TO_CLEAR = [
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  REFRESH_TOKEN_KEY,
  SETTINGS_STORAGE_KEY,
  THEME_STORAGE_KEY,
  "sentimentoia-preferences",
  "sentimentoia-theme",
  "sentimentoia-locale",
  "sentimentoia-settings",
  "sentimentoia-dark",
  "sentimentoia_preferences",
  "sentimentoia_locale",
  "sentimentoia_settings",
  "locale",
] as const;
const API_TIMEOUT_MS = Number.isFinite(configuredApiTimeoutMs)
  ? Math.max(1000, configuredApiTimeoutMs)
  : 90000;
const API_RETRY_ATTEMPTS = Number.isFinite(configuredRetryAttempts)
  ? Math.max(0, Math.min(5, configuredRetryAttempts))
  : 2;
const API_RETRY_DELAY_MS = Number.isFinite(configuredRetryDelayMs)
  ? Math.max(100, configuredRetryDelayMs)
  : 1000;
let resolvedApiIngestPath = configuredApiIngestPath || "api/ingestion/comments";
if (!resolvedApiIngestPath.startsWith("/")) {
  resolvedApiIngestPath = `/${resolvedApiIngestPath}`;
}
const API_INGEST_PATH = resolvedApiIngestPath.replace(/\/+$/, "") || "api/ingestion/comments";
const LONG_PATHS = ["/api/search", API_INGEST_PATH] as const;
const LONG_REQUEST_TIMEOUT_MS = 120_000;
const SEARCH_TIMEOUT_MESSAGE =
  "A busca demorou mais que o esperado. Tente selecionar menos fontes ou reduza o período de busca.";
const AI_UPSTREAM_PATH_PREFIXES = ["/api/chat", "/api/insights", "/api/analyze"] as const;
const SESSION_EXPIRED_PATTERNS = [/session expired/i, /token expired/i, /jwt/i, /authentication required/i];
const TIMEOUT_PATTERNS = [/timeout/i, /timed out/i, /deadline exceeded/i, /request aborted/i];
const NETWORK_UNAVAILABLE_PATTERNS = [/failed to fetch/i, /network error/i, /network request failed/i, /fetch failed/i];
const AI_TEMPORARY_UNAVAILABLE_PATTERNS = [/temporarily unavailable/i, /unavailable/i, /overloaded/i, /busy/i, /rate limit/i];
const AI_UPSTREAM_FAILURE_PATTERNS = [/llm/i, /gateway/i, /upstream/i, /provider/i, /model/i, /generation failed/i];
const INTERNAL_ERROR_DETAIL_PATTERNS = [/traceback/i, /stack/i, /exception/i, /gateway/i, /upstream/i, /model/i, /ollama/i];

export type AuthUser = {
  id?: string;
  email: string;
  name: string;
  username?: string | null;
  phone?: string | null;
  role?: string;
  mfa_enabled?: boolean;
  mfa_verified?: boolean;
};

export type AuthResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: "bearer";
  user: AuthUser;
};

export type MfaChallengeResponse = {
  mfa_required: true;
  message: string;
};

export type LoginResponse = AuthResponse | MfaChallengeResponse;

export type AspectSentimentValue = "positivo" | "negativo" | "neutro" | null;

export type UrgencyTrendPoint = {
  date: string;
  avg_score: number;
  critical_count: number;
};

export type UrgencyEvolutionPoint = {
  date: string;
  avg_urgency: number;
};

export type AspectMentionsPoint = {
  label: string;
  mentions: number;
};

export type CompanyItem = {
  company_id: string;
  name: string;
  slug: string;
};

export type NamedCount = {
  name: string;
  count: number;
};

export type AppTheme = "light" | "dark";
export type AppLocale = "pt-BR" | "en-US";

export type UserSettings = {
  theme: AppTheme;
  locale: AppLocale;
  llm_trigger_min_comments: number;
  updated_at?: string;
};

function getCurrentLocale(): AppLocale {
  if (typeof document === "undefined") return "pt-BR";
  return document.documentElement.lang === "en-US" ? "en-US" : "pt-BR";
}

function tApi(key: TranslationKey) {
  return translate(getCurrentLocale(), key);
}

function normalizeErrorText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function extractErrorDetail(payload: any): string {
  const direct = normalizeErrorText(payload);
  if (direct) return direct;

  const candidates = [
    payload?.business_state?.actionable_message,
    payload?.meta?.actionable_message,
    payload?.detail,
    payload?.message,
    payload?.error,
    payload?.errors?.[0]?.error,
    payload?.errors?.[0]?.detail,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeErrorText(candidate);
    if (normalized) return normalized;
  }

  return "";
}

function extractErrorCode(payload: any): string | undefined {
  const candidates = [
    payload?.code,
    payload?.reason,
    payload?.meta?.reason,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeErrorText(candidate);
    if (normalized) return normalized;
  }

  return undefined;
}

function isAiUpstreamPath(path: string): boolean {
  return AI_UPSTREAM_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isLongRequestPath(path: string): boolean {
  return LONG_PATHS.some((prefix) => path.startsWith(prefix));
}

function matchesAnyPattern(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function isAuthExpiredError(status: number | undefined, detailText: string): boolean {
  return status === 401 || (Boolean(detailText) && matchesAnyPattern(detailText, SESSION_EXPIRED_PATTERNS));
}

function isTimeoutError(status: number | undefined, detailText: string): boolean {
  return (
    status === 408 ||
    status === 504 ||
    (Boolean(detailText) && matchesAnyPattern(detailText, TIMEOUT_PATTERNS))
  );
}

function resolveAiSpecificError(status: number | undefined, detailText: string): TranslationKey | null {
  if (status === 502 || status === 503 || status === 504) {
    return "api.aiUnavailable";
  }

  if (detailText && matchesAnyPattern(detailText, AI_TEMPORARY_UNAVAILABLE_PATTERNS)) {
    return "api.aiUnavailable";
  }

  if (detailText && matchesAnyPattern(detailText, AI_UPSTREAM_FAILURE_PATTERNS)) {
    return "api.aiUpstreamError";
  }

  return null;
}

function resolveTimeoutFriendlyMessage(path: string): string {
  return isLongRequestPath(path) ? SEARCH_TIMEOUT_MESSAGE : tApi("api.timeout");
}

function resolveFriendlyErrorMessage(params: {
  path: string;
  status?: number;
  detail?: unknown;
  fallbackKey: TranslationKey;
}): string {
  const detailText = extractErrorDetail(params.detail);
  const aiRequest = isAiUpstreamPath(params.path);

  if (isAuthExpiredError(params.status, detailText)) {
    return tApi("api.authExpired");
  }

  if (isTimeoutError(params.status, detailText)) {
    return resolveTimeoutFriendlyMessage(params.path);
  }

  if (detailText && matchesAnyPattern(detailText, NETWORK_UNAVAILABLE_PATTERNS)) {
    return aiRequest ? tApi("api.aiUnavailable") : tApi(params.fallbackKey);
  }

  if (aiRequest) {
    const aiErrorKey = resolveAiSpecificError(params.status, detailText);
    if (aiErrorKey) {
      return tApi(aiErrorKey);
    }
  }

  if (detailText && matchesAnyPattern(detailText, INTERNAL_ERROR_DETAIL_PATTERNS)) {
    return aiRequest ? tApi("api.aiUpstreamError") : tApi(params.fallbackKey);
  }

  if (detailText) {
    return detailText;
  }

  return tApi(params.fallbackKey);
}

function ensureApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error(tApi("api.missingBaseUrl"));
  }
  return API_BASE_URL;
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function buildAuthHeaders(options: RequestInit, token: string | null): Headers {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  try {
    headers.set("Accept-Encoding", "gzip");
  } catch {
    // Browsers can block unsafe headers; ignore to keep request resilient.
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

function shouldRetryStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

type RequestAttemptResult = {
  response: Response | null;
  networkError?: unknown;
};

async function runRequestAttempt(params: {
  url: string;
  options: RequestInit;
  token: string | null;
  attempt: number;
  timeoutMs: number;
}): Promise<RequestAttemptResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), params.timeoutMs);

  try {
    const response = await fetch(params.url, {
      ...params.options,
      headers: buildAuthHeaders(params.options, params.token),
      signal: controller.signal,
    });

    if (!response.ok && shouldRetryStatus(response.status) && params.attempt < API_RETRY_ATTEMPTS) {
      await wait(API_RETRY_DELAY_MS * (params.attempt + 1));
      return { response: null };
    }

    return { response };
  } catch (err) {
    if (params.attempt < API_RETRY_ATTEMPTS) {
      await wait(API_RETRY_DELAY_MS * (params.attempt + 1));
    }

    return {
      response: null,
      networkError: err,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken || !API_BASE_URL) return null;

  try {
    const signal =
      typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
        ? AbortSignal.timeout(15_000)
        : undefined;

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal,
    });

    if (!response.ok) return null;

    const data = ensureObject(await response.json());
    const accessToken = asString(data.access_token, "");
    if (!accessToken) return null;

    const nextRefreshToken = asString(data.refresh_token, "");
    localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    if (nextRefreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
    }

    return accessToken;
  } catch {
    return null;
  }
}

async function requestWithRetry(path: string, options: RequestInit = {}, authRetryDone = false): Promise<Response> {
  const apiBaseUrl = ensureApiBaseUrl();
  const token = getToken();
  const url = `${apiBaseUrl}${path}`;
  const apiTimeout = API_TIMEOUT_MS;
  const isLongRequest = isLongRequestPath(path);

  let lastNetworkError: unknown = null;

  for (let attempt = 0; attempt <= API_RETRY_ATTEMPTS; attempt += 1) {
    const timeout = isLongRequest ? LONG_REQUEST_TIMEOUT_MS : apiTimeout;
    const { response, networkError } = await runRequestAttempt({
      url,
      options,
      token,
      attempt,
      timeoutMs: timeout,
    });

    if (networkError !== undefined) {
      lastNetworkError = networkError;
    }

    if (response) {
      if (response.status === 401) {
        if (!authRetryDone) {
          const refreshedToken = await tryRefreshToken();
          if (refreshedToken) {
            return requestWithRetry(path, options, true);
          }
        }

        clearAuthSession();
        throw new ApiRequestError("Sessão expirada", {
          path,
          status: 401,
          code: "session_expired",
        });
      }

      return response;
    }
  }

  if (lastNetworkError instanceof DOMException && lastNetworkError.name === "AbortError") {
    throw new Error(resolveTimeoutFriendlyMessage(path));
  }

  if (lastNetworkError instanceof Error) {
    throw new Error(
      resolveFriendlyErrorMessage({
        path,
        detail: lastNetworkError.message,
        fallbackKey: "api.requestError",
      })
    );
  }

  throw new Error(tApi("api.requestError"));
}

async function parseResponseJson(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function parseFilenameFromDisposition(dispositionHeader: string | null): string | null {
  if (!dispositionHeader) return null;

  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(dispositionHeader);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1].trim());
    } catch {
      return utfMatch[1].trim();
    }
  }

  const plainMatch = /filename="?([^";]+)"?/i.exec(dispositionHeader);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }

  return null;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = globalThis.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL(url);
}

function ensureObject(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, any>;
}

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function asNullableString(value: unknown): string | undefined {
  const resolved = asString(value, "");
  return resolved || undefined;
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeNumericRecord(value: unknown): Record<string, number> {
  const raw = ensureObject(value);
  const output: Record<string, number> = {};
  for (const [key, item] of Object.entries(raw)) {
    const parsed = Number(item);
    if (Number.isFinite(parsed)) {
      output[key] = parsed;
    }
  }
  return output;
}

function normalizeSourceTier(value: unknown): "S" | "A" | "B" | null {
  const normalized = asString(value, "").toUpperCase();
  if (normalized === "S" || normalized === "A" || normalized === "B") {
    return normalized;
  }
  return null;
}

function normalizeUnitInterval(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  if (parsed <= 1) return Math.max(0, Math.min(1, parsed));
  return Math.max(0, Math.min(1, parsed / 100));
}

function normalizeAspectSentiment(value: unknown): Record<string, AspectSentimentValue> | undefined {
  const raw = ensureObject(value);
  const output: Record<string, AspectSentimentValue> = {};

  for (const [aspectKey, sentimentValue] of Object.entries(raw)) {
    if (sentimentValue === null) {
      output[aspectKey] = null;
      continue;
    }

    const normalized = asString(sentimentValue, "").toLowerCase();
    if (normalized === "positivo" || normalized === "positive") {
      output[aspectKey] = "positivo";
      continue;
    }
    if (normalized === "negativo" || normalized === "negative") {
      output[aspectKey] = "negativo";
      continue;
    }
    if (normalized === "neutro" || normalized === "neutral") {
      output[aspectKey] = "neutro";
    }
  }

  return Object.keys(output).length > 0 ? output : undefined;
}

function normalizeUrgencyTrend(value: unknown): UrgencyTrendPoint[] {
  const rawArray = ensureArray<any>(value);

  return rawArray
    .map((entry) => {
      const item = ensureObject(entry);
      const date = asString(item.date || item.day || item.label, "");
      if (!date) return null;

      return {
        date,
        avg_score: normalizeUnitInterval(item.avg_score ?? item.average_score ?? item.urgency_score),
        critical_count: Math.max(0, Math.round(asNumber(item.critical_count ?? item.critical_mentions, 0))),
      };
    })
    .filter((entry): entry is UrgencyTrendPoint => entry !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function normalizeNamedCounts(value: unknown, aliases: string[]): NamedCount[] {
  const rawObject = ensureObject(value);

  if (Object.keys(rawObject).length > 0) {
    return Object.entries(rawObject)
      .map(([name, count]) => ({
        name,
        count: Math.max(0, Math.round(asNumber(count, 0))),
      }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  const rawArray = ensureArray<any>(value);
  return rawArray
    .map((entry) => {
      const item = ensureObject(entry);
      const nameCandidate = aliases.map((alias) => item[alias]).find((candidate) => asString(candidate, "") !== "");
      const name = asString(nameCandidate, "");
      if (!name) return null;

      const count = Math.max(0, Math.round(asNumber(item.count ?? item.value ?? item.total, 0)));
      if (count <= 0) return null;

      return { name, count };
    })
    .filter((entry): entry is NamedCount => entry !== null)
    .sort((a, b) => b.count - a.count);
}

function normalizeTopNegativeAspects(value: unknown): Record<string, number> {
  const asRecord = normalizeNumericRecord(value);
  if (Object.keys(asRecord).length > 0) {
    return asRecord;
  }

  const namedCounts = normalizeNamedCounts(value, ["aspect", "name", "key"]);
  return namedCounts.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.name] = entry.count;
    return acc;
  }, {});
}

function normalizeAspectMentions(value: unknown, aliases: string[]): AspectMentionsPoint[] {
  const asRecord = normalizeNumericRecord(value);
  if (Object.keys(asRecord).length > 0) {
    return Object.entries(asRecord)
      .map(([label, mentions]) => ({
        label,
        mentions: Math.max(0, Math.round(asNumber(mentions, 0))),
      }))
      .filter((entry) => entry.mentions > 0)
      .sort((a, b) => b.mentions - a.mentions);
  }

  return ensureArray<any>(value)
    .map((entry) => {
      const item = ensureObject(entry);
      const labelCandidate = aliases
        .map((alias) => item[alias])
        .find((candidate) => asString(candidate, "") !== "");
      const label = asString(labelCandidate, "");
      if (!label) return null;

      const mentions = Math.max(0, Math.round(asNumber(item.mentions ?? item.count ?? item.value ?? item.total, 0)));
      if (mentions <= 0) return null;
      return { label, mentions };
    })
    .filter((entry): entry is AspectMentionsPoint => entry !== null)
    .sort((a, b) => b.mentions - a.mentions);
}

function normalizeUrgencyEvolution(value: unknown): UrgencyEvolutionPoint[] {
  return ensureArray<any>(value)
    .map((entry) => {
      const item = ensureObject(entry);
      const date = asString(item.date || item.day || item.label, "");
      if (!date) return null;

      return {
        date,
        avg_urgency: normalizeUnitInterval(
          item.avg_urgency ?? item.avgUrgency ?? item.avg_score ?? item.average_score ?? item.urgency_score
        ),
      };
    })
    .filter((entry): entry is UrgencyEvolutionPoint => entry !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function normalizeCompany(item: unknown): CompanyItem | null {
  const raw = ensureObject(item);
  const companyId = asString(raw.companyId || raw.company_id || raw.id || raw._id, "");
  const name = asString(raw.name || raw.company_name || raw.display_name, "");
  const slug = asString(raw.slug || raw.company_slug, "");

  if (!companyId || !name) return null;
  return {
    company_id: companyId,
    name,
    slug: slug || companyId,
  };
}

function normalizeDateLike(value: unknown): string | undefined {
  const normalized = asString(value, "");
  return normalized || undefined;
}

function resolvePeriodLabel(params: { periodLabel?: unknown; from?: unknown; to?: unknown }): string | undefined {
  const explicitLabel = asString(params.periodLabel, "");
  if (explicitLabel) return explicitLabel;

  const from = normalizeDateLike(params.from);
  const to = normalizeDateLike(params.to);
  if (!from && !to) return undefined;
  if (from && to) return `${from} a ${to}`;
  return from || to;
}

function normalizeMetricsResponse(rawPayload: unknown): MetricsResponse {
  const payload = ensureObject(rawPayload);
  const metrics = ensureObject(payload.metrics);
  const rootPeriod = ensureObject(payload.period);
  const metricsPeriod = ensureObject(metrics.period);

  const sentimentDistribution = normalizeNumericRecord(
    payload.sentiment_distribution || metrics.sentiment_distribution || payload.by_sentiment || metrics.by_sentiment
  );
  const topNegativeAspects = normalizeAspectMentions(
    payload.top_negative_aspects || metrics.top_negative_aspects,
    ["label", "aspect", "name", "key"]
  );
  const topPositiveAspects = normalizeAspectMentions(
    payload.top_positive_aspects || metrics.top_positive_aspects,
    ["label", "aspect", "name", "key"]
  );
  const mostCitedAspects = normalizeAspectMentions(
    payload.most_cited_aspects || metrics.most_cited_aspects || payload.top_aspects || metrics.top_aspects,
    ["label", "aspect", "name", "key"]
  );
  const urgencyEvolution = normalizeUrgencyEvolution(
    payload.urgency_evolution || metrics.urgency_evolution || payload.urgencyEvolution || metrics.urgencyEvolution
  );

  const periodFrom = normalizeDateLike(
    payload.period_from || payload.from || rootPeriod.from || metrics.period_from || metrics.from || metricsPeriod.from
  );
  const periodTo = normalizeDateLike(
    payload.period_to || payload.to || rootPeriod.to || metrics.period_to || metrics.to || metricsPeriod.to
  );
  const periodLabel = resolvePeriodLabel({
    periodLabel: payload.period_label || metrics.period_label || rootPeriod.label || metricsPeriod.label,
    from: periodFrom,
    to: periodTo,
  });

  return {
    company_id: asNullableString(payload.company_id || payload.companyId || metrics.company_id || metrics.companyId),
    company_name: asNullableString(
      payload.company_name || payload.current_company_name || payload.company || metrics.company_name || metrics.current_company_name
    ),
    company_slug: asNullableString(payload.company_slug || payload.slug || metrics.company_slug),
    period_label: periodLabel,
    period_from: periodFrom,
    period_to: periodTo,
    total_mentions: Math.max(
      0,
      Math.round(asNumber(payload.total_mentions ?? metrics.total_mentions ?? payload.total ?? payload.total_analyzed, 0))
    ),
    sentiment_distribution: sentimentDistribution,
    average_urgency: normalizeUnitInterval(payload.average_urgency ?? metrics.average_urgency ?? payload.avg_urgency_score),
    urgency_evolution: urgencyEvolution,
    top_negative_aspects: topNegativeAspects,
    top_positive_aspects: topPositiveAspects,
    most_cited_aspects: mostCitedAspects,
  };
}

function normalizeReportItem(item: unknown): ReportsListItem | null {
  const raw = ensureObject(item);

  const companyName =
    asNullableString(raw.company_name || raw.current_company_name || raw.company || raw.brand_name) || "Empresa";
  const companyId = asNullableString(raw.company_id || raw.companyId);
  const companySlug = asNullableString(raw.company_slug || raw.companySlug || raw.slug);

  const periodFrom = normalizeDateLike(raw.period_from || raw.from || raw.period?.from);
  const periodTo = normalizeDateLike(raw.period_to || raw.to || raw.period?.to);
  const periodLabel =
    resolvePeriodLabel({ periodLabel: raw.period_label || raw.period?.label, from: periodFrom, to: periodTo }) ||
    "Período não informado";

  const id = asString(raw.id || raw.report_id || raw._id || `${companyId || companyName}-${periodLabel}`, "");
  if (!id) return null;

  return {
    id,
    company_id: companyId,
    company_name: companyName,
    company_slug: companySlug,
    period_label: periodLabel,
    period_from: periodFrom,
    period_to: periodTo,
    created_at: asNullableString(raw.created_at),
    format: asNullableString(raw.format || raw.type),
  };
}

function normalizeMention(item: unknown): Mention {
  const raw = ensureObject(item);
  const normalizedConfidence = normalizeUnitInterval(raw.confidence_score ?? raw.confidence ?? 0);
  return {
    id: asString(raw.id || raw._id || raw.external_id, "unknown"),
    brand_id: asNullableString(raw.brand_id),
    brand_name: asNullableString(raw.brand_name || raw.query || raw.entity),
    text: asString(raw.text || raw.snippet || raw.title, ""),
    source: asString(raw.source, "web"),
    sentiment: asString(raw.sentiment, "neutro"),
    score: raw.score === null || raw.score === undefined ? null : asNumber(raw.score, 0),
    source_tier: normalizeSourceTier(raw.source_tier),
    criticality: asString(raw.criticality, "baixa"),
    urgency_score: asNumber(raw.urgency_score, 0),
    confidence: raw.confidence === null || raw.confidence === undefined ? undefined : asNumber(raw.confidence, 0),
    confidence_score:
      raw.confidence_score === null || raw.confidence_score === undefined
        ? null
        : normalizedConfidence,
    aspects: ensureArray<string>(raw.aspects),
    urgency_factors: ensureArray<string>(raw.urgency_factors),
    aspect_sentiment: normalizeAspectSentiment(raw.aspect_sentiment),
    critical_terms: ensureArray<string>(raw.critical_terms),
    rating: raw.rating === null || raw.rating === undefined ? undefined : asNumber(raw.rating, 0),
    author: asNullableString(raw.author),
    url: asNullableString(raw.url || raw.canonical_url),
    published_at: asNullableString(raw.published_at),
    created_at: asNullableString(raw.created_at),
  };
}

function normalizeInsight(item: unknown): InsightItem {
  const raw = ensureObject(item);
  const rootPeriod = ensureObject(raw.period);
  const periodFrom = normalizeDateLike(raw.period_from || raw.from || rootPeriod.from);
  const periodTo = normalizeDateLike(raw.period_to || raw.to || rootPeriod.to);

  let avgConfidence: number | undefined;
  const directAvgConfidence = raw.avg_confidence ?? raw.confidence_score;
  if (directAvgConfidence !== undefined && directAvgConfidence !== null) {
    avgConfidence = normalizeUnitInterval(directAvgConfidence);
  } else {
    const mentionConfidenceScores = ensureArray<any>(raw.mentions)
      .map((mention) => {
        const rawMention = ensureObject(mention);
        const confidenceValue = rawMention.confidence_score ?? rawMention.confidence;
        return confidenceValue === null || confidenceValue === undefined
          ? null
          : normalizeUnitInterval(confidenceValue);
      })
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

    if (mentionConfidenceScores.length > 0) {
      const total = mentionConfidenceScores.reduce((acc, current) => acc + current, 0);
      avgConfidence = total / mentionConfidenceScores.length;
    }
  }

  return {
    id: asString(raw.id || raw._id || raw.insight_id || raw.context_id, "unknown"),
    insight_id: asNullableString(raw.insight_id),
    job_id: asNullableString(raw.job_id),
    user_id: asNullableString(raw.user_id),
    batch_id: asNullableString(raw.batch_id),
    context_id: asNullableString(raw.context_id),
    context_type: asNullableString(raw.context_type),
    company: asNullableString(raw.company || raw.snapshot?.brand),
    company_id: asNullableString(raw.company_id || raw.companyId),
    company_name: asNullableString(raw.company_name || raw.company || raw.snapshot?.brand),
    company_slug: asNullableString(raw.company_slug || raw.slug),
    period_label: resolvePeriodLabel({
      periodLabel: raw.period_label || rootPeriod.label,
      from: periodFrom,
      to: periodTo,
    }),
    period_from: periodFrom,
    period_to: periodTo,
    trigger: asNullableString(raw.trigger),
    archived: Boolean(raw.archived),
    priority: asNullableString(raw.priority),
    urgency: asNullableString(raw.urgency),
    root_cause: asNullableString(raw.root_cause),
    recommended_action: asNullableString(raw.recommended_action),
    status: asNullableString(raw.status),
    resolution: asNullableString(raw.resolution),
    timestamp: asNullableString(raw.timestamp),
    executive_summary: asNullableString(raw.executive_summary),
    sentiment_overview: asNullableString(raw.sentiment_overview),
    risks: ensureArray<string>(raw.risks),
    opportunities: ensureArray<string>(raw.opportunities),
    recommended_actions: ensureArray<string>(raw.recommended_actions),
    decision_guidance: asNullableString(raw.decision_guidance),
    trend: asNullableString(raw.trend),
    avg_confidence: avgConfidence,
    created_at: asNullableString(raw.created_at),
    updated_at: asNullableString(raw.updated_at),
  };
}

function normalizeSearchErrors(
  errors: unknown
): Array<{ source?: string; error?: string; reason?: string; timeout?: boolean } | string> {
  return ensureArray<any>(errors)
    .map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }

      const raw = ensureObject(entry);
      const source = asString(raw.source || raw.name, "fonte");
      const error = asString(raw.error || raw.detail || raw.message, "Erro temporario na coleta");
      const reason = asNullableString(raw.reason);
      const timeout = Boolean(raw.timeout) || reason === "timeout";
      return { source, error, reason, timeout };
    })
    .filter(Boolean);
}

function normalizeIngestErrors(errors: unknown): IngestItemError[] {
  return ensureArray<any>(errors)
    .map((entry) => {
      const raw = ensureObject(entry);
      const rawIndex = asNumber(raw.index ?? raw.item_index ?? raw.row ?? raw.position, -1);
      return {
        index: Number.isFinite(rawIndex) ? Math.round(rawIndex) : -1,
        field: asNullableString(raw.field || raw.path) ?? undefined,
        message: asString(raw.error || raw.message || raw.detail, "Erro de validacao"),
        code: asNullableString(raw.code) ?? undefined,
      };
    })
    .filter((entry) => entry.message.length > 0);
}

function normalizeChatThread(item: unknown): ChatThread {
  const raw = ensureObject(item);
  const threadId = asString(raw.thread_id || raw.id, "");
  return {
    id: asString(raw.id || threadId, threadId || "unknown"),
    thread_id: threadId || asString(raw.id, "unknown"),
    title: asString(raw.title, "Nova conversa"),
    locale: asNullableString(raw.locale),
    archived: raw.archived === undefined ? undefined : Boolean(raw.archived),
    created_at: asNullableString(raw.created_at),
    updated_at: asNullableString(raw.updated_at),
    last_message_at: asNullableString(raw.last_message_at),
  };
}

function resolveChatMessageContent(raw: Record<string, any>): string {
  const directCandidates = [
    raw.content,
    raw.final_answer,
    raw.final_response,
    raw.answer,
    raw.message,
    raw.text,
  ];

  for (const candidate of directCandidates) {
    const resolved = asString(candidate, "");
    if (resolved) return resolved;
  }

  const nestedResponse = ensureObject(raw.response);
  const nestedMessage = ensureObject(raw.message);
  const nestedCandidates = [
    nestedResponse.content,
    nestedResponse.text,
    nestedResponse.answer,
    nestedResponse.final_answer,
    nestedMessage.content,
    nestedMessage.text,
  ];

  for (const candidate of nestedCandidates) {
    const resolved = asString(candidate, "");
    if (resolved) return resolved;
  }

  return "";
}

function normalizeChatMessage(
  item: unknown,
  fallback: { role?: "system" | "user" | "assistant"; content?: string; threadId?: string } = {}
): ChatMessage {
  const raw = typeof item === "string" ? { content: item } : ensureObject(item);
  const messageId = asString(raw.message_id || raw.id, "");
  const role = asString(raw.role, fallback.role || "assistant").toLowerCase();
  const content = resolveChatMessageContent(raw) || asString(fallback.content, "");
  return {
    id: asString(raw.id || messageId, messageId || "unknown"),
    message_id: messageId || asString(raw.id, "unknown"),
    thread_id: asString(raw.thread_id || raw.threadId || fallback.threadId, ""),
    role: role === "system" || role === "user" || role === "assistant" ? role : "assistant",
    content,
    created_at: asNullableString(raw.created_at),
  };
}

function resolveChatMessagePayload(payload: Record<string, any>, role: "user" | "assistant"): unknown {
  const candidates =
    role === "user"
      ? [payload.user_message, payload.userMessage, payload.input_message]
      : [
          payload.assistant_message,
          payload.assistantMessage,
          payload.final_message,
          payload.finalMessage,
          payload.response_message,
          payload.responseMessage,
          payload.response,
          payload.assistant,
        ];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const content = asString(candidate, "");
      if (content) {
        return {
          role,
          content,
        };
      }
      continue;
    }

    if (candidate && typeof candidate === "object") {
      return candidate;
    }
  }

  if (role === "assistant") {
    const fallbackContent = resolveChatMessageContent(payload);
    if (fallbackContent) {
      return {
        role: "assistant",
        content: fallbackContent,
      };
    }
  }

  return null;
}

function normalizeDashboardMetrics(rawMetrics: unknown, mentions: Mention[] = []): Partial<DashboardMetrics> {
  const raw = ensureObject(rawMetrics);
  const rootPeriod = ensureObject(raw.period);
  const totalMentions = asNumber(raw.total_mentions, mentions.length);
  const sentimentDistribution = normalizeNumericRecord(raw.sentiment_distribution);
  const sourceDistribution = normalizeNumericRecord(raw.source_distribution || raw.sources_distribution);
  const sourcesDistribution = normalizeNumericRecord(raw.sources_distribution || raw.source_distribution);
  const topAspects = normalizeNumericRecord(raw.top_aspects);
  const urgencyTrend = normalizeUrgencyTrend(raw.urgency_trend);
  const urgencyEvolution = normalizeUrgencyEvolution(raw.urgency_evolution || raw.urgencyEvolution || raw.urgency_trend);
  const topNegativeAspects = normalizeTopNegativeAspects(raw.top_negative_aspects);
  const topNegativeAspectsList = normalizeAspectMentions(
    raw.top_negative_aspects_list || raw.topNegativeAspects || raw.top_negative_aspects,
    ["label", "name", "aspect", "key"]
  );
  const mostCitedAspects = normalizeAspectMentions(
    raw.most_cited_aspects || raw.mostCitedAspects || raw.top_aspects,
    ["label", "name", "aspect", "key"]
  );
  const topPositiveAspects = normalizeAspectMentions(
    raw.top_positive_aspects || raw.topPositiveAspects,
    ["label", "name", "aspect", "key"]
  );

  let topThemes: Record<string, number> | string[] | undefined;
  if (Array.isArray(raw.top_themes)) {
    topThemes = ensureArray<string>(raw.top_themes);
  } else {
    topThemes = normalizeNumericRecord(raw.top_themes || raw.top_aspects);
  }

  return {
    total_mentions: totalMentions,
    total_comments: asNumber(raw.total_comments, totalMentions),
    sentiment_distribution: sentimentDistribution,
    source_distribution: sourceDistribution,
    sources_distribution: sourcesDistribution,
    top_aspects: topAspects,
    top_themes: topThemes,
    critical_mentions: asNumber(raw.critical_mentions, 0),
    average_urgency: asNumber(raw.average_urgency, 0),
    urgency_score: raw.urgency_score === undefined || raw.urgency_score === null ? undefined : asNumber(raw.urgency_score, 0),
    reputation_score: asNumber(raw.reputation_score, 0),
    sentiment_score: raw.sentiment_score === undefined || raw.sentiment_score === null ? undefined : asNumber(raw.sentiment_score, 0),
    negative_count: raw.negative_count === undefined || raw.negative_count === null ? undefined : asNumber(raw.negative_count, 0),
    trend: asNullableString(raw.trend),
    urgency_trend: urgencyTrend,
    urgency_evolution: urgencyEvolution,
    top_negative_aspects: topNegativeAspects,
    top_negative_aspects_list: topNegativeAspectsList,
    most_cited_aspects: mostCitedAspects,
    top_positive_aspects: topPositiveAspects,
    current_company_id: asNullableString(raw.current_company_id || raw.company_id || raw.companyId),
    current_company_name: asNullableString(raw.current_company_name || raw.company_name || raw.company),
    current_company_slug: asNullableString(raw.current_company_slug || raw.company_slug || raw.slug),
    period_label: resolvePeriodLabel({
      periodLabel: raw.period_label || rootPeriod.label,
      from: raw.period_from || raw.from || rootPeriod.from,
      to: raw.period_to || raw.to || rootPeriod.to,
    }),
    period_from: normalizeDateLike(raw.period_from || raw.from || rootPeriod.from),
    period_to: normalizeDateLike(raw.period_to || raw.to || rootPeriod.to),
    recent_mentions: ensureArray<any>(raw.recent_mentions).map(normalizeMention),
  };
}

export type ChatThread = {
  id: string;
  thread_id: string;
  title: string;
  locale?: string;
  archived?: boolean;
  created_at?: string;
  updated_at?: string;
  last_message_at?: string;
};

export type ChatMessage = {
  id: string;
  message_id: string;
  thread_id: string;
  role: "system" | "user" | "assistant";
  content: string;
  created_at?: string;
};

export class ApiRequestError extends Error {
  status?: number;
  code?: string;
  data?: any;
  path: string;

  constructor(
    message: string,
    params: {
      path: string;
      status?: number;
      code?: string;
      data?: any;
    }
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.path = params.path;
    this.status = params.status;
    this.code = params.code;
    this.data = params.data;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthSession(token: string, user: AuthUser, refreshToken?: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  if (globalThis.window !== undefined) {
    globalThis.window.dispatchEvent(
      new CustomEvent(AUTH_SESSION_CHANGED_EVENT, {
        detail: { authenticated: true },
      })
    );
  }
}

export function clearAuthSession() {
  for (const storageKey of LOCAL_STORAGE_KEYS_TO_CLEAR) {
    localStorage.removeItem(storageKey);
  }

  if (typeof sessionStorage !== "undefined") {
    for (const storageKey of LOCAL_STORAGE_KEYS_TO_CLEAR) {
      sessionStorage.removeItem(storageKey);
    }
  }

  if (typeof document !== "undefined") {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.classList.remove("dark");
  }

  if (globalThis.window !== undefined) {
    globalThis.window.dispatchEvent(
      new CustomEvent(AUTH_SESSION_CHANGED_EVENT, {
        detail: { authenticated: false },
      })
    );
  }
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    clearAuthSession();
    return null;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await requestWithRetry(path, options);
  const data = await parseResponseJson(response);

  if (!response.ok) {
    const message = resolveFriendlyErrorMessage({
      path,
      status: response.status,
      detail: data,
      fallbackKey: "api.requestError",
    });
    throw new ApiRequestError(message, {
      path,
      status: response.status,
      code: extractErrorCode(data),
      data,
    });
  }

  return data as T;
}

export async function rawFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const response = await requestWithRetry(path, options);

  if (!response.ok) {
    const data = await parseResponseJson(response);
    const message = resolveFriendlyErrorMessage({
      path,
      status: response.status,
      detail: data,
      fallbackKey: "api.requestError",
    });
    throw new ApiRequestError(message, {
      path,
      status: response.status,
      code: extractErrorCode(data),
      data,
    });
  }

  return response;
}

async function apiFetchBlob(path: string, options: RequestInit = {}): Promise<{ blob: Blob; filename: string | null }> {
  const response = await requestWithRetry(path, options);

  if (!response.ok) {
    const data = await parseResponseJson(response);
    const message = resolveFriendlyErrorMessage({
      path,
      status: response.status,
      detail: data,
      fallbackKey: "api.reportError",
    });
    throw new ApiRequestError(message, {
      path,
      status: response.status,
      code: extractErrorCode(data),
      data,
    });
  }

  const blob = await response.blob();
  const filename = parseFilenameFromDisposition(response.headers.get("content-disposition"));
  return { blob, filename };
}

export const authApi = {
  register(payload: { name: string; email: string; phone?: string; password: string }) {
    return apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async login(payload: { email: string; password: string; mfa_code?: string }) {
    const data = await apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if ("access_token" in data) {
      setAuthSession(data.access_token, data.user, data.refresh_token);
    }

    return data;
  },
  me() {
    return apiFetch<AuthUser>("/api/auth/me");
  },
  updateProfile(payload: { name?: string; username?: string }) {
    return apiFetch<AuthUser>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  changePassword(payload: { current_password: string; new_password: string }) {
    return apiFetch<{ status: string; message: string }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  mfaStatus() {
    return apiFetch<{ mfa_enabled: boolean; mfa_verified: boolean }>("/api/auth/mfa/status");
  },
  setupMfa() {
    return apiFetch<{ status: string; secret: string; qr_code: string; message: string }>("/api/auth/mfa/setup", {
      method: "POST",
    });
  },
  enableMfa(payload: { code: string }) {
    return apiFetch<{ status: string; message: string }>("/api/auth/mfa/enable", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  verifyMfa(payload: { code: string }) {
    return apiFetch<{ status: string; message: string }>("/api/auth/mfa/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  disableMfa(payload: { password: string }) {
    return apiFetch<{ status: string; message: string }>("/api/auth/mfa/disable", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  requestPasswordReset(payload: { email: string }) {
    return apiFetch<{ status: string; message: string }>("/api/auth/password/forgot", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  resetPassword(payload: { token: string; new_password: string }) {
    return apiFetch<{ status: string; message: string }>("/api/auth/password/reset", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  deleteAccount(options?: { hard_delete?: boolean; delete_related_data?: boolean }) {
    // Contrato oficial: DELETE /api/auth/me (query params opcionais hard_delete/delete_related_data).
    const query = new URLSearchParams();
    if (options?.hard_delete) query.set("hard_delete", "true");
    if (options?.delete_related_data ?? true) query.set("delete_related_data", "true");
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<{ ok: boolean; message?: string }>(`/api/auth/me${suffix}`, {
      method: "DELETE",
    });
  },
  async logout() {
    try {
      await apiFetch<{ status?: string; clear_preferences?: boolean }>("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // Keep logout idempotent on the client even when backend session is already invalid.
    } finally {
      clearAuthSession();
    }
  },
};


export type Mention = {
  id: string;
  brand_id?: string;
  brand_name?: string;
  text: string;
  source: string;
  sentiment: string;
  score?: number | null;
  source_tier?: "S" | "A" | "B" | null;
  criticality: string;
  urgency_score?: number;
  confidence?: number;
  confidence_score?: number | null;
  aspects?: string[];
  urgency_factors?: string[];
  aspect_sentiment?: Record<string, AspectSentimentValue>;
  critical_terms?: string[];
  rating?: number;
  author?: string;
  url?: string;
  published_at?: string;
  created_at?: string;
};

export type DashboardMetrics = {
  total_mentions: number;
  total_comments?: number;
  sentiment_distribution: Record<string, number>;
  source_distribution: Record<string, number>;
  sources_distribution?: Record<string, number>;
  top_aspects: Record<string, number>;
  top_themes?: Record<string, number> | string[];
  critical_mentions: number;
  average_urgency: number;
  urgency_score?: number;
  reputation_score: number;
  sentiment_score?: number;
  negative_count?: number;
  trend?: string;
  urgency_trend?: UrgencyTrendPoint[];
  urgency_evolution?: UrgencyEvolutionPoint[];
  top_negative_aspects?: Record<string, number>;
  top_negative_aspects_list?: AspectMentionsPoint[];
  most_cited_aspects?: AspectMentionsPoint[];
  top_positive_aspects?: AspectMentionsPoint[];
  current_company_id?: string;
  current_company_name?: string;
  current_company_slug?: string;
  period_label?: string;
  period_from?: string;
  period_to?: string;
  recent_mentions?: Mention[];
};

export type DashboardResponse = {
  search_id: string | null;
  batch_id?: string | null;
  query?: string;
  current_company_id?: string;
  current_company_name?: string;
  current_company_slug?: string;
  period_label?: string;
  period_from?: string;
  period_to?: string;
  metrics: Partial<DashboardMetrics>;
  mentions: Mention[];
  latest_insight?: InsightItem | null;
  alerts?: any[];
  llm_analysis?: any;
  errors?: any[];
};

export type InsightItem = {
  id: string;
  insight_id?: string;
  job_id?: string;
  user_id?: string;
  batch_id?: string;
  context_id?: string;
  context_type?: string;
  company?: string;
  company_id?: string;
  company_name?: string;
  company_slug?: string;
  period_label?: string;
  period_from?: string;
  period_to?: string;
  trigger?: string;
  archived?: boolean;
  priority?: string;
  urgency?: string;
  root_cause?: string;
  recommended_action?: string;
  status?: string;
  resolution?: string;
  timestamp?: string;
  executive_summary?: string;
  sentiment_overview?: string;
  risks?: string[];
  opportunities?: string[];
  recommended_actions?: string[];
  decision_guidance?: string;
  trend?: string;
  avg_confidence?: number;
  created_at?: string;
  updated_at?: string;
};

export type MetricsResponse = {
  company_id?: string;
  company_name?: string;
  company_slug?: string;
  period_label?: string;
  period_from?: string;
  period_to?: string;
  total_mentions: number;
  sentiment_distribution: Record<string, number>;
  average_urgency: number;
  urgency_evolution: UrgencyEvolutionPoint[];
  top_negative_aspects: AspectMentionsPoint[];
  top_positive_aspects: AspectMentionsPoint[];
  most_cited_aspects: AspectMentionsPoint[];
};

export type InsightsResponse = {
  items: InsightItem[];
};

export type ReportsListItem = {
  id: string;
  company_id?: string;
  company_name: string;
  company_slug?: string;
  period_label: string;
  period_from?: string;
  period_to?: string;
  created_at?: string;
  format?: string;
};

export type ReportsListResponse = {
  items: ReportsListItem[];
  total: number;
};

export type CookieConsentPreferences = {
  cookies_estritamente_necessarios: true;
  cookies_analiticos: boolean;
  cookies_personalizacao: boolean;
  cookies_treinamento_ia: boolean;
};

export type PrivacyConsentPayload = {
  session_id: string;
  analytics?: boolean;
  marketing?: boolean;
  accepted?: boolean;
  consent?: CookieConsentPreferences;
};

export type NpsMetrics = {
  total_responses: number;
  promoters: number;
  passives: number;
  detractors: number;
  nps_score: number;
  average_score: number;
  by_module: Record<string, { total: number; average: number; nps_score: number; promoters: number; detractors: number }>;
  recent_comments: Array<{ comment: string; score: number; module_key: string; created_at: string }>;
};

export type ExecutionStatus = "success" | "partial_success" | "empty" | "failed";

export type SourceExecutionStatus = {
  source: string;
  ok: boolean;
  count: number;
  error?: string | null;
  reason?: string | null;
  timeout?: boolean;
};

export type ExecutionStatusSummary = {
  status: ExecutionStatus;
  partial_success: boolean;
  message?: string;
  sources_requested?: number;
  sources_with_data?: number;
  sources_failed?: number;
  timeout_sources?: string[];
  source_status?: SourceExecutionStatus[];
  unmapped_error_count?: number;
};

export type SearchResponse = {
  search_id: string;
  query?: string;
  cached?: boolean;
  status?: ExecutionStatus;
  partial_success?: boolean;
  status_summary?: ExecutionStatusSummary;
  total: number;
  mentions: Mention[];
  metrics: Partial<DashboardMetrics>;
  llm_analysis?: any;
  alerts?: any[];
  errors?: Array<{ source?: string; error?: string; reason?: string; timeout?: boolean } | string>;
};

export type IngestItemError = {
  index: number;
  field?: string;
  message: string;
  code?: string;
};

export type IngestResponse = {
  received: number;
  inserted: number;
  duplicates: number;
  batch_id?: string;
  status?: string;
  rejected_count?: number;
  rejected_messages?: string[];
  errors: IngestItemError[];
  message?: string;
};

export type IngestionBatch = {
  batch_id: string;
  status?: string;
  received_count: number;
  inserted_count: number;
  duplicate_count: number;
  company_slugs: string[];
  sources: string[];
  created_at?: string;
  updated_at?: string;
};

export type StagingComment = {
  id: string;
  user_id?: string;
  batch_id?: string;
  company_name?: string;
  company_slug?: string;
  source: string;
  text: string;
  author?: string;
  location?: string;
  published_at?: string;
  url?: string;
  external_id?: string;
};

export type StagingCommentsResponse = {
  total: number;
  limit: number;
  offset: number;
  items: StagingComment[];
};

export type CommitResponse = {
  commit_id: string | null;
  status?: string;
  selected: number;
  inserted: number;
  committed_at?: string;
  batch_id?: string;
  company_slug?: string;
  source?: string;
};

export type AlertItem = {
  id: string;
  title?: string;
  message?: string;
  severity?: string;
  search_id?: string;
  created_at?: string;
  [key: string]: unknown;
};

export type AdminUser = {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  is_active?: boolean;
  created_at?: string;
  [key: string]: unknown;
};

export type AdminAuditLog = {
  id: string;
  action?: string;
  user_id?: string;
  detail?: string;
  created_at?: string;
  [key: string]: unknown;
};

export type AdminSystemStats = Record<string, unknown>;

export type HealthResponse = {
  status: string;
  version?: string;
};

type IntegrationStatusResponse = {
  ingestion_json_enabled?: boolean;
  mongodb_secondary_configured?: boolean;
  ingestion_staging_collection?: string;
  [key: string]: unknown;
};

function normalizeIngestionBatch(item: unknown): IngestionBatch {
  const raw = ensureObject(item);
  return {
    batch_id: asString(raw.batch_id || raw.id || raw._id, "unknown"),
    status: asNullableString(raw.status),
    received_count: Math.max(0, Math.round(asNumber(raw.received_count ?? raw.received, 0))),
    inserted_count: Math.max(0, Math.round(asNumber(raw.inserted_count ?? raw.inserted, 0))),
    duplicate_count: Math.max(0, Math.round(asNumber(raw.duplicate_count ?? raw.duplicates, 0))),
    company_slugs: ensureArray<string>(raw.company_slugs),
    sources: ensureArray<string>(raw.sources),
    created_at: asNullableString(raw.created_at),
    updated_at: asNullableString(raw.updated_at),
  };
}

function normalizeStagingComment(item: unknown): StagingComment {
  const raw = ensureObject(item);
  return {
    id: asString(raw.id || raw._id || raw.external_id, "unknown"),
    user_id: asNullableString(raw.user_id),
    batch_id: asNullableString(raw.batch_id),
    company_name: asNullableString(raw.company_name),
    company_slug: asNullableString(raw.company_slug),
    source: asString(raw.source, "web"),
    text: asString(raw.text || raw.snippet, ""),
    author: asNullableString(raw.author),
    location: asNullableString(raw.location),
    published_at: asNullableString(raw.published_at),
    url: asNullableString(raw.url || raw.canonical_url),
    external_id: asNullableString(raw.external_id),
  };
}

let ingestionCompatibilityChecked = false;

async function assertSecondaryIngestionBackendCompatible(): Promise<void> {
  if (ingestionCompatibilityChecked) return;

  const raw = await apiFetch<any>("/api/status/integrations");
  const status = ensureObject(raw) as IntegrationStatusResponse;
  const debugKeys = Object.keys(status).sort().join(",");
  const hasSecondaryPipeline =
    status.ingestion_json_enabled === true &&
    typeof status.ingestion_staging_collection === "string";

  if (!hasSecondaryPipeline) {
    throw new Error(
      `Backend incompatível com ingestão em banco secundário (API=${API_BASE_URL || "N/A"}). ` +
      `Resposta de /api/status/integrations não contém o contrato esperado. Chaves recebidas: [${debugKeys}]`
    );
  }

  if (status.mongodb_secondary_configured !== true) {
    throw new Error(
      `MongoDB secundário não configurado no backend (API=${API_BASE_URL || "N/A"}). ` +
      "Defina SECONDARY_MONGODB_URI e SECONDARY_DATABASE_NAME no deploy."
    );
  }

  ingestionCompatibilityChecked = true;
}

function normalizeExecutionStatus(value: unknown, fallback: ExecutionStatus = "success"): ExecutionStatus {
  const normalized = asString(value, "").toLowerCase();
  if (normalized === "success" || normalized === "partial_success" || normalized === "empty" || normalized === "failed") {
    return normalized;
  }
  return fallback;
}

function normalizeStatusSummary(value: unknown): ExecutionStatusSummary | undefined {
  const raw = ensureObject(value);
  if (Object.keys(raw).length === 0) return undefined;

  const sourceStatus = ensureArray<any>(raw.source_status).map((entry) => {
    const item = ensureObject(entry);
    return {
      source: asString(item.source, "unknown"),
      ok: Boolean(item.ok),
      count: asNumber(item.count, 0),
      error: asNullableString(item.error) ?? null,
      reason: asNullableString(item.reason) ?? null,
      timeout: Boolean(item.timeout),
    };
  });

  return {
    status: normalizeExecutionStatus(raw.status, "success"),
    partial_success: Boolean(raw.partial_success),
    message: asNullableString(raw.message),
    sources_requested: raw.sources_requested === undefined ? undefined : asNumber(raw.sources_requested, 0),
    sources_with_data: raw.sources_with_data === undefined ? undefined : asNumber(raw.sources_with_data, 0),
    sources_failed: raw.sources_failed === undefined ? undefined : asNumber(raw.sources_failed, 0),
    timeout_sources: ensureArray<string>(raw.timeout_sources),
    source_status: sourceStatus,
    unmapped_error_count: raw.unmapped_error_count === undefined ? undefined : asNumber(raw.unmapped_error_count, 0),
  };
}

export const sentimentApi = {
  rawFetch(path: string, options: RequestInit = {}) {
    return rawFetch(path, options);
  },
  async dashboard(params?: {
    batch_id?: string;
    period_days?: number;
    limit_mentions?: number;
    company_id?: string;
    company_slug?: string;
    from?: string;
    to?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.batch_id) query.set("batch_id", params.batch_id);
    if (params?.period_days) query.set("period_days", String(params.period_days));
    if (params?.limit_mentions) query.set("limit_mentions", String(params.limit_mentions));
    if (params?.company_id) query.set("companyId", params.company_id);
    if (params?.company_slug) query.set("companySlug", params.company_slug);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const raw = await apiFetch<any>(`/api/dashboard${suffix}`);
    const data = ensureObject(raw);
    const mentions = ensureArray<any>(data.mentions).map(normalizeMention);
    const normalizedMetrics = normalizeDashboardMetrics(
      {
        ...ensureObject(data.metrics),
        urgency_trend: data.urgency_trend ?? data.metrics?.urgency_trend,
        top_negative_aspects: data.top_negative_aspects ?? data.metrics?.top_negative_aspects,
      },
      mentions
    );

    return {
      search_id: asNullableString(data.search_id || data.batch_id) ?? null,
      batch_id: asNullableString(data.batch_id || data.search_id) ?? null,
      query: asNullableString(data.query),
      current_company_id:
        asNullableString(data.current_company_id || data.company_id || normalizedMetrics.current_company_id),
      current_company_name:
        asNullableString(data.current_company_name || data.company_name || normalizedMetrics.current_company_name),
      current_company_slug:
        asNullableString(data.current_company_slug || data.company_slug || normalizedMetrics.current_company_slug),
      period_label: asNullableString(data.period_label || normalizedMetrics.period_label),
      period_from: asNullableString(data.period_from || normalizedMetrics.period_from),
      period_to: asNullableString(data.period_to || normalizedMetrics.period_to),
      metrics: normalizedMetrics,
      mentions,
      latest_insight: data.latest_insight ? normalizeInsight(data.latest_insight) : null,
      alerts: ensureArray<any>(data.alerts),
      llm_analysis: ensureObject(data.llm_analysis),
      errors: normalizeSearchErrors(data.errors),
    };
  },
  async search(payload: {
    brand_name?: string;
    query?: string;
    sources: string[];
    from?: string;
    to?: string;
    locality?: string;
    replace_existing?: boolean;
    limit?: number;
    sentiment_filter?: string;
    min_criticality?: string;
  }) {
    const requestPayload = {
      ...payload,
      period_from: payload.from,
      period_to: payload.to,
    };

    const raw = await apiFetch<any>("/api/search", {
      method: "POST",
      body: JSON.stringify(requestPayload),
    });

    const data = ensureObject(raw);
    const mentions = ensureArray<any>(data.mentions).map(normalizeMention);
    const statusSummary = normalizeStatusSummary(data.status_summary);
    const fallbackStatus = mentions.length > 0 ? "success" : "empty";
    const status = normalizeExecutionStatus(data.status || statusSummary?.status, fallbackStatus);
    const partialSuccess = Boolean(data.partial_success ?? statusSummary?.partial_success ?? status === "partial_success");

    return {
      search_id: asString(data.search_id, ""),
      query: asNullableString(data.query || payload.brand_name || payload.query),
      cached: Boolean(data.cached),
      status,
      partial_success: partialSuccess,
      status_summary: statusSummary,
      total: asNumber(data.total ?? data.total_importado, mentions.length),
      mentions,
      metrics: normalizeDashboardMetrics(data.metrics, mentions),
      llm_analysis: ensureObject(data.llm_analysis),
      alerts: ensureArray<any>(data.alerts),
      errors: normalizeSearchErrors(data.errors),
    } as SearchResponse;
  },
  async mentions(params?: {
    company_id?: string;
    company_slug?: string;
    from?: string;
    to?: string;
    status?: string;
    sentiment?: string;
    limit?: number;
  }) {
    // Contrato oficial /api/mentions: companyId/companySlug, from/to, status, sentiment, limit.
    const query = new URLSearchParams();
    if (params?.company_id) query.set("companyId", params.company_id);
    if (params?.company_slug) query.set("companySlug", params.company_slug);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);

    const resolvedStatus = asNullableString(params?.status);
    if (resolvedStatus && resolvedStatus !== "all") query.set("status", resolvedStatus);

    const resolvedSentiment = asNullableString(params?.sentiment);
    if (resolvedSentiment && resolvedSentiment !== "all") query.set("sentiment", resolvedSentiment);

    if (typeof params?.limit === "number" && Number.isFinite(params.limit)) {
      query.set("limit", String(Math.max(1, Math.min(Math.round(params.limit), 1000))));
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";
    const raw = await apiFetch<any>(`/api/mentions${suffix}`);
    const payload = ensureObject(raw);
    const items = Array.isArray(raw)
      ? raw
      : ensureArray<any>(payload.items || payload.mentions || payload.data);
    return items.map(normalizeMention);
  },
  async insights(params?: {
    batch_id?: string;
    include_archived?: boolean;
    limit?: number;
    priority?: string;
    resolution?: string;
    urgency?: string;
    company_id?: string;
    company_slug?: string;
    from?: string;
    to?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.batch_id) query.set("batch_id", params.batch_id);
    if (params?.include_archived) query.set("include_archived", "true");
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.priority) query.set("priority", params.priority);
    if (params?.resolution) query.set("resolution", params.resolution);
    if (params?.urgency) query.set("urgency", params.urgency);
    if (params?.company_id) query.set("companyId", params.company_id);
    if (params?.company_slug) query.set("companySlug", params.company_slug);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const raw = await apiFetch<any>(`/api/insights${suffix}`);
    const data = ensureObject(raw);
    return {
      items: ensureArray<any>(data.items).map(normalizeInsight),
    };
  },
  async listCompanies(): Promise<CompanyItem[]> {
    const raw = await apiFetch<any>("/api/companies");
    const data = ensureObject(raw);
    const rawItems = Array.isArray(raw)
      ? raw
      : ensureArray<any>(data.items || data.companies || data.data);

    return rawItems
      .map((item) => normalizeCompany(item))
      .filter((item): item is CompanyItem => item !== null);
  },
  async generateInsight(payload?: {
    batch_id?: string;
    force?: boolean;
    company_id?: string;
    company_slug?: string;
    from?: string;
    to?: string;
  }) {
    const requestPayload: Record<string, unknown> = {
      batch_id: payload?.batch_id ?? null,
      force: Boolean(payload?.force),
    };

    if (payload?.company_id) requestPayload.company_id = payload.company_id;
    if (payload?.company_slug) requestPayload.company_slug = payload.company_slug;
    // Contrato oficial usa period_from/period_to no corpo de /api/insights/generate.
    if (payload?.from) requestPayload.period_from = payload.from;
    if (payload?.to) requestPayload.period_to = payload.to;

    const raw = await apiFetch<any>("/api/insights/generate", {
      method: "POST",
      body: JSON.stringify(requestPayload),
    });
    const data = ensureObject(raw);
    return {
      ok: Boolean(data.ok),
      item: normalizeInsight(data.item),
    };
  },
  archiveInsight(insightId: string) {
    return apiFetch<{ ok: boolean }>(`/api/insights/${encodeURIComponent(insightId)}/archive`, {
      method: "POST",
    });
  },
  deleteInsight(insightId: string) {
    return apiFetch<{ ok: boolean }>(`/api/insights/${encodeURIComponent(insightId)}`, {
      method: "DELETE",
    });
  },
  async regenerateInsight(insightId: string) {
    const raw = await apiFetch<any>(`/api/insights/${encodeURIComponent(insightId)}/regenerate`, {
      method: "POST",
    });
    const data = ensureObject(raw);
    return {
      ok: Boolean(data.ok),
      item: normalizeInsight(data.item),
    };
  },
  getSettings() {
    return apiFetch<UserSettings>("/api/settings");
  },
  updateSettings(payload: UserSettings) {
    return apiFetch<UserSettings>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  async exportInsightsPdf(params?: {
    priority?: string;
    resolution?: string;
    companyId?: string;
    companySlug?: string;
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<void> {
    // Contrato oficial: GET /api/reports/export/insights.pdf.
    const query = new URLSearchParams();
    if (params?.priority) query.set("priority", params.priority);
    if (params?.resolution) query.set("resolution", params.resolution);
    if (params?.companySlug) query.set("companySlug", params.companySlug);
    else if (params?.companyId) query.set("companyId", params.companyId);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.limit) query.set("limit", String(params.limit));

    const suffix = query.toString() ? `?${query.toString()}` : "";
    const { blob, filename } = await apiFetchBlob(`/api/reports/export/insights.pdf${suffix}`);
    triggerBlobDownload(blob, filename || `insights-${new Date().toISOString().slice(0, 10)}.pdf`);
  },
  async listChatThreads(limit = 20) {
    const raw = await apiFetch<any>(`/api/chat/threads?limit=${Math.max(1, Math.min(limit, 200))}`);
    const data = ensureObject(raw);
    return {
      items: ensureArray<any>(data.items).map(normalizeChatThread),
    };
  },
  async createChatThread(payload?: { title?: string }) {
    const raw = await apiFetch<any>("/api/chat/threads", {
      method: "POST",
      body: JSON.stringify({ title: payload?.title ?? null }),
    });
    const data = ensureObject(raw);
    return {
      item: normalizeChatThread(data.item),
    };
  },
  async listChatMessages(threadId: string, limit = 100) {
    const raw = await apiFetch<any>(
      `/api/chat/threads/${encodeURIComponent(threadId)}/messages?limit=${Math.max(1, Math.min(limit, 500))}`
    );
    const data = ensureObject(raw);
    return {
      items: ensureArray<any>(data.items).map((item) => normalizeChatMessage(item)),
    };
  },
  async sendChatMessage(threadId: string, content: string) {
    const raw = await apiFetch<any>(`/api/chat/threads/${encodeURIComponent(threadId)}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });

    const data = ensureObject(raw);
    const threadPayload = ensureObject(data.thread);
    const resolvedThreadId = asString(threadPayload.thread_id || threadPayload.id || threadId, threadId);
    const userPayload = resolveChatMessagePayload(data, "user");
    const assistantPayload = resolveChatMessagePayload(data, "assistant");

    return {
      thread: normalizeChatThread({
        ...threadPayload,
        id: asString(threadPayload.id, resolvedThreadId),
        thread_id: resolvedThreadId,
      }),
      user_message: normalizeChatMessage(userPayload, {
        role: "user",
        content,
        threadId: resolvedThreadId,
      }),
      assistant_message: normalizeChatMessage(assistantPayload, {
        role: "assistant",
        content: resolveChatMessageContent(data),
        threadId: resolvedThreadId,
      }),
    };
  },
  deleteChatThread(threadId: string) {
    return apiFetch<{ ok: boolean }>(`/api/chat/threads/${encodeURIComponent(threadId)}`, {
      method: "DELETE",
    });
  },
  deleteChatMessage(threadId: string, messageId: string) {
    return apiFetch<{ ok: boolean }>(
      `/api/chat/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(messageId)}`,
      { method: "DELETE" }
    );
  },
  deleteAllChatThreads() {
    return apiFetch<{ ok: boolean }>("/api/chat/threads", { method: "DELETE" });
  },
  async analyze(payload: { text: string; brand_name?: string; source?: string }) {
    const raw = await apiFetch<any>("/api/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return normalizeMention(raw);
  },
  npsSubmit(payload: {
    session_id: string;
    score: number;
    comment?: string;
    module_key?: string;
    route?: string;
    context_metadata?: Record<string, unknown>;
  }) {
    return apiFetch<{ ok: boolean }>("/api/nps/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  npsDismiss(payload: { session_id: string; module_key?: string; route?: string }) {
    return apiFetch<{ ok: boolean }>("/api/nps/dismiss", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async npsCheck(sessionId: string) {
    const raw = await apiFetch<any>(
      `/api/nps/check?session_id=${encodeURIComponent(sessionId)}`
    );
    const data = ensureObject(raw);
    return {
      should_show: Boolean(data.should_show),
      trigger: asNullableString(data.trigger) ?? null,
    };
  },
  async npsMetrics(params?: { period_days?: number; module_key?: string }) {
    const query = new URLSearchParams();
    if (params?.period_days) query.set("period_days", String(params.period_days));
    if (params?.module_key) query.set("module_key", params.module_key);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const raw = await apiFetch<any>(`/api/nps/metrics${suffix}`);
    const data = ensureObject(raw);
    return {
      total_responses: asNumber(data.total_responses, 0),
      promoters: asNumber(data.promoters, 0),
      passives: asNumber(data.passives, 0),
      detractors: asNumber(data.detractors, 0),
      nps_score: asNumber(data.nps_score, 0),
      average_score: asNumber(data.average_score, 0),
      by_module: ensureObject(data.by_module) as NpsMetrics["by_module"],
      recent_comments: ensureArray<any>(data.recent_comments).map((item) => {
        const rawComment = ensureObject(item);
        return {
          comment: asString(rawComment.comment, ""),
          score: asNumber(rawComment.score, 0),
          module_key: asString(rawComment.module_key, "geral"),
          created_at: asString(rawComment.created_at, ""),
        };
      }),
    };
  },
  async metrics(params?: {
    company_id?: string;
    company_slug?: string;
    from?: string;
    to?: string;
    period_days?: number;
  }): Promise<MetricsResponse> {
    const query = new URLSearchParams();
    if (params?.company_id) query.set("companyId", params.company_id);
    if (params?.company_slug) query.set("companySlug", params.company_slug);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (typeof params?.period_days === "number" && Number.isFinite(params.period_days)) {
      query.set("period_days", String(Math.max(1, Math.min(Math.round(params.period_days), 365))));
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";
    const raw = await apiFetch<any>(`/api/metrics${suffix}`);
    return normalizeMetricsResponse(raw);
  },
  async reports(params?: {
    company_id?: string;
    company_slug?: string;
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<ReportsListResponse> {
    const query = new URLSearchParams();
    if (params?.company_id) query.set("companyId", params.company_id);
    if (params?.company_slug) query.set("companySlug", params.company_slug);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (typeof params?.limit === "number" && Number.isFinite(params.limit)) {
      query.set("limit", String(Math.max(1, Math.min(Math.round(params.limit), 500))));
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";
    const raw = await apiFetch<any>(`/api/reports${suffix}`);
    const data = ensureObject(raw);
    const rawItems = Array.isArray(raw)
      ? raw
      : ensureArray<any>(data.items || data.reports || data.data);

    const items = rawItems
      .map((item) => normalizeReportItem(item))
      .filter((item): item is ReportsListItem => item !== null);

    return {
      items,
      total: Math.max(0, Math.round(asNumber(data.total, items.length))),
    };
  },
  async ingest(payload: Record<string, unknown> | Record<string, unknown>[]): Promise<IngestResponse> {
    await assertSecondaryIngestionBackendCompatible();

    const raw = await apiFetch<any>(API_INGEST_PATH, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = ensureObject(raw);
    const rejectedItems = ensureArray<any>(data.rejected_items).map((entry) => {
      const item = ensureObject(entry);
      return {
        index: -1,
        field: asNullableString(item.external_id) ?? undefined,
        message: asString(item.reason, "Erro de validacao"),
        code: asNullableString(item.code) ?? undefined,
      } as IngestItemError;
    });
    const errors = normalizeIngestErrors(data.errors || data.validation_errors || data.invalid_items);
    const mergedErrors = errors.length > 0 ? errors : rejectedItems;
    const payloadItemsCount = Array.isArray(payload)
      ? payload.length
      : ensureArray<any>(ensureObject(payload).mentions).length;
    const received = Math.max(
      0,
      Math.round(
        asNumber(data.received ?? data.total_received ?? data.total ?? data.count, payloadItemsCount)
      )
    );
    const inserted = Math.max(0, Math.round(asNumber(data.inserted ?? data.accepted ?? data.success_count, 0)));
    const duplicates = Math.max(0, Math.round(asNumber(data.duplicates ?? data.duplicate_count, 0)));
    const rejectedCount = Math.max(
      0,
      Math.round(asNumber(data.rejected_count ?? data.rejected ?? data.invalid_count ?? mergedErrors.length, mergedErrors.length))
    );
    const rejectedMessages = mergedErrors
      .map((item) => item.message)
      .filter((item) => item.length > 0)
      .slice(0, 5);

    return {
      received,
      inserted,
      duplicates,
      batch_id: asNullableString(data.batch_id) ?? undefined,
      status: asNullableString(data.status) ?? undefined,
      rejected_count: rejectedCount,
      rejected_messages: rejectedMessages.length > 0 ? rejectedMessages : undefined,
      errors: mergedErrors,
      message: asNullableString(data.message) ?? undefined,
    };
  },
  // --- Ingestão: staging e commit para o primário (fluxo recomendado da doc) ---
  async listIngestionBatches(limit = 20): Promise<{ items: IngestionBatch[] }> {
    const safeLimit = Math.max(1, Math.min(Math.round(limit || 20), 100));
    const raw = await apiFetch<any>(`/api/ingestion/batches?limit=${safeLimit}`);
    const data = ensureObject(raw);
    const rawItems = Array.isArray(raw) ? raw : ensureArray<any>(data.items);
    return { items: rawItems.map(normalizeIngestionBatch) };
  },
  async getIngestionBatch(batchId: string): Promise<{ batch: IngestionBatch; recent_mentions: Mention[] }> {
    const raw = await apiFetch<any>(`/api/ingestion/batches/${encodeURIComponent(batchId)}`);
    const data = ensureObject(raw);
    return {
      batch: normalizeIngestionBatch(data.batch ?? data),
      recent_mentions: ensureArray<any>(data.recent_mentions).map(normalizeMention),
    };
  },
  async listStagingComments(params?: {
    batch_id?: string;
    company_id?: string;
    company_slug?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }): Promise<StagingCommentsResponse> {
    const query = new URLSearchParams();
    if (params?.batch_id) query.set("batch_id", params.batch_id);
    if (params?.company_id) query.set("companyId", params.company_id);
    if (params?.company_slug) query.set("companySlug", params.company_slug);
    if (params?.source) query.set("source", params.source);
    if (typeof params?.limit === "number" && Number.isFinite(params.limit)) {
      query.set("limit", String(Math.max(1, Math.min(Math.round(params.limit), 1000))));
    }
    if (typeof params?.offset === "number" && Number.isFinite(params.offset)) {
      query.set("offset", String(Math.max(0, Math.round(params.offset))));
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const raw = await apiFetch<any>(`/api/ingestion/staging/comments${suffix}`);
    const data = ensureObject(raw);
    return {
      total: Math.max(0, Math.round(asNumber(data.total, 0))),
      limit: asNumber(data.limit, 100),
      offset: asNumber(data.offset, 0),
      items: ensureArray<any>(data.items).map(normalizeStagingComment),
    };
  },
  async commitStaging(payload: {
    batch_id?: string;
    staging_ids?: string[];
    company_id?: string;
    company_slug?: string;
    source?: string;
    limit?: number;
  }): Promise<CommitResponse> {
    const body: Record<string, unknown> = {};
    if (payload.batch_id) body.batch_id = payload.batch_id;
    if (payload.staging_ids && payload.staging_ids.length > 0) body.staging_ids = payload.staging_ids;
    if (payload.company_id) body.companyId = payload.company_id;
    if (payload.company_slug) body.companySlug = payload.company_slug;
    if (payload.source) body.source = payload.source;
    if (typeof payload.limit === "number" && Number.isFinite(payload.limit)) {
      body.limit = Math.max(1, Math.round(payload.limit));
    }

    const raw = await apiFetch<any>("/api/ingestion/commit", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = ensureObject(raw);
    return {
      commit_id: asNullableString(data.commit_id) ?? null,
      status: asNullableString(data.status),
      selected: Math.max(0, Math.round(asNumber(data.selected, 0))),
      inserted: Math.max(0, Math.round(asNumber(data.inserted, 0))),
      committed_at: asNullableString(data.committed_at),
      batch_id: asNullableString(data.batch_id),
      company_slug: asNullableString(data.company_slug),
      source: asNullableString(data.source),
    };
  },
  // --- Alertas (standalone) ---
  async alerts(params?: { search_id?: string }): Promise<AlertItem[]> {
    const suffix = params?.search_id ? `?search_id=${encodeURIComponent(params.search_id)}` : "";
    const raw = await apiFetch<any>(`/api/alerts${suffix}`);
    const data = ensureObject(raw);
    const rawItems = Array.isArray(raw) ? raw : ensureArray<any>(data.items || data.alerts || data.data);
    return rawItems.map((item) => {
      const rawItem = ensureObject(item);
      return {
        ...rawItem,
        id: asString(rawItem.id || rawItem._id, "unknown"),
      } as AlertItem;
    });
  },
  // --- Sistema / diagnóstico ---
  health(): Promise<HealthResponse> {
    return apiFetch<HealthResponse>("/health");
  },
  integrationsStatus(): Promise<IntegrationStatusResponse> {
    return apiFetch<IntegrationStatusResponse>("/api/status/integrations");
  },
  // --- Privacidade (LGPD) ---
  getPrivacyPolicy(): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>("/api/privacy/policy");
  },
  getPrivacyRights(): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>("/api/privacy/rights");
  },
  getConsent(sessionId?: string): Promise<Record<string, unknown>> {
    const suffix = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
    return apiFetch<Record<string, unknown>>(`/api/privacy/consent${suffix}`);
  },
  getPrivacyExportSummary(): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>("/api/privacy/export-summary");
  },
  // --- Administração (somente role admin) ---
  async adminUsers(params?: { limit?: number; skip?: number }): Promise<AdminUser[]> {
    const query = new URLSearchParams();
    if (typeof params?.limit === "number") query.set("limit", String(Math.max(1, Math.round(params.limit))));
    if (typeof params?.skip === "number") query.set("skip", String(Math.max(0, Math.round(params.skip))));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const raw = await apiFetch<any>(`/api/admin/users${suffix}`);
    const data = ensureObject(raw);
    const rawItems = Array.isArray(raw) ? raw : ensureArray<any>(data.items || data.users || data.data);
    return rawItems.map((item) => {
      const rawItem = ensureObject(item);
      return { ...rawItem, id: asString(rawItem.id || rawItem._id, "unknown") } as AdminUser;
    });
  },
  async adminAuditLogs(params?: { action?: string; limit?: number; skip?: number }): Promise<AdminAuditLog[]> {
    const query = new URLSearchParams();
    if (params?.action) query.set("action", params.action);
    if (typeof params?.limit === "number") query.set("limit", String(Math.max(1, Math.round(params.limit))));
    if (typeof params?.skip === "number") query.set("skip", String(Math.max(0, Math.round(params.skip))));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const raw = await apiFetch<any>(`/api/admin/audit-logs${suffix}`);
    const data = ensureObject(raw);
    const rawItems = Array.isArray(raw) ? raw : ensureArray<any>(data.items || data.logs || data.data);
    return rawItems.map((item) => {
      const rawItem = ensureObject(item);
      return { ...rawItem, id: asString(rawItem.id || rawItem._id, "unknown") } as AdminAuditLog;
    });
  },
  adminSystemStats(): Promise<AdminSystemStats> {
    return apiFetch<AdminSystemStats>("/api/admin/system-stats");
  },
  adminToggleUserActive(targetUserId: string): Promise<{ ok: boolean; is_active?: boolean }> {
    return apiFetch<{ ok: boolean; is_active?: boolean }>(
      `/api/admin/users/${encodeURIComponent(targetUserId)}/toggle-active`,
      { method: "POST" }
    );
  },
  async adminAlerts(params?: { severity?: string }): Promise<AlertItem[]> {
    const suffix = params?.severity ? `?severity=${encodeURIComponent(params.severity)}` : "";
    const raw = await apiFetch<any>(`/api/admin/alerts${suffix}`);
    const data = ensureObject(raw);
    const rawItems = Array.isArray(raw) ? raw : ensureArray<any>(data.items || data.alerts || data.data);
    return rawItems.map((item) => {
      const rawItem = ensureObject(item);
      return { ...rawItem, id: asString(rawItem.id || rawItem._id, "unknown") } as AlertItem;
    });
  },
  privacyConsent(payload: PrivacyConsentPayload) {
    const preferences = payload.consent;
    const analytics =
      payload.analytics ??
      (preferences ? Boolean(preferences.cookies_analiticos) : false);
    const marketing =
      payload.marketing ??
      (preferences
        ? Boolean(preferences.cookies_personalizacao || preferences.cookies_treinamento_ia)
        : false);

    return apiFetch<{ ok: boolean }>("/api/privacy/consent", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        analytics,
        marketing,
        accepted: payload.accepted ?? true,
      }),
    });
  },
  async searchHistory(limit = 20) {
    const raw = await apiFetch<any>(
      `/api/search/history?limit=${Math.max(1, Math.min(limit, 100))}`
    );
    const data = ensureObject(raw);
    return {
      history: ensureArray<any>(data.history).map((item) => {
        const rawItem = ensureObject(item);
        return {
          search_id: asNullableString(rawItem.search_id),
          query: asNullableString(rawItem.query),
          created_at: asNullableString(rawItem.created_at),
          status: asNullableString(rawItem.status),
        };
      }),
    };
  },
  deleteSearch(id: string) {
    return apiFetch<{ ok: boolean }>(`/api/searches/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
  deleteAllSearches() {
    return apiFetch<{ ok: boolean }>("/api/searches/all", { method: "DELETE" });
  },
  deleteAllInsights() {
    return apiFetch<{ ok: boolean }>("/api/insights/all", { method: "DELETE" });
  },
  deleteAllUserData() {
    return apiFetch<{ ok: boolean; message: string }>("/api/user/data/all", { method: "DELETE" });
  },
};

// Mapeia (formato + fonte) para o caminho oficial de export documentado.
// Contrato: /api/reports/export/{mentions.csv,dashboard.pdf,insights.pdf,metrics.pdf}.
function resolveReportExportPath(format: "csv" | "pdf", source?: string): string {
  if (format === "csv") return "mentions.csv";
  const normalized = (source || "dashboard").toLowerCase();
  if (normalized === "metrics") return "metrics.pdf";
  if (normalized === "insights") return "insights.pdf";
  return "dashboard.pdf";
}

export async function downloadReport(
  format: "csv" | "pdf",
  params?: {
    source?: string;
    filename?: string;
    company_id?: string;
    company_slug?: string;
    from?: string;
    to?: string;
  }
) {
  const query = new URLSearchParams();
  if (params?.company_id) query.set("companyId", params.company_id);
  if (params?.company_slug) query.set("companySlug", params.company_slug);
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);

  const exportPath = resolveReportExportPath(format, params?.source);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const { blob, filename } = await apiFetchBlob(`/api/reports/export/${exportPath}${suffix}`);
  const resolvedFilename =
    filename ||
    params?.filename ||
    (format === "csv" ? "relatorio_sentimento.csv" : "relatorio_sentimento.pdf");
  triggerBlobDownload(blob, resolvedFilename);
}


