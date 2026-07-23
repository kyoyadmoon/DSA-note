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
  },
): DataStructureStep {
  const { states = {}, ...step } = config;
  return {
    ...step,
    view: {
      kind: "linear-collection",
      mode: "deque",
      items: items.map((item) => ({
        ...item,
        state: states[item.id] ?? "idle",
      })),
      frontId: items[0]?.id,
      backId: items.at(-1)?.id,
      output: [...output],
    },
  };
}

export function dequeSteps(input: number[]): DataStructureStep[] {
  const values = [...input];
  const items: StoredItem[] = [];
  const output: number[] = [];
  const steps: DataStructureStep[] = [
    makeStep(items, output, {
      phase: "idle",
      codeLine: 3,
      title: "建立空 Deque",
      detail: "front 與 back 都不存在；兩端都允許加入與移除。",
    }),
  ];

  values.forEach((value, index) => {
    const item = { id: `deque-${index}`, value };
    const useFront = index === 1;
    if (useFront) items.unshift(item);
    else items.push(item);

    steps.push(
      makeStep(items, output, {
        phase: useFront ? "push-front" : "push-back",
        codeLine: useFront ? 8 : 12,
        title: `${useFront ? "pushFront" : "pushBack"}(${value})`,
        detail: `${value} 加到 ${useFront ? "front" : "back"}；另一端的元素仍可 O(1) 取得。`,
        states: { [item.id]: "new" },
      }),
    );
  });

  const front = items[0];
  if (front) {
    steps.push(
      makeStep(items, output, {
        phase: "pop-front",
        codeLine: 16,
        title: `popFront() = ${front.value}`,
        detail: "從 front 移除；back 端的相對順序不變。",
        states: { [front.id]: "removing" },
      }),
    );
    output.push(front.value);
    items.shift();
  }

  const back = items.at(-1);
  if (back) {
    steps.push(
      makeStep(items, output, {
        phase: "pop-back",
        codeLine: 20,
        title: `popBack() = ${back.value}`,
        detail: "再從 back 移除；同一結構可同時支援 Queue 與 Stack 方向的操作。",
        states: { [back.id]: "removing" },
      }),
    );
    output.push(back.value);
    items.pop();
  }

  steps.push(
    makeStep(items, output, {
      phase: "done",
      codeLine: 24,
      title: "Deque 操作完成",
      detail: items.length
        ? `front = ${items[0].value}、back = ${items.at(-1)!.value}；兩端操作都維持 O(1) 目標。`
        : "Deque 為空；front 與 back 一起回到空狀態。",
    }),
  );

  return steps;
}

export const dequeSource = `class Deque<T> {
  private buffer: (T | undefined)[];
  private front = 0;
  private size = 0;

  pushFront(value: T) {
    this.front = (this.front - 1 + this.buffer.length) % this.buffer.length;
    this.buffer[this.front] = value;
    this.size += 1;
  }

  pushBack(value: T) {
    const index = (this.front + this.size) % this.buffer.length;
    this.buffer[index] = value;
    this.size += 1;
  }

  popFront(): T | undefined { /* read front, then advance */ }

  popBack(): T | undefined { /* read front + size - 1 */ }
}`;

export const dequeMeta: DataStructureMeta = {
  name: "Deque",
  slug: "deque",
  category: "data-structure",
  operations: [
    { operation: "push front/back", time: "amortized O(1)" },
    { operation: "pop front/back", time: "O(1)" },
    { operation: "peek front/back", time: "O(1)" },
  ],
  space: "O(n)",
  tags: ["double-ended", "sliding-window", "zero-one-bfs"],
};
