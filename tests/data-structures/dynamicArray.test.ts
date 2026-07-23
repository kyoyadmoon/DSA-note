import { describe, expect, it } from "vitest";
import { dynamicArraySteps } from "@/lib/algorithms/data-structures/dynamicArray";

describe("dynamicArraySteps", () => {
  it("starts with an empty buffer whose capacity is two", () => {
    const first = dynamicArraySteps([7])[0];

    expect(first.view.kind).toBe("dynamic-array");
    if (first.view.kind !== "dynamic-array") return;
    expect(first.view.size).toBe(0);
    expect(first.view.capacity).toBe(2);
    expect(first.view.buffers[0].slots.map((slot) => slot.value)).toEqual([
      null,
      null,
    ]);
  });

  it("preserves append order across repeated resizes", () => {
    const input = [7, 3, 9, 4, 6, 8, 1];
    const steps = dynamicArraySteps(input);
    const final = steps.at(-1)!;

    expect(final.view.kind).toBe("dynamic-array");
    if (final.view.kind !== "dynamic-array") return;
    expect(final.view.size).toBe(input.length);
    expect(final.view.capacity).toBe(8);
    expect(
      final.view.buffers[0].slots
        .slice(0, input.length)
        .map((slot) => slot.value),
    ).toEqual(input);
  });

  it("emits allocation and one copy step per existing element", () => {
    const steps = dynamicArraySteps([10, 20, 30]);

    expect(steps.filter((step) => step.phase === "allocate")).toHaveLength(2);
    expect(steps.filter((step) => step.phase === "copy")).toHaveLength(2);
  });

  it("uses independent snapshots", () => {
    const steps = dynamicArraySteps([1, 2, 3]);
    const firstView = steps[0].view;
    const finalView = steps.at(-1)!.view;

    expect(firstView.kind).toBe("dynamic-array");
    expect(finalView.kind).toBe("dynamic-array");
    if (
      firstView.kind !== "dynamic-array" ||
      finalView.kind !== "dynamic-array"
    ) {
      return;
    }
    const firstSlots = firstView.buffers[0].slots;
    const finalSlots = finalView.buffers[0].slots;

    expect(firstSlots).not.toBe(finalSlots);
    expect(firstSlots.every((slot) => slot.value === null)).toBe(true);
  });

  it("does not mutate the caller input", () => {
    const input = [4, 2, 8];
    dynamicArraySteps(input);
    expect(input).toEqual([4, 2, 8]);
  });

  it("handles an empty input with a terminal step", () => {
    const steps = dynamicArraySteps([]);
    const final = steps.at(-1)!;

    expect(final.phase).toBe("done");
    expect(final.view.kind).toBe("dynamic-array");
    if (final.view.kind !== "dynamic-array") return;
    expect(final.view.size).toBe(0);
  });
});
