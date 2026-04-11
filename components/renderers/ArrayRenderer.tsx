"use client";

import { useLayoutEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Legend } from "@/components/visualizer/Legend";
import type { ArrayStep } from "@/lib/types/step";

type Props = {
  step: ArrayStep;
};

const MAX_SQUARE = 84;
const DEFAULT_POINTER_COLOR = "var(--color-accent)";
const SWAP_LIFT = 32;
const COMPARE_LIFT = -6;
const SWAP_SCALE = 1.12;
const SWAP_DURATION_MS = 820;
const SWAP_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

const LEGEND_ITEMS = [
  { label: "未排序", color: "var(--color-bar-idle)" },
  { label: "比較中", color: "var(--color-bar-compare)" },
  { label: "交換中", color: "var(--color-bar-swap)" },
  { label: "Pivot", color: "var(--color-bar-pivot)" },
  { label: "已就位", color: "var(--color-bar-sorted)" },
] as const;

export function ArrayRenderer({ step }: Props) {
  const { array, comparing, swapping, sorted, pivot, pointers } = step;
  const n = array.length;
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const prevCentersRef = useRef(new Map<string, number>());
  const prevStepRef = useRef<ArrayStep | null>(null);
  const runningAnimationsRef = useRef(new Map<string, Animation>());

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
    // When swapping, split the two elements onto different horizontal lanes.
    // They first move vertically, then slide sideways, then return.
    if (swapping) {
      if (swapping[0] === i) return -SWAP_LIFT;
      if (swapping[1] === i) return SWAP_LIFT;
    }
    if (isComparing(i)) return COMPARE_LIFT;
    return 0;
  };

  const getScale = (i: number) => (isSwapping(i) ? SWAP_SCALE : 1);

  useLayoutEffect(() => {
    runningAnimationsRef.current.forEach((animation) => animation.cancel());
    runningAnimationsRef.current.clear();

    const currentCenters = new Map<string, number>();
    for (const item of array) {
      const node = itemRefs.current.get(item.id);
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      currentCenters.set(item.id, rect.left + rect.width / 2);
    }

    const prevStep = prevStepRef.current;
    const prevCenters = prevCentersRef.current;

    if (swapping && prevStep) {
      for (const index of swapping) {
        const item = array[index];
        const node = itemRefs.current.get(item.id);
        const prevCenter = prevCenters.get(item.id);
        const currentCenter = currentCenters.get(item.id);
        if (!node || prevCenter === undefined || currentCenter === undefined) {
          continue;
        }

        const previousIndex = prevStep.array.findIndex(
          (prevItem) => prevItem.id === item.id,
        );
        const previousLift =
          previousIndex >= 0
            ? (() => {
                if (prevStep.swapping?.[0] === previousIndex) return -SWAP_LIFT;
                if (prevStep.swapping?.[1] === previousIndex) return SWAP_LIFT;
                if (
                  prevStep.comparing?.[0] === previousIndex ||
                  prevStep.comparing?.[1] === previousIndex
                ) {
                  return COMPARE_LIFT;
                }
                return 0;
              })()
            : 0;

        const previousScale =
          previousIndex >= 0 &&
          (prevStep.swapping?.[0] === previousIndex ||
            prevStep.swapping?.[1] === previousIndex)
            ? SWAP_SCALE
            : 1;

        const laneLift = swapping[0] === index ? -SWAP_LIFT : SWAP_LIFT;
        const deltaX = prevCenter - currentCenter;

        const animation = node.animate(
          [
            {
              transform: `translate3d(${deltaX}px, ${previousLift}px, 0) scale(${previousScale})`,
            },
            {
              transform: `translate3d(${deltaX}px, ${laneLift}px, 0) scale(${SWAP_SCALE})`,
              offset: 0.24,
            },
            {
              transform: `translate3d(0px, ${laneLift}px, 0) scale(${SWAP_SCALE})`,
              offset: 0.78,
            },
            {
              transform: "translate3d(0px, 0px, 0) scale(1)",
            },
          ],
          {
            duration: SWAP_DURATION_MS,
            easing: SWAP_EASING,
            fill: "both",
          },
        );

        runningAnimationsRef.current.set(item.id, animation);
        animation.onfinish = () => {
          runningAnimationsRef.current.delete(item.id);
        };
        animation.oncancel = () => {
          runningAnimationsRef.current.delete(item.id);
        };
      }
    }

    prevCentersRef.current = currentCenters;
    prevStepRef.current = step;

    return () => {
      runningAnimationsRef.current.forEach((animation) => animation.cancel());
      runningAnimationsRef.current.clear();
    };
  }, [array, step, swapping]);

    return (
    <div className="relative h-full flex items-center justify-center px-4 sm:px-6">
      <Legend
        title="Legend"
        items={LEGEND_ITEMS}
        ariaLabel="Array legend"
        className="absolute bottom-3 left-3 z-20"
      />

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
                        className="flex flex-col items-center gap-2"
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
            const scale = getScale(i);
            const itemSwapping = isSwapping(i);
            return (
              <div
                key={item.id}
                ref={(node) => {
                  if (node) {
                    itemRefs.current.set(item.id, node);
                    return;
                  }
                  itemRefs.current.delete(item.id);
                }}
                className="relative flex-1 aspect-square rounded-xl shadow-lg flex items-center justify-center transition-[background-color,transform] duration-200 ease-out"
                style={{
                  maxWidth: MAX_SQUARE,
                  minWidth: 0,
                  backgroundColor: color,
                  transform: itemSwapping
                    ? undefined
                    : `translate3d(0, ${lift}px, 0) scale(${scale})`,
                }}
              >
                <span
                  className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-150"
                  style={{
                    opacity: itemSwapping ? 0.9 : 0,
                    boxShadow:
                      "0 0 0 3px color-mix(in oklab, var(--color-bar-swap) 70%, transparent), 0 10px 24px -6px color-mix(in oklab, var(--color-bar-swap) 55%, transparent)",
                  }}
                />
                <span
                  className="relative z-10 font-mono text-xl font-bold tabular-nums select-none"
                  style={{ color: "#0b0d12" }}
                >
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
