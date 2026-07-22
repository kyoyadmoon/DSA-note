"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useReducer, useState } from "react";
import { getAlgorithm } from "@/lib/algorithms/registry";
import type { ArrayStep } from "@/lib/types/step";
import {
  comparisonStepIndex,
  playbackReducer,
} from "@/lib/utils/sortingComparison";

const ALGORITHMS = [
  { slug: "bubble-sort", label: "Bubble" },
  { slug: "selection-sort", label: "Selection" },
  { slug: "insertion-sort", label: "Insertion" },
  { slug: "quick-sort", label: "Quick" },
  { slug: "merge-sort", label: "Merge" },
  { slug: "heap-sort", label: "Heap" },
] as const;

const INITIAL_INPUT = [7, 3, 8, 2, 6, 1];
const SPEEDS = [0.5, 1, 2] as const;

export function SortingComparison() {
  const [input, setInput] = useState(INITIAL_INPUT);
  const [speed, setSpeed] = useState<number>(1);
  const [playback, dispatch] = useReducer(playbackReducer, {
    progress: 0,
    isPlaying: false,
  });
  const comparisons = useMemo(
    () =>
      ALGORITHMS.map((algorithm) => {
        const entry = getAlgorithm(algorithm.slug);
        return {
          ...algorithm,
          meta: entry.meta,
          steps: entry.steps(input),
        };
      }),
    [input],
  );

  useEffect(() => {
    if (!playback.isPlaying) return;
    const timer = window.setInterval(() => {
      dispatch({ type: "tick", amount: 1 });
    }, 100 / speed);
    return () => window.clearInterval(timer);
  }, [playback.isPlaying, speed]);

  const randomize = () => {
    setInput(
      Array.from({ length: INITIAL_INPUT.length }, () =>
        Math.floor(Math.random() * 90 + 10),
      ),
    );
    dispatch({ type: "reset" });
  };

  return (
    <section className="not-prose my-10 rounded-2xl border border-border bg-surface/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl tracking-tight">
            六種排序同步比較
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            相同輸入 · 相對進度 {Math.round(playback.progress)}% · 每個演算法依自己的步驟數映射
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              dispatch({ type: playback.isPlaying ? "pause" : "play" })
            }
            className="rounded-md border border-accent/50 bg-accent/10 px-3 py-1.5 text-xs text-accent transition-colors hover:bg-accent/20"
          >
            {playback.isPlaying
              ? "Pause"
              : playback.progress >= 100
                ? "Replay"
                : "Play"}
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "reset" })}
            className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-surface-raised"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={randomize}
            className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-surface-raised"
          >
            Random
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted">
        <LegendDot color="var(--color-bar-compare)" label="比較" />
        <LegendDot color="var(--color-bar-swap)" label="交換" />
        <LegendDot color="var(--color-bar-pivot)" label="選取 / pivot" />
        <LegendDot color="var(--color-bar-sorted)" label="已就位" />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {comparisons.map(({ slug, label, meta, steps }) => {
          const stepIndex = comparisonStepIndex(
            playback.progress,
            steps.length,
          );
          const step = steps[stepIndex];
          return (
            <article
              key={slug}
              className="min-w-0 rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/sorting/${slug}`}
                    className="font-serif text-lg tracking-tight transition-colors hover:text-accent"
                  >
                    {label} Sort
                  </Link>
                  <div className="mt-1 text-[10px] font-mono text-muted">
                    avg {meta.timeAvg} · worst {meta.timeWorst} ·{" "}
                    {meta.stable ? "stable" : "unstable"}
                  </div>
                </div>
                <div className="font-mono text-[10px] tabular-nums text-muted">
                  {stepIndex + 1}/{steps.length}
                </div>
              </div>

              <MiniArray step={step} slug={slug} />

              <div className="mt-3 min-h-12 border-t border-border pt-3">
                <div className="truncate text-xs font-medium text-foreground/90">
                  {step.title}
                </div>
                <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">
                  {step.detail}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <label className="min-w-48 flex-1">
          <span className="sr-only">同步比較進度</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={playback.progress}
            onChange={(event) =>
              dispatch({ type: "seek", progress: Number(event.target.value) })
            }
            className="w-full accent-[var(--color-accent)]"
          />
        </label>
        <div className="flex items-center gap-1">
          {SPEEDS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSpeed(option)}
              aria-pressed={speed === option}
              className={
                "rounded px-2 py-1 text-[11px] font-mono transition-colors " +
                (speed === option
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:bg-surface-raised hover:text-foreground")
              }
            >
              {option}x
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function MiniArray({ step, slug }: { step: ArrayStep; slug: string }) {
  const maxValue = Math.max(...step.array.map((item) => item.value), 1);
  const minValue = Math.min(...step.array.map((item) => item.value), 0);
  const span = Math.max(maxValue - minValue, 1);
  const includes = (indices: number[] | undefined, index: number) =>
    indices?.includes(index) ?? false;

  return (
    <div className="mt-5 flex h-32 items-end justify-center gap-2" aria-hidden="true">
      {step.array.map((item, index) => {
        const isSwapping = includes(step.swapping, index);
        const isComparing = includes(step.comparing, index);
        const isSorted = includes(step.sorted, index);
        const isFocused = step.pivot === index || step.selected === index;
        const isActive =
          step.active === undefined ||
          (index >= step.active[0] && index < step.active[1]);
        const color = isSwapping
          ? "var(--color-bar-swap)"
          : isComparing
            ? "var(--color-bar-compare)"
            : isFocused
              ? "var(--color-bar-pivot)"
              : isSorted
                ? "var(--color-bar-sorted)"
                : "var(--color-bar-idle)";
        const height = 34 + ((item.value - minValue) / span) * 70;

        return (
          <motion.div
            layout="position"
            key={`${slug}-${item.id}`}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative flex min-w-0 flex-1 items-end justify-center rounded-t-md shadow-md"
            style={{
              maxWidth: 44,
              height,
              backgroundColor: color,
              opacity: isActive || isSorted ? 1 : 0.32,
            }}
          >
            <span className="mb-1 font-mono text-[10px] font-bold text-bar-text">
              {item.value}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
