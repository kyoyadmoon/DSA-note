import type {
  DataStructureMeta,
  DataStructureStep,
  GraphInput,
} from "@/lib/types/dataStructure";
import {
  edgeIdBetween,
  makeTraversalStep,
  prepareGraph,
  traversalNodeStates,
} from "./traversalShared";

export function bfsSteps(input: GraphInput): DataStructureStep[] {
  const graph = prepareGraph(input);
  const queue: string[] = [];
  const discovered = new Set<string>();
  const visited = new Set<string>();
  const visitOrder: string[] = [];
  const steps: DataStructureStep[] = [
    makeTraversalStep(graph, "bfs", queue, visitOrder, {
      phase: "idle",
      codeLine: 2,
      title: "準備 BFS Queue",
      detail: graph.start
        ? `從起點 ${graph.start} 開始；尚未發現任何 vertex。`
        : "起點不存在於 graph，無法開始 traversal。",
    }),
  ];

  if (!graph.start) {
    steps.push(
      makeTraversalStep(graph, "bfs", queue, visitOrder, {
        phase: "done",
        codeLine: 23,
        title: "BFS 結束",
        detail: "沒有有效起點，因此 visit order 為空。",
      }),
    );
    return steps;
  }

  queue.push(graph.start);
  discovered.add(graph.start);
  steps.push(
    makeTraversalStep(graph, "bfs", queue, visitOrder, {
      phase: "enqueue-start",
      codeLine: 6,
      title: `enqueue(${graph.start}) 並標記 discovered`,
      detail: "在 enqueue 時標記，可避免同一 vertex 被不同 predecessor 重複加入。",
      nodeStates: traversalNodeStates(discovered, visited, graph.start),
    }),
  );

  while (queue.length > 0) {
    const current = queue.shift()!;
    visited.add(current);
    visitOrder.push(current);
    steps.push(
      makeTraversalStep(graph, "bfs", queue, visitOrder, {
        phase: "dequeue",
        codeLine: 10,
        title: `dequeue() = ${current}`,
        detail: `${current} 是 Queue 中最早發現的 vertex，現在展開它的 neighbors。`,
        nodeStates: traversalNodeStates(discovered, visited, current),
      }),
    );

    for (const neighbor of graph.adjacency.get(current) ?? []) {
      const edgeId = edgeIdBetween(graph, current, neighbor);
      steps.push(
        makeTraversalStep(graph, "bfs", queue, visitOrder, {
          phase: "inspect-edge",
          codeLine: 13,
          title: `檢查 ${current} → ${neighbor}`,
          detail: discovered.has(neighbor)
            ? `${neighbor} 已 discovered，略過以避免重複入列。`
            : `${neighbor} 尚未 discovered，加入 Queue。`,
          nodeStates: traversalNodeStates(discovered, visited, current),
          edgeStates: edgeId ? { [edgeId]: "active" } : undefined,
        }),
      );
      if (discovered.has(neighbor)) continue;

      discovered.add(neighbor);
      queue.push(neighbor);
      steps.push(
        makeTraversalStep(graph, "bfs", queue, visitOrder, {
          phase: "enqueue",
          codeLine: 16,
          title: `enqueue(${neighbor})`,
          detail: `Queue 保持先發現者先處理；${neighbor} 立刻標記 discovered。`,
          nodeStates: traversalNodeStates(discovered, visited, neighbor),
          edgeStates: edgeId ? { [edgeId]: "traversed" } : undefined,
        }),
      );
    }
  }

  steps.push(
    makeTraversalStep(graph, "bfs", queue, visitOrder, {
      phase: "done",
      codeLine: 23,
      title: "BFS 結束",
      detail: `從 ${graph.start} 可達的 ${visitOrder.length} 個 vertices 已處理；Queue 為空。`,
      nodeStates: traversalNodeStates(discovered, visited),
    }),
  );

  return steps;
}

export const bfsSource = `function bfs(graph: Map<string, string[]>, start: string) {
  const queue = [start];
  let head = 0;
  const discovered = new Set([start]);
  const parent = new Map<string, string | null>([[start, null]]);

  while (head < queue.length) {
    const vertex = queue[head++];
    for (const neighbor of graph.get(vertex) ?? []) {
      if (discovered.has(neighbor)) continue;
      discovered.add(neighbor);
      parent.set(neighbor, vertex);
      queue.push(neighbor);
    }
  }

  return { discovered, parent };
}`;

export const bfsMeta: DataStructureMeta = {
  name: "Breadth-First Search",
  slug: "bfs",
  category: "data-structure",
  operations: [
    { operation: "time", time: "O(V + E)" },
    { operation: "auxiliary space", time: "O(V)" },
  ],
  space: "O(V)",
  tags: ["graph", "queue", "shortest-path"],
};
