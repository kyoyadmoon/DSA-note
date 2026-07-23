import type {
  DataStructureMeta,
  DataStructureStep,
  StructureBuffer,
  StructureSlotState,
} from "@/lib/types/dataStructure";

const INITIAL_CAPACITY = 2;

function makeBuffer(
  generation: number,
  capacity: number,
  values: number[],
  label: string,
  active: boolean,
  states: Record<number, StructureSlotState> = {},
): StructureBuffer {
  return {
    id: `buffer-${generation}`,
    label,
    active,
    slots: Array.from({ length: capacity }, (_, index) => ({
      id: `buffer-${generation}-slot-${index}`,
      value: values[index] ?? null,
      state: states[index] ?? (index < values.length ? "idle" : "empty"),
    })),
  };
}

function makeStep(
  values: number[],
  capacity: number,
  generation: number,
  config: Omit<DataStructureStep, "view"> & {
    states?: Record<number, StructureSlotState>;
    pointer?: { index: number; label: string };
    buffers?: StructureBuffer[];
  },
): DataStructureStep {
  const { states, pointer, buffers, ...step } = config;
  return {
    ...step,
    view: {
      kind: "dynamic-array",
      size: values.length,
      capacity,
      pointer,
      buffers:
        buffers ?? [makeBuffer(generation, capacity, values, "data", true, states)],
    },
  };
}

export function dynamicArraySteps(input: number[]): DataStructureStep[] {
  const requestedValues = [...input];
  const stored: number[] = [];
  let capacity = INITIAL_CAPACITY;
  let generation = 0;
  const steps: DataStructureStep[] = [
    makeStep(stored, capacity, generation, {
      phase: "idle",
      codeLine: 2,
      title: "建立空的動態陣列",
      detail: `size = 0、capacity = ${capacity}。已配置的槽位存在，但目前都沒有有效元素。`,
    }),
  ];

  for (const value of requestedValues) {
    steps.push(
      makeStep(stored, capacity, generation, {
        phase: "inspect",
        codeLine: 5,
        title: `準備 append(${value})`,
        detail: `先檢查 size (${stored.length}) 是否等於 capacity (${capacity})。`,
        pointer: { index: stored.length, label: "write" },
      }),
    );

    if (stored.length === capacity) {
      const oldCapacity = capacity;
      const nextCapacity = capacity * 2;
      const nextGeneration = generation + 1;
      const copied: number[] = [];

      steps.push(
        makeStep(stored, oldCapacity, generation, {
          phase: "allocate",
          codeLine: 10,
          title: `容量擴張為 ${nextCapacity}`,
          detail: "舊 buffer 沒有足夠空間，因此配置兩倍大的連續 buffer；舊資料尚未搬移。",
          buffers: [
            makeBuffer(generation, oldCapacity, stored, "old buffer", true),
            makeBuffer(nextGeneration, nextCapacity, copied, "new buffer", false),
          ],
        }),
      );

      for (let index = 0; index < stored.length; index++) {
        copied[index] = stored[index];
        steps.push(
          makeStep(stored, oldCapacity, generation, {
            phase: "copy",
            codeLine: 12,
            title: `複製 index ${index}`,
            detail: `把 ${stored[index]} 從舊 buffer 的 index ${index} 複製到新 buffer 的相同位置。`,
            pointer: { index, label: "copy" },
            buffers: [
              makeBuffer(generation, oldCapacity, stored, "old buffer", false, {
                [index]: "copy-source",
              }),
              makeBuffer(
                nextGeneration,
                nextCapacity,
                copied,
                "new buffer",
                true,
                { [index]: "copy-target" },
              ),
            ],
          }),
        );
      }

      capacity = nextCapacity;
      generation = nextGeneration;
      steps.push(
        makeStep(stored, capacity, generation, {
          phase: "allocate",
          codeLine: 14,
          title: "切換到新 buffer",
          detail: `所有 ${stored.length} 個元素都已搬完；之後的讀寫只使用 capacity = ${capacity} 的新 buffer。`,
        }),
      );
    }

    const writeIndex = stored.length;
    stored.push(value);
    steps.push(
      makeStep(stored, capacity, generation, {
        phase: "write",
        codeLine: 7,
        title: `寫入 index ${writeIndex}`,
        detail: `把 ${value} 寫到第一個空槽，size 更新為 ${stored.length}；這次 append 完成。`,
        states: { [writeIndex]: "active" },
        pointer: { index: writeIndex, label: "append" },
      }),
    );
  }

  steps.push(
    makeStep(stored, capacity, generation, {
      phase: "done",
      codeLine: 8,
      title: "所有 append 完成",
      detail: `最終 size = ${stored.length}、capacity = ${capacity}。索引 0..${Math.max(0, stored.length - 1)} 是有效元素，其餘只是保留容量。`,
    }),
  );

  return steps;
}

export const dynamicArraySource = `class DynamicArray {
  private data = new Array<number>(2);
  private length = 0;

  append(value: number) {
    if (this.length === this.data.length) {
      this.resize(this.data.length * 2);
    }
    this.data[this.length++] = value;
  }

  private resize(capacity: number) {
    const next = new Array<number>(capacity);
    for (let i = 0; i < this.length; i++) {
      next[i] = this.data[i];
    }
    this.data = next;
  }
}`;

export const dynamicArrayMeta: DataStructureMeta = {
  name: "Dynamic Array",
  slug: "dynamic-array",
  category: "data-structure",
  operations: [
    { operation: "index", time: "O(1)" },
    { operation: "append", time: "amortized O(1)" },
    { operation: "insert/delete", time: "O(n)" },
  ],
  space: "O(n)",
  tags: ["array", "contiguous memory", "amortized analysis", "resize"],
};
