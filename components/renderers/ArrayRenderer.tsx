"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ArrayStep } from "@/lib/types/step";

type Props = {
  step: ArrayStep;
};

const MAX_SQUARE = 84;
const DEFAULT_POINTER_COLOR = "var(--color-accent)";

export function ArrayRenderer({ step }: Props) {
  const { array, comparing, swapping, sorted, pivot, pointers } = step;
  const n = array.length;

  const isComparing = (i: number) =>
    comparing?.[0] === i || comparing?.[1] === i;
  const isSwapping = (i: number) =>
    swapping?.[0] === i || swapping?.[1] === i;
  const isSorted = (i: number) => sorted?.includes(i) ?? false;
  const isPivot = (i: number) => pivot === i;

  const getColor = (i: number) => {
    if (isSwapping(i)) return "var(--color-bar-swap)";
    if (isComparing(i)) return "var(--color-bar-compare)";
    if (isPivot(i)) return "var(--color-bar-pivot)";
    if (isSorted(i)) return "var(--color-bar-sorted)";
    return "var(--color-bar-idle)";
  };

  const getLift = (i: number) => {
    if (isSwapping(i)) return -10;
    if (isComparing(i)) return -6;
    return 0;
  };

  return (
    <div className="relative h-full flex items-center justify-center px-4 sm:px-6">
      <div className="relative w-full">
        {/* Pointer overlay — sits above squares, absolute + bottom-full keeps it glued */}
        <div className="absolute bottom-full left-0 right-0 mb-5 flex items-end justify-center gap-3 pointer-events-none">
          {Array.from({ length: n }).map((_, i) => {
            const slotPointers = pointers?.filter((p) => p.index === i) ?? [];
            return (
              <div
                key={`pointer-slot-${i}`}
                className="flex-1 flex flex-col items-center gap-1"
                style={{ maxWidth: MAX_SQUARE, minWidth: 0 }}
              >
                <AnimatePresence mode="popLayout">
                  {slotPointers.map((p) => {
                    const color = p.color ?? DEFAULT_POINTER_COLOR;
                    return (
                      <motion.div
                        key={p.name}
                        layoutId={`pointer-${p.name}`}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{
                          layout: {
                            type: "spring",
                            stiffness: 360,
                            damping: 28,
                          },
                          opacity: { duration: 0.15 },
                        }}
                        className="flex flex-col items-center gap-0.5"
                      >
                        <span
                          className="font-mono text-sm font-semibold tracking-tight px-2.5 py-0.5 rounded-md bg-surface-raised shadow-md"
                          style={{
                            color,
                            border: `1px solid color-mix(in oklab, ${color} 45%, transparent)`,
                          }}
                        >
                          {p.name}
                        </span>
                        <span
                          className="block w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent"
                          style={{ borderTopColor: color }}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Squares row */}
        <div className="flex items-center justify-center gap-3 w-full">
          {array.map((item, i) => {
            const lift = getLift(i);
            const color = getColor(i);
            return (
              <motion.div
                key={item.id}
                layout
                transition={{
                  type: "spring",
                  stiffness: 320,
                  damping: 26,
                  mass: 0.9,
                }}
                className="flex-1 aspect-square rounded-xl shadow-lg flex items-center justify-center"
                style={{
                  maxWidth: MAX_SQUARE,
                  minWidth: 0,
                }}
                animate={{
                  y: lift,
                  backgroundColor: color,
                }}
              >
                <span
                  className="font-mono text-xl font-bold tabular-nums select-none"
                  style={{ color: "#0b0d12" }}
                >
                  {item.value}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
