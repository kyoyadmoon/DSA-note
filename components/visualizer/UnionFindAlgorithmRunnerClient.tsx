"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getUnionFindAlgorithm } from "@/lib/algorithms/registry";
import type {
  UnionFindAlgorithmMeta,
  UnionFindOp,
} from "@/lib/types/unionFind";
import { UnionFindRenderer } from "@/components/renderers/UnionFindRenderer";
import { CodePanel } from "./CodePanel";
import { Narration } from "./Narration";
import { Splitter } from "./Splitter";
import { StepPlayer } from "./StepPlayer";

type Props = {
  slug: string;
  n: number;
  ops: UnionFindOp[];
  highlightedLines: string[];
  meta: UnionFindAlgorithmMeta;
  /** When true (weighted / path-compression variants), the renderer shows
   * a small `r=` rank label beside each node. */
  showRanks?: boolean;
};

type LayoutMode = "horizontal" | "vertical";

const LAYOUT_KEY = "dsa:runner-layout";
const SPLIT_H_KEY = "dsa:runner-split-h";
const SPLIT_V_KEY = "dsa:runner-split-v";
const HORIZONTAL_HEIGHT = 460;
const VERTICAL_HEIGHT = 800;

function randomOps(n: number, count: number): UnionFindOp[] {
  if (n < 2) return [];
  const ops: UnionFindOp[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    if (r < 0.85) {
      // ~85% union, ~15% find — keep the focus on the structural changes.
      const p = Math.floor(Math.random() * n);
      let q = Math.floor(Math.random() * n);
      if (q === p) q = (q + 1) % n;
      ops.push({ kind: "union", p, q });
    } else {
      ops.push({ kind: "find", x: Math.floor(Math.random() * n) });
    }
  }
  return ops;
}

export function UnionFindAlgorithmRunnerClient({
  slug,
  n,
  ops,
  highlightedLines,
  meta,
  showRanks = false,
}: Props) {
  const [input, setInput] = useState<{ n: number; ops: UnionFindOp[] }>({ n, ops });
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const [layout, setLayout] = useState<LayoutMode>("horizontal");
  const [splitRatioH, setSplitRatioH] = useState(0.6);
  const [splitRatioV, setSplitRatioV] = useState(0.55);

  useEffect(() => {
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

  const steps = useMemo(() => {
    const entry = getUnionFindAlgorithm(slug);
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
    setInput({ n, ops });
    setCurrentStep(0);
    setIsPlaying(false);
  }, [n, ops]);

  const handleRandomize = useCallback(() => {
    setInput({ n, ops: randomOps(n, ops.length || 6) });
    setCurrentStep(0);
    setIsPlaying(false);
  }, [n, ops.length]);

  const animationPanel = (
    <div className="rounded-xl border border-border bg-surface relative overflow-hidden h-full">
      <UnionFindRenderer
        step={step}
        arrayLabel={slug === "uf-quick-find" ? "id[]" : "parent[]"}
        showRanks={showRanks}
      />
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
              find <span className="text-foreground/80">{meta.timeFind}</span>
            </span>
            <span>
              union <span className="text-foreground/80">{meta.timeUnion}</span>
            </span>
            <span>
              space <span className="text-foreground/80">{meta.space}</span>
            </span>
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

      <div
        className="mb-4"
        style={{
          height: layout === "horizontal" ? HORIZONTAL_HEIGHT : VERTICAL_HEIGHT,
        }}
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

      <div className="mb-4">
        <Narration step={step} stepIndex={currentStep} />
      </div>

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
          <rect x="1.5" y="3" width="5.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="9" y="3" width="5.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
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
          <rect x="2" y="1.5" width="12" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="2" y="9" width="12" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
    </div>
  );
}
