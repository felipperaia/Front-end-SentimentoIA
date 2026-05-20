interface Props {
  tier?: "S" | "A" | "B" | null;
}

const tierConfig: Record<"S" | "A" | "B", { label: string; className: string }> = {
  S: {
    label: "Tier S",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  A: {
    label: "Tier A",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  B: {
    label: "Tier B",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

export function SourceTierBadge({ tier }: Props) {
  if (!tier || !tierConfig[tier]) return null;

  const { label, className } = tierConfig[tier];

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
