import { cn } from "@/lib/utils";
import { useAppSettings } from "@/contexts/AppSettingsContext";

type BrandMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function BrandMark({ className, size = "md" }: Readonly<BrandMarkProps>) {
  const { settings } = useAppSettings();
  const isDark = settings.theme === "dark";
  const logoSrc = isDark ? "/img/logo-dark.svg" : "/img/logo-light.svg";

  const sizeClass = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  }[size];

  return (
    <div className={cn("brand-mark", sizeClass, className)}>
      <img
        src={logoSrc}
        alt="Sentimento AI"
        width={36}
        height={36}
        className="shrink-0"
      />
      <span className="font-semibold text-sm">[Sentimento AI]</span>
    </div>
  );
}
