"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Legend } from "@/components/visualizer/Legend";
import type { TreeStep, TreeNodeState } from "@/lib/types/tree";
import {
  calculateTreeLayout,
  TREE_NODE_RADIUS,
} from "@/lib/utils/treeLayout";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  step: TreeStep;
  direction?: 1 | -1 | 0;
};

const NODE_RADIUS = TREE_NODE_RADIUS;
const INSERT_EDGE_GROW_DURATION = 0.34;
const INSERT_NODE_REVEAL_DELAY = 0.08;
const NODE_EXIT_DURATION = 0.14;
const LEGEND_ITEMS = [
  { label: "未操作", color: "var(--color-bar-idle)" },
  { label: "正在比較", color: "var(--color-bar-compare)" },
  { label: "目前路徑", color: "var(--color-bar-pivot)" },
  { label: "新插入節點", color: "var(--color-bar-sorted)" },
  { label: "當前邊", color: "var(--color-accent)", isLine: true },
] as const;

// ── node colour mapping ───────────────────────────────────────

function getNodeColor(state: TreeNodeState): string {
  switch (state) {
    case "comparing":
      return "var(--color-bar-compare)";
    case "inserted":
      return "var(--color-bar-sorted)";
    case "visited":
      return "var(--color-bar-active)";
    case "found":
      return "var(--color-bar-swap)";
    case "path":
      return "var(--color-bar-pivot)";
    default:
      return "var(--color-bar-idle)";
  }
}

function getNodeScale(state: TreeNodeState): number {
  if (state === "comparing" || state === "inserted") return 1.15;
  return 1;
}

// ── component ──────────────────────────────────────────────────

export function TreeRenderer({ step, direction = 0 }: Props) {
  const { root, nodeStates, activeEdge, operationValue } = step;
  const layout = useMemo(() => calculateTreeLayout(root), [root]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Auto-scale to fit container
  useEffect(() => {
    if (!containerRef.current || layout.width === 0) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const padding = 40;
    const scaleX = (rect.width - padding * 2) / layout.width;
    const scaleY = (rect.height - padding * 2) / layout.height;
    setScale(Math.min(scaleX, scaleY, 1.5));
  }, [layout]);

  // Build a lookup for quick position access
  const posMap = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const n of layout.nodes) m.set(n.id, { x: n.x, y: n.y });
    return m;
  }, [layout.nodes]);

  if (!root) {
    return (
      <div className="h-full flex items-center justify-center text-muted text-sm font-mono">
        {operationValue !== undefined
          ? `inserting ${operationValue}…`
          : "empty tree"}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full flex items-center justify-center overflow-hidden"
    >
      {/* Operation badge */}
      {operationValue !== undefined && step.phase !== "done" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-20
            font-mono text-sm px-3 py-1 rounded-full
            bg-surface-raised border border-border shadow-md text-accent"
        >
          insert({operationValue})
        </motion.div>
      )}

      <Legend
        title="Legend"
        ariaLabel="Animation color legend"
        className="absolute bottom-3 left-3 z-20"
        items={LEGEND_ITEMS.map((item) => ({
          label: item.label,
          color: item.isLine ? undefined : item.color,
          marker: item.isLine ? (
            <span
              className="block w-4 rounded-full"
              style={{
                height: 2,
                backgroundColor: item.color,
              }}
              aria-hidden="true"
            />
          ) : undefined,
        }))}
      />

      <svg
        width={layout.width * scale}
        height={layout.height * scale}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="overflow-visible"
      >
        {/* Edges */}
        <AnimatePresence initial={false} custom={direction}>
          {layout.nodes
            .filter((n) => n.parentId)
            .map((n) => {
              const parent = posMap.get(n.parentId!);
              if (!parent) return null;

              const isActive =
                (activeEdge?.from === n.parentId && activeEdge?.to === n.id) ||
                (activeEdge?.from === n.id && activeEdge?.to === n.parentId);

              return (
                <motion.line
                  key={`edge-${n.parentId}-${n.id}`}
                  custom={direction}
                  initial={{
                    pathLength: 0,
                    opacity: 0,
                    x1: parent.x,
                    y1: parent.y,
                    x2: n.x,
                    y2: n.y,
                  }}
                  animate={{
                    pathLength: 1,
                    opacity: 1,
                    x1: parent.x,
                    y1: parent.y,
                    x2: n.x,
                    y2: n.y,
                    stroke: isActive
                      ? "var(--color-accent)"
                      : "var(--color-border)",
                    strokeWidth: isActive ? 3 : 2,
                  }}
                  exit={(stepDirection) =>
                    stepDirection < 0
                      ? {
                          pathLength: 0,
                          opacity: 0,
                          transition: {
                            pathLength: {
                              duration: INSERT_EDGE_GROW_DURATION,
                              ease: "easeInOut",
                              delay: NODE_EXIT_DURATION,
                            },
                            opacity: {
                              duration: 0.12,
                              delay:
                                NODE_EXIT_DURATION + INSERT_EDGE_GROW_DURATION - 0.02,
                            },
                          },
                        }
                      : {
                          opacity: 0,
                          transition: { duration: 0.16 },
                        }
                  }
                  transition={{
                    pathLength: { duration: INSERT_EDGE_GROW_DURATION, ease: "easeOut" },
                    opacity: { duration: 0.25 },
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
        <AnimatePresence initial={false} custom={direction}>
          {layout.nodes.map((n) => {
            const state = nodeStates[n.id] ?? "idle";
            const color = getNodeColor(state);
            const nodeScale = getNodeScale(state);
            const isInsertedNode = step.phase === "insert" && step.targetNodeId === n.id;
            const revealDelay =
              direction >= 0 && isInsertedNode && n.parentId
                ? INSERT_EDGE_GROW_DURATION + INSERT_NODE_REVEAL_DELAY
                : 0;

            return (
              <motion.g
                key={n.id}
                custom={direction}
                initial={{ opacity: 0, scale: 0.86, x: n.x, y: n.y }}
                animate={{
                  opacity: 1,
                  scale: nodeScale,
                  x: n.x,
                  y: n.y,
                }}
                exit={(stepDirection) => ({
                  opacity: 0,
                  scale: stepDirection < 0 ? 0.92 : 0.86,
                  x: n.x,
                  y: n.y,
                  transition: {
                    opacity: { duration: NODE_EXIT_DURATION },
                    scale: { duration: NODE_EXIT_DURATION },
                  },
                })}
                transition={{
                  x: { type: "spring", stiffness: 340, damping: 28 },
                  y: { type: "spring", stiffness: 340, damping: 28 },
                  scale: {
                    type: "spring",
                    stiffness: isInsertedNode ? 360 : 340,
                    damping: isInsertedNode ? 24 : 26,
                    delay: revealDelay,
                  },
                  opacity: { duration: 0.18, delay: revealDelay },
                }}
              >
                {/* Glow ring for active nodes */}
                {(state === "comparing" || state === "inserted") && (
                  <motion.circle
                    r={NODE_RADIUS + 6}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.35, scale: 1 }}
                    transition={{
                      repeat: state === "comparing" ? Infinity : 0,
                      repeatType: "reverse",
                      duration: 0.8,
                    }}
                  />
                )}

                {/* Main circle */}
                <motion.circle
                  r={NODE_RADIUS}
                  animate={{ fill: color }}
                  transition={{ duration: 0.22 }}
                  className="drop-shadow-lg"
                />

                {/* Value label */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="font-mono text-base font-bold select-none"
                  fill="#0b0d12"
                  fontSize={18}
                >
                  {n.value}
                </text>
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>
    </div>
  );
}
