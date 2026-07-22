import type { AlgorithmMeta, ArrayItem, ArrayStep } from "@/lib/types/step";
import { range } from "@/lib/utils/range";

export function selectionSort(input: number[]): number[] {
  const arr = [...input];
  for (let i = 0; i < arr.length - 1; i++) {
    let minIndex = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIndex]) {
        minIndex = j;
      }
    }
    if (minIndex !== i) {
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
    }
  }
  return arr;
}

export function selectionSortSteps(input: number[]): ArrayStep[] {
  const items: ArrayItem[] = input.map((value, index) => ({
    id: `ss-${index}`,
    value,
  }));
  const steps: ArrayStep[] = [
    {
      array: [...items],
      phase: "idle",
      codeLine: 1,
      focusLabel: "目前最小值",
      title: "開始排序",
      detail: `輸入共 ${items.length} 個元素。每一輪從未排序區找出最小值，放到左側第一格。`,
    },
  ];

  if (items.length <= 1) {
    steps.push({
      array: [...items],
      sorted: range(0, items.length),
      phase: "done",
      codeLine: 14,
      focusLabel: "目前最小值",
      title: "完成",
      detail: "長度不足 2，無需排序。",
    });
    return steps;
  }

  const iColor = "var(--color-accent)";
  const minColor = "var(--color-bar-pivot)";

  for (let i = 0; i < items.length - 1; i++) {
    let minIndex = i;
    steps.push({
      array: [...items],
      sorted: range(0, i),
      selected: minIndex,
      pointers: [
        { name: "i", index: i, color: iColor },
        { name: "min", index: minIndex, color: minColor },
      ],
      phase: "select-min",
      codeLine: 4,
      focusLabel: "目前最小值",
      title: `第 ${i + 1} 輪：先把 a[${i}] 當最小值`,
      detail:
        i === 0
          ? `已排序區目前為空；現在掃描 a[0..${items.length - 1}]。`
          : `已排序區是 a[0..${i - 1}]；現在掃描 a[${i}..${items.length - 1}]。`,
    });

    for (let j = i + 1; j < items.length; j++) {
      const foundSmaller = items[j].value < items[minIndex].value;
      steps.push({
        array: [...items],
        sorted: range(0, i),
        selected: minIndex,
        comparing: [minIndex, j],
        pointers: [
          { name: "i", index: i, color: iColor },
          { name: "min", index: minIndex, color: minColor },
          { name: "j", index: j, color: iColor },
        ],
        phase: "compare",
        codeLine: 6,
        focusLabel: "目前最小值",
        title: `比較目前最小值與 a[${j}]`,
        detail: foundSmaller
          ? `${items[j].value} < ${items[minIndex].value}，a[${j}] 成為新的最小值。`
          : `${items[j].value} ≥ ${items[minIndex].value}，最小值仍在 a[${minIndex}]。`,
      });

      if (foundSmaller) {
        minIndex = j;
        steps.push({
          array: [...items],
          sorted: range(0, i),
          selected: minIndex,
          pointers: [
            { name: "i", index: i, color: iColor },
            { name: "min", index: minIndex, color: minColor },
            { name: "j", index: j, color: iColor },
          ],
          phase: "select-min",
          codeLine: 7,
          focusLabel: "目前最小值",
          title: `更新 min = ${minIndex}`,
          detail: `${items[minIndex].value} 是目前掃過範圍中的最小值。`,
        });
      }
    }

    if (minIndex !== i) {
      const leftValue = items[i].value;
      const minValue = items[minIndex].value;
      [items[i], items[minIndex]] = [items[minIndex], items[i]];
      steps.push({
        array: [...items],
        sorted: range(0, i),
        swapping: [i, minIndex],
        pointers: [
          { name: "i", index: i, color: iColor },
        ],
        phase: "swap",
        codeLine: 11,
        focusLabel: "目前最小值",
        title: `交換 a[${i}] 與 a[${minIndex}]`,
        detail: `把最小值 ${minValue} 放到 a[${i}]；${leftValue} 移到原本最小值的位置。`,
      });
    }

    steps.push({
      array: [...items],
      sorted: range(0, i + 1),
      pointers: [{ name: "i", index: i, color: iColor }],
      phase: "idle",
      codeLine: 12,
      focusLabel: "目前最小值",
      title: `a[${i}] 已就位`,
      detail: `${items[i].value} 是未排序區最小值；左側已排序區增加一格。`,
    });
  }

  steps.push({
    array: [...items],
    sorted: range(0, items.length),
    phase: "done",
    codeLine: 14,
    focusLabel: "目前最小值",
    title: "完成",
    detail: "所有元素都已經就位。",
  });

  return steps;
}

export const selectionSortSource = `export function selectionSort(input: number[]): number[] {
  const arr = [...input];
  for (let i = 0; i < arr.length - 1; i++) {
    let minIndex = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIndex]) {
        minIndex = j;
      }
    }
    if (minIndex !== i) {
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
    }
  }
  return arr;
}`;

export const selectionSortMeta: AlgorithmMeta = {
  name: "Selection Sort",
  slug: "selection-sort",
  timeBest: "O(n²)",
  timeAvg: "O(n²)",
  timeWorst: "O(n²)",
  space: "O(1)",
  stable: false,
  inPlace: true,
  tags: ["入門", "選擇", "少量交換"],
};
