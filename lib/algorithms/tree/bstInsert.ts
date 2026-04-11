import type {
  TreeNode,
  TreeStep,
  TreeNodeState,
  TreeAlgorithmMeta,
} from "@/lib/types/tree";

// ── helpers ────────────────────────────────────────────────────

let nextId = 0;
function makeNode(value: number): TreeNode {
  return { id: `bst-${nextId++}`, value, left: null, right: null };
}

function resetIdCounter() {
  nextId = 0;
}

function deepCopy(node: TreeNode | null): TreeNode | null {
  if (!node) return null;
  return {
    id: node.id,
    value: node.value,
    left: deepCopy(node.left),
    right: deepCopy(node.right),
  };
}

function collectIds(node: TreeNode | null): string[] {
  if (!node) return [];
  return [node.id, ...collectIds(node.left), ...collectIds(node.right)];
}

function buildStates(
  root: TreeNode | null,
  overrides: Record<string, TreeNodeState> = {},
): Record<string, TreeNodeState> {
  const states: Record<string, TreeNodeState> = {};
  for (const id of collectIds(root)) {
    states[id] = overrides[id] ?? "idle";
  }
  return states;
}

// ── pure function (testable) ───────────────────────────────────

export function bstInsert(
  values: number[],
): TreeNode | null {
  let root: TreeNode | null = null;
  resetIdCounter();
  for (const v of values) {
    root = insertNode(root, v);
  }
  return root;
}

function insertNode(root: TreeNode | null, value: number): TreeNode {
  if (!root) return makeNode(value);
  if (value < root.value) {
    root.left = insertNode(root.left, value);
  } else {
    root.right = insertNode(root.right, value);
  }
  return root;
}

// ── step generator ─────────────────────────────────────────────

export function bstInsertSteps(values: number[]): TreeStep[] {
  resetIdCounter();
  const steps: TreeStep[] = [];
  let root: TreeNode | null = null;

  steps.push({
    root: null,
    nodeStates: {},
    phase: "idle",
    codeLine: 1,
    title: "開始建立 BST",
    detail: `將依序插入 ${values.length} 個值：[${values.join(", ")}]。`,
  });

  for (let vi = 0; vi < values.length; vi++) {
    const value = values[vi];

    if (!root) {
      // First node — becomes root directly
      root = makeNode(value);
      steps.push({
        root: deepCopy(root),
        nodeStates: buildStates(root, { [root.id]: "inserted" }),
        targetNodeId: root.id,
        operationValue: value,
        phase: "insert",
        codeLine: 2,
        title: `插入根節點 ${value}`,
        detail: `樹是空的，${value} 成為根節點。`,
      });
      continue;
    }

    // Start inserting — announce
    steps.push({
      root: deepCopy(root),
      nodeStates: buildStates(root),
      operationValue: value,
      phase: "idle",
      codeLine: 3,
      title: `準備插入 ${value}`,
      detail: `從根節點開始往下比較，找到正確的位置。`,
    });

    // Walk down the tree
    let current: TreeNode = root;
    const pathIds: string[] = [];

    while (true) {
      pathIds.push(current.id);

      // Build state: mark previously visited nodes as "path"
      const stateOverrides: Record<string, TreeNodeState> = {};
      for (const pid of pathIds) {
        stateOverrides[pid] = "path";
      }
      stateOverrides[current.id] = "comparing";

      const goLeft = value < current.value;

      steps.push({
        root: deepCopy(root),
        nodeStates: buildStates(root, stateOverrides),
        currentNodeId: current.id,
        operationValue: value,
        phase: "compare",
        codeLine: goLeft ? 5 : 7,
        title: `比較 ${value} 與 ${current.value}`,
        detail: goLeft
          ? `${value} < ${current.value}，往左子樹走。`
          : `${value} ≥ ${current.value}，往右子樹走。`,
      });

      if (goLeft) {
        if (current.left) {
          steps.push({
            root: deepCopy(root),
            nodeStates: buildStates(root, stateOverrides),
            currentNodeId: current.id,
            activeEdge: { from: current.id, to: current.left.id },
            operationValue: value,
            phase: "compare",
            codeLine: 6,
            title: `走向左子節點 ${current.left.value}`,
            detail: `左子樹存在，繼續往下。`,
          });
          current = current.left;
        } else {
          // Insert here
          const newNode = makeNode(value);
          current.left = newNode;

          const insertOverrides: Record<string, TreeNodeState> = {};
          for (const pid of pathIds) {
            insertOverrides[pid] = "path";
          }
          insertOverrides[newNode.id] = "inserted";

          steps.push({
            root: deepCopy(root),
            nodeStates: buildStates(root, insertOverrides),
            targetNodeId: newNode.id,
            activeEdge: { from: current.id, to: newNode.id },
            operationValue: value,
            phase: "insert",
            codeLine: 5,
            title: `插入 ${value} 為左子節點`,
            detail: `${current.value} 沒有左子節點，${value} 插入此處。`,
          });
          break;
        }
      } else {
        if (current.right) {
          steps.push({
            root: deepCopy(root),
            nodeStates: buildStates(root, stateOverrides),
            currentNodeId: current.id,
            activeEdge: { from: current.id, to: current.right.id },
            operationValue: value,
            phase: "compare",
            codeLine: 8,
            title: `走向右子節點 ${current.right.value}`,
            detail: `右子樹存在，繼續往下。`,
          });
          current = current.right;
        } else {
          // Insert here
          const newNode = makeNode(value);
          current.right = newNode;

          const insertOverrides: Record<string, TreeNodeState> = {};
          for (const pid of pathIds) {
            insertOverrides[pid] = "path";
          }
          insertOverrides[newNode.id] = "inserted";

          steps.push({
            root: deepCopy(root),
            nodeStates: buildStates(root, insertOverrides),
            targetNodeId: newNode.id,
            activeEdge: { from: current.id, to: newNode.id },
            operationValue: value,
            phase: "insert",
            codeLine: 7,
            title: `插入 ${value} 為右子節點`,
            detail: `${current.value} 沒有右子節點，${value} 插入此處。`,
          });
          break;
        }
      }
    }
  }

  // Final step
  steps.push({
    root: deepCopy(root),
    nodeStates: buildStates(root),
    phase: "done",
    codeLine: 10,
    title: "BST 建立完成",
    detail: `${values.length} 個節點全部插入。樹的結構由插入順序決定。`,
  });

  return steps;
}

// ── source code (for CodePanel) ────────────────────────────────

export const bstInsertSource = `function insert(root: TreeNode | null, value: number): TreeNode {
  // 空位就是新節點的家
  if (!root) return { value, left: null, right: null };

  if (value < root.value) {
    // 比較小 → 往左子樹
    root.left = insert(root.left, value);
  } else {
    // 大於等於 → 往右子樹
    root.right = insert(root.right, value);
  }
  return root;
}`;

// ── metadata ───────────────────────────────────────────────────

export const bstInsertMeta: TreeAlgorithmMeta = {
  name: "BST Insertion",
  slug: "bst-insert",
  category: "tree",
  timeBest: "O(log n)",
  timeAvg: "O(log n)",
  timeWorst: "O(n)",
  space: "O(h)",
  tags: ["BST", "遞迴", "基礎"],
};
