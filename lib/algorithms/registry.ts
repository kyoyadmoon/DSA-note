import type { AlgorithmMeta, ArrayStep } from "@/lib/types/step";
import {
  bubbleSortMeta,
  bubbleSortSource,
  bubbleSortSteps,
} from "@/lib/algorithms/sorting/bubbleSort";

export type AlgorithmEntry = {
  meta: AlgorithmMeta;
  source: string;
  steps: (input: number[]) => ArrayStep[];
};

export const registry: Record<string, AlgorithmEntry> = {
  "bubble-sort": {
    meta: bubbleSortMeta,
    source: bubbleSortSource,
    steps: bubbleSortSteps,
  },
};

export function getAlgorithm(slug: string): AlgorithmEntry {
  const entry = registry[slug];
  if (!entry) throw new Error(`Unknown algorithm slug: ${slug}`);
  return entry;
}
