"use client";

type Props = {
  highlightedLines: string[];
  currentLine: number;
  filename?: string;
};

export function CodePanel({
  highlightedLines,
  currentLine,
  filename = "algorithm.ts",
}: Props) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden flex flex-col h-full">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 bg-surface-raised/40">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
        </div>
        <div className="text-[11px] text-muted ml-2 font-mono">{filename}</div>
      </div>
      <pre className="overflow-auto py-3 text-[13px] leading-6 font-mono flex-1">
        <code className="block">
          {highlightedLines.map((line, i) => {
            const lineNum = i + 1;
            const isCurrent = lineNum === currentLine;
            return (
              <div
                key={i}
                data-line={lineNum}
                className={
                  "flex items-start gap-4 px-4 transition-colors duration-200 " +
                  (isCurrent
                    ? "bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)]"
                    : "")
                }
                style={
                  isCurrent
                    ? { boxShadow: "inset 2px 0 0 var(--color-accent)" }
                    : undefined
                }
              >
                <span className="text-muted/60 select-none tabular-nums w-6 text-right shrink-0">
                  {lineNum}
                </span>
                <span
                  className="flex-1 min-w-0 whitespace-pre"
                  dangerouslySetInnerHTML={{ __html: line || "&nbsp;" }}
                />
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
