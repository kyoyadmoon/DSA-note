import type { AlgorithmMeta, ArrayItem, ArrayStep } from "@/lib/types/step";

export function quickSort(input: number[]): number[] {
  const arr = [...input];
  function sort(lo: number, hi: number): void {
    if (lo >= hi) return;
    const pivot = arr[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      if (arr[j] < pivot) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        i++;
      }
    }
    [arr[i], arr[hi]] = [arr[hi], arr[i]];
    sort(lo, i - 1);
    sort(i + 1, hi);
  }
  sort(0, arr.length - 1);
  return arr;
}

export function quickSortSteps(input: number[]): ArrayStep[] {
  const items: ArrayItem[] = input.map((value, index) => ({
    id: `qs-${index}`,
    value,
  }));
  const steps: ArrayStep[] = [
    {
      array: [...items],
      phase: "idle",
      codeLine: 1,
      title: "開始排序",
      detail: `輸入共 ${items.length} 個元素。每次分割會把一個 pivot 放到最終位置。`,
    },
  ];
  const settled = new Set<number>();
  const settledIndices = () => [...settled].sort((a, b) => a - b);
  const pivotColor = "var(--color-bar-pivot)";
  const scanColor = "var(--color-accent)";

  function sort(lo: number, hi: number): void {
    if (lo > hi) return;

    if (lo === hi) {
      settled.add(lo);
      steps.push({
        array: [...items],
        active: [lo, hi + 1],
        sorted: settledIndices(),
        pivot: lo,
        pointers: [{ name: "pivot", index: lo, color: pivotColor }],
        phase: "partition",
        codeLine: 4,
        title: `a[${lo}] 單獨成區`,
        detail: `子區間只剩 ${items[lo].value}，不需比較就已位於正確位置。`,
      });
      return;
    }

    const pivotValue = items[hi].value;
    let i = lo;
    steps.push({
      array: [...items],
      active: [lo, hi + 1],
      sorted: settledIndices(),
      pivot: hi,
      pointers: [
        { name: "i", index: i, color: scanColor },
        { name: "pivot", index: hi, color: pivotColor },
      ],
      phase: "partition",
      codeLine: 5,
      title: `分割 a[${lo}..${hi}]，pivot = ${pivotValue}`,
      detail: `i = ${i} 是「小於 pivot」區的下一個空位；j 將由左向右掃描。`,
    });

    for (let j = lo; j < hi; j++) {
      const belongsLeft = items[j].value < pivotValue;
      steps.push({
        array: [...items],
        active: [lo, hi + 1],
        sorted: settledIndices(),
        pivot: hi,
        comparing: [j, hi],
        pointers: [
          { name: "i", index: i, color: scanColor },
          { name: "j", index: j, color: scanColor },
          { name: "pivot", index: hi, color: pivotColor },
        ],
        phase: "compare",
        codeLine: 8,
        title: `比較 a[${j}] 與 pivot ${pivotValue}`,
        detail: belongsLeft
          ? `${items[j].value} < ${pivotValue}，把它放入左側區並將 i 右移。`
          : `${items[j].value} ≥ ${pivotValue}，保留在右側區。`,
      });

      if (!belongsLeft) continue;

      if (i !== j) {
        const leftValue = items[i].value;
        const scanValue = items[j].value;
        [items[i], items[j]] = [items[j], items[i]];
        steps.push({
          array: [...items],
          active: [lo, hi + 1],
          sorted: settledIndices(),
          pivot: hi,
          swapping: [i, j],
          pointers: [
            { name: "i", index: i, color: scanColor },
            { name: "j", index: j, color: scanColor },
            { name: "pivot", index: hi, color: pivotColor },
          ],
          phase: "swap",
          codeLine: 9,
          title: `交換 a[${i}] 與 a[${j}]`,
          detail: `${scanValue} 進入小於 pivot 的區域；${leftValue} 移到尚未確定的右側。`,
        });
      }
      i++;
    }

    if (i !== hi) {
      const boundaryValue = items[i].value;
      [items[i], items[hi]] = [items[hi], items[i]];
      steps.push({
        array: [...items],
        active: [lo, hi + 1],
        sorted: settledIndices(),
        pivot: i,
        swapping: [i, hi],
        pointers: [{ name: "pivot", index: i, color: pivotColor }],
        phase: "swap",
        codeLine: 13,
        title: `pivot 交換到 a[${i}]`,
        detail: `${pivotValue} 取代 ${boundaryValue}；左側都較小，右側都大於或等於它。`,
      });
    }

    settled.add(i);
    steps.push({
      array: [...items],
      active: [lo, hi + 1],
      sorted: settledIndices(),
      pivot: i,
      pointers: [{ name: "pivot", index: i, color: pivotColor }],
      phase: "partition",
      codeLine: 13,
      title: `分割完成：pivot 固定在 a[${i}]`,
      detail: `接著分別排序 a[${lo}..${i - 1}] 與 a[${i + 1}..${hi}]；pivot 不會再移動。`,
    });

    sort(lo, i - 1);
    sort(i + 1, hi);
  }

  sort(0, items.length - 1);
  steps.push({
    array: [...items],
    sorted: items.map((_, index) => index),
    phase: "done",
    codeLine: 18,
    title: "完成",
    detail: "所有 pivot 與單元素子區間都已就位。",
  });

  return steps;
}

export const quickSortSource = `export function quickSort(input: number[]): number[] {
  const arr = [...input];
  function sort(lo: number, hi: number): void {
    if (lo >= hi) return;
    const pivot = arr[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      if (arr[j] < pivot) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        i++;
      }
    }
    [arr[i], arr[hi]] = [arr[hi], arr[i]];
    sort(lo, i - 1);
    sort(i + 1, hi);
  }
  sort(0, arr.length - 1);
  return arr;
}`;

export const quickSortMeta: AlgorithmMeta = {
  name: "Quick Sort",
  slug: "quick-sort",
  timeBest: "O(n log n)",
  timeAvg: "O(n log n)",
  timeWorst: "O(n²)",
  space: "O(log n) avg",
  stable: false,
  inPlace: true,
  tags: ["分治", "Partition", "Pivot"],
};
