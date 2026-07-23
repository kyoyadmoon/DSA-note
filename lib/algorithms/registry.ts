import type { AlgorithmMeta, ArrayStep } from "@/lib/types/step";
import type {
  DataStructureInput,
  DataStructureMeta,
  DataStructureStep,
} from "@/lib/types/dataStructure";
import type { TreeAlgorithmMeta, TreeStep } from "@/lib/types/tree";
import type {
  UnionFindAlgorithmMeta,
  UnionFindInput,
  UnionFindStep,
} from "@/lib/types/unionFind";
import {
  bubbleSortMeta,
  bubbleSortSource,
  bubbleSortSteps,
} from "@/lib/algorithms/sorting/bubbleSort";
import {
  selectionSortMeta,
  selectionSortSource,
  selectionSortSteps,
} from "@/lib/algorithms/sorting/selectionSort";
import {
  insertionSortMeta,
  insertionSortSource,
  insertionSortSteps,
} from "@/lib/algorithms/sorting/insertionSort";
import {
  quickSortMeta,
  quickSortSource,
  quickSortSteps,
} from "@/lib/algorithms/sorting/quickSort";
import {
  mergeSortMeta,
  mergeSortSource,
  mergeSortSteps,
} from "@/lib/algorithms/sorting/mergeSort";
import {
  heapSortMeta,
  heapSortSource,
  heapSortSteps,
} from "@/lib/algorithms/sorting/heapSort";
import {
  bstInsertMeta,
  bstInsertSource,
  bstInsertSteps,
} from "@/lib/algorithms/tree/bstInsert";
import {
  inorderMeta,
  inorderSource,
  inorderSteps,
} from "@/lib/algorithms/tree/inorder";
import {
  lcaMeta,
  lcaSource,
  lcaSteps,
} from "@/lib/algorithms/tree/lca";
import {
  preorderMeta,
  preorderSource,
  preorderSteps,
} from "@/lib/algorithms/tree/preorder";
import {
  levelOrderMeta,
  levelOrderSource,
  levelOrderSteps,
} from "@/lib/algorithms/tree/levelOrder";
import {
  postorderMeta,
  postorderSource,
  postorderSteps,
} from "@/lib/algorithms/tree/postorder";
import {
  maxDepthMeta,
  maxDepthSource,
  maxDepthSteps,
} from "@/lib/algorithms/tree/maxDepth";
import {
  diameterMeta,
  diameterSource,
  diameterSteps,
} from "@/lib/algorithms/tree/diameter";
import {
  quickFindMeta,
  quickFindSource,
  quickFindSteps,
} from "@/lib/algorithms/graph/union-find/quickFind";
import {
  quickUnionMeta,
  quickUnionSource,
  quickUnionSteps,
} from "@/lib/algorithms/graph/union-find/quickUnion";
import {
  weightedQuickUnionMeta,
  weightedQuickUnionSource,
  weightedQuickUnionSteps,
} from "@/lib/algorithms/graph/union-find/weightedQuickUnion";
import {
  pathCompressionMeta,
  pathCompressionSource,
  pathCompressionSteps,
} from "@/lib/algorithms/graph/union-find/pathCompression";
import {
  invertTreeMeta,
  invertTreeSource,
  invertTreeSteps,
} from "@/lib/algorithms/tree/invert";
import {
  symmetricMeta,
  symmetricSource,
  symmetricSteps,
} from "@/lib/algorithms/tree/symmetric";
import {
  pathSumMeta,
  pathSumSource,
  pathSumSteps,
} from "@/lib/algorithms/tree/pathSum";
import {
  dynamicArrayMeta,
  dynamicArraySource,
  dynamicArraySteps,
} from "@/lib/algorithms/data-structures/dynamicArray";
import {
  singlyLinkedListMeta,
  singlyLinkedListSource,
  singlyLinkedListSteps,
} from "@/lib/algorithms/data-structures/singlyLinkedList";
import {
  doublyLinkedListMeta,
  doublyLinkedListSource,
  doublyLinkedListSteps,
} from "@/lib/algorithms/data-structures/doublyLinkedList";
import {
  stackMeta,
  stackSource,
  stackSteps,
} from "@/lib/algorithms/data-structures/stack";
import {
  queueMeta,
  queueSource,
  queueSteps,
} from "@/lib/algorithms/data-structures/queue";
import {
  dequeMeta,
  dequeSource,
  dequeSteps,
} from "@/lib/algorithms/data-structures/deque";

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
  "selection-sort": {
    meta: selectionSortMeta,
    source: selectionSortSource,
    steps: selectionSortSteps,
  },
  "insertion-sort": {
    meta: insertionSortMeta,
    source: insertionSortSource,
    steps: insertionSortSteps,
  },
  "quick-sort": {
    meta: quickSortMeta,
    source: quickSortSource,
    steps: quickSortSteps,
  },
  "merge-sort": {
    meta: mergeSortMeta,
    source: mergeSortSource,
    steps: mergeSortSteps,
  },
  "heap-sort": {
    meta: heapSortMeta,
    source: heapSortSource,
    steps: heapSortSteps,
  },
};

