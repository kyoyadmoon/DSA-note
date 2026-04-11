"use client";

import { useEffect } from "react";

type Props = {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  onStepChange: (step: number) => void;
  onPlayToggle: () => void;
  onPause: () => void;
  onSpeedChange: (speed: number) => void;
};

const BASE_INTERVAL_MS = 650;
const SPEEDS = [0.25, 0.5, 1, 2] as const;

export function StepPlayer({
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  onStepChange,
  onPlayToggle,
  onPause,
  onSpeedChange,
}: Props) {
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= totalSteps - 1) return;
    const id = window.setTimeout(() => {
      onStepChange(currentStep + 1);
    }, BASE_INTERVAL_MS / speed);
    return () => window.clearTimeout(id);
  }, [isPlaying, currentStep, totalSteps, speed, onStepChange]);

  const manualStep = (idx: number) => {
    onPause();
    onStepChange(idx);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        onPlayToggle();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        onPause();
        onStepChange(Math.max(0, currentStep - 1));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        onPause();
        onStepChange(Math.min(totalSteps - 1, currentStep + 1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentStep, totalSteps, onStepChange, onPlayToggle, onPause]);

  const atEnd = currentStep >= totalSteps - 1;
  const progress = totalSteps > 1 ? currentStep / (totalSteps - 1) : 0;

  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4 flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <div className="flex-1" />
        <IconButton
          label="Restart"
          onClick={() => manualStep(0)}
          disabled={currentStep === 0}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zM9.5 12l10 6V6z" />
          </svg>
        </IconButton>
        <IconButton
          label="Previous"
          onClick={() => manualStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 18L9.5 12l6-6v12z" />
          </svg>
        </IconButton>
        <button
          type="button"
          onClick={onPlayToggle}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-accent text-background hover:opacity-90 transition-opacity shadow-lg shadow-accent/20"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : atEnd ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08a6 6 0 1 1-1.41-6.36L13 11h7V4l-2.35 2.35z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <IconButton
          label="Next"
          onClick={() =>
            manualStep(Math.min(totalSteps - 1, currentStep + 1))
          }
          disabled={atEnd}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.5 6l6 6-6 6V6z" />
          </svg>
        </IconButton>
        <IconButton
          label="End"
          onClick={() => manualStep(totalSteps - 1)}
          disabled={atEnd}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 6h2v12h-2zM4.5 18l10-6-10-6z" />
          </svg>
        </IconButton>

        <div className="mx-3 font-mono text-xs text-muted tabular-nums shrink-0">
          {String(currentStep + 1).padStart(2, "0")} /{" "}
          {String(totalSteps).padStart(2, "0")}
        </div>

        <div className="flex-1 flex justify-end">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted mr-1">speed</span>
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSpeedChange(s)}
                className={
                  "px-2 py-1 rounded-md font-mono tabular-nums transition-colors " +
                  (speed === s
                    ? "bg-accent/15 text-accent border border-accent/40"
                    : "text-muted hover:text-foreground border border-transparent")
                }
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative h-1.5 rounded-full bg-surface-raised overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-accent/70 transition-[width] duration-150"
          style={{ width: `${progress * 100}%` }}
        />
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={currentStep}
          onChange={(e) => manualStep(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Scrub steps"
        />
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className="flex items-center justify-center h-8 w-8 rounded-md text-foreground/70 hover:text-foreground hover:bg-surface-raised disabled:opacity-30 disabled:pointer-events-none transition-colors"
    >
      {children}
    </button>
  );
}
