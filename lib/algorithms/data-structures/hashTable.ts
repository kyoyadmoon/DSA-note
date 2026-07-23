import type {
  DataStructureMeta,
  DataStructureStep,
  HashEntryState,
} from "@/lib/types/dataStructure";

type StoredEntry = {
  id: string;
  key: string;
  value: number;
};

const CAPACITY = 5;

export function interviewHash(key: string, capacity = CAPACITY): number {
  let total = 0;
  for (const character of key) total += character.charCodeAt(0);
  return total % capacity;
}

function makeStep(
  buckets: StoredEntry[][],
  config: Omit<DataStructureStep, "view"> & {
    activeBucket?: number;
    states?: Record<string, HashEntryState>;
    hashLabel?: string;
  },
): DataStructureStep {
  const { activeBucket, states = {}, hashLabel, ...step } = config;
  const size = buckets.reduce((sum, bucket) => sum + bucket.length, 0);
  return {
    ...step,
    view: {
      kind: "hash-table",
      buckets: buckets.map((bucket, index) => ({
        index,
        active: index === activeBucket,
        entries: bucket.map((entry) => ({
          ...entry,
          state: states[entry.id] ?? "idle",
        })),
      })),
      capacity: buckets.length,
      size,
      loadFactor: size / buckets.length,
      hashLabel,
    },
  };
}

export function hashTableSteps(input: string[]): DataStructureStep[] {
  const keys = [...input];
  const buckets: StoredEntry[][] = Array.from(
    { length: CAPACITY },
    () => [],
  );
  const steps: DataStructureStep[] = [
    makeStep(buckets, {
      phase: "idle",
      codeLine: 3,
      title: `建立 ${CAPACITY} 個 buckets`,
      detail: "每個 bucket 使用 linked-list-like chain 保存碰撞的 entries。",
    }),
  ];

  keys.forEach((key, index) => {
    const bucketIndex = interviewHash(key);
    const bucket = buckets[bucketIndex];
    steps.push(
      makeStep(buckets, {
        phase: "hash",
        codeLine: 7,
        title: `hash("${key}") = ${bucketIndex}`,
        detail: `先把 key 映射到 bucket ${bucketIndex}；hash 相同不代表 key 相同。`,
        activeBucket: bucketIndex,
        hashLabel: `Σ charCode("${key}") mod ${CAPACITY} = ${bucketIndex}`,
      }),
    );

    const existing = bucket.find((entry) => entry.key === key);
    if (existing) {
      existing.value = index;
      steps.push(
        makeStep(buckets, {
          phase: "update",
          codeLine: 11,
          title: `更新既有 key "${key}"`,
          detail: "Map 的 key 必須唯一；相同 key 再次 set 會覆寫 value，不增加 size。",
          activeBucket: bucketIndex,
          states: { [existing.id]: "active" },
        }),
      );
      return;
    }

    const entry = { id: `hash-${index}`, key, value: index };
    const collided = bucket.length > 0;
    bucket.push(entry);
    steps.push(
      makeStep(buckets, {
        phase: collided ? "collision" : "insert",
        codeLine: 14,
        title: collided
          ? `碰撞：把 "${key}" 加入 bucket ${bucketIndex} 的 chain`
          : `插入 "${key}"`,
        detail: collided
          ? `bucket 已有其他 key；逐一比較 key 後，保存新 entry。`
          : `bucket ${bucketIndex} 原本為空，直接加入 entry。`,
        activeBucket: bucketIndex,
        states: { [entry.id]: "new" },
      }),
    );
  });

  const searchKey = keys.at(-1);
  if (searchKey !== undefined) {
    const bucketIndex = interviewHash(searchKey);
    const bucket = buckets[bucketIndex];
    for (const entry of bucket) {
      const found = entry.key === searchKey;
      steps.push(
        makeStep(buckets, {
          phase: found ? "found" : "compare-key",
          codeLine: found ? 22 : 21,
          title: found ? `找到 "${searchKey}"` : `比較 key "${entry.key}"`,
          detail: found
            ? `bucket ${bucketIndex} 中的完整 key 相等，回傳 value ${entry.value}。`
            : "hash 相同但 key 不同，繼續走訪 chain。",
          activeBucket: bucketIndex,
          states: { [entry.id]: found ? "found" : "active" },
        }),
      );
      if (found) break;
    }
  }

  const deleteKey = keys.find((key) => key !== keys[0]);
  if (deleteKey !== undefined) {
    const bucketIndex = interviewHash(deleteKey);
    const bucket = buckets[bucketIndex];
    const entryIndex = bucket.findIndex((entry) => entry.key === deleteKey);
    if (entryIndex >= 0) {
      const entry = bucket[entryIndex];
      steps.push(
        makeStep(buckets, {
          phase: "delete",
          codeLine: 29,
          title: `delete("${deleteKey}")`,
          detail: `從 bucket ${bucketIndex} 的 chain 移除完整 key 相等的 entry。`,
          activeBucket: bucketIndex,
          states: { [entry.id]: "removing" },
        }),
      );
      bucket.splice(entryIndex, 1);
    }
  }

  steps.push(
    makeStep(buckets, {
      phase: "done",
      codeLine: 32,
      title: "Hash Table 操作完成",
      detail: `size 與 capacity 決定 load factor；目前 α = ${(buckets.reduce((sum, bucket) => sum + bucket.length, 0) / CAPACITY).toFixed(2)}。`,
    }),
  );

  return steps;
}

export const hashTableSource = `class ChainedHashMap<V> {
  private buckets: Entry<V>[][];
  private size = 0;

  set(key: string, value: V) {
    const index = hash(key) % this.buckets.length;
    const entry = this.buckets[index].find(e => e.key === key);
    if (entry) {
      entry.value = value;
    } else {
      this.buckets[index].push({ key, value });
      this.size += 1;
    }
  }

  get(key: string): V | undefined {
    const index = hash(key) % this.buckets.length;
    for (const entry of this.buckets[index]) {
      if (entry.key === key) return entry.value;
    }
    return undefined;
  }

  delete(key: string) {
    const index = hash(key) % this.buckets.length;
    // Find the exact key, remove it, and update size.
  }
}`;

export const hashTableMeta: DataStructureMeta = {
  name: "Hash Table",
  slug: "hash-table",
  category: "data-structure",
  operations: [
    { operation: "get / set / delete", time: "expected O(1)" },
    { operation: "worst case", time: "O(n)" },
  ],
  space: "O(n)",
  tags: ["hashing", "map", "set", "collision"],
};
