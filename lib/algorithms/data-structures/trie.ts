import type {
  DataStructureMeta,
  DataStructureStep,
  TrieNodeState,
} from "@/lib/types/dataStructure";

type StoredNode = {
  id: string;
  character: string;
  path: string;
  parentId: string | null;
  children: Map<string, StoredNode>;
  terminal: boolean;
};

function createRoot(): StoredNode {
  return {
    id: "trie-root",
    character: "",
    path: "",
    parentId: null,
    children: new Map(),
    terminal: false,
  };
}

function flatten(root: StoredNode): StoredNode[] {
  const result: StoredNode[] = [];
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    queue.push(...node.children.values());
  }
  return result;
}

function makeStep(
  root: StoredNode,
  wordCount: number,
  config: Omit<DataStructureStep, "view"> & {
    states?: Record<string, TrieNodeState>;
    query?: string;
  },
): DataStructureStep {
  const { states = {}, query, ...step } = config;
  return {
    ...step,
    view: {
      kind: "trie",
      nodes: flatten(root).map((node) => ({
        id: node.id,
        character: node.character,
        path: node.path,
        parentId: node.parentId,
        childIds: [...node.children.values()].map((child) => child.id),
        terminal: node.terminal,
        state: states[node.id] ?? "idle",
      })),
      wordCount,
      query,
    },
  };
}

function pathStates(
  path: StoredNode[],
  current: StoredNode,
  state: TrieNodeState,
): Record<string, TrieNodeState> {
  return Object.fromEntries([
    ...path.map((node) => [node.id, "visited" as const]),
    [current.id, state],
  ]);
}

export function trieSteps(input: string[]): DataStructureStep[] {
  const words = [...input];
  const root = createRoot();
  let wordCount = 0;
  const steps: DataStructureStep[] = [
    makeStep(root, wordCount, {
      phase: "idle",
      codeLine: 3,
      title: "建立只有 root 的 Trie",
      detail: "root 不代表任何字元；每條 root-to-node 路徑代表一個 prefix。",
    }),
  ];

  for (const word of words) {
    let current = root;
    const path = [root];
    for (const character of word) {
      const existing = current.children.get(character);
      if (existing) {
        current = existing;
        steps.push(
          makeStep(root, wordCount, {
            phase: "follow-prefix",
            codeLine: 8,
            title: `沿共享 prefix 前往 "${current.path}"`,
            detail: `字元 '${character}' 已存在，不建立重複節點。`,
            states: pathStates(path, current, "active"),
            query: word,
          }),
        );
      } else {
        const pathValue = current.path + character;
        const child: StoredNode = {
          id: `trie-${pathValue}`,
          character,
          path: pathValue,
          parentId: current.id,
          children: new Map(),
          terminal: false,
        };
        current.children.set(character, child);
        current = child;
        steps.push(
          makeStep(root, wordCount, {
            phase: "create-node",
            codeLine: 9,
            title: `建立字元節點 '${character}'`,
            detail: `新路徑 "${pathValue}" 成為可搜尋的 prefix。`,
            states: pathStates(path, current, "new"),
            query: word,
          }),
        );
      }
      path.push(current);
    }

    if (!current.terminal) {
      current.terminal = true;
      wordCount += 1;
    }
    steps.push(
      makeStep(root, wordCount, {
        phase: "mark-word",
        codeLine: 13,
        title: `把 "${word}" 標記為完整單字`,
        detail: "terminal marker 區分完整 word 與只有 prefix 的路徑。",
        states: pathStates(path.slice(0, -1), current, "found"),
        query: word,
      }),
    );
  }

  const query = words.at(-1);
  if (query !== undefined) {
    let current: StoredNode | undefined = root;
    const path = [root];
    for (const character of query) {
      current = current?.children.get(character);
      if (!current) break;
      path.push(current);
      steps.push(
        makeStep(root, wordCount, {
          phase: "search",
          codeLine: 20,
          title: `search: 讀取 '${character}'`,
          detail: `目前匹配 prefix "${current.path}"。`,
          states: pathStates(path.slice(0, -1), current, "active"),
          query,
        }),
      );
    }

    const found = current?.terminal === true;
    if (current) {
      steps.push(
        makeStep(root, wordCount, {
          phase: found ? "found" : "prefix-only",
          codeLine: 23,
          title: found ? `找到完整單字 "${query}"` : `"${query}" 只是 prefix`,
          detail: found
            ? "所有字元匹配，且最後節點 terminal = true。"
            : "所有字元雖匹配，但最後節點沒有 terminal marker。",
          states: pathStates(path.slice(0, -1), current, found ? "found" : "active"),
          query,
        }),
      );
    }
  }

  steps.push(
    makeStep(root, wordCount, {
      phase: "done",
      codeLine: 25,
      title: "Trie 操作完成",
      detail: `共保存 ${wordCount} 個不同單字；共享 prefix 只佔一條共同路徑。`,
    }),
  );

  return steps;
}

export const trieSource = `class TrieNode {
  children = new Map<string, TrieNode>();
  isWord = false;
}

class Trie {
  private root = new TrieNode();

  insert(word: string) {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }
    node.isWord = true;
  }

  search(word: string) {
    const node = this.walk(word);
    return node?.isWord === true;
  }

  startsWith(prefix: string) {
    return this.walk(prefix) !== undefined;
  }
}`;

export const trieMeta: DataStructureMeta = {
  name: "Trie / Prefix Tree",
  slug: "trie",
  category: "data-structure",
  operations: [
    { operation: "insert", time: "O(L)" },
    { operation: "search", time: "O(L)" },
    { operation: "startsWith", time: "O(L)" },
  ],
  space: "O(total characters)",
  tags: ["prefix", "string", "autocomplete"],
};
