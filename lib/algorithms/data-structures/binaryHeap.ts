import type {
  DataStructureMeta,
  DataStructureStep,
  HeapNodeState,
} from "@/lib/types/dataStructure";

function makeStep(
  heap: number[],
  output: number[],
  config: Omit<DataStructureStep, "view"> & {
    states?: Record<number, HeapNodeState>;
  },
): DataStructureStep {
  const { states = {}, ...step } = config;
  return {
    ...step,
    view: {
      kind: "binary-heap",
      heapType: "min",
      nodes: heap.map((value, index) => ({
        id: `heap-${index}`,
        index,
        value,
        state: states[index] ?? "idle",
      })),
      output: [...output],
    },
  };
}

export function isMinHeap(values: number[]): boolean {
  return values.every((value, index) => {
    if (index === 0) return true;
    return values[Math.floor((index - 1) / 2)] <= value;
  });
}

export function binaryHeapSteps(input: number[]): DataStructureStep[] {
  const values = [...input];
  const heap: number[] = [];
  const output: number[] = [];
  const steps: DataStructureStep[] = [
    makeStep(heap, output, {
      phase: "idle",
      codeLine: 2,
      title: "建立空 Min Heap",
      detail: "底層 array 為空；complete tree 的 root index 固定為 0。",
    }),
  ];

  values.forEach((value) => {
    heap.push(value);
    let index = heap.length - 1;
    steps.push(
      makeStep(heap, output, {
        phase: "append",
        codeLine: 5,
        title: `把 ${value} 加到 array 尾端`,
        detail: "先維持 complete tree 形狀，再修復 heap-order invariant。",
        states: { [index]: "new" },
      }),
    );

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      steps.push(
        makeStep(heap, output, {
          phase: "compare-parent",
          codeLine: 8,
          title: `比較 ${heap[index]} 與 parent ${heap[parentIndex]}`,
          detail:
            heap[parentIndex] <= heap[index]
              ? "parent 已不大於 child，bubble-up 停止。"
              : "child 較小，交換後繼續往上檢查。",
          states: { [index]: "compare", [parentIndex]: "active" },
        }),
      );
      if (heap[parentIndex] <= heap[index]) break;

      [heap[parentIndex], heap[index]] = [heap[index], heap[parentIndex]];
      steps.push(
        makeStep(heap, output, {
          phase: "bubble-up",
          codeLine: 9,
          title: "向上交換",
          detail: `較小值移到 index ${parentIndex}，heap-order 在該路徑上逐步恢復。`,
          states: { [index]: "swap", [parentIndex]: "swap" },
        }),
      );
      index = parentIndex;
    }
  });

  if (heap.length > 0) {
    const minimum = heap[0];
    steps.push(
      makeStep(heap, output, {
        phase: "peek",
        codeLine: 15,
        title: `peek() = ${minimum}`,
        detail: "Min Heap invariant 保證 root 是全域最小值。",
        states: { 0: "active" },
      }),
    );

    const last = heap.pop()!;
    output.push(minimum);
    if (heap.length > 0) {
      heap[0] = last;
      steps.push(
        makeStep(heap, output, {
          phase: "replace-root",
          codeLine: 21,
          title: `移除 ${minimum}，把尾端 ${last} 放到 root`,
          detail: "complete tree 形狀已恢復，但 root 可能違反 heap order。",
          states: { 0: "new" },
        }),
      );

      let index = 0;
      while (true) {
        const left = index * 2 + 1;
        const right = index * 2 + 2;
        let smallest = index;
        if (left < heap.length && heap[left] < heap[smallest]) smallest = left;
        if (right < heap.length && heap[right] < heap[smallest]) smallest = right;
        if (smallest === index) break;

        steps.push(
          makeStep(heap, output, {
            phase: "compare-child",
            codeLine: 29,
            title: `選擇較小 child ${heap[smallest]}`,
            detail: "Min Heap 要和兩個 children 中較小者交換，才能同時修復兩側關係。",
            states: { [index]: "active", [smallest]: "compare" },
          }),
        );
        [heap[index], heap[smallest]] = [heap[smallest], heap[index]];
        steps.push(
          makeStep(heap, output, {
            phase: "bubble-down",
            codeLine: 30,
            title: "向下交換",
            detail: `${heap[index]} 上移；較大值繼續沿 index ${smallest} 向下檢查。`,
            states: { [index]: "swap", [smallest]: "swap" },
          }),
        );
        index = smallest;
      }
    }
  }

  steps.push(
    makeStep(heap, output, {
      phase: "done",
      codeLine: 34,
      title: "Min Heap 操作完成",
      detail: heap.length
        ? `root = ${heap[0]}，且每個 parent 都不大於 children。`
        : "Heap 為空；extract 前必須處理 underflow。",
    }),
  );

  return steps;
}

export const binaryHeapSource = `class MinHeap {
  private heap: number[] = [];

  insert(value: number) {
    this.heap.push(value);
    let i = this.heap.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent] <= this.heap[i]) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  peek() { return this.heap[0]; }

  extractMin() {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      let i = 0;
      while (true) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let smallest = i;
        if (left < this.heap.length && this.heap[left] < this.heap[smallest]) smallest = left;
        if (right < this.heap.length && this.heap[right] < this.heap[smallest]) smallest = right;
        if (smallest === i) break;
        [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
        i = smallest;
      }
    }
    return min;
  }
}`;

export const binaryHeapMeta: DataStructureMeta = {
  name: "Binary Heap / Priority Queue",
  slug: "binary-heap",
  category: "data-structure",
  operations: [
    { operation: "insert", time: "O(log n)" },
    { operation: "peek", time: "O(1)" },
    { operation: "extract min", time: "O(log n)" },
    { operation: "build heap", time: "O(n)" },
  ],
  space: "O(n)",
  tags: ["heap", "priority-queue", "top-k"],
};
