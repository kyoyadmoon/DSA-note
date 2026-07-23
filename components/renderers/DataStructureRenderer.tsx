"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Legend } from "@/components/visualizer/Legend";
import type {
  DataStructureStep,
  DynamicArrayView,
  LinearCollectionItemState,
  LinearCollectionView,
  LinkedListNodeState,
  LinkedListView,
  StructureSlotState,
} from "@/lib/types/dataStructure";

type Props = {
  step: DataStructureStep;
};

const LEGEND = [
  { label: "有效元素", color: "var(--color-bar-idle)" },
  { label: "目前操作", color: "var(--color-bar-compare)" },
  { label: "複製來源", color: "var(--color-bar-pivot)" },
  { label: "複製目標", color: "var(--color-bar-sorted)" },
] as const;

function slotColor(state: StructureSlotState): string {
  switch (state) {
    case "active":
      return "var(--color-bar-compare)";
    case "copy-source":
      return "var(--color-bar-pivot)";
    case "copy-target":
      return "var(--color-bar-sorted)";
    case "empty":
      return "transparent";
    default:
      return "var(--color-bar-idle)";
  }
}

export function DataStructureRenderer({ step }: Props) {
  switch (step.view.kind) {
    case "dynamic-array":
      return <DynamicArrayRenderer view={step.view} />;
    case "linked-list":
      return <LinkedListRenderer view={step.view} />;
    case "linear-collection":
      return <LinearCollectionRenderer view={step.view} />;
  }
}

function linearItemColor(state: LinearCollectionItemState): string {
  switch (state) {
    case "active":
      return "var(--color-bar-compare)";
    case "new":
      return "var(--color-bar-sorted)";
    case "removing":
      return "var(--color-bar-swap)";
    case "consumed":
      return "var(--color-surface-raised)";
    default:
      return "var(--color-bar-idle)";
  }
}

function LinearCollectionRenderer({ view }: { view: LinearCollectionView }) {
  if (view.mode === "stack") return (
    <div className="relative flex h-full items-center justify-center overflow-auto px-8 py-8">
      <div className="flex min-h-72 min-w-44 flex-col justify-end rounded-b-2xl border-x-2 border-b-2 border-border bg-surface-raised/35 px-4 pb-4 pt-12">
        {view.items.length === 0 ? (
          <div className="my-auto text-center font-mono text-sm text-muted">
            empty stack
          </div>
        ) : (
          [...view.items].reverse().map((item) => (
            <motion.div
              key={item.id}
              layout
              animate={{
                backgroundColor: linearItemColor(item.state),
                scale: item.state === "idle" ? 1 : 1.05,
                opacity: item.state === "removing" ? 0.65 : 1,
              }}
              className="relative mb-2 flex h-12 min-w-32 items-center justify-center rounded-lg font-mono text-base font-semibold text-background shadow-sm"
            >
              {item.id === view.topId && (
                <span className="absolute -right-12 font-mono text-[10px] uppercase tracking-wider text-accent">
                  top
                </span>
              )}
              {item.value}
            </motion.div>
          ))
        )}
      </div>
      <div className="absolute bottom-4 right-5 font-mono text-xs text-muted">
        output [{view.output.join(", ")}]
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full items-center overflow-auto px-8 py-10">
      <div className="mx-auto flex min-w-max items-center gap-2">
        {view.items.length === 0 ? (
          <div className="font-mono text-sm text-muted">empty {view.mode}</div>
        ) : (
          view.items.map((item, index) => (
            <div key={item.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-5 gap-2 text-[10px] uppercase tracking-wider text-accent">
                  {item.id === view.frontId && <span>front</span>}
                  {item.id === view.backId && <span>back</span>}
                </div>
                <motion.div
                  layout
                  animate={{
                    backgroundColor: linearItemColor(item.state),
                    scale: item.state === "idle" || item.state === "consumed" ? 1 : 1.06,
                    opacity: item.state === "consumed" ? 0.38 : item.state === "removing" ? 0.65 : 1,
                  }}
                  className="flex h-16 min-w-20 items-center justify-center rounded-xl border border-border px-4 font-mono text-lg font-semibold text-background shadow-sm"
                >
                  {item.value}
                </motion.div>
                <div className="mt-2 font-mono text-[10px] text-muted">
                  {index}
                </div>
              </div>
              {index < view.items.length - 1 && (
                <span className="mx-1 mt-3 font-mono text-muted">→</span>
              )}
            </div>
          ))
        )}
      </div>
      {view.headIndex !== undefined && (
        <div className="absolute left-5 top-4 font-mono text-xs text-muted">
          head index {view.headIndex}
        </div>
      )}
      <div className="absolute bottom-4 right-5 font-mono text-xs text-muted">
        output [{view.output.join(", ")}]
      </div>
    </div>
  );
}

function linkedNodeColor(state: LinkedListNodeState): string {
  switch (state) {
    case "active":
      return "var(--color-bar-compare)";
    case "visited":
      return "var(--color-bar-active)";
    case "new":
      return "var(--color-bar-sorted)";
    case "removing":
      return "var(--color-bar-swap)";
    default:
      return "var(--color-bar-idle)";
  }
}

function LinkedListRenderer({ view }: { view: LinkedListView }) {
  if (view.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center font-mono text-sm text-muted">
        head / tail → null
      </div>
    );
  }

  return (
    <div className="flex h-full items-center overflow-auto px-8 py-10">
      <div className="mx-auto flex min-w-max items-center">
        {view.nodes.map((node, index) => {
          const next = view.nodes[index + 1];
          const activeLink =
            next &&
            ((view.activeLink?.from === node.id &&
              view.activeLink.to === next.id) ||
              (view.activeLink?.from === next.id &&
                view.activeLink.to === node.id));
          return (
            <div key={node.id} className="flex items-center">
              <div className="relative flex flex-col items-center">
                <div className="mb-2 h-5 text-[10px] uppercase tracking-wider text-accent">
                  {node.id === view.headId ? "head" : ""}
                  {node.id === view.tailId
                    ? node.id === view.headId
                      ? " / tail"
                      : "tail"
                    : ""}
                </div>
                <motion.div
                  layout
                  animate={{
                    backgroundColor: linkedNodeColor(node.state),
                    scale: node.state === "idle" ? 1 : 1.08,
                    opacity: node.state === "removing" ? 0.65 : 1,
                  }}
                  className="flex h-16 min-w-20 items-center justify-center rounded-xl border border-transparent px-4 font-mono text-lg font-semibold text-background shadow-lg"
                >
                  {node.value}
                </motion.div>
                <div className="mt-2 text-center font-mono text-[10px] leading-4 text-muted">
                  {view.doubly && (
                    <div>{node.prevId ? `prev: ${node.prevId}` : "prev: null"}</div>
                  )}
                  <div>{node.nextId ? `next: ${node.nextId}` : "next: null"}</div>
                </div>
              </div>
              {next && node.nextId === next.id && (
                <motion.div
                  animate={{
                    color: activeLink
                      ? "var(--color-accent)"
                      : "var(--color-muted)",
                    scale: activeLink ? 1.15 : 1,
                  }}
                  className="mx-3 mb-1 font-mono text-2xl"
                  aria-label={
                    view.doubly
                      ? `${node.value} and ${next.value} point to each other`
                      : `${node.value} points to ${next.value}`
                  }
                >
                  {view.doubly ? "⇄" : "→"}
                </motion.div>
              )}
            </div>
          );
        })}
        <div className="mx-3 mb-1 font-mono text-sm text-muted">null</div>
      </div>
    </div>
  );
}

