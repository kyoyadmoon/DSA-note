import { describe, expect, it } from "vitest";
import {
  heapSort,
  heapSortMeta,
  heapSortSource,
  heapSortSteps,
} from "@/lib/algorithms/sorting/heapSort";

function isMaxHeap(values: number[]): boolean {
  for (let parent = 0; parent < values.length; parent++) {
    const left = parent * 2 + 1;
    const right = left + 1;
    if (left < values.length && values[parent] < values[left]) return false;
    if (right < values.length && values[parent] < values[right]) return false;
  }
  return true;
}

describe("heapSort", () => {
  it.each([
    { name: "empty", input: [] },
    { name: "single", input: [42] },
    { name: "sorted", input: [1, 2, 3, 4, 5] },
    { name: "reversed", input: [5, 4, 3, 2, 1] },
    { name: "duplicates", input: [3, 1, 3, 2, 1] },
    { name: "negative values", input: [-2, 4, 0, -5, 4] },
  ])("sorts $name input without mutating it", ({ input }) => {
    const original = [...input];

    expect(heapSort(input)).toEqual([...input].sort((a, b) => a - b));
    expect(input).toEqual(original);
  });

  it("matches Array.prototype.sort on 200 random inputs", () => {
    for (let trial = 0; trial < 200; trial++) {
      const length = Math.floor(Math.random() * 30);
      const input = Array.from(
        { length },
        () => Math.floor(Math.random() * 201) - 100,
      );
      expect(heapSort(input)).toEqual([...input].sort((a, b) => a - b));
    }
  });
});

describe("heapSortSteps", () => {
  it("starts idle and ends with the pure function result", () => {
    const input = [5, 2, 8, 1, 9, 3];
    const steps = heapSortSteps(input);

    expect(steps[0].phase).toBe("idle");
    expect(steps.at(-1)?.phase).toBe("done");
    expect(steps.at(-1)?.array.map((item) => item.value)).toEqual(
      heapSort(input),
    );
  });

  it("preserves the value multiset and item ids in every step", () => {
    const input = [5, 2, 8, 1, 9, 3];
    const expectedValues = [...input].sort((a, b) => a - b);
    const expectedIds = new Set(input.map((_, index) => `hs-${index}`));

    for (const step of heapSortSteps(input)) {
      expect(step.array.map((item) => item.value).sort((a, b) => a - b)).toEqual(
        expectedValues,
      );
      expect(new Set(step.array.map((item) => item.id))).toEqual(expectedIds);
    }
  });

  it("builds and repairs a valid max heap", () => {
    const heapSteps = heapSortSteps([5, 2, 8, 1, 9, 3]).filter(
      (step) =>
        step.title === "Max heap 建立完成" ||
        step.title === "剩餘 heap 已修復",
    );

    expect(heapSteps.length).toBeGreaterThan(1);
    for (const step of heapSteps) {
      expect(step.active).toBeDefined();
      if (!step.active) continue;
      const [lo, hi] = step.active;
      expect(lo).toBe(0);
      expect(isMaxHeap(step.array.slice(lo, hi).map((item) => item.value))).toBe(
        true,
      );
    }
  });

  it("keeps every marked suffix sorted", () => {
    for (const step of heapSortSteps([5, 2, 8, 1, 9, 3])) {
      if (!step.sorted?.length) continue;
      const first = step.sorted[0];
      expect(step.sorted).toEqual(
        Array.from(
          { length: step.array.length - first },
          (_, offset) => first + offset,
        ),
      );
      const values = step.sorted.map((index) => step.array[index].value);
      expect(values).toEqual([...values].sort((a, b) => a - b));
    }
  });

  it("demonstrates that root-to-end swaps are not stable", () => {
    const final = heapSortSteps([2, 2, 2]).at(-1)!;
    const equalValueIds = final.array.map((item) => item.id);

    expect(equalValueIds).toEqual(["hs-1", "hs-2", "hs-0"]);
    expect(heapSortMeta.stable).toBe(false);
  });

  it("keeps all active ranges, referenced indices, and code lines valid", () => {
    const input = [4, 1, 3, 2];
    const lineCount = heapSortSource.split("\n").length;

    for (const step of heapSortSteps(input)) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(lineCount);
      if (step.active) {
        expect(step.active[0]).toBeGreaterThanOrEqual(0);
        expect(step.active[0]).toBeLessThanOrEqual(step.active[1]);
        expect(step.active[1]).toBeLessThanOrEqual(input.length);
      }
      for (const index of [
        ...(step.comparing ?? []),
        ...(step.swapping ?? []),
        ...(step.sorted ?? []),
        ...(step.selected === undefined ? [] : [step.selected]),
      ]) {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(input.length);
      }
    }
  });
});