export const treeRegistry: Record<string, TreeAlgorithmEntry> = {
  "bst-insert": {
    meta: bstInsertMeta,
    source: bstInsertSource,
    steps: bstInsertSteps,
  },
  "tree-lca": {
    meta: lcaMeta,
    source: lcaSource,
    steps: lcaSteps,
  },
  "tree-preorder": {
    meta: preorderMeta,
    source: preorderSource,
    steps: preorderSteps,
  },
  "tree-level-order": {
    meta: levelOrderMeta,
    source: levelOrderSource,
    steps: levelOrderSteps,
  },
  "tree-postorder": {
    meta: postorderMeta,
    source: postorderSource,
    steps: postorderSteps,
  },
  "tree-inorder": {
    meta: inorderMeta,
    source: inorderSource,
    steps: inorderSteps,
  },
  "tree-max-depth": {
    meta: maxDepthMeta,
    source: maxDepthSource,
    steps: maxDepthSteps,
  },
  "tree-diameter": {
    meta: diameterMeta,
    source: diameterSource,
    steps: diameterSteps,
  },
  "tree-invert": {
    meta: invertTreeMeta,
    source: invertTreeSource,
    steps: invertTreeSteps,
  },
  "tree-symmetric": {
    meta: symmetricMeta,
    source: symmetricSource,
    steps: symmetricSteps,
  },
  "tree-path-sum": {
    meta: pathSumMeta,
    source: pathSumSource,
    steps: pathSumSteps,
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

export type UnionFindAlgorithmEntry = {
  meta: UnionFindAlgorithmMeta;
  source: string;
  steps: (input: UnionFindInput) => UnionFindStep[];
};

export const unionFindRegistry: Record<string, UnionFindAlgorithmEntry> = {
  "uf-quick-find": {
    meta: quickFindMeta,
    source: quickFindSource,
    steps: quickFindSteps,
  },
  "uf-quick-union": {
    meta: quickUnionMeta,
    source: quickUnionSource,
    steps: quickUnionSteps,
  },
  "uf-weighted-quick-union": {
    meta: weightedQuickUnionMeta,
    source: weightedQuickUnionSource,
    steps: weightedQuickUnionSteps,
  },
  "uf-path-compression": {
    meta: pathCompressionMeta,
    source: pathCompressionSource,
    steps: pathCompressionSteps,
  },
};

export function getUnionFindAlgorithm(slug: string): UnionFindAlgorithmEntry {
  const entry = unionFindRegistry[slug];
  if (!entry) throw new Error(`Unknown union-find algorithm slug: ${slug}`);
  return entry;
}

export type DataStructureAlgorithmEntry = {
  meta: DataStructureMeta;
  source: string;
  steps: (input: DataStructureInput) => DataStructureStep[];
};

export const dataStructureRegistry: Record<
  string,
  DataStructureAlgorithmEntry
> = {
  "dynamic-array": {
    meta: dynamicArrayMeta,
    source: dynamicArraySource,
    steps: (input) => {
      if (input.kind !== "numbers") {
        throw new Error("Dynamic Array expects a numbers input");
      }
      return dynamicArraySteps(input.values);
    },
  },
  "singly-linked-list": {
    meta: singlyLinkedListMeta,
    source: singlyLinkedListSource,
    steps: (input) => {
      if (input.kind !== "numbers") {
        throw new Error("Singly Linked List expects a numbers input");
      }
      return singlyLinkedListSteps(input.values);
    },
  },
  "doubly-linked-list": {
    meta: doublyLinkedListMeta,
    source: doublyLinkedListSource,
    steps: (input) => {
      if (input.kind !== "numbers") {
        throw new Error("Doubly Linked List expects a numbers input");
      }
      return doublyLinkedListSteps(input.values);
    },
  },
  stack: {
    meta: stackMeta,
    source: stackSource,
    steps: (input) => {
      if (input.kind !== "numbers") {
        throw new Error("Stack expects a numbers input");
      }
      return stackSteps(input.values);
    },
  },
  queue: {
    meta: queueMeta,
    source: queueSource,
    steps: (input) => {
      if (input.kind !== "numbers") {
        throw new Error("Queue expects a numbers input");
      }
      return queueSteps(input.values);
    },
  },
  deque: {
    meta: dequeMeta,
    source: dequeSource,
    steps: (input) => {
      if (input.kind !== "numbers") {
        throw new Error("Deque expects a numbers input");
      }
      return dequeSteps(input.values);
    },
  },
};

export function getDataStructureAlgorithm(
  slug: string,
): DataStructureAlgorithmEntry {
  const entry = dataStructureRegistry[slug];
  if (!entry) throw new Error(`Unknown data-structure slug: ${slug}`);
  return entry;
}
