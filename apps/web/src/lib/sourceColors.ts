const normalizeSource = (source: string): string =>
  String(source || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

export const SOURCE_COLORS: Record<string, string> = {
  reddit: "#FF4500",
  youtube: "#FF0000",
  appstore: "#0D96F6",
  playstore: "#34A853",
  googleplay: "#34A853",
  trustpilot: "#00B67A",
  glassdoor: "#0CAA41",
  reclameaqui: "#E8232A",
  mastodon: "#6364FF",
  web: "#6B7280",
};

export const SOURCE_LABELS: Record<string, string> = {
  reddit: "Reddit",
  youtube: "YouTube",
  appstore: "App Store",
  playstore: "Google Play",
  googleplay: "Google Play",
  trustpilot: "Trustpilot",
  glassdoor: "Glassdoor",
  reclameaqui: "Reclame Aqui",
  mastodon: "Mastodon",
  web: "Web (Mar Aberto)",
};

export function getSourceColor(source: string): string {
  const key = normalizeSource(source);
  return SOURCE_COLORS[key] ?? SOURCE_COLORS.web;
}

export function getSourceLabel(source: string): string {
  const key = normalizeSource(source);
  return SOURCE_LABELS[key] ?? SOURCE_LABELS.web;
}
