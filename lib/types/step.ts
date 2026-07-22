export type Phase =
  | "idle"
  | "compare"
  | "swap"
  | "select-min"
  | "insert"
  | "partition"
  | "merge"
  | "heapify"
  | "done";

export type ArrayItem = {
  id: string;
  value: number;
};

export type Pointer = {
  name: string;
  index: number;
  color?: string;
};

export type ArrayStep = {
  array: ArrayItem[];

  pointers?: Pointer[];
  comparing?: [number, number];
  swapping?: [number, number];
  sorted?: number[];
  active?: [number, number];
  pivot?: number;
  selected?: number;
  focusLabel?: string;

  phase: Phase;
  codeLine: number;
  title: string;
  detail: string;
};

export type AlgorithmMeta = {
  name: string;
  slug: string;
  timeBest: string;
  timeAvg: string;
  timeWorst: string;
  space: string;
  stable: boolean;
  inPlace: boolean;
  tags: string[];
};
