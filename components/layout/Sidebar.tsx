"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const DATA_STRUCTURE_LINKS = [
  { href: "/data-structures/dynamic-array", label: "Dynamic Array" },
  { href: "/data-structures/singly-linked-list", label: "Singly Linked List" },
  { href: "/data-structures/doubly-linked-list", label: "Doubly Linked List" },
  { href: "/data-structures/stack", label: "Stack" },
  { href: "/data-structures/monotonic-stack", label: "Monotonic Stack" },
  { href: "/data-structures/queue", label: "Queue" },
  { href: "/data-structures/deque", label: "Deque" },
  { href: "/data-structures/hash-table", label: "Hash Table" },
  { href: "/data-structures/binary-heap", label: "Binary Heap / Priority Queue" },
  { href: "/data-structures/trie", label: "Trie / Prefix Tree" },
  { href: "/data-structures/graph-representation", label: "Graph Representation" },
] as const;

const TREE_LINKS = [
  { href: "/tree/bst-insert", label: "BST Insertion" },
  { href: "/tree/tree-lca", label: "最近公共祖先" },
  { href: "/tree/tree-preorder", label: "前序走訪" },
  { href: "/tree/tree-level-order", label: "層序走訪" },
  { href: "/tree/tree-postorder", label: "後序走訪" },
  { href: "/tree/tree-inorder", label: "中序走訪" },
  { href: "/tree/tree-max-depth", label: "最大深度" },
  { href: "/tree/tree-diameter", label: "二元樹直徑" },
  { href: "/tree/tree-invert", label: "翻轉樹" },
  { href: "/tree/tree-symmetric", label: "對稱樹" },
  { href: "/tree/tree-path-sum", label: "路徑總和" },
] as const;

const SORTING_LINKS = [
  { href: "/sorting", label: "Sorting overview" },
  { href: "/sorting/bubble-sort", label: "Bubble sort" },
  { href: "/sorting/selection-sort", label: "Selection sort" },
  { href: "/sorting/insertion-sort", label: "Insertion sort" },
  { href: "/sorting/quick-sort", label: "Quick sort" },
  { href: "/sorting/merge-sort", label: "Merge sort" },
  { href: "/sorting/heap-sort", label: "Heap sort" },
] as const;

const GRAPH_LINKS = [
  { href: "/graph/bfs", label: "Breadth-First Search" },
  { href: "/graph/dfs", label: "Depth-First Search" },
  { href: "/graph/topological-sort", label: "Topological Sort" },
  { href: "/graph/dijkstra", label: "Dijkstra Shortest Path" },
  { href: "/graph/uf-quick-find", label: "Quick Find" },
  { href: "/graph/uf-quick-union", label: "Quick Union" },
  { href: "/graph/uf-weighted-quick-union", label: "Weighted Quick Union" },
  { href: "/graph/uf-path-compression", label: "+ Path Compression" },
] as const;

const NAV_SECTIONS = [
  { title: "Data Structures", links: DATA_STRUCTURE_LINKS },
  { title: "Sorting", links: SORTING_LINKS },
  { title: "Trees", links: TREE_LINKS },
  { title: "Graph", links: GRAPH_LINKS },
] as const;

type Props = {
  isCollapsed: boolean;
  onCollapse: () => void;
};

export function Sidebar({ isCollapsed, onCollapse }: Props) {
  const pathname = usePathname();

  return (
    <aside
      className={
        "hidden md:flex sticky top-0 self-start h-screen shrink-0 overflow-hidden bg-surface/60 transition-[width,border-color] duration-300 ease-out " +
        (isCollapsed ? "border-r border-transparent" : "border-r border-border")
      }
      style={{ width: isCollapsed ? 0 : 240 }}
    >
      <div
        className={
          "flex h-full w-60 min-w-60 flex-col gap-8 px-6 py-8 transition-opacity duration-200 " +
          (isCollapsed ? "pointer-events-none opacity-0" : "opacity-100")
        }
      >
        <div className="flex items-start justify-between gap-3">
          <Link href="/" className="block">
            <div className="font-serif text-2xl leading-none tracking-tight">
              DSA<span className="text-accent">.</span>
            </div>
            <div className="mt-1 text-xs text-muted">interactive notes</div>
          </Link>

          <button
            type="button"
            onClick={onCollapse}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/92 text-foreground/70 transition-colors hover:text-foreground hover:bg-surface-raised"
            aria-label="Collapse navigation drawer"
            aria-expanded="true"
          >
            <ChevronIcon direction="left" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1 text-sm">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="mb-2 text-[11px] uppercase tracking-widest text-muted">
                {section.title}
              </div>
              <ul className="space-y-1.5">
                {section.links.map((item) => (
                  <SidebarLink
                    key={item.href}
                    href={item.href}
                    isActive={pathname === item.href}
                  >
                    {item.label}
                  </SidebarLink>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export function ExpandSidebarButton({
  isCollapsed,
  onExpand,
}: {
  isCollapsed: boolean;
  onExpand: () => void;
}) {
  if (!isCollapsed) return null;

  return (
    <button
      type="button"
      onClick={onExpand}
      className="hidden md:flex fixed left-4 top-4 z-30 h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/92 text-foreground/80 shadow-lg backdrop-blur-sm transition-colors hover:text-foreground hover:bg-surface-raised"
      aria-label="Expand navigation drawer"
      aria-expanded="false"
    >
      <ChevronIcon direction="right" />
    </button>
  );
}

function SidebarLink({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={
          "block rounded-md px-2 py-1 transition-colors " +
          (isActive
            ? "bg-accent/15 text-accent ring-1 ring-accent/35"
            : "text-foreground/80 hover:bg-surface-raised hover:text-foreground")
        }
      >
        {children}
      </Link>
    </li>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direction === "left" ? (
        <path d="m15 18-6-6 6-6" />
      ) : (
        <path d="m9 18 6-6-6-6" />
      )}
    </svg>
  );
}
