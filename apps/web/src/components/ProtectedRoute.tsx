import { useAuth } from "@/_core/hooks/useAuth";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { lazy, Suspense } from "react";

const DomainChatWidget = lazy(() =>
  import("@/components/DomainChatWidget").then((module) => ({ default: module.DomainChatWidget }))
);

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { t } = useAppSettings();
  const { loading, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login",
  });

  if (loading) {
    return (
      <div className="app-bg flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">{t("loading.validatingSession")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      {children}
      <Suspense fallback={null}>
        <DomainChatWidget />
      </Suspense>
    </>
  );
}
