import type {
  DataStructureMeta,
  DataStructureStep,
  GraphEdgeState,
  GraphInput,
  GraphNodeState,
} from "@/lib/types/dataStructure";

type Edge = {
  id: string;
  from: string;
  to: string;
};

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

function makeStep(
  nodes: string[],
  edges: Edge[],
  directed: boolean,
  config: Omit<DataStructureStep, "view"> & {
    nodeStates?: Record<string, GraphNodeState>;
    edgeStates?: Record<string, GraphEdgeState>;
  },
): DataStructureStep {
  const { nodeStates = {}, edgeStates = {}, ...step } = config;
  const adjacency = new Map(nodes.map((node) => [node, [] as string[]]));
  for (const edge of edges) {
    adjacency.get(edge.from)?.push(edge.to);
    if (!directed && edge.from !== edge.to) adjacency.get(edge.to)?.push(edge.from);
  }

  return {
    ...step,
    view: {
      kind: "graph",
      mode: "representation",
      nodes: nodePositions(nodes).map((node) => ({
        ...node,
        state: nodeStates[node.id] ?? "idle",
      })),
      edges: edges.map((edge) => ({
        ...edge,
        directed,
        state: edgeStates[edge.id] ?? "idle",
      })),
      adjacency: nodes.map((node) => ({
        node,
        neighbors: [...(adjacency.get(node) ?? [])],
      })),
      frontier: [],
      visitOrder: [],
    },
  };
}

export function graphRepresentationSteps(input: GraphInput): DataStructureStep[] {
  const nodes = [...new Set(input.nodes)];
  const validNodes = new Set(nodes);
  const directed = input.directed ?? false;
  const edges: Edge[] = [];
  const seen = new Set<string>();
  const steps: DataStructureStep[] = [
    makeStep(nodes, edges, directed, {
      phase: "vertices",
      codeLine: 3,
      title: `建立 ${nodes.length} 個 vertices`,
      detail: "每個 vertex 先有一個空的 adjacency list。",
      nodeStates: Object.fromEntries(nodes.map((node) => [node, "discovered"])),
    }),
  ];

  for (const [from, to] of input.edges) {
    if (!validNodes.has(from) || !validNodes.has(to)) continue;
    const key = directed
      ? `${from}->${to}`
      : [from, to].sort().join("--");
    if (seen.has(key)) continue;
    seen.add(key);

    const edge = { id: `edge-${edges.length}-${from}-${to}`, from, to };
    edges.push(edge);
    steps.push(
      makeStep(nodes, edges, directed, {
        phase: "add-edge",
        codeLine: directed ? 9 : 10,
        title: `加入 ${from} ${directed ? "→" : "—"} ${to}`,
        detail: directed
          ? `只把 ${to} 加入 adjacency[${from}]。`
          : `無向邊要同時更新 adjacency[${from}] 與 adjacency[${to}]。`,
        nodeStates: { [from]: "active", [to]: "active" },
        edgeStates: { [edge.id]: "active" },
      }),
    );
  }

  const focus = nodes[0];
  if (focus !== undefined) {
    steps.push(
      makeStep(nodes, edges, directed, {
        phase: "neighbors",
        codeLine: 15,
        title: `讀取 neighbors(${focus})`,
        detail: `Adjacency list 只走訪 ${focus} 的鄰居，成本與 degree(${focus}) 成正比。`,
        nodeStates: { [focus]: "active" },
        edgeStates: Object.fromEntries(
          edges
            .filter((edge) => edge.from === focus || (!directed && edge.to === focus))
            .map((edge) => [edge.id, "traversed"]),
        ),
      }),
    );
  }

  steps.push(
    makeStep(nodes, edges, directed, {
      phase: "done",
      codeLine: 17,
      title: "Graph representation 完成",
      detail: `V = ${nodes.length}、E = ${edges.length}；目前使用 ${directed ? "directed" : "undirected"} adjacency list。`,
    }),
  );

  return steps;
}

export const graphRepresentationSource = `class Graph {
  private adjacency = new Map<string, Set<string>>();

  addVertex(vertex: string) {
    if (!this.adjacency.has(vertex)) this.adjacency.set(vertex, new Set());
  }

  addEdge(from: string, to: string, directed = false) {
    this.addVertex(from);
    this.addVertex(to);
    this.adjacency.get(from)!.add(to);
    if (!directed) this.adjacency.get(to)!.add(from);
  }

  neighbors(vertex: string) {
    return this.adjacency.get(vertex) ?? new Set();
  }
}`;

export const graphRepresentationMeta: DataStructureMeta = {
  name: "Graph Representation",
  slug: "graph-representation",
  category: "data-structure",
  operations: [
    { operation: "add vertex / edge", time: "expected O(1)" },
    { operation: "list neighbors", time: "O(deg(v))" },
    { operation: "space", time: "O(V + E)" },
  ],
  space: "O(V + E)",
  tags: ["graph", "adjacency-list", "adjacency-matrix"],
};
