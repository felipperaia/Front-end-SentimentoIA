import { BrandMark } from "@/components/BrandMark";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const { t } = useAppSettings();
  const [, setLocation] = useLocation();

  return (
    <div className="app-bg flex min-h-screen items-center justify-center p-4">
      <section className="app-panel w-full max-w-lg p-8 text-center">
        <BrandMark className="mx-auto mb-7 w-fit" />
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-7 w-7" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-semibold">{t("notFound.title")}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">{t("notFound.text")}</p>
        <button onClick={() => setLocation("/")} className="primary-btn mx-auto mt-7">
          <Home className="h-4 w-4" />
          <span>{t("common.goHome")}</span>
        </button>
      </section>
    </div>
  );
}
