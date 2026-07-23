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
    prevId: stored[index - 1]?.id ?? null,
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
  },
): DataStructureStep {
  const { states, activeLink, visibleNodes = stored, ...step } = config;
  return {
    ...step,
    view: {
      kind: "linked-list",
      nodes: makeNodes(visibleNodes, states),
      headId: stored[0]?.id ?? null,
      tailId: stored.at(-1)?.id ?? null,
      activeLink,
      doubly: true,
    },
  };
}

export function doublyLinkedListSteps(input: number[]): DataStructureStep[] {
  const values = [...input];
  const stored: StoredNode[] = [];
  const steps: DataStructureStep[] = [
    makeStep(stored, {
      phase: "idle",
      codeLine: 3,
      title: "建立空的 doubly linked list",
      detail: "head 與 tail 都是 null；沒有節點，也沒有前後指標。",
    }),
  ];

  values.forEach((value, index) => {
    const node: StoredNode = { id: `dll-${index}`, value };
    const previousTail = stored.at(-1);

    steps.push(
      makeStep(stored, {
        phase: "allocate",
        codeLine: 7,
        title: `配置節點 ${value}`,
        detail: previousTail
          ? `新節點的 prev 將指向目前 tail ${previousTail.value}。`
          : "第一個節點會同時成為 head 與 tail。",
        visibleNodes: [...stored, node],
        states: { [node.id]: "new" },
      }),
    );

    stored.push(node);
    steps.push(
      makeStep(stored, {
        phase: "link",
        codeLine: previousTail ? 12 : 9,
        title: previousTail
          ? `建立 ${previousTail.value} ⇄ ${value}`
          : "設定 head 與 tail",
        detail: previousTail
          ? `同時設定舊 tail.next 與新節點.prev，再更新 tail。`
          : `${value}.prev 與 ${value}.next 都維持 null。`,
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

  for (let index = stored.length - 1; index >= 0; index -= 1) {
    const node = stored[index];
    const previous = stored[index - 1];
    steps.push(
      makeStep(stored, {
        phase: "inspect-backward",
        codeLine: 22,
        title: `從 tail 反向走訪 ${node.value}`,
        detail: previous
          ? `沿 ${node.value}.prev 前往 ${previous.value}。`
          : `${node.value} 是 head，反向走訪完成。`,
        states: Object.fromEntries(
          stored.map((current, currentIndex) => [
            current.id,
            currentIndex === index
              ? "active"
              : currentIndex > index
                ? "visited"
                : "idle",
          ]),
        ),
        activeLink: previous
          ? { from: node.id, to: previous.id }
          : undefined,
      }),
    );
  }

  if (stored.length > 1) {
    const removeIndex = Math.floor(stored.length / 2);
    const target = stored[removeIndex];
    const previous = stored[removeIndex - 1];
    const next = stored[removeIndex + 1];

    steps.push(
      makeStep(stored, {
        phase: "remove",
        codeLine: 29,
        title: `已知節點 ${target.value}，直接刪除`,
        detail: [
          previous ? `${previous.value}.next 改接 ${next?.value ?? "null"}` : "更新 head",
          next ? `${next.value}.prev 改接 ${previous?.value ?? "null"}` : "更新 tail",
        ].join("；"),
        states: {
          [target.id]: "removing",
          ...(previous ? { [previous.id]: "active" as const } : {}),
          ...(next ? { [next.id]: "active" as const } : {}),
        },
      }),
    );

    stored.splice(removeIndex, 1);
  }

  steps.push(
    makeStep(stored, {
      phase: "done",
      codeLine: 35,
      title: "Doubly linked list 操作完成",
      detail: stored.length
        ? `head = ${stored[0].value}、tail = ${stored.at(-1)!.value}；每條 next 與 prev 關係互相對應。`
        : "list 維持空集合，head 與 tail 都是 null。",
    }),
  );

  return steps;
}

export const doublyLinkedListSource = `class DoublyLinkedList {
  head: Node | null = null;
  tail: Node | null = null;

  append(value: number) {
    const node = new Node(value);
    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      node.prev = this.tail;
      this.tail.next = node;
      this.tail = node;
    }
  }

  *backward() {
    let current = this.tail;
    while (current) {
      yield current.value;
      current = current.prev;
    }
  }

  removeKnown(node: Node) {
    if (node.prev) node.prev.next = node.next;
    else this.head = node.next;
    if (node.next) node.next.prev = node.prev;
    else this.tail = node.prev;
    node.prev = node.next = null;
  }
}`;

export const doublyLinkedListMeta: DataStructureMeta = {
  name: "Doubly Linked List",
  slug: "doubly-linked-list",
  category: "data-structure",
  operations: [
    { operation: "get(i)", time: "O(n)" },
    { operation: "push front/back", time: "O(1)" },
    { operation: "remove known node", time: "O(1)" },
  ],
  space: "O(n)",
  tags: ["linked-list", "two-way", "pointer"],
};
