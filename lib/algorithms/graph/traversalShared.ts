import type {
  DataStructureStep,
  GraphEdgeState,
  GraphInput,
  GraphNodeState,
} from "@/lib/types/dataStructure";

export type TraversalEdge = {
  id: string;
  from: string;
  to: string;
};

export type PreparedGraph = {
  nodes: string[];
  edges: TraversalEdge[];
  adjacency: Map<string, string[]>;
  directed: boolean;
  start: string | undefined;
};

export function prepareGraph(input: GraphInput): PreparedGraph {
  const nodes = [...new Set(input.nodes)];
  const validNodes = new Set(nodes);
  const directed = input.directed ?? false;
  const edges: TraversalEdge[] = [];
  const seen = new Set<string>();
  const adjacency = new Map(nodes.map((node) => [node, [] as string[]]));

  for (const [from, to] of input.edges) {
    if (!validNodes.has(from) || !validNodes.has(to)) continue;
    const key = directed ? `${from}->${to}` : [from, to].sort().join("--");
    if (seen.has(key)) continue;
    seen.add(key);
    const edge = { id: `edge-${edges.length}-${from}-${to}`, from, to };
    edges.push(edge);
    adjacency.get(from)!.push(to);
    if (!directed && from !== to) adjacency.get(to)!.push(from);
  }

  return {
    nodes,
    edges,
    adjacency,
    directed,
    start: validNodes.has(input.start) ? input.start : undefined,
  };
}

function nodePositions(nodes: string[]) {
  return nodes.map((label, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / Math.max(nodes.length, 1);
    return {
      id: label,
      label,
      x: 300 + Math.cos(angle) * 205,
      y: 155 + Math.sin(angle) * 105,
    };
  });
}

export function edgeIdBetween(
  graph: PreparedGraph,
  from: string,
  to: string,
): string | undefined {
  return graph.edges.find(
    (edge) =>
      (edge.from === from && edge.to === to) ||
      (!graph.directed && edge.from === to && edge.to === from),
  )?.id;
}

export function makeTraversalStep(
  graph: PreparedGraph,
  mode: "bfs" | "dfs",
  frontier: string[],
  visitOrder: string[],
  config: Omit<DataStructureStep, "view"> & {
    nodeStates?: Record<string, GraphNodeState>;
    edgeStates?: Record<string, GraphEdgeState>;
  },
): DataStructureStep {
  const { nodeStates = {}, edgeStates = {}, ...step } = config;
  return {
    ...step,
    view: {
      kind: "graph",
      mode,
      nodes: nodePositions(graph.nodes).map((node) => ({
        ...node,
        state: nodeStates[node.id] ?? "idle",
      })),
      edges: graph.edges.map((edge) => ({
        ...edge,
        directed: graph.directed,
        state: edgeStates[edge.id] ?? "idle",
      })),
      adjacency: graph.nodes.map((node) => ({
        node,
        neighbors: [...(graph.adjacency.get(node) ?? [])],
      })),
      frontier: [...frontier],
      visitOrder: [...visitOrder],
    },
  };
}

export function traversalNodeStates(
  discovered: Set<string>,
  visited: Set<string>,
  active?: string,
): Record<string, GraphNodeState> {
  return Object.fromEntries(
    [...discovered].map((node) => [
      node,
      node === active
        ? "active"
        : visited.has(node)
          ? "visited"
          : "discovered",
    ]),
  );
}
