import type { AlgorithmMeta, ArrayItem, ArrayStep } from "@/lib/types/step";
import { range } from "@/lib/utils/range";

export function heapSort(input: number[]): number[] {
  const arr = [...input];
  function siftDown(start: number, end: number): void {
    let root = start;
    while (root * 2 + 1 < end) {
      let child = root * 2 + 1;
      if (child + 1 < end && arr[child] < arr[child + 1]) child++;
      if (arr[root] >= arr[child]) return;
      [arr[root], arr[child]] = [arr[child], arr[root]];
      root = child;
    }
  }
  for (let start = Math.floor(arr.length / 2) - 1; start >= 0; start--) {
    siftDown(start, arr.length);
  }
  for (let end = arr.length - 1; end > 0; end--) {
    [arr[0], arr[end]] = [arr[end], arr[0]];
    siftDown(0, end);
  }
  return arr;
}

export function heapSortSteps(input: number[]): ArrayStep[] {
  const items: ArrayItem[] = input.map((value, index) => ({
    id: `hs-${index}`,
    value,
  }));
  const steps: ArrayStep[] = [
    {
      array: [...items],
      phase: "idle",
      codeLine: 1,
      focusLabel: "較大子節點",
      title: "開始排序",
      detail: `輸入共 ${items.length} 個元素。先建立 max heap，再逐一取出最大值。`,
    },
  ];
  const rootColor = "var(--color-accent)";
  const childColor = "var(--color-bar-pivot)";

  function siftDown(start: number, end: number, sorted: number[]): void {
    let root = start;
    while (root * 2 + 1 < end) {
      const left = root * 2 + 1;
      const right = left + 1;
      let child = left;

      if (right < end) {
        const chooseRight = items[left].value < items[right].value;
        steps.push({
          array: [...items],
          active: [0, end],
          sorted,
          selected: chooseRight ? right : left,
          comparing: [left, right],
          pointers: [
            { name: "left", index: left, color: rootColor },
            { name: "right", index: right, color: childColor },
          ],
          phase: "heapify",
          codeLine: 7,
          focusLabel: "較大子節點",
          title: `比較 a[${left}] 與 a[${right}]`,
          detail: chooseRight
            ? `${items[right].value} 較大，選右子節點與 root 比較。`
            : `${items[left].value} 較大或相等，選左子節點與 root 比較。`,
        });
        if (chooseRight) child = right;
      }

      const heapOrdered = items[root].value >= items[child].value;
      steps.push({
        array: [...items],
        active: [0, end],
        sorted,
        selected: child,
        comparing: [root, child],
        pointers: [
          { name: "root", index: root, color: rootColor },
          { name: "child", index: child, color: childColor },
        ],
        phase: "heapify",
        codeLine: 8,
        focusLabel: "較大子節點",
        title: `比較 root ${items[root].value} 與較大子節點 ${items[child].value}`,
        detail: heapOrdered
          ? `${items[root].value} ≥ ${items[child].value}，這個子樹已符合 max-heap property。`
          : `${items[root].value} < ${items[child].value}，交換後繼續向下修復。`,
      });

      if (heapOrdered) break;

      const rootValue = items[root].value;
      const childValue = items[child].value;
      [items[root], items[child]] = [items[child], items[root]];
      steps.push({
        array: [...items],
        active: [0, end],
        sorted,
        swapping: [root, child],
        pointers: [{ name: "root", index: child, color: rootColor }],
        phase: "heapify",
        codeLine: 9,
        focusLabel: "較大子節點",
        title: `交換 ${rootValue} 與 ${childValue}`,
        detail: `${childValue} 上升到父節點；${rootValue} 下沉後還要檢查新的子節點。`,
      });
      root = child;
    }
  }

  for (
    let start = Math.floor(items.length / 2) - 1;
    start >= 0;
    start--
  ) {
    steps.push({
      array: [...items],
      active: [0, items.length],
      pointers: [{ name: "root", index: start, color: rootColor }],
      phase: "heapify",
      codeLine: 13,
      focusLabel: "較大子節點",
      title: `由 a[${start}] 開始 sift-down`,
      detail: "它的子樹已是 heap；把 root 向下移到符合 max-heap property 的位置。",
    });
    siftDown(start, items.length, []);
  }

  if (items.length > 1) {
    steps.push({
      array: [...items],
      active: [0, items.length],
      selected: 0,
      pointers: [{ name: "max", index: 0, color: childColor }],
      phase: "heapify",
      codeLine: 16,
      focusLabel: "Heap 最大值",
      title: "Max heap 建立完成",
      detail: `${items[0].value} 位於 root；每個父節點都大於或等於它的子節點。`,
    });
  }

  for (let end = items.length - 1; end > 0; end--) {
    const maxValue = items[0].value;
    [items[0], items[end]] = [items[end], items[0]];
    const sorted = range(end, items.length);
    steps.push({
      array: [...items],
      active: [0, end],
      sorted,
      swapping: [0, end],
      pointers: [{ name: "max", index: end, color: childColor }],
      phase: "heapify",
      codeLine: 17,
      focusLabel: "Heap 最大值",
      title: `把最大值 ${maxValue} 固定到 a[${end}]`,
      detail: `交換 root 與 heap 最後一格；a[${end}..${items.length - 1}] 不再參與 heap。`,
    });

    siftDown(0, end, sorted);
    steps.push({
      array: [...items],
      active: [0, end],
      sorted,
      selected: end > 0 ? 0 : undefined,
      pointers:
        end > 0 ? [{ name: "max", index: 0, color: childColor }] : undefined,
      phase: "heapify",
      codeLine: 18,
      focusLabel: "Heap 最大值",
      title: "剩餘 heap 已修復",
      detail: `a[0..${end - 1}] 恢復 max-heap property；下一個最大值位於 root。`,
    });
  }

  steps.push({
    array: [...items],
    sorted: items.map((_, index) => index),
    phase: "done",
    codeLine: 20,
    focusLabel: "Heap 最大值",
    title: "完成",
    detail: "Heap 已縮小至一個元素，整個陣列由小到大排列。",
  });

  return steps;
}

export const heapSortSource = `export function heapSort(input: number[]): number[] {
  const arr = [...input];
  function siftDown(start: number, end: number): void {
    let root = start;
    while (root * 2 + 1 < end) {
      let child = root * 2 + 1;
      if (child + 1 < end && arr[child] < arr[child + 1]) child++;
      if (arr[root] >= arr[child]) return;
      [arr[root], arr[child]] = [arr[child], arr[root]];
      root = child;
    }
  }
  for (let start = Math.floor(arr.length / 2) - 1; start >= 0; start--) {
    siftDown(start, arr.length);
  }
  for (let end = arr.length - 1; end > 0; end--) {
    [arr[0], arr[end]] = [arr[end], arr[0]];
    siftDown(0, end);
  }
  return arr;
}`;

export const heapSortMeta: AlgorithmMeta = {
  name: "Heap Sort",
  slug: "heap-sort",
  timeBest: "O(n log n)",
  timeAvg: "O(n log n)",
  timeWorst: "O(n log n)",
  space: "O(1)",
  stable: false,
  inPlace: true,
  tags: ["Heap", "選擇", "原地"],
};
