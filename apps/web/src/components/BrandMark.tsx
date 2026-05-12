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

  return (
    <div className={cn("brand-mark", sizeClass, className)}>
      [Sentimento AI]
    </div>
  );
}
