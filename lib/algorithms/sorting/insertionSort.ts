import type { AlgorithmMeta, ArrayItem, ArrayStep } from "@/lib/types/step";
import { range } from "@/lib/utils/range";

export function insertionSort(input: number[]): number[] {
  const arr = [...input];
  for (let i = 1; i < arr.length; i++) {
    let j = i;
    while (j > 0 && arr[j - 1] > arr[j]) {
      [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
      j--;
    }
  }
  return arr;
}

export function insertionSortSteps(input: number[]): ArrayStep[] {
  const items: ArrayItem[] = input.map((value, index) => ({
    id: `is-${index}`,
    value,
  }));
  const steps: ArrayStep[] = [
    {
      array: [...items],
      phase: "idle",
      codeLine: 1,
      focusLabel: "待插入值",
      title: "開始排序",
      detail: `輸入共 ${items.length} 個元素。從第二格開始，把每個元素插入左側已排序區。`,
    },
  ];

  if (items.length <= 1) {
    steps.push({
      array: [...items],
      sorted: range(0, items.length),
      phase: "done",
      codeLine: 11,
      focusLabel: "待插入值",
      title: "完成",
      detail: "長度不足 2，無需排序。",
    });
    return steps;
  }

  const keyColor = "var(--color-bar-pivot)";

  for (let i = 1; i < items.length; i++) {
    let j = i;
    const keyId = items[i].id;
    const keyValue = items[i].value;

    steps.push({
      array: [...items],
      sorted: range(0, i),
      active: [0, i + 1],
      selected: j,
      pointers: [{ name: "key", index: j, color: keyColor }],
      phase: "idle",
      codeLine: 3,
      focusLabel: "待插入值",
      title: `第 ${i} 輪：插入 ${keyValue}`,
      detail: `a[0..${i - 1}] 已排序；現在把原本位於 a[${i}] 的 ${keyValue} 向左移到正確位置。`,
    });

    while (j > 0) {
      const leftValue = items[j - 1].value;
      const shouldSwap = leftValue > items[j].value;

      steps.push({
        array: [...items],
        active: [0, i + 1],
        selected: j,
        comparing: [j - 1, j],
        pointers: [{ name: "key", index: j, color: keyColor }],
        phase: "compare",
        codeLine: 5,
        focusLabel: "待插入值",
        title: `比較 a[${j - 1}] 與待插入值`,
        detail: shouldSwap
          ? `${leftValue} > ${items[j].value}，交換相鄰元素，讓待插入值向左一格。`
          : `${leftValue} ≤ ${items[j].value}，待插入值已在正確位置。`,
      });

      if (!shouldSwap) break;

      const rightValue = items[j].value;
      [items[j - 1], items[j]] = [items[j], items[j - 1]];
      j--;
      steps.push({
        array: [...items],
        active: [0, i + 1],
        selected: j,
        swapping: [j, j + 1],
        pointers: [{ name: "key", index: j, color: keyColor }],
        phase: "swap",
        codeLine: 6,
        focusLabel: "待插入值",
        title: `${rightValue} 向左移到 a[${j}]`,
        detail: `交換 ${leftValue} 與 ${rightValue}；接著繼續檢查左側。`,
      });
    }

    const insertedAt = items.findIndex((item) => item.id === keyId);
    steps.push({
      array: [...items],
      sorted: range(0, i + 1),
      active: [0, i + 1],
      selected: insertedAt,
      pointers: [{ name: "key", index: insertedAt, color: keyColor }],
      phase: "insert",
      codeLine: 9,
      focusLabel: "待插入值",
      title: `${keyValue} 已插入 a[${insertedAt}]`,
      detail: `a[0..${i}] 現在由小到大排列，下一輪再把已排序區向右擴一格。`,
    });
  }

  steps.push({
    array: [...items],
    sorted: range(0, items.length),
    phase: "done",
    codeLine: 11,
    focusLabel: "待插入值",
    title: "完成",
    detail: "整個陣列都已經納入已排序區。",
  });

  return steps;
}

export const insertionSortSource = `export function insertionSort(input: number[]): number[] {
  const arr = [...input];
  for (let i = 1; i < arr.length; i++) {
    let j = i;
    while (j > 0 && arr[j - 1] > arr[j]) {
      [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
      j--;
    }
  }
  return arr;
}`;

export const insertionSortMeta: AlgorithmMeta = {
  name: "Insertion Sort",
  slug: "insertion-sort",
  timeBest: "O(n)",
  timeAvg: "O(n²)",
  timeWorst: "O(n²)",
  space: "O(1)",
  stable: true,
  inPlace: true,
  tags: ["入門", "增量", "近乎排序"],
};
