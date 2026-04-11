import type { ReactNode } from "react";

export type LegendItem = {
  label: string;
  color?: string;
  marker?: ReactNode;
};

type Props = {
  title: string;
  items: readonly LegendItem[];
  className?: string;
  ariaLabel?: string;
};

export function Legend({
  title,
  items,
  className,
  ariaLabel,
}: Props) {
  return (
    <div
      className={
        "rounded-lg border border-border/80 bg-surface/92 px-3 py-2 shadow-md backdrop-blur-sm " +
        (className ?? "")
      }
      aria-label={ariaLabel ?? title}
    >
      <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
        {title}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            {item.marker ? (
              <span className="flex items-center justify-center" aria-hidden="true">
                {item.marker}
              </span>
            ) : item.color ? (
              <span
                className="block size-2.5 rounded-[3px]"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
            ) : null}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
