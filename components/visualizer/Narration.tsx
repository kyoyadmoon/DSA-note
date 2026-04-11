"use client";

import { AnimatePresence, motion } from "framer-motion";
type NarrationStep = {
  phase: string;
  title: string;
  detail: string;
};

type Props = {
  step: NarrationStep;
  stepIndex: number;
};

export function Narration({ step, stepIndex }: Props) {
  return (
    <div className="rounded-xl border border-border bg-surface px-6 py-5 overflow-hidden relative min-h-[112px]">
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted mb-2">
        Step {stepIndex + 1} · {step.phase}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          <div className="font-serif text-[22px] leading-snug tracking-tight mb-1.5">
            {step.title}
          </div>
          <div className="text-sm text-foreground/70 leading-relaxed">
            {step.detail}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
