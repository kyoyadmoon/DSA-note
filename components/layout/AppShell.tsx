"use client";

import { useEffect, useState } from "react";
import {
  ExpandSidebarButton,
  Sidebar,
} from "@/components/layout/Sidebar";

type Props = {
  children: React.ReactNode;
};

const SIDEBAR_STATE_KEY = "dsa:sidebar-collapsed";

export function AppShell({ children }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasLoadedSidebarState, setHasLoadedSidebarState] = useState(false);

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
      <ExpandSidebarButton
        isCollapsed={isCollapsed}
        onExpand={() => setIsCollapsed(false)}
      />
      <Sidebar
        isCollapsed={isCollapsed}
        onCollapse={() => setIsCollapsed(true)}
      />

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
