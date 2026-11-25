"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Binary, Check, Copy } from "lucide-react";
import type { HexDumpViewProps } from "./types";
import {
  buildHexRows,
  cleanHexString,
  isOffsetInRange,
  parseRawHexToBytes,
} from "@/lib/protocols/hex-utils";

export function HexDumpView({
  rawHex,
  selectedRange,
  hoveredRange,
  bytesPerRow = 16,
  activeFieldLabel,
  onSelectByteOffset,
  onHoverByteOffset,
}: HexDumpViewProps) {
  const [copied, setCopied] = useState(false);
  const [containerNarrow, setContainerNarrow] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 600;
      setContainerNarrow(w < 430);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const effectiveBytesPerRow = containerNarrow ? Math.min(bytesPerRow, 8) : bytesPerRow;
  const bytes = useMemo(() => parseRawHexToBytes(rawHex), [rawHex]);
  const rows = useMemo(
    () => buildHexRows(bytes, effectiveBytesPerRow),
    [bytes, effectiveBytesPerRow]
  );
  const activeRange = hoveredRange ?? selectedRange;

  const handleCopyHex = async () => {
    const clean = cleanHexString(rawHex);
    const formatted = clean.match(/.{1,2}/g)?.join(" ") ?? clean;
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable in restricted browser context
    }
  };

  return (
    <div className="protocol-hex-dump-container flex flex-col h-full rounded-xl border border-[var(--pe-border)] bg-[var(--pe-surface)] overflow-hidden font-mono text-xs text-[var(--pe-text)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--pe-border)] bg-[var(--pe-surface-alt)] px-3.5 py-2 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-[var(--pe-text)] font-sans whitespace-nowrap">
          <Binary size={14} className="text-[var(--pe-accent-text)] shrink-0" />
          <span>Hex Dump</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-[var(--pe-text-muted)] whitespace-nowrap">
            {bytes.length} bytes total
          </span>
          <button
            type="button"
            onClick={() => void handleCopyHex()}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--pe-border)] bg-[var(--pe-surface)] px-2 py-0.5 text-[10px] font-sans font-semibold text-[var(--pe-text-secondary)] hover:text-[var(--pe-text)] hover:border-[var(--pe-border-strong)] transition-colors"
            title="Copy raw hex bytes"
            aria-label="Copy hex bytes"
          >
            {copied ? <Check size={11} className="text-[var(--pe-green)]" /> : <Copy size={11} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Hex + ASCII Body */}
      <div
        ref={bodyRef}
        className="p-3 overflow-x-auto overflow-y-auto flex-1 max-h-[340px] select-text bg-[var(--pe-surface-inset)]/40"
      >
        <div className="min-w-fit space-y-1">
          {rows.map((row) => (
            <div
              key={row.rowOffset}
              className="flex items-center gap-3 hover:bg-[var(--pe-surface-alt)] px-1.5 py-0.5 rounded"
            >
              {/* Offset Gutter */}
              <span className="text-[var(--pe-text-muted)] w-10 shrink-0 select-none text-[11px]">
                {row.formattedOffset}
              </span>

              {/* Interactive Hex Byte Buttons */}
              <div className="flex items-center gap-1">
                {row.bytes.map((b) => {
                  const isHighlighted = isOffsetInRange(b.offset, activeRange);

                  return (
                    <button
                      key={b.offset}
                      type="button"
                      onClick={() => onSelectByteOffset?.(b.offset)}
                      onMouseEnter={() => onHoverByteOffset?.(b.offset)}
                      onMouseLeave={() => onHoverByteOffset?.(null)}
                      aria-label={`Byte ${b.offset}: ${b.hex}`}
                      aria-pressed={isHighlighted}
                      className={`px-1 py-0.5 rounded text-[11px] leading-none transition-colors cursor-pointer ${
                        isHighlighted
                          ? "bg-[var(--pe-orange)] text-white font-bold shadow-xs"
                          : "text-[var(--pe-text-secondary)] hover:bg-[var(--pe-accent-soft)] hover:text-[var(--pe-accent-text)]"
                      }`}
                      title={`Offset ${b.offset} (0x${b.offset.toString(16).padStart(2, "0")})`}
                    >
                      {b.hex}
                    </button>
                  );
                })}

                {row.bytes.length < bytesPerRow &&
                  Array.from({ length: bytesPerRow - row.bytes.length }).map((_, idx) => (
                    <span key={idx} className="px-1 text-[11px] select-none opacity-0">
                      ..
                    </span>
                  ))}
              </div>

              {/* ASCII representation */}
              <div className="flex items-center border-l border-[var(--pe-border-strong)] pl-2.5 text-[var(--pe-text-muted)] select-none text-[11px]">
                {row.bytes.map((b) => {
                  const isHighlighted = isOffsetInRange(b.offset, activeRange);

                  return (
                    <span
                      key={b.offset}
                      className={
                        isHighlighted
                          ? "bg-[var(--pe-orange-soft)] text-[var(--pe-orange)] font-bold rounded-[2px]"
                          : ""
                      }
                    >
                      {b.ascii}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Range Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-[var(--pe-border)] bg-[var(--pe-surface-alt)] px-3.5 py-1.5 text-[11px] text-[var(--pe-text-muted)]">
        {activeRange ? (
          <span className="truncate text-[var(--pe-orange)] font-semibold">
            {activeFieldLabel ? `${activeFieldLabel} · ` : ""}
            Bytes {activeRange[0]}–{activeRange[1] - 1} ({activeRange[1] - activeRange[0]} B)
          </span>
        ) : (
          <span>Click any field or hex byte to inspect offset ranges</span>
        )}
      </div>
    </div>
  );
}
