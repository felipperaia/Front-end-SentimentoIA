import { BrandMark } from "@/components/BrandMark";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import type { ReactNode } from "react";
import { Link } from "wouter";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { t } = useAppSettings();

  return (
    <div className="app-bg min-h-screen">
      <header className="border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="inline-flex items-center">
            <BrandMark size="md" />
          </Link>
          <LanguageSelector compact />
        </div>
      </header>

      <main className="container grid min-h-[calc(100vh-73px)] items-center py-10">
        <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,440px)] lg:items-center">
          <section className="hidden lg:block">
            <p className="section-eyebrow">{t("common.productLine")}</p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight">
              {t("home.title")}
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              {t("home.subtitle")}
            </p>
          </section>

          <section className="app-panel p-6 md:p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-semibold">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}
