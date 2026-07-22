"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Legend } from "@/components/visualizer/Legend";
import type { UnionFindStep } from "@/lib/types/unionFind";
import {
  calculateForestLayout,
  FOREST_NODE_RADIUS,
} from "@/lib/utils/forestLayout";

type Props = {
  step: UnionFindStep;
  /** Quick Find stores component ids; later variants store parent pointers. */
  arrayLabel?: "id[]" | "parent[]";
  /** When true, the renderer shows rank/size badges next to each node. */
  showRanks?: boolean;
};

const MAX_SQUARE = 56;
const MIN_SQUARE = 28;

const LEGEND_ITEMS = [
  { label: "Root（自指）", color: "var(--color-bar-pivot)" },
  { label: "目前 op 對象", color: "var(--color-bar-compare)" },
  { label: "find 走訪路徑", color: "var(--color-bar-active)" },
  { label: "其他", color: "var(--color-bar-idle)" },
] as const;

function nodeColor(
  i: number,
  parents: number[],
  highlighted: Set<number>,
  pathSet: Set<number>,
): string {
  if (highlighted.has(i)) return "var(--color-bar-compare)";
  if (pathSet.has(i)) return "var(--color-bar-active)";
  if (parents[i] === i) return "var(--color-bar-pivot)";
  return "var(--color-bar-idle)";
}

