import type { AlgorithmMeta, ArrayItem, ArrayStep } from "@/lib/types/step";

export function mergeSort(input: number[]): number[] {
  const arr = [...input];
  const aux = [...arr];
  function sort(lo: number, hi: number): void {
    if (hi - lo <= 1) return;
    const mid = lo + Math.floor((hi - lo) / 2);
    sort(lo, mid);
    sort(mid, hi);
    for (let k = lo; k < hi; k++) aux[k] = arr[k];
    let i = lo;
    let j = mid;
    for (let k = lo; k < hi; k++) {
      if (i >= mid) arr[k] = aux[j++];
      else if (j >= hi) arr[k] = aux[i++];
      else if (aux[j] < aux[i]) arr[k] = aux[j++];
      else arr[k] = aux[i++];
    }
  }
  sort(0, arr.length);
  return arr;
}

export function mergeSortSteps(input: number[]): ArrayStep[] {
  const items: ArrayItem[] = input.map((value, index) => ({
    id: `ms-${index}`,
    value,
  }));
  const steps: ArrayStep[] = [
    {
      array: [...items],
      phase: "idle",
      codeLine: 1,
      title: "開始排序",
      detail: `輸入共 ${items.length} 個元素。先遞迴切半，再由小區間向上合併。`,
    },
  ];
  const leftColor = "var(--color-accent)";
  const rightColor = "var(--color-bar-pivot)";

  function sort(lo: number, hi: number): void {
    if (hi - lo <= 1) return;

    const mid = lo + Math.floor((hi - lo) / 2);
    steps.push({
      array: [...items],
      active: [lo, hi],
      pointers: [{ name: "mid", index: mid, color: rightColor }],
      phase: "idle",
      codeLine: 6,
      title: `切分 a[${lo}..${hi - 1}]`,
      detail: `左半是 a[${lo}..${mid - 1}]，右半是 a[${mid}..${hi - 1}]；先各自排序。`,
    });

    sort(lo, mid);
    sort(mid, hi);

    const left = items.slice(lo, mid);
    const right = items.slice(mid, hi);
    const merged: ArrayItem[] = [];
    let i = 0;
    let j = 0;
    steps.push({
      array: [...items],
      active: [lo, hi],
      pointers: [
        { name: "L", index: lo, color: leftColor },
        { name: "R", index: mid, color: rightColor },
      ],
      phase: "merge",
      codeLine: 9,
      title: `準備合併 a[${lo}..${mid - 1}] 與 a[${mid}..${hi - 1}]`,
      detail: "左右兩半都已排序；每次比較兩邊尚未取用的第一個元素。",
    });

    while (i < left.length && j < right.length) {
      const leftIndex = lo + i;
      const rightIndex = mid + j;
      const chooseLeft = left[i].value <= right[j].value;
      steps.push({
        array: [...items],
        active: [lo, hi],
        comparing: [leftIndex, rightIndex],
        pointers: [
          { name: "L", index: leftIndex, color: leftColor },
          { name: "R", index: rightIndex, color: rightColor },
        ],
        phase: "merge",
        codeLine: 15,
        title: `比較左側 ${left[i].value} 與右側 ${right[j].value}`,
        detail: chooseLeft
          ? `${left[i].value} ≤ ${right[j].value}，先取左側；相等時取左側可保持穩定。`
          : `${right[j].value} < ${left[i].value}，先取右側。`,
      });

      if (chooseLeft) {
        merged.push(left[i++]);
      } else {
        merged.push(right[j++]);
      }
    }

    merged.push(...left.slice(i), ...right.slice(j));
    items.splice(lo, hi - lo, ...merged);
    const isFinalMerge = lo === 0 && hi === items.length;
    steps.push({
      array: [...items],
      active: [lo, hi],
      sorted: isFinalMerge ? items.map((_, index) => index) : undefined,
      phase: "merge",
      codeLine: 17,
      title: `合併完成：a[${lo}..${hi - 1}] 已排序`,
      detail: `寫回 [${merged.map((item) => item.value).join(", ")}]；這個區間可供上一層繼續合併。`,
    });
  }

  sort(0, items.length);
  steps.push({
    array: [...items],
    sorted: items.map((_, index) => index),
    phase: "done",
    codeLine: 20,
    title: "完成",
    detail: "最上層合併完成，整個陣列已排序。",
  });

  return steps;
}

export const mergeSortSource = `export function mergeSort(input: number[]): number[] {
  const arr = [...input];
  const aux = [...arr];
  function sort(lo: number, hi: number): void {
    if (hi - lo <= 1) return;
    const mid = lo + Math.floor((hi - lo) / 2);
    sort(lo, mid);
    sort(mid, hi);
    for (let k = lo; k < hi; k++) aux[k] = arr[k];
    let i = lo;
    let j = mid;
    for (let k = lo; k < hi; k++) {
      if (i >= mid) arr[k] = aux[j++];
      else if (j >= hi) arr[k] = aux[i++];
      else if (aux[j] < aux[i]) arr[k] = aux[j++];
      else arr[k] = aux[i++];
    }
  }
  sort(0, arr.length);
  return arr;
}`;

export const mergeSortMeta: AlgorithmMeta = {
  name: "Merge Sort",
  slug: "merge-sort",
  timeBest: "O(n log n)",
  timeAvg: "O(n log n)",
  timeWorst: "O(n log n)",
  space: "O(n)",
  stable: true,
  inPlace: false,
  tags: ["分治", "合併", "穩定"],
};
