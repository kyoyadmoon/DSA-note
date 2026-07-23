import type {
  DataStructureMeta,
  DataStructureStep,
  LinearCollectionItemState,
} from "@/lib/types/dataStructure";

type StoredItem = {
  id: string;
  value: number;
};

function makeStep(
  items: StoredItem[],
  output: number[],
  config: Omit<DataStructureStep, "view"> & {
    states?: Record<string, LinearCollectionItemState>;
    visibleItems?: StoredItem[];
  },
): DataStructureStep {
  const { states = {}, visibleItems = items, ...step } = config;
  return {
    ...step,
    view: {
      kind: "linear-collection",
      mode: "stack",
      items: visibleItems.map((item) => ({
        ...item,
        state: states[item.id] ?? "idle",
      })),
      topId: items.at(-1)?.id,
      output: [...output],
    },
  };
}

export function stackSteps(input: number[]): DataStructureStep[] {
  const values = [...input];
  const items: StoredItem[] = [];
  const output: number[] = [];
  const steps: DataStructureStep[] = [
    makeStep(items, output, {
      phase: "idle",
      codeLine: 2,
      title: "建立空 Stack",
      detail: "top 不存在；第一個被 push 的元素會位在最底部。",
    }),
  ];

  values.forEach((value, index) => {
    const item = { id: `stack-${index}`, value };
    items.push(item);
    steps.push(
      makeStep(items, output, {
        phase: "push",
        codeLine: 5,
        title: `push(${value})`,
        detail: `${value} 成為新的 top；先前元素的相對順序不變。`,
        states: { [item.id]: "new" },
      }),
    );
  });

  const top = items.at(-1);
  if (top) {
    steps.push(
      makeStep(items, output, {
        phase: "peek",
        codeLine: 9,
        title: `peek() = ${top.value}`,
        detail: "peek 只讀取 top，不改變 Stack。",
        states: { [top.id]: "active" },
      }),
    );

    steps.push(
      makeStep(items, output, {
        phase: "pop",
        codeLine: 13,
        title: `pop() = ${top.value}`,
        detail: `${top.value} 是最後 push 的元素，因此最先被移除。`,
        states: { [top.id]: "removing" },
      }),
    );
    output.push(top.value);
    items.pop();
  }

  steps.push(
    makeStep(items, output, {
      phase: "done",
      codeLine: 15,
      title: "Stack 操作完成",
      detail: items.length
        ? `目前 top = ${items.at(-1)!.value}；pop 輸出依 LIFO 排列。`
        : "Stack 為空；peek 或 pop 前必須先處理 underflow。",
    }),
  );

  return steps;
}

export const stackSource = `class Stack<T> {
  private items: T[] = [];

  push(value: T) {
    this.items.push(value);
  }

  peek(): T | undefined {
    return this.items.at(-1);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  get size() { return this.items.length; }
}`;

export const stackMeta: DataStructureMeta = {
  name: "Stack",
  slug: "stack",
  category: "data-structure",
  operations: [
    { operation: "push", time: "amortized O(1)" },
    { operation: "pop", time: "O(1)" },
    { operation: "peek", time: "O(1)" },
  ],
  space: "O(n)",
  tags: ["lifo", "parsing", "dfs"],
};
