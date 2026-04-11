import type { AlgorithmMeta, ArrayItem, ArrayStep } from "@/lib/types/step";
import { range } from "@/lib/utils/range";

export function bubbleSort(input: number[]): number[] {
  const arr = [...input];
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return arr;
}

export function bubbleSortSteps(input: number[]): ArrayStep[] {
  const items: ArrayItem[] = input.map((value, index) => ({
    id: `bs-${index}`,
    value,
  }));
  const n = items.length;
  const steps: ArrayStep[] = [];

  steps.push({
    array: [...items],
    phase: "idle",
    codeLine: 1,
    title: "開始排序",
    detail: `輸入共 ${n} 個元素。Bubble sort 會一輪又一輪地掃描，把最大值往右推。`,
  });

  if (n <= 1) {
    steps.push({
      array: [...items],
      sorted: range(0, n),
      phase: "done",
      codeLine: 14,
      title: "完成",
      detail: "長度不足 2，無需排序。",
    });
    return steps;
  }

  const pivotColor = "var(--color-bar-pivot)";
  const accentColor = "var(--color-accent)";

  for (let i = 0; i < n - 1; i++) {
    const iIndex = n - 1 - i;
    steps.push({
      array: [...items],
      sorted: range(n - i, n),
      pointers: [{ name: "i", index: iIndex, color: pivotColor }],
      phase: "idle",
      codeLine: 4,
      title: `第 ${i + 1} 輪開始`,
      detail: `i = ${i}，本輪要把未排序區最大值冒泡到 a[${iIndex}]。`,
    });

    let swapped = false;

    for (let j = 0; j < n - 1 - i; j++) {
      steps.push({
        array: [...items],
        comparing: [j, j + 1],
        sorted: range(n - i, n),
        pointers: [
          { name: "i", index: iIndex, color: pivotColor },
          { name: "j", index: j, color: accentColor },
        ],
        phase: "compare",
        codeLine: 7,
        title: `比較 a[${j}] 與 a[${j + 1}]`,
        detail:
          items[j].value > items[j + 1].value
            ? `${items[j].value} > ${items[j + 1].value}，需要交換。`
            : `${items[j].value} ≤ ${items[j + 1].value}，順序已經正確，跳過。`,
      });

      if (items[j].value > items[j + 1].value) {
        [items[j], items[j + 1]] = [items[j + 1], items[j]];
        swapped = true;
        steps.push({
          array: [...items],
          swapping: [j, j + 1],
          sorted: range(n - i, n),
          pointers: [
            { name: "i", index: iIndex, color: pivotColor },
            { name: "j", index: j + 1, color: accentColor },
          ],
          phase: "swap",
          codeLine: 8,
          title: `交換 a[${j}] ↔ a[${j + 1}]`,
          detail: "較大的值往右推進一格。",
        });
      }
    }

    steps.push({
      array: [...items],
      sorted: range(n - 1 - i, n),
      pointers: [{ name: "i", index: iIndex, color: pivotColor }],
      phase: "idle",
      codeLine: 11,
      title: `第 ${i + 1} 輪結束`,
      detail: `a[${iIndex}] 已經鎖定為這一輪的最大值。`,
    });

    if (!swapped) {
      steps.push({
        array: [...items],
        sorted: range(0, n),
        phase: "done",
        codeLine: 12,
        title: "提早結束",
        detail: "這一輪沒有發生任何交換，代表陣列已經排好，直接跳出。",
      });
      return steps;
    }
  }

  steps.push({
    array: [...items],
    sorted: range(0, n),
    phase: "done",
    codeLine: 14,
    title: "完成",
    detail: "所有元素都已經就位。",
  });

  return steps;
}

export const bubbleSortSource = `export function bubbleSort(input: number[]): number[] {
  const arr = [...input];
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return arr;
}`;

export const bubbleSortMeta: AlgorithmMeta = {
  name: "Bubble Sort",
  slug: "bubble-sort",
  timeBest: "O(n)",
  timeAvg: "O(n²)",
  timeWorst: "O(n²)",
  space: "O(1)",
  stable: true,
  inPlace: true,
  tags: ["入門", "相鄰交換"],
};
