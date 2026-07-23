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

export function dfsSteps(input: GraphInput): DataStructureStep[] {
  const graph = prepareGraph(input);
  const stack: string[] = [];
  const discovered = new Set<string>();
  const visited = new Set<string>();
  const visitOrder: string[] = [];
  const steps: DataStructureStep[] = [
    makeTraversalStep(graph, "dfs", stack, visitOrder, {
      phase: "idle",
      codeLine: 2,
      title: "準備 DFS Stack",
      detail: graph.start
        ? `從起點 ${graph.start} 開始；Stack 尚未保存任何 vertex。`
        : "起點不存在於 graph，無法開始 traversal。",
    }),
  ];

  if (!graph.start) {
    steps.push(
      makeTraversalStep(graph, "dfs", stack, visitOrder, {
        phase: "done",
        codeLine: 24,
        title: "DFS 結束",
        detail: "沒有有效起點，因此 visit order 為空。",
      }),
    );
    return steps;
  }

  stack.push(graph.start);
  discovered.add(graph.start);
  steps.push(
    makeTraversalStep(graph, "dfs", stack, visitOrder, {
      phase: "push-start",
      codeLine: 6,
      title: `push(${graph.start}) 並標記 discovered`,
      detail: "Stack 會優先取出最近加入的 vertex，沿一條路徑深入。",
      nodeStates: traversalNodeStates(discovered, visited, graph.start),
    }),
  );

  while (stack.length > 0) {
    const current = stack.pop()!;
    visited.add(current);
    visitOrder.push(current);
    steps.push(
      makeTraversalStep(graph, "dfs", stack, visitOrder, {
        phase: "pop",
        codeLine: 10,
        title: `pop() = ${current}`,
        detail: `進入 ${current}；接著把尚未發現的 neighbors 放到 Stack。`,
        nodeStates: traversalNodeStates(discovered, visited, current),
      }),
    );

    const neighbors = [...(graph.adjacency.get(current) ?? [])].reverse();
    for (const neighbor of neighbors) {
      const edgeId = edgeIdBetween(graph, current, neighbor);
      steps.push(
        makeTraversalStep(graph, "dfs", stack, visitOrder, {
          phase: "inspect-edge",
          codeLine: 14,
          title: `檢查 ${current} → ${neighbor}`,
          detail: discovered.has(neighbor)
            ? `${neighbor} 已 discovered，略過以避免 cycle 重複走訪。`
            : `${neighbor} 尚未 discovered，push 到 Stack。`,
          nodeStates: traversalNodeStates(discovered, visited, current),
          edgeStates: edgeId ? { [edgeId]: "active" } : undefined,
        }),
      );
      if (discovered.has(neighbor)) continue;

      discovered.add(neighbor);
      stack.push(neighbor);
      steps.push(
        makeTraversalStep(graph, "dfs", stack, visitOrder, {
          phase: "push",
          codeLine: 18,
          title: `push(${neighbor})`,
          detail: `${neighbor} 成為 Stack top，會在較早加入的候選前被處理。`,
          nodeStates: traversalNodeStates(discovered, visited, neighbor),
          edgeStates: edgeId ? { [edgeId]: "traversed" } : undefined,
        }),
      );
    }
  }

  steps.push(
    makeTraversalStep(graph, "dfs", stack, visitOrder, {
      phase: "done",
      codeLine: 24,
      title: "DFS 結束",
      detail: `從 ${graph.start} 可達的 ${visitOrder.length} 個 vertices 已處理；Stack 為空。`,
      nodeStates: traversalNodeStates(discovered, visited),
    }),
  );

  return steps;
}

export const dfsSource = `function dfs(graph: Map<string, string[]>, start: string) {
  const stack = [start];
  const discovered = new Set([start]);
  const order: string[] = [];

  while (stack.length > 0) {
    const vertex = stack.pop()!;
    order.push(vertex);
    const neighbors = graph.get(vertex) ?? [];
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const neighbor = neighbors[i];
      if (discovered.has(neighbor)) continue;
      discovered.add(neighbor);
      stack.push(neighbor);
    }
  }

  return order;
}`;

export const dfsMeta: DataStructureMeta = {
  name: "Depth-First Search",
  slug: "dfs",
  category: "data-structure",
  operations: [
    { operation: "time", time: "O(V + E)" },
    { operation: "auxiliary space", time: "O(V)" },
  ],
  space: "O(V)",
  tags: ["graph", "stack", "backtracking", "cycle"],
};
