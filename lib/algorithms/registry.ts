import type { AlgorithmMeta, ArrayStep } from "@/lib/types/step";
import type { TreeAlgorithmMeta, TreeStep } from "@/lib/types/tree";
import {
  bubbleSortMeta,
  bubbleSortSource,
  bubbleSortSteps,
} from "@/lib/algorithms/sorting/bubbleSort";
import {
  bstInsertMeta,
  bstInsertSource,
  bstInsertSteps,
} from "@/lib/algorithms/tree/bstInsert";

export type AlgorithmEntry = {
  meta: AlgorithmMeta;
  source: string;
  steps: (input: number[]) => ArrayStep[];
};

export type TreeAlgorithmEntry = {
  meta: TreeAlgorithmMeta;
  source: string;
  steps: (input: number[]) => TreeStep[];
};

export const registry: Record<string, AlgorithmEntry> = {
  "bubble-sort": {
    meta: bubbleSortMeta,
    source: bubbleSortSource,
    steps: bubbleSortSteps,
  },
};

export const treeRegistry: Record<string, TreeAlgorithmEntry> = {
  "bst-insert": {
    meta: bstInsertMeta,
    source: bstInsertSource,
    steps: bstInsertSteps,
  },
};

export function getAlgorithm(slug: string): AlgorithmEntry {
  const entry = registry[slug];
  if (!entry) throw new Error(`Unknown algorithm slug: ${slug}`);
  return entry;
}

export function getTreeAlgorithm(slug: string): TreeAlgorithmEntry {
  const entry = treeRegistry[slug];
  if (!entry) throw new Error(`Unknown tree algorithm slug: ${slug}`);
  return entry;
}