function DynamicArrayRenderer({ view }: { view: DynamicArrayView }) {
  return (
    <div className="relative flex h-full flex-col justify-center gap-8 overflow-auto px-5 py-8">
      <div className="absolute right-4 top-4 flex gap-2 font-mono text-xs tabular-nums">
        <span className="rounded-full border border-border bg-surface-raised px-3 py-1 text-muted">
          size <strong className="text-foreground">{view.size}</strong>
        </span>
        <span className="rounded-full border border-border bg-surface-raised px-3 py-1 text-muted">
          capacity <strong className="text-foreground">{view.capacity}</strong>
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {view.buffers.map((buffer) => (
          <motion.div
            key={buffer.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={buffer.active ? "opacity-100" : "opacity-70"}
          >
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted">
              {buffer.label}
              {buffer.active && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-accent">
                  active
                </span>
              )}
            </div>
            <div className="flex min-w-max items-start justify-center gap-1.5">
              {buffer.slots.map((slot, index) => {
                const pointer = view.pointer?.index === index;
                return (
                  <div key={slot.id} className="flex w-14 flex-col items-center">
                    <div className="mb-1 h-5 text-[10px] font-mono text-accent">
                      {pointer ? view.pointer?.label : ""}
                    </div>
                    <motion.div
                      layout
                      animate={{
                        backgroundColor: slotColor(slot.state),
                        scale:
                          slot.state === "active" ||
                          slot.state === "copy-source" ||
                          slot.state === "copy-target"
                            ? 1.08
                            : 1,
                      }}
                      className={
                        "flex h-14 w-14 items-center justify-center rounded-lg border font-mono text-base font-semibold shadow-sm " +
                        (slot.state === "empty"
                          ? "border-dashed border-border text-muted"
                          : "border-transparent text-background")
                      }
                    >
                      {slot.value ?? "∅"}
                    </motion.div>
                    <div className="mt-1 font-mono text-[10px] text-muted">
                      {index}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <Legend
        title="Legend"
        ariaLabel="Dynamic array legend"
        className="absolute bottom-3 left-3"
        items={LEGEND.map((item) => ({
          label: item.label,
          color: item.color,
        }))}
      />
    </div>
  );
}
