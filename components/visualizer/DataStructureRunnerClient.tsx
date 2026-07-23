"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataStructureRenderer } from "@/components/renderers/DataStructureRenderer";
import { getDataStructureAlgorithm } from "@/lib/algorithms/registry";
import type {
  DataStructureInput,
  DataStructureMeta,
} from "@/lib/types/dataStructure";
import { CodePanel } from "./CodePanel";
import { Narration } from "./Narration";
import { Splitter } from "./Splitter";
import { StepPlayer } from "./StepPlayer";

type Props = {
  slug: string;
  initial: DataStructureInput;
  highlightedLines: string[];
  meta: DataStructureMeta;
};

type LayoutMode = "horizontal" | "vertical";

const LAYOUT_KEY = "dsa:runner-layout";
const SPLIT_H_KEY = "dsa:runner-split-h";
const SPLIT_V_KEY = "dsa:runner-split-v";
const HORIZONTAL_HEIGHT = 460;
const VERTICAL_HEIGHT = 780;

function randomizeInput(input: DataStructureInput): DataStructureInput {
  if (input.kind === "numbers") {
    return {
      kind: "numbers",
      values: input.values.map(() => Math.floor(Math.random() * 90) + 10),
    };
  }
  if (input.kind === "words") {
    return {
      kind: "words",
      values: [...input.values].sort(() => Math.random() - 0.5),
    };
  }
  return input;
}

export function DataStructureRunnerClient({
  slug,
  initial,
  highlightedLines,
  meta,
}: Props) {
  const [input, setInput] = useState<DataStructureInput>(initial);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [layout, setLayout] = useState<LayoutMode>("horizontal");
  const [splitRatioH, setSplitRatioH] = useState(0.6);
  const [splitRatioV, setSplitRatioV] = useState(0.55);

  useEffect(() => {
    // This effect intentionally hydrates state from localStorage after mount.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const savedLayout = window.localStorage.getItem(LAYOUT_KEY);
      if (savedLayout === "horizontal" || savedLayout === "vertical") {
        setLayout(savedLayout);
      }
      const savedH = Number(window.localStorage.getItem(SPLIT_H_KEY));
      if (savedH >= 0.2 && savedH <= 0.85) setSplitRatioH(savedH);
      const savedV = Number(window.localStorage.getItem(SPLIT_V_KEY));
      if (savedV >= 0.2 && savedV <= 0.85) setSplitRatioV(savedV);
    } catch {
      // Storage can be unavailable in privacy-restricted environments.
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(LAYOUT_KEY, layout);
      window.localStorage.setItem(SPLIT_H_KEY, String(splitRatioH));
      window.localStorage.setItem(SPLIT_V_KEY, String(splitRatioV));
    } catch {
      // Storage can be unavailable in privacy-restricted environments.
    }
  }, [layout, splitRatioH, splitRatioV]);

  const steps = useMemo(
    () => getDataStructureAlgorithm(slug).steps(input),
    [input, slug],
  );
  const step = steps[Math.min(currentStep, steps.length - 1)];

  const handleStepChange = useCallback(
    (index: number) => {
      setCurrentStep(index);
      if (index >= steps.length - 1) setIsPlaying(false);
    },
    [steps.length],
  );

  const handlePlayToggle = useCallback(() => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((playing) => !playing);
  }, [currentStep, steps.length]);

  const handleReset = useCallback(() => {
    setInput(initial);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [initial]);

  const handleRandomize = useCallback(() => {
    setInput((current) => randomizeInput(current));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const animationPanel = (
    <div className="h-full overflow-hidden rounded-xl border border-border bg-surface">
      <DataStructureRenderer step={step} />
    </div>
  );

  const codePanel = (
    <div className="h-full">
      <CodePanel
        highlightedLines={highlightedLines}
        currentLine={step.codeLine}
        filename={`${meta.slug}.ts`}
      />
    </div>
  );

  return (
    <div className="not-prose my-10 overflow-x-hidden rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-serif text-2xl tracking-tight">{meta.name}</div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono tabular-nums text-muted">
            {meta.operations.map((item) => (
              <span key={item.operation}>
                {item.operation}{" "}
                <span className="text-foreground/80">{item.time}</span>
              </span>
            ))}
            <span>
              space <span className="text-foreground/80">{meta.space}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LayoutToggle layout={layout} onChange={setLayout} />
          <div className="mx-1 h-5 w-px bg-border" />
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:border-accent/50 hover:bg-surface-raised"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleRandomize}
            className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:border-accent/50 hover:bg-surface-raised"
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
          {codePanel}
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
        onPause={() => setIsPlaying(false)}
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
  onChange: (layout: LayoutMode) => void;
}) {
  return (
    <div className="flex items-center rounded-md border border-border p-0.5">
      {(["horizontal", "vertical"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          aria-label={mode === "horizontal" ? "Side-by-side layout" : "Stacked layout"}
          aria-pressed={layout === mode}
          className={
            "flex h-6 w-8 items-center justify-center rounded text-[10px] transition-colors " +
            (layout === mode
              ? "bg-accent/15 text-accent"
              : "text-muted hover:text-foreground")
          }
        >
          {mode === "horizontal" ? "↔" : "↕"}
        </button>
      ))}
    </div>
  );
}
