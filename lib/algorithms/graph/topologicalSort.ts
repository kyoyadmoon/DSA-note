import type {
  DataStructureMeta,
  DataStructureStep,
  GraphInput,
  GraphNodeState,
} from "@/lib/types/dataStructure";
import {
  edgeIdBetween,
  makeTraversalStep,
  prepareGraph,
} from "./traversalShared";

function inDegreeBadges(inDegree: Map<string, number>): Record<string, string> {
  return Object.fromEntries(
    [...inDegree].map(([node, degree]) => [node, `in=${degree}`]),
  );
}

function processedStates(
  nodes: string[],
  processed: Set<string>,
  active?: string,
): Record<string, GraphNodeState> {
  return Object.fromEntries(
    nodes.map((node) => [
      node,
      node === active ? "active" : processed.has(node) ? "visited" : "idle",
    ]),
  );
}

export function topologicalSortSteps(input: GraphInput): DataStructureStep[] {
  const graph = prepareGraph({ ...input, directed: true });
  const inDegree = new Map(graph.nodes.map((node) => [node, 0]));
  for (const edge of graph.edges) {
    inDegree.set(edge.to, inDegree.get(edge.to)! + 1);
  }

  const queue = graph.nodes.filter((node) => inDegree.get(node) === 0);
  let head = 0;
  const order: string[] = [];
  const processed = new Set<string>();
  const steps: DataStructureStep[] = [
    makeTraversalStep(graph, "topological", queue, order, {
      phase: "count-indegree",
      codeLine: 3,
      title: "計算所有 vertices 的 in-degree",
      detail: "in-degree 表示尚未完成的 prerequisites 數量。",
      nodeBadges: inDegreeBadges(inDegree),
    }),
    makeTraversalStep(graph, "topological", queue, order, {
      phase: "enqueue-zero",
      codeLine: 7,
      title: `enqueue 所有 in-degree 0 vertices`,
      detail: queue.length
        ? `[${queue.join(", ")}] 沒有未完成 prerequisite，可以先處理。`
        : "沒有 in-degree 0 vertex；非空 graph 中這代表存在 directed cycle。",
      nodeStates: Object.fromEntries(queue.map((node) => [node, "discovered"])),
      nodeBadges: inDegreeBadges(inDegree),
    }),
  ];

  while (head < queue.length) {
    const current = queue[head++];
    order.push(current);
    processed.add(current);
    steps.push(
      makeTraversalStep(graph, "topological", queue.slice(head), order, {
        phase: "dequeue",
        codeLine: 11,
        title: `輸出 ${current}`,
        detail: `${current} 的 prerequisites 已完成；從 graph 移除它的 outgoing edges。`,
        nodeStates: processedStates(graph.nodes, processed, current),
        nodeBadges: inDegreeBadges(inDegree),
      }),
    );

    for (const neighbor of graph.adjacency.get(current) ?? []) {
      const edgeId = edgeIdBetween(graph, current, neighbor);
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
      steps.push(
        makeTraversalStep(graph, "topological", queue.slice(head), order, {
          phase: "decrement",
          codeLine: 14,
          title: `inDegree[${neighbor}] 減為 ${inDegree.get(neighbor)}`,
          detail: `Prerequisite ${current} 已完成。`,
          nodeStates: processedStates(graph.nodes, processed, neighbor),
          nodeBadges: inDegreeBadges(inDegree),
          edgeStates: edgeId ? { [edgeId]: "traversed" } : undefined,
        }),
      );

      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
        steps.push(
          makeTraversalStep(graph, "topological", queue.slice(head), order, {
            phase: "enqueue",
            codeLine: 16,
            title: `enqueue(${neighbor})`,
            detail: `${neighbor} 的所有 prerequisites 都已輸出。`,
            nodeStates: processedStates(graph.nodes, processed, neighbor),
            nodeBadges: inDegreeBadges(inDegree),
          }),
        );
      }
    }
  }

  const hasCycle = order.length !== graph.nodes.length;
  steps.push(
    makeTraversalStep(graph, "topological", [], order, {
      phase: hasCycle ? "cycle" : "done",
      codeLine: 21,
      title: hasCycle ? "偵測到 directed cycle" : "Topological Sort 完成",
      detail: hasCycle
        ? `只輸出 ${order.length} / ${graph.nodes.length} 個 vertices；剩餘 vertices 的 in-degree 無法降到 0。`
        : `輸出全部 ${order.length} 個 vertices；每條 edge 的起點都在終點之前。`,
      nodeStates: processedStates(graph.nodes, processed),
      nodeBadges: inDegreeBadges(inDegree),
    }),
  );

  return steps;
}

export const topologicalSortSource = `function topologicalSort(nodes: string[], edges: [string, string][]) {
  const graph = buildAdjacencyList(nodes, edges);
  const inDegree = new Map(nodes.map(node => [node, 0]));
  for (const [, to] of edges) inDegree.set(to, inDegree.get(to)! + 1);

  const queue = nodes.filter(node => inDegree.get(node) === 0);
  let head = 0;
  const order: string[] = [];

  while (head < queue.length) {
    const node = queue[head++];
    order.push(node);
    for (const neighbor of graph.get(node) ?? []) {
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
      if (inDegree.get(neighbor) === 0) queue.push(neighbor);
    }
  }

  return order.length === nodes.length ? order : null;
}`;

export const topologicalSortMeta: DataStructureMeta = {
  name: "Topological Sort · Kahn's Algorithm",
  slug: "topological-sort",
  category: "data-structure",
  operations: [
    { operation: "time", time: "O(V + E)" },
    { operation: "auxiliary space", time: "O(V)" },
  ],
  space: "O(V)",
  tags: ["dag", "indegree", "prerequisite"],
};
