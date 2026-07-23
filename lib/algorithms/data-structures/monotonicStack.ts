import type {
  DataStructureMeta,
  DataStructureStep,
  MonotonicItemState,
} from "@/lib/types/dataStructure";

function makeStep(
  values: number[],
  stack: number[],
  answers: Array<number | null>,
  config: Omit<DataStructureStep, "view"> & {
    states?: Record<number, MonotonicItemState>;
  },
): DataStructureStep {
  const { states = {}, ...step } = config;
  const stackSet = new Set(stack);
  return {
    ...step,
    view: {
      kind: "monotonic-stack",
      values: values.map((value, index) => ({
        index,
        value,
        state: states[index] ?? (stackSet.has(index) ? "stacked" : "idle"),
      })),
      stack: [...stack],
      answers: [...answers],
    },
  };
}

export function monotonicStackSteps(input: number[]): DataStructureStep[] {
  const values = [...input];
  const stack: number[] = [];
  const answers: Array<number | null> = Array(values.length).fill(null);
  const steps: DataStructureStep[] = [
    makeStep(values, stack, answers, {
      phase: "idle",
      codeLine: 3,
      title: "建立空的遞減 Monotonic Stack",
      detail: "Stack 保存尚未找到 next greater value 的 indices。",
    }),
  ];

  values.forEach((value, index) => {
    steps.push(
      makeStep(values, stack, answers, {
        phase: "scan",
        codeLine: 6,
        title: `掃描 index ${index}，value = ${value}`,
        detail: "先用目前 value 解決 Stack top 中較小的未決元素。",
        states: { [index]: "current" },
      }),
    );

    while (
      stack.length > 0 &&
      values[stack.at(-1)!] < value
    ) {
      const resolvedIndex = stack.pop()!;
      answers[resolvedIndex] = value;
      steps.push(
        makeStep(values, stack, answers, {
          phase: "resolve",
          codeLine: 9,
          title: `answer[${resolvedIndex}] = ${value}`,
          detail: `${value} 是 index ${resolvedIndex} 右側第一個嚴格更大的值；pop 該 index。`,
          states: { [index]: "current", [resolvedIndex]: "resolved" },
        }),
      );
    }

    stack.push(index);
    steps.push(
      makeStep(values, stack, answers, {
        phase: "push",
        codeLine: 11,
        title: `push index ${index}`,
        detail: `Stack 對應 values 維持 non-increasing；top value = ${value}。`,
        states: { [index]: "stacked" },
      }),
    );
  });

  for (const index of stack) answers[index] = -1;
  steps.push(
    makeStep(values, stack, answers, {
      phase: "done",
      codeLine: 15,
      title: "Next Greater Element 完成",
      detail: "仍在 Stack 的 indices 右側沒有更大值，答案設為 -1。",
      states: Object.fromEntries(stack.map((index) => [index, "stacked"])),
    }),
  );

  return steps;
}

export const monotonicStackSource = `function nextGreater(values: number[]): number[] {
  const answer = Array(values.length).fill(-1);
  const stack: number[] = [];

  for (let i = 0; i < values.length; i++) {
    while (
      stack.length > 0 &&
      values[stack[stack.length - 1]] < values[i]
    ) {
      const resolved = stack.pop()!;
      answer[resolved] = values[i];
    }
    stack.push(i);
  }

  return answer;
}`;

export const monotonicStackMeta: DataStructureMeta = {
  name: "Monotonic Stack",
  slug: "monotonic-stack",
  category: "data-structure",
  operations: [
    { operation: "full scan", time: "O(n) amortized" },
    { operation: "push / pop per index", time: "O(1)" },
  ],
  space: "O(n)",
  tags: ["stack", "next-greater", "amortized"],
};
