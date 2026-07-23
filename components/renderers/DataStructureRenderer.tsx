"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Legend } from "@/components/visualizer/Legend";
import type {
  DataStructureStep,
  DynamicArrayView,
  HashEntryState,
  HashTableView,
  HeapNodeState,
  HeapView,
  GraphNodeState,
  GraphView,
  LinearCollectionItemState,
  LinearCollectionView,
  MonotonicItemState,
  MonotonicStackView,
  LinkedListNodeState,
  LinkedListView,
  StructureSlotState,
  TrieNodeState,
  TrieNodeView,
  TrieView,
} from "@/lib/types/dataStructure";

type Props = {
  step: DataStructureStep;
};

const LEGEND = [
  { label: "有效元素", color: "var(--color-bar-idle)" },
  { label: "目前操作", color: "var(--color-bar-compare)" },
  { label: "複製來源", color: "var(--color-bar-pivot)" },
  { label: "複製目標", color: "var(--color-bar-sorted)" },
] as const;

function slotColor(state: StructureSlotState): string {
  switch (state) {
    case "active":
      return "var(--color-bar-compare)";
    case "copy-source":
      return "var(--color-bar-pivot)";
    case "copy-target":
      return "var(--color-bar-sorted)";
    case "empty":
      return "transparent";
    default:
      return "var(--color-bar-idle)";
  }
}

export function DataStructureRenderer({ step }: Props) {
  switch (step.view.kind) {
    case "dynamic-array":
      return <DynamicArrayRenderer view={step.view} />;
    case "linked-list":
      return <LinkedListRenderer view={step.view} />;
    case "linear-collection":
      return <LinearCollectionRenderer view={step.view} />;
    case "hash-table":
      return <HashTableRenderer view={step.view} />;
    case "binary-heap":
      return <BinaryHeapRenderer view={step.view} />;
    case "trie":
      return <TrieRenderer view={step.view} />;
    case "graph":
      return <GraphRenderer view={step.view} />;
    case "monotonic-stack":
      return <MonotonicStackRenderer view={step.view} />;
  }
}

function monotonicItemColor(state: MonotonicItemState): string {
  switch (state) {
    case "current":
      return "var(--color-bar-compare)";
    case "stacked":
      return "var(--color-bar-active)";
    case "resolved":
      return "var(--color-bar-sorted)";
    default:
      return "var(--color-bar-idle)";
  }
}

