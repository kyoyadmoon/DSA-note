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
  headIndex: number,
  output: number[],
  config: Omit<DataStructureStep, "view"> & {
    states?: Record<string, LinearCollectionItemState>;
  },
): DataStructureStep {
  const { states = {}, ...step } = config;
  const activeItems = items.slice(headIndex);
  return {
    ...step,
    view: {
      kind: "linear-collection",
      mode: "queue",
      items: items.map((item, index) => ({
        ...item,
        state: states[item.id] ?? (index < headIndex ? "consumed" : "idle"),
      })),
      frontId: activeItems[0]?.id,
      backId: activeItems.at(-1)?.id,
      headIndex,
      output: [...output],
    },
  };
}

export function queueSteps(input: number[]): DataStructureStep[] {
  const values = [...input];
  const items: StoredItem[] = [];
  const output: number[] = [];
  let headIndex = 0;
  const steps: DataStructureStep[] = [
    makeStep(items, headIndex, output, {
      phase: "idle",
      codeLine: 3,
      title: "建立空 Queue",
      detail: "front 與 back 都不存在；head index 從 0 開始。",
    }),
  ];

  values.forEach((value, index) => {
    const item = { id: `queue-${index}`, value };
    items.push(item);
    steps.push(
      makeStep(items, headIndex, output, {
        phase: "enqueue",
        codeLine: 7,
        title: `enqueue(${value})`,
        detail: `${value} 加到 back；既有 front 不變。`,
        states: { [item.id]: "new" },
      }),
    );
  });

  const front = items[headIndex];
  if (front) {
    steps.push(
      makeStep(items, headIndex, output, {
        phase: "dequeue",
        codeLine: 12,
        title: `dequeue() = ${front.value}`,
        detail: "移除最早 enqueue、尚未被取出的元素；符合 FIFO。",
        states: { [front.id]: "removing" },
      }),
    );
    output.push(front.value);
    headIndex += 1;

    steps.push(
      makeStep(items, headIndex, output, {
        phase: "advance",
        codeLine: 13,
        title: `head index 前進到 ${headIndex}`,
        detail: items[headIndex]
          ? `${items[headIndex].value} 成為新 front；舊 slot 標記為 consumed，不搬移其他元素。`
          : "Queue 已空；舊 slot 可在之後批次 compact。",
        states: items[headIndex]
          ? { [items[headIndex].id]: "active" }
          : undefined,
      }),
    );
  }

  steps.push(
    makeStep(items, headIndex, output, {
      phase: "done",
      codeLine: 18,
      title: "Queue 操作完成",
      detail: items[headIndex]
        ? `front = ${items[headIndex].value}、back = ${items.at(-1)!.value}；dequeue 輸出依 FIFO 排列。`
        : "Queue 為空；dequeue 前必須處理 underflow。",
    }),
  );

  return steps;
}

export const queueSource = `class Queue<T> {
  private items: T[] = [];
  private head = 0;

  enqueue(value: T) {
    this.items.push(value);
  }

  dequeue(): T | undefined {
    if (this.head === this.items.length) return undefined;
    const value = this.items[this.head];
    this.head += 1;
    return value;
  }

  peek(): T | undefined {
    return this.items[this.head];
  }
}`;

export const queueMeta: DataStructureMeta = {
  name: "Queue",
  slug: "queue",
  category: "data-structure",
  operations: [
    { operation: "enqueue", time: "amortized O(1)" },
    { operation: "dequeue", time: "O(1)" },
    { operation: "peek", time: "O(1)" },
  ],
  space: "O(n)",
  tags: ["fifo", "bfs", "scheduling"],
};
