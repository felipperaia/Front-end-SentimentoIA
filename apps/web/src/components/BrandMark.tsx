import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function BrandMark({ className, size = "md" }: BrandMarkProps) {
  const sizeClass = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  }[size];

  const iconClass = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }[size];

  return (
    <div className={cn("brand-mark", sizeClass, className)}>
      <img src="/img/logo.svg" alt="" aria-hidden="true" className={iconClass} />
      <span>[Sentimento AI]</span>
    </div>
  );
}
