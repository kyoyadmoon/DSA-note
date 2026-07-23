import { describe, expect, it } from "vitest";
import { singlyLinkedListSteps } from "@/lib/algorithms/data-structures/singlyLinkedList";

describe("singlyLinkedListSteps", () => {
  it("appends nodes in input order", () => {
    const steps = singlyLinkedListSteps([12, 7, 25, 4]);
    const beforeSearch = steps.findLast((step) => step.phase === "link")!;

    expect(beforeSearch.view.kind).toBe("linked-list");
    if (beforeSearch.view.kind !== "linked-list") return;
    expect(beforeSearch.view.nodes.map((node) => node.value)).toEqual([
      12, 7, 25, 4,
    ]);
    expect(beforeSearch.view.headId).toBe("sll-0");
    expect(beforeSearch.view.tailId).toBe("sll-3");
  });

  it("links every reachable node to its successor", () => {
    const finalLink = singlyLinkedListSteps([1, 2, 3]).findLast(
      (step) => step.phase === "link",
    )!;

    expect(finalLink.view.kind).toBe("linked-list");
    if (finalLink.view.kind !== "linked-list") return;
    expect(finalLink.view.nodes.map((node) => node.nextId)).toEqual([
      "sll-1",
      "sll-2",
      null,
    ]);
  });

  it("shows linear traversal before finding the tail", () => {
    const inspectSteps = singlyLinkedListSteps([5, 6, 7, 8]).filter(
      (step) => step.phase === "inspect",
    );
    const finalInspect = inspectSteps.at(-1)!;

    expect(inspectSteps).toHaveLength(4);
    expect(finalInspect.view.kind).toBe("linked-list");
    if (finalInspect.view.kind !== "linked-list") return;
    expect(finalInspect.view.nodes.at(-1)?.state).toBe("active");
  });

  it("removes the second node by reconnecting its predecessor", () => {
    const final = singlyLinkedListSteps([12, 7, 25, 4]).at(-1)!;

    expect(final.view.kind).toBe("linked-list");
    if (final.view.kind !== "linked-list") return;
    expect(final.view.nodes.map((node) => node.value)).toEqual([12, 25, 4]);
    expect(final.view.nodes[0].nextId).toBe("sll-2");
  });

  it("does not mutate input and handles an empty list", () => {
    const input = [3, 1];
    singlyLinkedListSteps(input);
    const empty = singlyLinkedListSteps([]).at(-1)!;

    expect(input).toEqual([3, 1]);
    expect(empty.view.kind).toBe("linked-list");
    if (empty.view.kind !== "linked-list") return;
    expect(empty.view.nodes).toEqual([]);
    expect(empty.view.headId).toBeNull();
    expect(empty.view.tailId).toBeNull();
  });
});
