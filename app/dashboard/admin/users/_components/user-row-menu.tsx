"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type MenuItem =
  | {
      kind: "button";
      label: string;
      onClick: () => void;
      variant?: "default" | "danger";
    }
  | { kind: "separator" };

type MenuPosition = {
  top: number;
  left: number;
  placement: "below" | "above";
};

const MENU_WIDTH = 180;
const MENU_GAP = 4;
const ESTIMATED_ITEM_HEIGHT = 32;
const MENU_PADDING = 8;
const VIEWPORT_MARGIN = 8;

function estimateMenuHeight(items: MenuItem[]) {
  let h = MENU_PADDING * 2;
  for (const item of items) {
    h += item.kind === "separator" ? 9 : ESTIMATED_ITEM_HEIGHT;
  }
  return h;
}

export function UserRowMenu({ items, label }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const computePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const estimatedHeight = estimateMenuHeight(items);

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const placement: "below" | "above" =
      spaceBelow >= estimatedHeight + MENU_GAP + VIEWPORT_MARGIN
        ? "below"
        : spaceAbove > spaceBelow
          ? "above"
          : "below";

    const top =
      placement === "below"
        ? rect.bottom + MENU_GAP
        : rect.top - MENU_GAP - estimatedHeight;

    const rawLeft = rect.right - MENU_WIDTH;
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(rawLeft, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN),
    );

    setPosition({ top, left, placement });
  }, [items]);

  useLayoutEffect(() => {
    if (!open) return;
    computePosition();
  }, [open, computePosition]);

  useEffect(() => {
    if (!open) return;

    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    }
    function onReposition() {
      computePosition();
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, computePosition]);

  if (items.length === 0) {
    return null;
  }

  const menuNode =
    open && position ? (
      <div
        ref={menuRef}
        role="menu"
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          width: MENU_WIDTH,
          zIndex: 50,
        }}
        className="rounded-lg border border-zinc-800 bg-zinc-950 p-1 shadow-xl"
      >
        {items.map((item, i) => {
          if (item.kind === "separator") {
            return <div key={`sep-${i}`} className="my-1 h-px bg-zinc-800" />;
          }
          const isDanger = item.variant === "danger";
          return (
            <button
              key={item.label}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`block w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                isDanger
                  ? "text-red-300 hover:bg-red-950/40"
                  : "text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label ?? "Actions"}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-700"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {mounted && menuNode ? createPortal(menuNode, document.body) : null}
    </>
  );
}
