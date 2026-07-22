export type UnionFindOp =
  | { kind: "union"; p: number; q: number }
  | { kind: "find"; x: number };

export type UnionFindInput = { n: number; ops: UnionFindOp[] };

export type UnionFindPhase =
  | "idle"
  | "find-walking"
  | "compare-roots"
  | "linking"
  | "relabeling"
  | "compressing"
  | "op-complete"
  | "done";

export type UnionFindStep = {
  /** parent[i] = parent of i, with parent[root] === root. */
  parents: number[];
  /** rank[i] for union-by-rank (only present in weighted / compression variants). */
  ranks?: number[];
  /** size[i] for union-by-size (alternative to rank; not used by the bundled
   * variants but kept on the type for future expansion). */
  sizes?: number[];
  /** Total element count (== parents.length). */
  n: number;

  /** Index of the op currently executing within the ops sequence. */
  currentOpIndex: number;
  /** The op being executed at this step (undefined on the trailing done step). */
  currentOp?: UnionFindOp;

  /** Nodes whose squares should glow (e.g. p and q during union, x during find). */
  highlightedNodes?: number[];
  /** Path of nodes being walked in find() — front to back, root at end. */
  activePath?: number[];
  /** Linking: which root becomes the child of which root. */
  linkChildRoot?: number;
  linkParentRoot?: number;

  phase: UnionFindPhase;
  codeLine: number;
  title: string;
  detail: string;
};

export type UnionFindAlgorithmMeta = {
  name: string;
  slug: string;
  category: "union-find";
  /** Amortized find. */
  timeFind: string;
  /** Amortized union. */
  timeUnion: string;
  space: string;
  tags: string[];
};
