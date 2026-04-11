"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Orientation = "horizontal" | "vertical";

type Props = {
  orientation: Orientation;
  firstRatio: number;
  onChange: (ratio: number) => void;
  minRatio?: number;
  maxRatio?: number;
  children: [React.ReactNode, React.ReactNode];
};

export function Splitter({
  orientation,
  firstRatio,
  onChange,
  minRatio = 0.2,
  maxRatio = 0.85,
  children,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const isHorizontal = orientation === "horizontal";

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pos = isHorizontal ? e.clientX - rect.left : e.clientY - rect.top;
      const total = isHorizontal ? rect.width : rect.height;
      if (total <= 0) return;
      const raw = pos / total;
      const clamped = Math.min(maxRatio, Math.max(minRatio, raw));
      onChange(clamped);
    },
    [minRatio, maxRatio, onChange, isHorizontal],
  );

  useEffect(() => {
    if (!dragging) return;
    const handleUp = () => setDragging(false);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handleUp);
    document.body.style.cursor = isHorizontal ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragging, handlePointerMove, isHorizontal]);

  const keyDec = isHorizontal ? "ArrowLeft" : "ArrowUp";
  const keyInc = isHorizontal ? "ArrowRight" : "ArrowDown";

  return (
    <div
      ref={containerRef}
      className={
        "flex w-full h-full " +
        (isHorizontal ? "flex-row items-stretch" : "flex-col")
      }
    >
      <div
        style={{ [isHorizontal ? "width" : "height"]: `${firstRatio * 100}%` }}
        className={isHorizontal ? "min-w-0" : "min-h-0"}
      >
        {children[0]}
      </div>
      <div
        role="separator"
        aria-orientation={isHorizontal ? "vertical" : "horizontal"}
        aria-valuenow={Math.round(firstRatio * 100)}
        tabIndex={0}
        onPointerDown={(e) => {
          e.preventDefault();
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          setDragging(true);
        }}
        onKeyDown={(e) => {
          const step = 0.03;
          if (e.key === keyDec) {
            e.preventDefault();
            onChange(Math.max(minRatio, firstRatio - step));
          } else if (e.key === keyInc) {
            e.preventDefault();
            onChange(Math.min(maxRatio, firstRatio + step));
          }
        }}
        className={
          "group relative shrink-0 flex items-center justify-center " +
          (isHorizontal ? "w-3 cursor-col-resize" : "h-3 cursor-row-resize") +
          " " +
          (dragging ? "bg-accent/20" : "hover:bg-accent/10")
        }
      >
        <div
          className={
            "absolute transition-colors " +
            (isHorizontal ? "inset-y-4 w-px" : "inset-x-4 h-px") +
            " " +
            (dragging ? "bg-accent" : "bg-border group-hover:bg-accent/60")
          }
        />
        <div
          className={
            "relative z-10 flex gap-0.5 transition-opacity " +
            (isHorizontal ? "flex-col" : "flex-row") +
            " " +
            (dragging ? "opacity-100" : "opacity-0 group-hover:opacity-100")
          }
        >
          <span className="block h-1 w-1 rounded-full bg-accent" />
          <span className="block h-1 w-1 rounded-full bg-accent" />
          <span className="block h-1 w-1 rounded-full bg-accent" />
        </div>
      </div>
      <div className={"flex-1 " + (isHorizontal ? "min-w-0" : "min-h-0")}>
        {children[1]}
      </div>
    </div>
  );
}
