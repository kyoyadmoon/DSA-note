"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Legend } from "@/components/visualizer/Legend";
import type {
  DataStructureStep,
  DynamicArrayView,
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
  }
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
