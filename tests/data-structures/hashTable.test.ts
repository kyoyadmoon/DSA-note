import { describe, expect, it } from "vitest";
import {
  hashTableSteps,
  interviewHash,
} from "@/lib/algorithms/data-structures/hashTable";

describe("hashTableSteps", () => {
  it("uses a deterministic hash and keeps every bucket in range", () => {
    const keys = ["cat", "act", "dog", "god"];

    expect(keys.map((key) => interviewHash(key))).toEqual([2, 2, 4, 4]);
    expect(keys.every((key) => interviewHash(key) >= 0)).toBe(true);
    expect(keys.every((key) => interviewHash(key) < 5)).toBe(true);
  });

  it("keeps colliding keys in the same chain", () => {
    const collision = hashTableSteps(["cat", "act"]).findLast(
      (step) => step.phase === "collision",
    )!;

    expect(collision.view.kind).toBe("hash-table");
    if (collision.view.kind !== "hash-table") return;
    expect(collision.view.buckets[2].entries.map((entry) => entry.key)).toEqual([
      "cat",
      "act",
    ]);
  });

  it("finds by exact key after choosing a bucket", () => {
    const found = hashTableSteps(["cat", "act", "dog"]).find(
      (step) => step.phase === "found",
    )!;

    expect(found.title).toBe('找到 "dog"');
    expect(found.view.kind).toBe("hash-table");
    if (found.view.kind !== "hash-table") return;
    expect(found.view.buckets[4].active).toBe(true);
  });

  it("deletes only the requested colliding key", () => {
    const final = hashTableSteps(["cat", "act", "dog"]).at(-1)!;

    expect(final.view.kind).toBe("hash-table");
    if (final.view.kind !== "hash-table") return;
    expect(final.view.buckets[2].entries.map((entry) => entry.key)).toEqual([
      "cat",
    ]);
    expect(final.view.size).toBe(2);
  });

  it("updates duplicate keys without increasing size", () => {
    const final = hashTableSteps(["cat", "cat"]).at(-1)!;

    expect(final.view.kind).toBe("hash-table");
    if (final.view.kind !== "hash-table") return;
    expect(final.view.size).toBe(1);
    expect(final.view.buckets[2].entries[0].value).toBe(1);
  });

  it("does not mutate input and handles an empty table", () => {
    const input = ["a", "b"];
    hashTableSteps(input);
    const final = hashTableSteps([]).at(-1)!;

    expect(input).toEqual(["a", "b"]);
    expect(final.view.kind).toBe("hash-table");
    if (final.view.kind !== "hash-table") return;
    expect(final.view.size).toBe(0);
    expect(final.view.loadFactor).toBe(0);
  });
});