export function UnionFindRenderer({
  step,
  arrayLabel = "parent[]",
  showRanks = false,
}: Props) {
  const { parents, n, ranks, highlightedNodes, activePath } = step;

  const highlighted = useMemo(
    () => new Set(highlightedNodes ?? []),
    [highlightedNodes],
  );
  const pathSet = useMemo(() => new Set(activePath ?? []), [activePath]);
  const pathEdgeSet = useMemo(() => {
    // Edges between consecutive nodes in activePath are highlighted.
    const set = new Set<string>();
    if (!activePath) return set;
    for (let i = 0; i < activePath.length - 1; i++) {
      const child = activePath[i];
      const parent = activePath[i + 1];
      set.add(`${child}->${parent}`);
    }
    return set;
  }, [activePath]);

  return (
    <div className="flex h-full flex-col gap-2 px-3 py-3">
      {/* Array view */}
      <div className="flex-shrink-0">
        <div className="mb-1 px-1 text-[10px] uppercase tracking-[0.16em] text-muted">
          {arrayLabel}
        </div>
        <ArrayView
          n={n}
          parents={parents}
          highlighted={highlighted}
          pathSet={pathSet}
          ranks={showRanks ? ranks : undefined}
        />
      </div>

      {/* Forest view */}
      <div className="relative min-h-0 flex-1">
        <div className="mb-1 px-1 text-[10px] uppercase tracking-[0.16em] text-muted">
          森林
        </div>
        <div className="relative h-[calc(100%-1rem)] overflow-hidden rounded-lg border border-border/60 bg-surface/60">
          <ForestView
            parents={parents}
            ranks={showRanks ? ranks : undefined}
            highlighted={highlighted}
            pathSet={pathSet}
            pathEdgeSet={pathEdgeSet}
          />
          <Legend
            title="Legend"
            ariaLabel="Union-find legend"
            className="absolute bottom-2 left-2 z-10"
            items={LEGEND_ITEMS.map((item) => ({
              label: item.label,
              color: item.color,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

// ── array view ──────────────────────────────────────────────────

function ArrayView({
  n,
  parents,
  highlighted,
  pathSet,
  ranks,
}: {
  n: number;
  parents: number[];
  highlighted: Set<number>;
  pathSet: Set<number>;
  ranks?: number[];
}) {
  if (n === 0) {
    return (
      <div className="flex h-12 items-center justify-center text-xs text-muted">
        n = 0
      </div>
    );
  }

  return (
    <div className="flex w-full items-end justify-center gap-1.5 px-1">
      {Array.from({ length: n }, (_, i) => {
        const color = nodeColor(i, parents, highlighted, pathSet);
        const isRoot = parents[i] === i;
        return (
          <div
            key={i}
            className="flex flex-1 flex-col items-center"
            style={{ maxWidth: MAX_SQUARE, minWidth: MIN_SQUARE }}
          >
            <div className="mb-0.5 font-mono text-[10px] tabular-nums text-muted">
              {i}
            </div>
            <motion.div
              layout
              animate={{ backgroundColor: color }}
              transition={{ duration: 0.22 }}
              className={
                "relative flex aspect-square w-full items-center justify-center rounded-md " +
                (isRoot ? "ring-1 ring-[var(--color-bar-pivot)]/60" : "")
              }
              style={{ backgroundColor: color }}
            >
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={parents[i]}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="font-mono text-base font-bold tabular-nums text-bar-text"
                >
                  {parents[i]}
                </motion.span>
              </AnimatePresence>
              {ranks ? (
                <span className="absolute -bottom-3.5 right-0 font-mono text-[9px] text-muted">
                  r={ranks[i]}
                </span>
              ) : null}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

// ── forest view ─────────────────────────────────────────────────

function ForestView({
  parents,
  ranks,
  highlighted,
  pathSet,
  pathEdgeSet,
}: {
  parents: number[];
  ranks?: number[];
  highlighted: Set<number>;
  pathSet: Set<number>;
  pathEdgeSet: Set<string>;
}) {
  const layout = useMemo(() => calculateForestLayout(parents), [parents]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || layout.width === 0 || layout.height === 0) return;

    const observer = new ResizeObserver(([entry]) => {
      const padding = 24;
      const availableWidth = Math.max(0, entry.contentRect.width - padding * 2);
      const availableHeight = Math.max(0, entry.contentRect.height - padding * 2);
      if (availableWidth === 0 || availableHeight === 0) return;
      const sx = availableWidth / layout.width;
      const sy = availableHeight / layout.height;
      setScale(Math.min(sx, sy, 1.4));
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [layout.height, layout.width]);

  if (parents.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted">
        empty
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center overflow-hidden"
    >
      <svg
        width={layout.width * scale}
        height={layout.height * scale}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="overflow-visible"
      >
        {/* Edges (child → parent) */}
        <AnimatePresence>
          {layout.edges.map((edge) => {
            const isOnPath = pathEdgeSet.has(`${edge.from}->${edge.to}`);
            return (
              <motion.line
                key={`edge-${edge.from}-${edge.to}`}
                initial={{
                  pathLength: 0,
                  opacity: 0,
                  x1: edge.fromX,
                  y1: edge.fromY,
                  x2: edge.toX,
                  y2: edge.toY,
                  stroke: isOnPath
                    ? "var(--color-bar-active)"
                    : "var(--color-border)",
                  strokeWidth: isOnPath ? 3 : 1.6,
                }}
                animate={{
                  pathLength: 1,
                  opacity: 1,
                  x1: edge.fromX,
                  y1: edge.fromY,
                  x2: edge.toX,
                  y2: edge.toY,
                  stroke: isOnPath
                    ? "var(--color-bar-active)"
                    : "var(--color-border)",
                  strokeWidth: isOnPath ? 3 : 1.6,
                }}
                exit={{ opacity: 0, transition: { duration: 0.14 } }}
                transition={{
                  pathLength: { duration: 0.34, ease: "easeOut" },
                  opacity: { duration: 0.22 },
                  x1: { type: "spring", stiffness: 320, damping: 28 },
                  y1: { type: "spring", stiffness: 320, damping: 28 },
                  x2: { type: "spring", stiffness: 320, damping: 28 },
                  y2: { type: "spring", stiffness: 320, damping: 28 },
                  stroke: { duration: 0.22 },
                  strokeWidth: { duration: 0.22 },
                }}
                strokeLinecap="round"
              />
            );
          })}
        </AnimatePresence>

        {/* Nodes */}
        {layout.nodes.map((node) => {
          const color = nodeColor(node.id, parents, highlighted, pathSet);
          const isHighlighted =
            highlighted.has(node.id) || pathSet.has(node.id);
          return (
            <motion.g
              key={`node-${node.id}`}
              initial={{ opacity: 0, scale: 0.85, x: node.x, y: node.y }}
              animate={{
                opacity: 1,
                scale: isHighlighted ? 1.12 : 1,
                x: node.x,
                y: node.y,
              }}
              transition={{
                x: { type: "spring", stiffness: 340, damping: 28 },
                y: { type: "spring", stiffness: 340, damping: 28 },
                scale: { type: "spring", stiffness: 360, damping: 24 },
                opacity: { duration: 0.18 },
              }}
            >
              {node.isRoot && (
                <circle
                  r={FOREST_NODE_RADIUS + 5}
                  fill="none"
                  stroke="var(--color-bar-pivot)"
                  strokeOpacity={0.4}
                  strokeWidth={1.5}
                />
              )}
              <motion.circle
                r={FOREST_NODE_RADIUS}
                initial={{ fill: color }}
                animate={{ fill: color }}
                transition={{ duration: 0.22 }}
                className="drop-shadow"
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                className="font-mono font-bold select-none"
                fill="var(--color-bar-text)"
                fontSize={16}
              >
                {node.id}
              </text>
              {ranks ? (
                <text
                  textAnchor="middle"
                  className="font-mono select-none"
                  fill="var(--color-muted)"
                  fontSize={10}
                  y={FOREST_NODE_RADIUS + 12}
                >
                  r={ranks[node.id]}
                </text>
              ) : null}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
