import { describe, expect, it } from "vitest";
import { monotonicStackSteps } from "@/lib/algorithms/data-structures/monotonicStack";

describe("monotonicStackSteps", () => {
  it("computes next strictly greater values", () => {
    const final = monotonicStackSteps([2, 1, 2, 4, 3]).at(-1)!;

    expect(final.view.kind).toBe("monotonic-stack");
    if (final.view.kind !== "monotonic-stack") return;
    expect(final.view.answers).toEqual([4, 2, 4, -1, -1]);
  });

  it("keeps stack values non-increasing after each push", () => {
    const pushSteps = monotonicStackSteps([2, 1, 2, 4, 3]).filter(
      (step) => step.phase === "push",
    );

    for (const step of pushSteps) {
      expect(step.view.kind).toBe("monotonic-stack");
      if (step.view.kind !== "monotonic-stack") continue;
      const stackValues = step.view.stack.map(
        (index) => step.view.kind === "monotonic-stack" ? step.view.values[index].value : 0,
      );
      expect(
        stackValues.every((value, index) => index === 0 || stackValues[index - 1] >= value),
      ).toBe(true);
    }
  });

  it("does not let an equal value resolve next greater", () => {
    const final = monotonicStackSteps([2, 2]).at(-1)!;

    expect(final.view.kind).toBe("monotonic-stack");
    if (final.view.kind !== "monotonic-stack") return;
    expect(final.view.answers).toEqual([-1, -1]);
  });

  it("pushes every index once and pops each resolved index once", () => {
    const steps = monotonicStackSteps([1, 3, 2, 4]);

    expect(steps.filter((step) => step.phase === "push")).toHaveLength(4);
    expect(steps.filter((step) => step.phase === "resolve")).toHaveLength(3);
  });

  it("does not mutate input and handles an empty list", () => {
    const input = [3, 1, 2];
    monotonicStackSteps(input);
    const final = monotonicStackSteps([]).at(-1)!;

    expect(input).toEqual([3, 1, 2]);
    expect(final.view.kind).toBe("monotonic-stack");
    if (final.view.kind !== "monotonic-stack") return;
    expect(final.view.values).toEqual([]);
    expect(final.view.answers).toEqual([]);
  });
});
