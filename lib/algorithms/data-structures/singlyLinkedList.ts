import type {
  DataStructureMeta,
  DataStructureStep,
  LinkedListNodeState,
  LinkedListNodeView,
} from "@/lib/types/dataStructure";

type StoredNode = {
  id: string;
  value: number;
};

function makeNodes(
  stored: StoredNode[],
  states: Record<string, LinkedListNodeState> = {},
): LinkedListNodeView[] {
  return stored.map((node, index) => ({
    ...node,
    nextId: stored[index + 1]?.id ?? null,
    state: states[node.id] ?? "idle",
  }));
}

function makeStep(
  stored: StoredNode[],
  config: Omit<DataStructureStep, "view"> & {
    states?: Record<string, LinkedListNodeState>;
    activeLink?: { from: string; to: string };
    visibleNodes?: StoredNode[];
    headId?: string | null;
    tailId?: string | null;
  },
): DataStructureStep {
  const {
    states,
    activeLink,
    visibleNodes = stored,
    headId = stored[0]?.id ?? null,
    tailId = stored.at(-1)?.id ?? null,
    ...step
  } = config;
  return {
    ...step,
    view: {
      kind: "linked-list",
      nodes: makeNodes(visibleNodes, states),
      headId,
      tailId,
      activeLink,
      doubly: false,
    },
  };
}

export function singlyLinkedListSteps(input: number[]): DataStructureStep[] {
  const values = [...input];
  const stored: StoredNode[] = [];
  const steps: DataStructureStep[] = [
    makeStep(stored, {
      phase: "idle",
      codeLine: 2,
      title: "建立空的 singly linked list",
      detail: "head 與 tail 都是 null；list 目前沒有任何可達節點。",
    }),
  ];

  values.forEach((value, index) => {
    const node: StoredNode = { id: `sll-${index}`, value };
    const previousTail = stored.at(-1);
    const visibleNodes = [...stored, node];

    steps.push(
      makeStep(stored, {
        phase: "allocate",
        codeLine: 6,
        title: `配置節點 ${value}`,
        detail: previousTail
          ? `新節點先獨立存在；目前 tail 仍是 ${previousTail.value}。`
          : "這是第一個節點，接下來 head 與 tail 都會指向它。",
        visibleNodes,
        states: { [node.id]: "new" },
      }),
    );

    stored.push(node);
    steps.push(
      makeStep(stored, {
        phase: "link",
        codeLine: previousTail ? 10 : 8,
        title: previousTail ? `連接 ${previousTail.value} → ${value}` : "設定 head",
        detail: previousTail
          ? `把舊 tail.next 改成新節點，再把 tail 更新為 ${value}。`
          : `空 list 的 head 與 tail 同時指向 ${value}。`,
        states: {
          [node.id]: "active",
          ...(previousTail ? { [previousTail.id]: "active" as const } : {}),
        },
        activeLink: previousTail
          ? { from: previousTail.id, to: node.id }
          : undefined,
      }),
    );
  });

  if (stored.length > 0) {
    const target = stored.at(-1)!;
    for (const [nodeIndex, node] of stored.entries()) {
      const found = node.id === target.id;
      const nextNode = stored[nodeIndex + 1];
      steps.push(
        makeStep(stored, {
          phase: "inspect",
          codeLine: found ? 18 : 19,
          title: found ? `找到 ${target.value}` : `檢查 ${node.value}`,
          detail: found
            ? `從 head 走到目標；最壞情況需要檢查全部 ${stored.length} 個節點。`
            : `${node.value} 不是目標，沿著 next 指標繼續往後。`,
          states: Object.fromEntries(
            stored.map((current) => [
              current.id,
              current.id === node.id
                ? "active"
                : stored.indexOf(current) < stored.indexOf(node)
                  ? "visited"
                  : "idle",
            ]),
          ),
          activeLink: nextNode
            ? { from: node.id, to: nextNode.id }
            : undefined,
        }),
      );
      if (found) break;
    }
  }

  if (stored.length > 1) {
    const removeIndex = 1;
    const previous = stored[removeIndex - 1];
    const removing = stored[removeIndex];
    const successor = stored[removeIndex + 1];

    steps.push(
      makeStep(stored, {
        phase: "remove",
        codeLine: 28,
        title: `移除 ${removing.value}`,
        detail: successor
          ? `把 ${previous.value}.next 從 ${removing.value} 改接到 ${successor.value}。`
          : `${removing.value} 是 tail；把 tail 改回 ${previous.value}。`,
        states: {
          [previous.id]: "active",
          [removing.id]: "removing",
          ...(successor ? { [successor.id]: "active" as const } : {}),
        },
        activeLink: successor
          ? { from: previous.id, to: successor.id }
          : undefined,
      }),
    );

    stored.splice(removeIndex, 1);
  }

  steps.push(
    makeStep(stored, {
      phase: "done",
      codeLine: 31,
      title: "Linked list 操作完成",
      detail: stored.length
        ? `head = ${stored[0].value}、tail = ${stored.at(-1)!.value}；每個節點只能沿 next 往後走。`
        : "list 維持空集合，head 與 tail 都是 null。",
    }),
  );

  return steps;
}

export const singlyLinkedListSource = `class SinglyLinkedList {
  head: Node | null = null;
  tail: Node | null = null;

  append(value: number) {
    const node = new Node(value);
    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
  }

  find(value: number) {
    let current = this.head;
    while (current) {
      if (current.value === value) return current;
      current = current.next;
    }
    return null;
  }

  remove(value: number) {
    let previous: Node | null = null;
    let current = this.head;
    while (current && current.value !== value) {
      previous = current;
      current = current.next;
    }
    if (!current) return false;
    if (previous) previous.next = current.next;
    else this.head = current.next;
    if (this.tail === current) this.tail = previous;
    return true;
  }
}`;

export const singlyLinkedListMeta: DataStructureMeta = {
  name: "Singly Linked List",
  slug: "singly-linked-list",
  category: "data-structure",
  operations: [
    { operation: "head insert", time: "O(1)" },
    { operation: "tail append", time: "O(1)" },
    { operation: "search/index", time: "O(n)" },
  ],
  space: "O(n)",
  tags: ["linked list", "pointer", "head", "tail", "linear traversal"],
};
