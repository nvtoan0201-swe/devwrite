"use client";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
}

export default function ProgressBar({
  value,
  max = 10,
  label,
  showValue = true,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color =
    pct >= 75 ? "#006400" : pct >= 50 ? "#1b61c9" : pct >= 25 ? "#b58900" : "#b3261e";

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-[13px] font-medium tracking-[0.08px] text-[#181d26]">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-[13px] tabular-nums text-[rgba(4,14,32,0.69)]">
              {value.toFixed(1)} / {max}
            </span>
          )}
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: "#eef1f5" }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
