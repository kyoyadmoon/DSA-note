import type {
  DataStructureMeta,
  DataStructureStep,
  GraphInput,
} from "@/lib/types/dataStructure";
import {
  edgeIdBetween,
  edgeWeightBetween,
  makeTraversalStep,
  prepareGraph,
  traversalNodeStates,
} from "./traversalShared";

type Candidate = {
  node: string;
  distance: number;
};

function distanceBadges(
  nodes: string[],
  distance: Map<string, number>,
): Record<string, string> {
  return Object.fromEntries(
    nodes.map((node) => [
      node,
      Number.isFinite(distance.get(node)) ? `d=${distance.get(node)}` : "d=∞",
    ]),
  );
}

function frontierLabels(queue: Candidate[]): string[] {
  return [...queue]
    .sort((a, b) => a.distance - b.distance)
    .map((candidate) => `${candidate.node}:${candidate.distance}`);
}

function popMinimum(queue: Candidate[]): Candidate {
  let minimumIndex = 0;
  for (let index = 1; index < queue.length; index += 1) {
    if (queue[index].distance < queue[minimumIndex].distance) {
      minimumIndex = index;
    }
  }
  return queue.splice(minimumIndex, 1)[0];
}

export function dijkstraSteps(input: GraphInput): DataStructureStep[] {
  const graph = prepareGraph(input);
  const distance = new Map(graph.nodes.map((node) => [node, Infinity]));
  const parent = new Map<string, string | null>();
  const queue: Candidate[] = [];
  const discovered = new Set<string>();
  const settled = new Set<string>();
  const visitOrder: string[] = [];
  const steps: DataStructureStep[] = [
    makeTraversalStep(graph, "dijkstra", [], visitOrder, {
      phase: "initialize",
      codeLine: 3,
      title: "初始化所有 distances 為 ∞",
      detail: graph.start
        ? `起點 ${graph.start} 的 distance 接著設為 0。`
        : "起點不存在於 graph，無法開始 shortest-path search。",
      nodeBadges: distanceBadges(graph.nodes, distance),
    }),
  ];

  const negativeEdge = graph.edges.find((edge) => edge.weight < 0);
  if (negativeEdge) {
    steps.push(
      makeTraversalStep(graph, "dijkstra", [], visitOrder, {
        phase: "invalid-negative-edge",
        codeLine: 5,
        title: "Dijkstra 不接受負權 edge",
        detail: `${negativeEdge.from} → ${negativeEdge.to} 的 weight = ${negativeEdge.weight}；應改用 Bellman–Ford 等方法。`,
        edgeStates: { [negativeEdge.id]: "active" },
        nodeBadges: distanceBadges(graph.nodes, distance),
      }),
    );
    return steps;
  }

  if (!graph.start) return steps;

  distance.set(graph.start, 0);
  parent.set(graph.start, null);
  discovered.add(graph.start);
  queue.push({ node: graph.start, distance: 0 });
  steps.push(
    makeTraversalStep(graph, "dijkstra", frontierLabels(queue), visitOrder, {
      phase: "enqueue-start",
      codeLine: 8,
      title: `push(${graph.start}, 0)`,
      detail: "Priority Queue 依 tentative distance 取出最小候選。",
      nodeStates: traversalNodeStates(discovered, settled, graph.start),
      nodeBadges: distanceBadges(graph.nodes, distance),
    }),
  );

  while (queue.length > 0) {
    const candidate = popMinimum(queue);
    if (candidate.distance !== distance.get(candidate.node)) {
      steps.push(
        makeTraversalStep(graph, "dijkstra", frontierLabels(queue), visitOrder, {
          phase: "stale",
          codeLine: 13,
          title: `略過 stale entry ${candidate.node}:${candidate.distance}`,
          detail: `目前最佳 distance[${candidate.node}] = ${distance.get(candidate.node)}，舊候選不再展開。`,
          nodeStates: traversalNodeStates(discovered, settled, candidate.node),
          nodeBadges: distanceBadges(graph.nodes, distance),
        }),
      );
      continue;
    }
    if (settled.has(candidate.node)) continue;

    settled.add(candidate.node);
    visitOrder.push(candidate.node);
    steps.push(
      makeTraversalStep(graph, "dijkstra", frontierLabels(queue), visitOrder, {
        phase: "settle",
        codeLine: 15,
        title: `settle ${candidate.node}，distance = ${candidate.distance}`,
        detail: "在所有 edge weights 非負時，Priority Queue 的最小有效候選已是最終最短距離。",
        nodeStates: traversalNodeStates(discovered, settled, candidate.node),
        nodeBadges: distanceBadges(graph.nodes, distance),
      }),
    );

    for (const neighbor of graph.adjacency.get(candidate.node) ?? []) {
      const weight = edgeWeightBetween(graph, candidate.node, neighbor)!;
      const edgeId = edgeIdBetween(graph, candidate.node, neighbor);
      const nextDistance = candidate.distance + weight;
      const currentDistance = distance.get(neighbor)!;
      steps.push(
        makeTraversalStep(graph, "dijkstra", frontierLabels(queue), visitOrder, {
          phase: "relax-check",
          codeLine: 19,
          title: `relax ${candidate.node} → ${neighbor}`,
          detail: `${candidate.distance} + ${weight} = ${nextDistance} ${nextDistance < currentDistance ? "<" : "≥"} ${Number.isFinite(currentDistance) ? currentDistance : "∞"}。`,
          nodeStates: traversalNodeStates(discovered, settled, neighbor),
          nodeBadges: distanceBadges(graph.nodes, distance),
          edgeStates: edgeId ? { [edgeId]: "active" } : undefined,
        }),
      );
      if (nextDistance >= currentDistance) continue;

      distance.set(neighbor, nextDistance);
      parent.set(neighbor, candidate.node);
      discovered.add(neighbor);
      queue.push({ node: neighbor, distance: nextDistance });
      steps.push(
        makeTraversalStep(graph, "dijkstra", frontierLabels(queue), visitOrder, {
          phase: "relax-update",
          codeLine: 22,
          title: `更新 distance[${neighbor}] = ${nextDistance}`,
          detail: `parent[${neighbor}] = ${candidate.node}，並把新候選加入 Priority Queue。`,
          nodeStates: traversalNodeStates(discovered, settled, neighbor),
          nodeBadges: distanceBadges(graph.nodes, distance),
          edgeStates: edgeId ? { [edgeId]: "traversed" } : undefined,
        }),
      );
    }
  }

  steps.push(
    makeTraversalStep(graph, "dijkstra", [], visitOrder, {
      phase: "done",
      codeLine: 27,
      title: "Dijkstra 完成",
      detail: `已 settle ${settled.size} 個 reachable vertices；未到達者 distance 維持 ∞。`,
      nodeStates: traversalNodeStates(discovered, settled),
      nodeBadges: distanceBadges(graph.nodes, distance),
    }),
  );

  return steps;
}

export const dijkstraSource = `function dijkstra(graph: WeightedGraph, start: string) {
  const distance = new Map(graph.nodes.map(node => [node, Infinity]));
  const parent = new Map<string, string | null>();
  const queue = new MinPriorityQueue<{ node: string; distance: number }>();

  distance.set(start, 0);
  parent.set(start, null);
  queue.push({ node: start, distance: 0 }, 0);

  while (!queue.isEmpty()) {
    const current = queue.popMin();
    if (current.distance !== distance.get(current.node)) continue;

    for (const { to, weight } of graph.neighbors(current.node)) {
      const candidate = current.distance + weight;
      if (candidate >= distance.get(to)!) continue;
      distance.set(to, candidate);
      parent.set(to, current.node);
      queue.push({ node: to, distance: candidate }, candidate);
    }
  }

  return { distance, parent };
}`;

export const dijkstraMeta: DataStructureMeta = {
  name: "Dijkstra's Shortest Path",
  slug: "dijkstra",
  category: "data-structure",
  operations: [
    { operation: "binary-heap time", time: "O((V + E) log V)" },
    { operation: "space", time: "O(V + E)" },
  ],
  space: "O(V + E)",
  tags: ["shortest-path", "priority-queue", "relaxation"],
};
