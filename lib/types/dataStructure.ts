export type NumberListInput = {
  kind: "numbers";
  values: number[];
};

export type WordListInput = {
  kind: "words";
  values: string[];
};

export type GraphInput = {
  kind: "graph";
  nodes: string[];
  edges: [string, string][];
  start: string;
  directed?: boolean;
};

export type DataStructureInput = NumberListInput | WordListInput | GraphInput;

export type StructureSlotState =
  | "idle"
  | "active"
  | "copy-source"
  | "copy-target"
  | "empty";

export type StructureSlot = {
  id: string;
  value: number | null;
  state: StructureSlotState;
};

export type StructureBuffer = {
  id: string;
  label: string;
  active: boolean;
  slots: StructureSlot[];
};

export type DynamicArrayView = {
  kind: "dynamic-array";
  size: number;
  capacity: number;
  buffers: StructureBuffer[];
  pointer?: { index: number; label: string };
};

export type LinkedListNodeState =
  | "idle"
  | "active"
  | "visited"
  | "new"
  | "removing";

export type LinkedListNodeView = {
  id: string;
  value: number;
  nextId: string | null;
  prevId?: string | null;
  state: LinkedListNodeState;
};

export type LinkedListView = {
  kind: "linked-list";
  nodes: LinkedListNodeView[];
  headId: string | null;
  tailId: string | null;
  activeLink?: { from: string; to: string };
  doubly: boolean;
};

export type LinearCollectionMode = "stack" | "queue" | "deque";

export type LinearCollectionItemState =
  | "idle"
  | "active"
  | "new"
  | "removing"
  | "consumed";

export type LinearCollectionItemView = {
  id: string;
  value: number;
  state: LinearCollectionItemState;
};

export type LinearCollectionView = {
  kind: "linear-collection";
  mode: LinearCollectionMode;
  items: LinearCollectionItemView[];
  topId?: string;
  frontId?: string;
  backId?: string;
  headIndex?: number;
  output: number[];
};

export type HashEntryState = "idle" | "active" | "new" | "removing" | "found";

export type HashEntryView = {
  id: string;
  key: string;
  value: number;
  state: HashEntryState;
};

export type HashBucketView = {
  index: number;
  entries: HashEntryView[];
  active: boolean;
};

export type HashTableView = {
  kind: "hash-table";
  buckets: HashBucketView[];
  capacity: number;
  size: number;
  loadFactor: number;
  hashLabel?: string;
};

export type HeapNodeState =
  | "idle"
  | "active"
  | "compare"
  | "swap"
  | "new";

export type HeapNodeView = {
  id: string;
  index: number;
  value: number;
  state: HeapNodeState;
};

export type HeapView = {
  kind: "binary-heap";
  heapType: "min" | "max";
  nodes: HeapNodeView[];
  output: number[];
};

export type DataStructureView =
  | DynamicArrayView
  | LinkedListView
  | LinearCollectionView
  | HashTableView
  | HeapView;

export type DataStructureStep = {
  view: DataStructureView;
  phase: string;
  codeLine: number;
  title: string;
  detail: string;
};

export type OperationComplexity = {
  operation: string;
  time: string;
};

export type DataStructureMeta = {
  name: string;
  slug: string;
  category: "data-structure";
  operations: OperationComplexity[];
  space: string;
  tags: string[];
};
