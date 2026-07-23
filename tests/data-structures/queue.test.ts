import { describe, expect, it } from "vitest";
import { queueSteps } from "@/lib/algorithms/data-structures/queue";

describe("queueSteps", () => {
  it("enqueues values at the back in input order", () => {
    const finalEnqueue = queueSteps([5, 8, 13]).findLast(
      (step) => step.phase === "enqueue",
    )!;

    expect(finalEnqueue.view.kind).toBe("linear-collection");
    if (finalEnqueue.view.kind !== "linear-collection") return;
    expect(finalEnqueue.view.mode).toBe("queue");
    expect(finalEnqueue.view.items.map((item) => item.value)).toEqual([5, 8, 13]);
    expect(finalEnqueue.view.frontId).toBe("queue-0");
    expect(finalEnqueue.view.backId).toBe("queue-2");
  });

  it("dequeues the earliest enqueued value", () => {
    const final = queueSteps([5, 8, 13]).at(-1)!;

    expect(final.view.kind).toBe("linear-collection");
    if (final.view.kind !== "linear-collection") return;
    expect(final.view.output).toEqual([5]);
    expect(final.view.frontId).toBe("queue-1");
    expect(final.view.backId).toBe("queue-2");
  });

  it("advances a head index without shifting the backing array", () => {
    const final = queueSteps([2, 4, 6]).at(-1)!;

    expect(final.view.kind).toBe("linear-collection");
    if (final.view.kind !== "linear-collection") return;
    expect(final.view.headIndex).toBe(1);
    expect(final.view.items).toHaveLength(3);
    expect(final.view.items[0].state).toBe("consumed");
  });

  it("emits one enqueue step for every value", () => {
    const steps = queueSteps([1, 2, 3, 4]);

    expect(steps.filter((step) => step.phase === "enqueue")).toHaveLength(4);
  });

  it("does not mutate input and handles an empty queue", () => {
    const input = [9, 7];
    queueSteps(input);
    const final = queueSteps([]).at(-1)!;

    expect(input).toEqual([9, 7]);
    expect(final.view.kind).toBe("linear-collection");
    if (final.view.kind !== "linear-collection") return;
    expect(final.view.items).toEqual([]);
    expect(final.view.frontId).toBeUndefined();
    expect(final.view.backId).toBeUndefined();
  });
});
