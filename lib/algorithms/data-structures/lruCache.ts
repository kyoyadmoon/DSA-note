import type {
  DataStructureMeta,
  DataStructureStep,
  LruEntryState,
} from "@/lib/types/dataStructure";

const CAPACITY = 3;

function makeStep(
  entries: string[],
  map: Set<string>,
  hits: number,
  misses: number,
  evicted: string[],
  config: Omit<DataStructureStep, "view"> & {
    states?: Record<string, LruEntryState>;
    request?: string;
  },
): DataStructureStep {
  const { states = {}, request, ...step } = config;
  return {
    ...step,
    view: {
      kind: "lru-cache",
      capacity: CAPACITY,
      entries: entries.map((key) => ({
        key,
        state: states[key] ?? "idle",
      })),
      mapKeys: [...map],
      hits,
      misses,
      evicted: [...evicted],
      request,
    },
  };
}

export function lruCacheSteps(input: string[]): DataStructureStep[] {
  const requests = [...input];
  const entries: string[] = [];
  const map = new Set<string>();
  const evicted: string[] = [];
  let hits = 0;
  let misses = 0;
  const steps: DataStructureStep[] = [
    makeStep(entries, map, hits, misses, evicted, {
      phase: "idle",
      codeLine: 5,
      title: `建立 capacity = ${CAPACITY} 的 LRU Cache`,
      detail: "Doubly Linked List 目前只有 head / tail sentinels；Map 為空。",
    }),
  ];

  for (const key of requests) {
    const index = entries.indexOf(key);
    if (index >= 0) {
      hits += 1;
      steps.push(
        makeStep(entries, map, hits, misses, evicted, {
          phase: "hit",
          codeLine: 10,
          title: `get(${key})：cache hit`,
          detail: "Map 直接取得 node reference；接著把它移到 MRU 端。",
          states: { [key]: "active" },
          request: key,
        }),
      );

      entries.splice(index, 1);
      entries.unshift(key);
      steps.push(
        makeStep(entries, map, hits, misses, evicted, {
          phase: "move-front",
          codeLine: 12,
          title: `把 ${key} 移到 MRU`,
          detail: "已知 node，從原位置 detach 再接到 head 後方，兩步皆 O(1)。",
          states: { [key]: "active" },
          request: key,
        }),
      );
      continue;
    }

    misses += 1;
    entries.unshift(key);
    map.add(key);
    steps.push(
      makeStep(entries, map, hits, misses, evicted, {
        phase: "miss",
        codeLine: 18,
        title: `get(${key})：cache miss`,
        detail: `${key} 建立新 node，加入 Map 並接到 MRU 端。`,
        states: { [key]: "new" },
        request: key,
      }),
    );

    if (entries.length > CAPACITY) {
      const lru = entries.at(-1)!;
      steps.push(
        makeStep(entries, map, hits, misses, evicted, {
          phase: "evict",
          codeLine: 22,
          title: `容量超限，evict LRU ${lru}`,
          detail: "tail.prev 直接給出最久未使用 node；從 list 與 Map 同時移除。",
          states: { [lru]: "evicting" },
          request: key,
        }),
      );
      entries.pop();
      map.delete(lru);
      evicted.push(lru);
    }
  }

  steps.push(
    makeStep(entries, map, hits, misses, evicted, {
      phase: "done",
      codeLine: 26,
      title: "LRU Cache access sequence 完成",
      detail: `hits = ${hits}、misses = ${misses}；list 與 Map 都保存 ${entries.length} 個相同 keys。`,
    }),
  );

  return steps;
}

export const lruCacheSource = `class LRUCache<K, V> {
  private map = new Map<K, Node<K, V>>();
  private head = new Node<K, V>(); // MRU sentinel
  private tail = new Node<K, V>(); // LRU sentinel

  constructor(private capacity: number) {
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    this.moveToFront(node);
    return node.value;
  }

  put(key: K, value: V) {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      this.moveToFront(existing);
      return;
    }
    const node = new Node(key, value);
    this.map.set(key, node);
    this.addAfterHead(node);
    if (this.map.size > this.capacity) {
      const lru = this.tail.prev!;
      this.detach(lru);
      this.map.delete(lru.key);
    }
  }

  private moveToFront(node: Node<K, V>) {
    this.detach(node);
    this.addAfterHead(node);
  }
}`;

export const lruCacheMeta: DataStructureMeta = {
  name: "LRU Cache",
  slug: "lru-cache",
  category: "data-structure",
  operations: [
    { operation: "get", time: "expected O(1)" },
    { operation: "put", time: "expected O(1)" },
    { operation: "evict LRU", time: "O(1)" },
  ],
  space: "O(capacity)",
  tags: ["cache", "hash-map", "doubly-linked-list"],
};