function MonotonicStackRenderer({ view }: { view: MonotonicStackView }) {
  return (
    <div className="flex h-full flex-col gap-5 overflow-auto px-6 py-8">
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-wider text-muted">input</div>
        <div className="flex min-w-max justify-center gap-1.5">
          {view.values.map((item) => (
            <div key={item.index} className="flex flex-col items-center">
              <motion.div
                animate={{
                  backgroundColor: monotonicItemColor(item.state),
                  scale: item.state === "idle" ? 1 : 1.06,
                }}
                className="flex h-12 w-12 items-center justify-center rounded-md font-mono font-semibold text-background"
              >
                {item.value}
              </motion.div>
              <span className="mt-1 font-mono text-[9px] text-muted">{item.index}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-5">
        <div className="rounded-lg border border-border bg-surface-raised/30 p-3">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-muted">decreasing stack · indices</div>
          <div className="flex min-h-20 items-center gap-2 overflow-auto">
            {view.stack.length === 0 ? (
              <span className="font-mono text-xs text-muted">empty</span>
            ) : (
              view.stack.map((index) => (
                <div key={index} className="rounded-md bg-[var(--color-bar-active)] px-3 py-2 text-center font-mono text-sm font-semibold text-background">
                  <div>{index}</div>
                  <div className="text-[9px] opacity-70">v={view.values[index].value}</div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface-raised/30 p-3">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-muted">answer</div>
          <div className="flex min-h-20 items-center gap-2 overflow-auto">
            {view.answers.map((answer, index) => (
              <div key={index} className="flex flex-col items-center font-mono">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-sm text-foreground">
                  {answer ?? "?"}
                </div>
                <span className="mt-1 text-[9px] text-muted">{index}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function graphNodeColor(state: GraphNodeState): string {
  switch (state) {
    case "active":
      return "var(--color-bar-compare)";
    case "discovered":
      return "var(--color-bar-active)";
    case "visited":
      return "var(--color-bar-sorted)";
    default:
      return "var(--color-bar-idle)";
  }
}

function GraphRenderer({ view }: { view: GraphView }) {
  const byId = new Map(view.nodes.map((node) => [node.id, node]));
  return (
    <div className="flex h-full min-w-0 flex-col gap-2 overflow-hidden p-3">
      <div className="min-h-0 flex-[3] overflow-hidden rounded-lg border border-border/60 bg-surface/50">
        {view.nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center font-mono text-sm text-muted">
            empty graph
          </div>
        ) : (
          <svg viewBox="0 0 600 310" className="h-full w-full" role="img" aria-label={`${view.mode} graph`}>
            <defs>
              <marker id="graph-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-muted)" />
              </marker>
            </defs>
            {view.edges.map((edge) => {
              const from = byId.get(edge.from);
              const to = byId.get(edge.to);
              if (!from || !to) return null;
              const active = edge.state !== "idle";
              return (
                <motion.line
                  key={edge.id}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  animate={{
                    stroke: active ? "var(--color-accent)" : "var(--color-border)",
                    strokeWidth: active ? 4 : 2,
                  }}
                  markerEnd={edge.directed ? "url(#graph-arrow)" : undefined}
                />
              );
            })}
            {view.nodes.map((node) => (
              <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
                <motion.circle
                  r="24"
                  animate={{
                    fill: graphNodeColor(node.state),
                    scale: node.state === "idle" ? 1 : 1.08,
                  }}
                />
                <text textAnchor="middle" dominantBaseline="central" className="fill-background font-mono text-sm font-bold">
                  {node.label}
                </text>
                {node.badge && (
                  <text y="39" textAnchor="middle" className="fill-muted font-mono text-[10px]">
                    {node.badge}
                  </text>
                )}
              </g>
            ))}
          </svg>
        )}
      </div>
      <div className="grid min-h-24 flex-1 grid-cols-2 gap-3 overflow-auto rounded-lg border border-border/60 bg-surface-raised/35 px-3 py-2 font-mono text-[11px]">
        <div>
          <div className="mb-1 uppercase tracking-wider text-muted">adjacency list</div>
          {view.adjacency.map((row) => (
            <div key={row.node} className="text-foreground/80">
              {row.node}: [{row.neighbors.join(", ")}]
            </div>
          ))}
        </div>
        <div>
          <div className="uppercase tracking-wider text-muted">frontier</div>
          <div className="mb-2 text-accent">[{view.frontier.join(", ")}]</div>
          <div className="uppercase tracking-wider text-muted">visit order</div>
          <div className="text-foreground/80">[{view.visitOrder.join(", ")}]</div>
        </div>
      </div>
    </div>
  );
}

function trieNodeColor(state: TrieNodeState): string {
  switch (state) {
    case "active":
      return "var(--color-bar-compare)";
    case "visited":
      return "var(--color-bar-active)";
    case "new":
    case "found":
      return "var(--color-bar-sorted)";
    default:
      return "var(--color-bar-idle)";
  }
}

function TrieRenderer({ view }: { view: TrieView }) {
  const byId = new Map(view.nodes.map((node) => [node.id, node]));
  const root = byId.get("trie-root");

  function Branch({ node }: { node: TrieNodeView }) {
    const children = node.childIds
      .map((id) => byId.get(id))
      .filter((child): child is TrieNodeView => child !== undefined);
    return (
      <div className="flex flex-col items-center">
        <motion.div
          layout
          animate={{
            backgroundColor: trieNodeColor(node.state),
            scale: node.state === "idle" ? 1 : 1.08,
          }}
          className="relative flex h-12 min-w-12 items-center justify-center rounded-full px-2 font-mono text-sm font-semibold text-background shadow-md"
        >
          {node.character || "root"}
          {node.terminal && (
            <span
              className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-surface bg-accent"
              aria-label="word ending"
            />
          )}
        </motion.div>
        <span className="mt-1 font-mono text-[9px] text-muted">
          {node.path || "∅"}
        </span>
        {children.length > 0 && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-start gap-5 border-t border-border pt-3">
              {children.map((child) => (
                <Branch key={child.id} node={child} />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex h-full items-start justify-center overflow-auto px-8 py-8">
      {root && <Branch node={root} />}
      <div className="absolute left-5 top-4 font-mono text-xs text-muted">
        words {view.wordCount}
      </div>
      {view.query !== undefined && (
        <div className="absolute bottom-4 right-5 font-mono text-xs text-accent">
          query {JSON.stringify(view.query)}
        </div>
      )}
    </div>
  );
}

function heapNodeColor(state: HeapNodeState): string {
  switch (state) {
    case "active":
      return "var(--color-bar-active)";
    case "compare":
      return "var(--color-bar-compare)";
    case "swap":
      return "var(--color-bar-swap)";
    case "new":
      return "var(--color-bar-sorted)";
    default:
      return "var(--color-bar-idle)";
  }
}

function BinaryHeapRenderer({ view }: { view: HeapView }) {
  const levelCount = view.nodes.length
    ? Math.floor(Math.log2(view.nodes.length)) + 1
    : 0;

  return (
    <div className="relative flex h-full flex-col justify-center gap-5 overflow-auto px-6 py-8">
      {view.nodes.length === 0 ? (
        <div className="text-center font-mono text-sm text-muted">empty heap</div>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
          {Array.from({ length: levelCount }, (_, level) => {
            const start = 2 ** level - 1;
            const end = Math.min(2 ** (level + 1) - 1, view.nodes.length);
            return (
              <div key={level} className="flex justify-around gap-3">
                {view.nodes.slice(start, end).map((node) => (
                  <motion.div
                    key={node.id}
                    layout
                    animate={{
                      backgroundColor: heapNodeColor(node.state),
                      scale: node.state === "idle" ? 1 : 1.08,
                    }}
                    className="flex h-12 w-12 flex-col items-center justify-center rounded-full font-mono font-semibold text-background shadow-md"
                  >
                    <span>{node.value}</span>
                    <span className="text-[8px] opacity-70">i={node.index}</span>
                  </motion.div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <div className="mx-auto flex min-w-max gap-1.5 border-t border-border pt-4">
        {view.nodes.map((node) => (
          <div key={node.id} className="flex flex-col items-center">
            <motion.div
              layout
              animate={{ backgroundColor: heapNodeColor(node.state) }}
              className="flex h-10 w-12 items-center justify-center rounded-md font-mono text-sm font-semibold text-background"
            >
              {node.value}
            </motion.div>
            <span className="mt-1 font-mono text-[9px] text-muted">{node.index}</span>
          </div>
        ))}
      </div>
      <div className="absolute bottom-4 right-5 font-mono text-xs text-muted">
        output [{view.output.join(", ")}]
      </div>
    </div>
  );
}

function hashEntryColor(state: HashEntryState): string {
  switch (state) {
    case "active":
      return "var(--color-bar-compare)";
    case "new":
    case "found":
      return "var(--color-bar-sorted)";
    case "removing":
      return "var(--color-bar-swap)";
    default:
      return "var(--color-bar-idle)";
  }
}

function HashTableRenderer({ view }: { view: HashTableView }) {
  return (
    <div className="relative flex h-full items-center overflow-auto px-6 py-12">
      <div className="mx-auto grid min-w-[34rem] grid-cols-[3rem_1fr] items-stretch gap-x-3 gap-y-2">
        {view.buckets.map((bucket) => (
          <div key={bucket.index} className="contents">
            <div
              className={
                "flex items-center justify-center rounded-lg border font-mono text-sm " +
                (bucket.active
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border bg-surface-raised text-muted")
              }
            >
              {bucket.index}
            </div>
            <div
              className={
                "flex min-h-14 items-center gap-2 rounded-lg border px-2 py-1.5 " +
                (bucket.active ? "border-accent/60" : "border-border")
              }
            >
              {bucket.entries.length === 0 ? (
                <span className="px-2 font-mono text-xs text-muted">empty</span>
              ) : (
                bucket.entries.map((entry, index) => (
                  <div key={entry.id} className="flex items-center gap-2">
                    {index > 0 && <span className="font-mono text-muted">→</span>}
                    <motion.div
                      layout
                      animate={{
                        backgroundColor: hashEntryColor(entry.state),
                        scale: entry.state === "idle" ? 1 : 1.04,
                        opacity: entry.state === "removing" ? 0.65 : 1,
                      }}
                      className="rounded-md px-3 py-2 font-mono text-xs font-semibold text-background shadow-sm"
                    >
                      {entry.key}: {entry.value}
                    </motion.div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute left-5 top-4 font-mono text-xs text-muted">
        size {view.size} / capacity {view.capacity} · α {view.loadFactor.toFixed(2)}
      </div>
      {view.hashLabel && (
        <div className="absolute bottom-4 right-5 font-mono text-xs text-accent">
          {view.hashLabel}
        </div>
      )}
    </div>
  );
}

function linearItemColor(state: LinearCollectionItemState): string {
  switch (state) {
    case "active":
      return "var(--color-bar-compare)";
    case "new":
      return "var(--color-bar-sorted)";
    case "removing":
      return "var(--color-bar-swap)";
    case "consumed":
      return "var(--color-surface-raised)";
    default:
      return "var(--color-bar-idle)";
  }
}

function LinearCollectionRenderer({ view }: { view: LinearCollectionView }) {
  if (view.mode === "stack") return (
    <div className="relative flex h-full items-center justify-center overflow-auto px-8 py-8">
      <div className="flex min-h-72 min-w-44 flex-col justify-end rounded-b-2xl border-x-2 border-b-2 border-border bg-surface-raised/35 px-4 pb-4 pt-12">
        {view.items.length === 0 ? (
          <div className="my-auto text-center font-mono text-sm text-muted">
            empty stack
          </div>
        ) : (
          [...view.items].reverse().map((item) => (
            <motion.div
              key={item.id}
              layout
              animate={{
                backgroundColor: linearItemColor(item.state),
                scale: item.state === "idle" ? 1 : 1.05,
                opacity: item.state === "removing" ? 0.65 : 1,
              }}
              className="relative mb-2 flex h-12 min-w-32 items-center justify-center rounded-lg font-mono text-base font-semibold text-background shadow-sm"
            >
              {item.id === view.topId && (
                <span className="absolute -right-12 font-mono text-[10px] uppercase tracking-wider text-accent">
                  top
                </span>
              )}
              {item.value}
            </motion.div>
          ))
        )}
      </div>
      <div className="absolute bottom-4 right-5 font-mono text-xs text-muted">
        output [{view.output.join(", ")}]
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full items-center overflow-auto px-8 py-10">
      <div className="mx-auto flex min-w-max items-center gap-2">
        {view.items.length === 0 ? (
          <div className="font-mono text-sm text-muted">empty {view.mode}</div>
        ) : (
          view.items.map((item, index) => (
            <div key={item.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-5 gap-2 text-[10px] uppercase tracking-wider text-accent">
                  {item.id === view.frontId && <span>front</span>}
                  {item.id === view.backId && <span>back</span>}
                </div>
                <motion.div
                  layout
                  animate={{
                    backgroundColor: linearItemColor(item.state),
                    scale: item.state === "idle" || item.state === "consumed" ? 1 : 1.06,
                    opacity: item.state === "consumed" ? 0.38 : item.state === "removing" ? 0.65 : 1,
                  }}
                  className="flex h-16 min-w-20 items-center justify-center rounded-xl border border-border px-4 font-mono text-lg font-semibold text-background shadow-sm"
                >
                  {item.value}
                </motion.div>
                <div className="mt-2 font-mono text-[10px] text-muted">
                  {index}
                </div>
              </div>
              {index < view.items.length - 1 && (
                <span className="mx-1 mt-3 font-mono text-muted">
                  {view.mode === "deque" ? "↔" : "→"}
                </span>
              )}
            </div>
          ))
        )}
      </div>
      {view.headIndex !== undefined && (
        <div className="absolute left-5 top-4 font-mono text-xs text-muted">
          head index {view.headIndex}
        </div>
      )}
      <div className="absolute bottom-4 right-5 font-mono text-xs text-muted">
        output [{view.output.join(", ")}]
      </div>
    </div>
  );
}

function linkedNodeColor(state: LinkedListNodeState): string {
  switch (state) {
    case "active":
      return "var(--color-bar-compare)";
    case "visited":
      return "var(--color-bar-active)";
    case "new":
      return "var(--color-bar-sorted)";
    case "removing":
      return "var(--color-bar-swap)";
    default:
      return "var(--color-bar-idle)";
  }
}

function LinkedListRenderer({ view }: { view: LinkedListView }) {
  if (view.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center font-mono text-sm text-muted">
        head / tail → null
      </div>
    );
  }

  return (
    <div className="flex h-full items-center overflow-auto px-8 py-10">
      <div className="mx-auto flex min-w-max items-center">
        {view.nodes.map((node, index) => {
          const next = view.nodes[index + 1];
          const activeLink =
            next &&
            ((view.activeLink?.from === node.id &&
              view.activeLink.to === next.id) ||
              (view.activeLink?.from === next.id &&
                view.activeLink.to === node.id));
          return (
            <div key={node.id} className="flex items-center">
              <div className="relative flex flex-col items-center">
                <div className="mb-2 h-5 text-[10px] uppercase tracking-wider text-accent">
                  {node.id === view.headId ? "head" : ""}
                  {node.id === view.tailId
                    ? node.id === view.headId
                      ? " / tail"
                      : "tail"
                    : ""}
                </div>
                <motion.div
                  layout
                  animate={{
                    backgroundColor: linkedNodeColor(node.state),
                    scale: node.state === "idle" ? 1 : 1.08,
                    opacity: node.state === "removing" ? 0.65 : 1,
                  }}
                  className="flex h-16 min-w-20 items-center justify-center rounded-xl border border-transparent px-4 font-mono text-lg font-semibold text-background shadow-lg"
                >
                  {node.value}
                </motion.div>
                <div className="mt-2 text-center font-mono text-[10px] leading-4 text-muted">
                  {view.doubly && (
                    <div>{node.prevId ? `prev: ${node.prevId}` : "prev: null"}</div>
                  )}
                  <div>{node.nextId ? `next: ${node.nextId}` : "next: null"}</div>
                </div>
              </div>
              {next && node.nextId === next.id && (
                <motion.div
                  animate={{
                    color: activeLink
                      ? "var(--color-accent)"
                      : "var(--color-muted)",
                    scale: activeLink ? 1.15 : 1,
                  }}
                  className="mx-3 mb-1 font-mono text-2xl"
                  aria-label={
                    view.doubly
                      ? `${node.value} and ${next.value} point to each other`
                      : `${node.value} points to ${next.value}`
                  }
                >
                  {view.doubly ? "⇄" : "→"}
                </motion.div>
              )}
            </div>
          );
        })}
        <div className="mx-3 mb-1 font-mono text-sm text-muted">null</div>
      </div>
    </div>
  );
}

function DynamicArrayRenderer({ view }: { view: DynamicArrayView }) {
  return (
    <div className="relative flex h-full flex-col justify-center gap-8 overflow-auto px-5 py-8">
      <div className="absolute right-4 top-4 flex gap-2 font-mono text-xs tabular-nums">
        <span className="rounded-full border border-border bg-surface-raised px-3 py-1 text-muted">
          size <strong className="text-foreground">{view.size}</strong>
        </span>
        <span className="rounded-full border border-border bg-surface-raised px-3 py-1 text-muted">
          capacity <strong className="text-foreground">{view.capacity}</strong>
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {view.buffers.map((buffer) => (
          <motion.div
            key={buffer.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={buffer.active ? "opacity-100" : "opacity-70"}
          >
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted">
              {buffer.label}
              {buffer.active && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-accent">
                  active
                </span>
              )}
            </div>
            <div className="flex min-w-max items-start justify-center gap-1.5">
              {buffer.slots.map((slot, index) => {
                const pointer = view.pointer?.index === index;
                return (
                  <div key={slot.id} className="flex w-14 flex-col items-center">
                    <div className="mb-1 h-5 text-[10px] font-mono text-accent">
                      {pointer ? view.pointer?.label : ""}
                    </div>
                    <motion.div
                      layout
                      animate={{
                        backgroundColor: slotColor(slot.state),
                        scale:
                          slot.state === "active" ||
                          slot.state === "copy-source" ||
                          slot.state === "copy-target"
                            ? 1.08
                            : 1,
                      }}
                      className={
                        "flex h-14 w-14 items-center justify-center rounded-lg border font-mono text-base font-semibold shadow-sm " +
                        (slot.state === "empty"
                          ? "border-dashed border-border text-muted"
                          : "border-transparent text-background")
                      }
                    >
                      {slot.value ?? "∅"}
                    </motion.div>
                    <div className="mt-1 font-mono text-[10px] text-muted">
                      {index}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <Legend
        title="Legend"
        ariaLabel="Dynamic array legend"
        className="absolute bottom-3 left-3"
        items={LEGEND.map((item) => ({
          label: item.label,
          color: item.color,
        }))}
      />
    </div>
  );
}
