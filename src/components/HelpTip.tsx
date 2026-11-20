"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

interface HelpTipProps {
  label: string;
  title?: string;
  children: ReactNode;
  align?: "left" | "center" | "right";
  side?: "top" | "bottom";
  widthClass?: string;
}

export function HelpTip({
  label,
  title,
  children,
  align = "left",
  side = "bottom",
  widthClass = "w-60 sm:w-64 max-w-[min(17rem,calc(100vw-2rem))]",
}: HelpTipProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();

  const open = hovered || focused || pinned;

  useEffect(() => {
    if (!pinned) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setPinned(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPinned(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  const posSide = side === "top" ? "bottom-full pb-2" : "top-full pt-2";
  const posAlign =
    align === "right"
      ? "right-0"
      : align === "center"
        ? "left-1/2 -translate-x-1/2"
        : "left-0";

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex items-center align-middle"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setPinned((p) => !p);
        }}
        className={`inline-flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border text-[0.68rem] font-semibold leading-none transition-colors cursor-pointer ${
          open
            ? "border-[rgba(34,211,238,0.55)] bg-[rgba(34,211,238,0.14)] text-white"
            : "border-[var(--color-rule-strong)] bg-[rgba(255,255,255,0.04)] text-[var(--color-mute)] hover:border-[rgba(34,211,238,0.45)] hover:text-white"
        }`}
      >
        ?
      </button>

      {open && (
        <span
          id={tipId}
          role="tooltip"
          className={`absolute z-40 ${posSide} ${posAlign} ${widthClass} text-left whitespace-normal break-words`}
        >
          <span className="block rounded-xl border border-[rgba(255,255,255,0.16)] bg-[#141720] px-4 py-3 text-sm font-normal normal-case tracking-normal leading-relaxed whitespace-normal break-words text-[var(--color-secondary)] shadow-[0_14px_34px_-10px_rgba(0,0,0,0.85)]">
            {title && (
              <span className="block font-medium text-white mb-1">{title}</span>
            )}
            <span className="block">{children}</span>
          </span>
        </span>
      )}
    </span>
  );
}
