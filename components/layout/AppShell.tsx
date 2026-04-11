"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

const SIDEBAR_STATE_KEY = "dsa:sidebar-collapsed";
const SIDEBAR_WIDTH_PX = 240;

const SORTING_LINKS = [
  { href: "/sorting/bubble-sort", label: "Bubble sort" },
  { href: "/sorting/selection-sort", label: "Selection sort" },
  { href: "/sorting/insertion-sort", label: "Insertion sort" },
  { href: "/sorting/quick-sort", label: "Quick sort" },
  { href: "/sorting/merge-sort", label: "Merge sort" },
  { href: "/sorting/heap-sort", label: "Heap sort" },
] as const;

export function AppShell({ children }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasLoadedSidebarState, setHasLoadedSidebarState] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      setIsCollapsed(window.localStorage.getItem(SIDEBAR_STATE_KEY) === "true");
    } catch {
      // ignore
    } finally {
      setHasLoadedSidebarState(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedSidebarState) return;
    try {
      window.localStorage.setItem(SIDEBAR_STATE_KEY, String(isCollapsed));
    } catch {
      // ignore
    }
  }, [hasLoadedSidebarState, isCollapsed]);

  return (
    <div className="min-h-screen md:flex">
      {isCollapsed ? (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="hidden md:flex fixed left-4 top-4 z-30 h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/92 text-foreground/80 shadow-lg backdrop-blur-sm transition-colors hover:text-foreground hover:bg-surface-raised"
          aria-label="Expand navigation drawer"
          aria-expanded="false"
        >
          <ChevronIcon direction="right" />
        </button>
      ) : null}

      <aside
        className={
          "hidden md:flex sticky top-0 self-start h-screen shrink-0 overflow-hidden bg-surface/60 transition-[width,border-color] duration-300 ease-out " +
          (isCollapsed ? "border-r border-transparent" : "border-r border-border")
        }
        style={{ width: isCollapsed ? 0 : SIDEBAR_WIDTH_PX }}
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
              onClick={() => setIsCollapsed(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/92 text-foreground/70 transition-colors hover:text-foreground hover:bg-surface-raised"
              aria-label="Collapse navigation drawer"
              aria-expanded="true"
            >
              <ChevronIcon direction="left" />
            </button>
          </div>

          <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1 text-sm">
            <div>
              <div className="mb-2 text-[11px] uppercase tracking-widest text-muted">
                Sorting
              </div>
              <ul className="space-y-1.5">
                {SORTING_LINKS.map((item) => (
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
          </nav>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
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
