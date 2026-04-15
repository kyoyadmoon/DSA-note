export type TreeNode = {
  id: string;
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
};

export type TreePhase =
  | "idle"
  | "compare"
  | "insert"
  | "found"
  | "not-found"
  | "visit"
  | "done";

export type TreeNodeState =
  | "idle"
  | "comparing"
  | "inserted"
  | "visited"
  | "found"
  | "path"
  | "swap";

export type TreeStep = {
  /** Deep-copied root of the tree at this point in the algorithm */
  root: TreeNode | null;

  /** Map of node id → visual state */
  nodeStates: Record<string, TreeNodeState>;

  /** The node currently being visited/compared (by id) */
  currentNodeId?: string;

  /** The node that was newly inserted or found (by id) */
  targetNodeId?: string;

  /** The edge being traversed (from parentId → childId) */
  activeEdge?: { from: string; to: string };

  /** The value being searched for or inserted */
  operationValue?: number;

  phase: TreePhase;
  codeLine: number;
  title: string;
  detail: string;
};

export type TreeAlgorithmMeta = {
  name: string;
  slug: string;
  category: "tree";
  timeBest: string;
  timeAvg: string;
  timeWorst: string;
  space: string;
  tags: string[];
};
