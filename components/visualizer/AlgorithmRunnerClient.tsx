"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAlgorithm } from "@/lib/algorithms/registry";
import type { AlgorithmMeta } from "@/lib/types/step";
import { ArrayRenderer } from "@/components/renderers/ArrayRenderer";
import { CodePanel } from "./CodePanel";
import { Narration } from "./Narration";
import { Splitter } from "./Splitter";
import { StepPlayer } from "./StepPlayer";

type Props = {
  slug: string;
  initial: number[];
  highlightedLines: string[];
  meta: AlgorithmMeta;
};

type LayoutMode = "horizontal" | "vertical";

const LAYOUT_KEY = "dsa:runner-layout";
const SPLIT_H_KEY = "dsa:runner-split-h";
const SPLIT_V_KEY = "dsa:runner-split-v";
const HEIGHT_H_KEY = "dsa:runner-height-h";
const HEIGHT_V_KEY = "dsa:runner-height-v";
const DEFAULT_HEIGHT_H = 380;
const DEFAULT_HEIGHT_V = 720;
const MIN_HEIGHT_H = 260;
const MAX_HEIGHT_H = 900;
const MIN_HEIGHT_V = 480;
const MAX_HEIGHT_V = 1800;

function randomArray(length: number): number[] {
  return Array.from(
    { length },
    () => Math.floor(Math.random() * 90) + 10,
  );
}

export function AlgorithmRunnerClient({
  slug,
  initial,
  highlightedLines,
  meta,
}: Props) {
  const [input, setInput] = useState<number[]>(initial);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const [layout, setLayout] = useState<LayoutMode>("horizontal");
  const [splitRatioH, setSplitRatioH] = useState(0.6);
  const [splitRatioV, setSplitRatioV] = useState(0.55);
  const [heightH, setHeightH] = useState(DEFAULT_HEIGHT_H);
  const [heightV, setHeightV] = useState(DEFAULT_HEIGHT_V);

  useEffect(() => {
    // Hydrate from localStorage once on mount. The set-state-in-effect lint
    // rule is a false positive here: we're syncing React state with an
    // external store (localStorage), which effects are designed for.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const savedLayout = window.localStorage.getItem(LAYOUT_KEY);
      if (savedLayout === "horizontal" || savedLayout === "vertical") {
        setLayout(savedLayout);
      }
      const savedH = window.localStorage.getItem(SPLIT_H_KEY);
      if (savedH) {
        const r = Number(savedH);
        if (!Number.isNaN(r) && r >= 0.2 && r <= 0.85) setSplitRatioH(r);
      }
      const savedV = window.localStorage.getItem(SPLIT_V_KEY);
      if (savedV) {
        const r = Number(savedV);
        if (!Number.isNaN(r) && r >= 0.2 && r <= 0.85) setSplitRatioV(r);
      }
      const savedHH = window.localStorage.getItem(HEIGHT_H_KEY);
      if (savedHH) {
        const v = Number(savedHH);
        if (!Number.isNaN(v) && v >= MIN_HEIGHT_H && v <= MAX_HEIGHT_H) {
          setHeightH(v);
        }
      }
      const savedVH = window.localStorage.getItem(HEIGHT_V_KEY);
      if (savedVH) {
        const v = Number(savedVH);
        if (!Number.isNaN(v) && v >= MIN_HEIGHT_V && v <= MAX_HEIGHT_V) {
          setHeightV(v);
        }
      }
    } catch {
      // ignore
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(LAYOUT_KEY, layout);
    } catch {
      // ignore
    }
  }, [layout]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SPLIT_H_KEY, String(splitRatioH));
    } catch {
      // ignore
    }
  }, [splitRatioH]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SPLIT_V_KEY, String(splitRatioV));
    } catch {
      // ignore
    }
  }, [splitRatioV]);

  useEffect(() => {
    try {
      window.localStorage.setItem(HEIGHT_H_KEY, String(heightH));
    } catch {
      // ignore
    }
  }, [heightH]);

  useEffect(() => {
    try {
      window.localStorage.setItem(HEIGHT_V_KEY, String(heightV));
    } catch {
      // ignore
    }
  }, [heightV]);

  const steps = useMemo(() => {
    const entry = getAlgorithm(slug);
    return entry.steps(input);
  }, [slug, input]);

  const step = steps[Math.min(currentStep, steps.length - 1)];

  const handleStepChange = useCallback(
    (idx: number) => {
      setCurrentStep(idx);
      if (idx >= steps.length - 1) setIsPlaying(false);
    },
    [steps.length],
  );

  const handlePlayToggle = useCallback(() => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((p) => !p);
  }, [currentStep, steps.length]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleReset = useCallback(() => {
    setInput(initial);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [initial]);

  const handleRandomize = useCallback(() => {
    setInput(randomArray(initial.length));
    setCurrentStep(0);
    setIsPlaying(false);
  }, [initial.length]);

  const animationPanel = (
    <div className="rounded-xl border border-border bg-surface relative overflow-hidden h-full">
      <ArrayRenderer step={step} />
    </div>
  );

  const codePanelEl = (
    <div className="h-full">
      <CodePanel
        highlightedLines={highlightedLines}
        currentLine={step.codeLine}
        filename={`${meta.slug}.ts`}
      />
    </div>
  );

  return (
    <div className="not-prose my-10 rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-serif text-2xl tracking-tight">{meta.name}</div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono tabular-nums text-muted">
            <span>
              best <span className="text-foreground/80">{meta.timeBest}</span>
            </span>
            <span>
              avg <span className="text-foreground/80">{meta.timeAvg}</span>
            </span>
            <span>
              worst{" "}
              <span className="text-foreground/80">{meta.timeWorst}</span>
            </span>
            <span>
              space <span className="text-foreground/80">{meta.space}</span>
            </span>
            <span className="text-foreground/80">
              {meta.stable ? "stable" : "unstable"}
            </span>
            {meta.inPlace && (
              <span className="text-foreground/80">in-place</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LayoutToggle layout={layout} onChange={setLayout} />
          <div className="h-5 w-px bg-border mx-1" />
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-xs rounded-md border border-border hover:border-accent/50 hover:bg-surface-raised transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleRandomize}
            className="px-3 py-1.5 text-xs rounded-md border border-border hover:border-accent/50 hover:bg-surface-raised transition-colors"
          >
            Random
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <div
          className="relative"
          style={{ height: layout === "horizontal" ? heightH : heightV }}
        >
          <Splitter
            orientation={layout}
            firstRatio={layout === "horizontal" ? splitRatioH : splitRatioV}
            onChange={layout === "horizontal" ? setSplitRatioH : setSplitRatioV}
          >
            {animationPanel}
            {codePanelEl}
          </Splitter>
        </div>
        <HeightResizeHandle
          value={layout === "horizontal" ? heightH : heightV}
          onChange={layout === "horizontal" ? setHeightH : setHeightV}
          min={layout === "horizontal" ? MIN_HEIGHT_H : MIN_HEIGHT_V}
          max={layout === "horizontal" ? MAX_HEIGHT_H : MAX_HEIGHT_V}
        />
      </div>

      <div className="mb-4">
        <StepPlayer
          currentStep={currentStep}
          totalSteps={steps.length}
          isPlaying={isPlaying}
          speed={speed}
          onStepChange={handleStepChange}
          onPlayToggle={handlePlayToggle}
          onPause={handlePause}
          onSpeedChange={setSpeed}
        />
      </div>

      <Narration step={step} stepIndex={currentStep} />
    </div>
  );
}

function HeightResizeHandle({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (h: number) => void;
  min: number;
  max: number;
}) {
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: PointerEvent) => {
      const delta = e.clientY - startYRef.current;
      const next = Math.min(max, Math.max(min, startHeightRef.current + delta));
      onChange(next);
    };
    const handleUp = () => setDragging(false);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragging, min, max, onChange]);

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        startYRef.current = e.clientY;
        startHeightRef.current = value;
        setDragging(true);
      }}
      onKeyDown={(e) => {
        const step = 20;
        if (e.key === "ArrowUp") {
          e.preventDefault();
          onChange(Math.max(min, value - step));
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          onChange(Math.min(max, value + step));
        }
      }}
      className={
        "group relative z-20 my-2 flex h-3 items-center justify-center cursor-ns-resize " +
        (dragging ? "bg-accent/20" : "hover:bg-accent/10")
      }
      title="Drag to resize height"
    >
      <div
        className={
          "absolute inset-x-4 h-px transition-colors " +
          (dragging ? "bg-accent" : "bg-border group-hover:bg-accent/60")
        }
      />
      <div
        className={
          "relative z-10 flex flex-row gap-0.5 transition-opacity " +
          (dragging ? "opacity-100" : "opacity-0 group-hover:opacity-100")
        }
      >
        <span className="block h-1 w-1 rounded-full bg-accent" />
        <span className="block h-1 w-1 rounded-full bg-accent" />
        <span className="block h-1 w-1 rounded-full bg-accent" />
      </div>
    </div>
  );
}

function LayoutToggle({
  layout,
  onChange,
}: {
  layout: LayoutMode;
  onChange: (l: LayoutMode) => void;
}) {
  return (
    <div className="flex items-center rounded-md border border-border p-0.5">
      <button
        type="button"
        onClick={() => onChange("horizontal")}
        aria-label="Side-by-side layout"
        aria-pressed={layout === "horizontal"}
        className={
          "flex items-center justify-center h-6 w-8 rounded transition-colors " +
          (layout === "horizontal"
            ? "bg-accent/15 text-accent"
            : "text-muted hover:text-foreground")
        }
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect
            x="1.5"
            y="3"
            width="5.5"
            height="10"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="9"
            y="3"
            width="5.5"
            height="10"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onChange("vertical")}
        aria-label="Stacked layout"
        aria-pressed={layout === "vertical"}
        className={
          "flex items-center justify-center h-6 w-8 rounded transition-colors " +
          (layout === "vertical"
            ? "bg-accent/15 text-accent"
            : "text-muted hover:text-foreground")
        }
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect
            x="2"
            y="1.5"
            width="12"
            height="5.5"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="2"
            y="9"
            width="12"
            height="5.5"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </button>
    </div>
  );
}
