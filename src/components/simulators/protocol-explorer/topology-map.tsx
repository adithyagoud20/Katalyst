"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { AlertOctagon, Focus, RotateCcw, ZoomIn, ZoomOut, X } from "lucide-react";
import type { TopologyMapProps } from "./types";
import {
  CANONICAL_SLOTS,
  DEFAULT_VIEWBOX,
  PHYSICAL_CABLES,
  interpolateLine,
  lineLength,
  resolveScenarioTopology,
  resolveStepHops,
  type CameraViewBox,
  type CanonicalSlotId,
} from "./isometric-engine";
import { IsometricDevice, IsometricPacketBadge } from "./isometric-devices";

const TRAIL_STEPS = [
  { offset: 14, r: 3.8, opacity: 0.45 },
  { offset: 26, r: 2.8, opacity: 0.3 },
  { offset: 37, r: 1.8, opacity: 0.18 },
] as const;

function getTargetCameraBox(
  activeSlotIds: Set<CanonicalSlotId>,
  isIdleInitial: boolean
): CameraViewBox {
  if (isIdleInitial || activeSlotIds.size === 0) {
    return DEFAULT_VIEWBOX;
  }
  const coords = Array.from(activeSlotIds).map((id) => CANONICAL_SLOTS[id].center);
  const minX = Math.min(...coords.map((c) => c[0])) - 175;
  const maxX = Math.max(...coords.map((c) => c[0])) + 175;
  const minY = Math.min(...coords.map((c) => c[1])) - 145;
  const maxY = Math.max(...coords.map((c) => c[1])) + 150;

  let width = Math.max(680, maxX - minX);
  let height = Math.max(width * 0.445, maxY - minY);
  width = Math.max(width, height / 0.445);
  height = width * 0.445;

  if (width >= 965) {
    return DEFAULT_VIEWBOX;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const x = Math.max(0, Math.min(1000 - width, cx - width / 2));
  const y = Math.max(0, Math.min(445 - height, cy - height / 2));
  return [x, y, width, height];
}

function getPacketColors(protocolName: string, arrowLabel: string, status?: string) {
  if (status === "dropped") {
    return { main: "#dc2626", light: "#f87171", dark: "#991b1b" };
  }
  if (status === "corrupted") {
    return { main: "#d97706", light: "#fbbf24", dark: "#92400e" };
  }
  if (status === "retransmission") {
    return { main: "#ea580c", light: "#fb923c", dark: "#9a3412" };
  }

  const p = protocolName.toUpperCase();
  if (p.includes("DNS")) {
    return { main: "#1f6fe8", light: "#60a5fa", dark: "#1e40af" };
  }
  if (p.includes("TCP")) {
    return { main: "#12a56b", light: "#4ade80", dark: "#166534" };
  }
  if (p.includes("TLS") || p.includes("SSL") || p.includes("HTTPS")) {
    return { main: "#0e95a3", light: "#22d3ee", dark: "#155e75" };
  }
  if (p.includes("QUIC") || p.includes("HTTP/3")) {
    return { main: "#ea580c", light: "#fb923c", dark: "#9a3412" };
  }
  if (p.includes("MQTT")) {
    return { main: "#db2777", light: "#f472b6", dark: "#9d174d" };
  }
  if (p.includes("WS") || p.includes("WEBSOCKET")) {
    return { main: "#7656e0", light: "#a78bfa", dark: "#5b21b6" };
  }
  if (p.includes("UDP")) {
    return { main: "#2563eb", light: "#60a5fa", dark: "#1e40af" };
  }
  if (p.includes("ICMP")) {
    return { main: "#0d9488", light: "#2dd4bf", dark: "#115e59" };
  }
  if (p.includes("HTTP")) {
    if (arrowLabel.includes("200") || arrowLabel.includes("OK") || arrowLabel.includes("101")) {
      return { main: "#7656e0", light: "#a78bfa", dark: "#5b21b6" };
    }
    return { main: "#f2ac0a", light: "#fcd34d", dark: "#b45309" };
  }
  return { main: "var(--pe-orange)", light: "var(--pe-orange-light)", dark: "var(--pe-orange-dark)" };
}

function formatPacketBadge(protocolName: string, arrowLabel: string): string {
  const upper = arrowLabel.toUpperCase();
  if (upper.startsWith("STANDARD QUERY RESPONSE")) return "DNS REPLY";
  if (upper.startsWith("STANDARD QUERY") || upper.startsWith("ITERATIVE QUERY")) return "DNS QUERY";
  if (upper.startsWith("AUTHORITATIVE ANSWER")) return "DNS ANSWER";
  if (upper.startsWith("ROOT REFERRAL")) return "TLD REFERRAL";
  if (upper.startsWith("SYN-ACK")) return "SYN-ACK";
  if (upper.startsWith("PSH-ACK")) return "PSH-ACK";
  if (upper.startsWith("FIN-ACK")) return "FIN-ACK";
  if (upper.startsWith("SYN")) return "SYN";
  if (upper.startsWith("ACK")) return "ACK";
  if (upper.startsWith("GET ")) return "GET /";
  if (upper.includes("200 OK")) return "200 OK";
  if (upper.includes("101 SWITCHING")) return "101 UPGRADE";
  if (upper.includes("500 INTERNAL")) return "500 ERROR";
  if (upper.includes("400 BAD")) return "400 REJECT";
  if (upper.startsWith("CLIENTHELLO")) return "ClientHello";
  if (upper.startsWith("SERVERHELLO")) return "ServerHello";
  if (upper.startsWith("ENCRYPTEDEXTENSIONS")) return "Cert + Finished";
  if (upper.startsWith("CLIENT FINISHED")) return "Finished";

  const shortWords = arrowLabel.replace(/\[.*?\]/g, "").trim().split(/\s+/);
  const candidate = shortWords.slice(0, 2).join(" ");
  return candidate.length > 0 ? candidate.slice(0, 18) : protocolName;
}

export function TopologyMap({
  nodes,
  currentStep,
  isPlaying,
  speed,
  scenarioId,
  stepIndex = 0,
  totalSteps = 1,
}: TopologyMapProps) {
  const uid = useId().replace(/:/g, "");
  const gridPatternId = `pe-grid-${uid}`;
  const arrowMarkerId = `pe-arrow-${uid}`;

  const topology = useMemo(() => resolveScenarioTopology(nodes), [nodes]);
  const hops = useMemo(() => {
    if (!currentStep) return [];
    return resolveStepHops(currentStep.fromNodeId, currentStep.toNodeId, topology.aliasToSlot);
  }, [currentStep, topology.aliasToSlot]);

  const activeSlotIds = useMemo(() => {
    const set = new Set<CanonicalSlotId>();
    if (!currentStep) return set;
    const fromSlot = topology.aliasToSlot[currentStep.fromNodeId.toLowerCase()];
    const toSlot = topology.aliasToSlot[currentStep.toNodeId.toLowerCase()];
    if (fromSlot) set.add(fromSlot);
    if (toSlot) set.add(toSlot);
    for (const hop of hops) {
      set.add(hop.fromSlot);
      set.add(hop.toSlot);
    }
    return set;
  }, [currentStep, hops, topology.aliasToSlot]);

  const [selectedSlot, setSelectedSlot] = useState<CanonicalSlotId | null>(null);
  const [autoFocusCamera, setAutoFocusCamera] = useState<boolean>(false);
  const [viewBox, setViewBox] = useState<CameraViewBox>(DEFAULT_VIEWBOX);

  // Packet animation + 3-dot wake trail + arrival/launch pulse ring state driven via rAF
  const [animState, setAnimState] = useState<{
    x: number;
    y: number;
    ux: number;
    uy: number;
    trailStrength: number;
    departPulse: number;
    departSlot: CanonicalSlotId | null;
    arrivePulse: number;
    arriveSlot: CanonicalSlotId | null;
    isDroppedMidway: boolean;
  }>({
    x: CANONICAL_SLOTS.client.anchor[0],
    y: CANONICAL_SLOTS.client.anchor[1],
    ux: 1,
    uy: 0,
    trailStrength: 0,
    departPulse: 0,
    departSlot: null,
    arrivePulse: 0,
    arriveSlot: null,
    isDroppedMidway: false,
  });

  const reducedMotionRef = useRef(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  }, []);

  // Smooth rAF Camera Pan/Zoom (a2aprotocol.ai dynamic viewBox transitions)
  useEffect(() => {
    if (!autoFocusCamera) return;
    const isIdleInitial = stepIndex === 0 && !isPlaying;
    const target = getTargetCameraBox(activeSlotIds, isIdleInitial);

    if (reducedMotionRef.current) {
      const raf = requestAnimationFrame(() => setViewBox(target));
      return () => cancelAnimationFrame(raf);
    }

    let rafId = 0;
    let lastTime: number | null = null;
    const stepCam = (now: number) => {
      if (lastTime === null) lastTime = now;
      const dt = Math.min(48, now - lastTime);
      lastTime = now;
      const alpha = 1 - Math.exp(-dt * 0.0085);

      let settled = false;
      setViewBox((prev) => {
        const dx = Math.abs(target[0] - prev[0]);
        const dy = Math.abs(target[1] - prev[1]);
        const dw = Math.abs(target[2] - prev[2]);
        const dh = Math.abs(target[3] - prev[3]);
        if (dx < 0.6 && dy < 0.6 && dw < 0.8 && dh < 0.8) {
          settled = true;
          return target;
        }
        return [
          prev[0] + (target[0] - prev[0]) * alpha,
          prev[1] + (target[1] - prev[1]) * alpha,
          prev[2] + (target[2] - prev[2]) * alpha,
          prev[3] + (target[3] - prev[3]) * alpha,
        ];
      });

      if (!settled) {
        rafId = requestAnimationFrame(stepCam);
      }
    };

    rafId = requestAnimationFrame(stepCam);
    return () => cancelAnimationFrame(rafId);
  }, [activeSlotIds, autoFocusCamera, isPlaying, stepIndex]);

  useEffect(() => {
    if (!currentStep || hops.length === 0) return;

    const isDropped = currentStep.status === "dropped";
    const lastHopIdx = hops.length - 1;

    // Immediate resting coordinates for reduced motion
    if (reducedMotionRef.current) {
      const targetHop = hops[lastHopIdx];
      const pos = interpolateLine(targetHop.coords, isDropped ? 0.5 : 0.94);
      const [x1, y1, x2, y2] = targetHop.coords;
      const len = Math.max(1, Math.hypot(x2 - x1, y2 - y1));
      const raf = requestAnimationFrame(() =>
        setAnimState({
          x: pos.x,
          y: pos.y,
          ux: (x2 - x1) / len,
          uy: (y2 - y1) / len,
          trailStrength: 0,
          departPulse: 0,
          departSlot: null,
          arrivePulse: 0,
          arriveSlot: null,
          isDroppedMidway: isDropped,
        })
      );
      return () => cancelAnimationFrame(raf);
    }

    let rafId = 0;
    let hopIdx = 0;
    let hopStartTime: number | null = null;
    let arriveStartTime: number | null = null;
    let dwellStartTime: number | null = null;
    const pxPerMs = 0.42 * speed;
    const rippleDuration = 480;

    const tick = (now: number) => {
      if (dwellStartTime !== null) {
        const arriveElapsed = arriveStartTime !== null ? now - arriveStartTime : rippleDuration;
        const arrivePulse = Math.min(1, arriveElapsed / rippleDuration);
        const dwellDone = now - dwellStartTime >= 440;
        const rippleDone = arriveElapsed >= rippleDuration;

        if (!dwellDone || !rippleDone) {
          const finalHop = hops[lastHopIdx];
          const [x1, y1, x2, y2] = finalHop.coords;
          const len = Math.max(1, Math.hypot(x2 - x1, y2 - y1));
          const pos = interpolateLine(finalHop.coords, 1);
          setAnimState({
            x: pos.x,
            y: pos.y,
            ux: (x2 - x1) / len,
            uy: (y2 - y1) / len,
            trailStrength: Math.max(0, 1 - arriveElapsed / 140),
            departPulse: 0,
            departSlot: null,
            arrivePulse: rippleDone ? 0 : arrivePulse,
            arriveSlot: finalHop.toSlot,
            isDroppedMidway: false,
          });
          rafId = requestAnimationFrame(tick);
          return;
        }

        if (!isPlaying) {
          return;
        }
        dwellStartTime = null;
        arriveStartTime = null;
        hopIdx = 0;
        hopStartTime = now;
      }

      if (hopStartTime === null) hopStartTime = now;
      const hop = hops[hopIdx];
      const [x1, y1, x2, y2] = hop.coords;
      const len = Math.max(1, lineLength(hop.coords));
      const ux = (x2 - x1) / len;
      const uy = (y2 - y1) / len;

      const duration = Math.max(220, len / pxPerMs);
      const rawT = Math.min(1, (now - hopStartTime) / duration);
      const stopAtEnd = isDropped && hopIdx === lastHopIdx;
      const clampedT = stopAtEnd ? Math.min(0.5, rawT) : rawT;

      const pos = interpolateLine(hop.coords, clampedT);
      const departPulse = hopIdx === 0 && rawT < 0.72 ? Math.min(1, rawT / 0.72) : 0;

      setAnimState({
        x: pos.x,
        y: pos.y,
        ux,
        uy,
        trailStrength: stopAtEnd && clampedT >= 0.49 ? 0 : Math.min(1, rawT * 4),
        departPulse,
        departSlot: hop.fromSlot,
        arrivePulse: 0,
        arriveSlot: null,
        isDroppedMidway: stopAtEnd && clampedT >= 0.49,
      });

      if (rawT >= 1) {
        if (stopAtEnd) {
          return;
        }
        if (hopIdx < lastHopIdx) {
          hopIdx += 1;
          hopStartTime = now;
          rafId = requestAnimationFrame(tick);
        } else {
          arriveStartTime = now;
          dwellStartTime = now;
          rafId = requestAnimationFrame(tick);
        }
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [currentStep, hops, isPlaying, speed]);

  const packetColors = useMemo(
    () =>
      currentStep
        ? getPacketColors(currentStep.protocolName, currentStep.arrowLabel, currentStep.status)
        : { main: "var(--pe-orange)", light: "var(--pe-orange-light)", dark: "var(--pe-orange-dark)" },
    [currentStep]
  );

  const packetLabel = useMemo(
    () =>
      currentStep ? formatPacketBadge(currentStep.protocolName, currentStep.arrowLabel) : "PACKET",
    [currentStep]
  );

  const isEncryptedPacket = useMemo(() => {
    if (!currentStep) return false;
    const p = currentStep.protocolName.toUpperCase();
    const l = currentStep.arrowLabel.toUpperCase();
    return (
      p.includes("TLS") ||
      p.includes("HTTPS") ||
      p.includes("QUIC") ||
      l.includes("ENCRYPTED") ||
      l.includes("APPLICATION DATA") ||
      l.includes("FINISHED")
    );
  }, [currentStep]);

  const urlBarState = useMemo(() => {
    const webScenarios = new Set([
      "http-exchange",
      "https-exchange",
      "tls-handshake",
      "websocket-upgrade",
      "quic-handshake",
      "dns-lookup",
    ]);
    if (!scenarioId || !webScenarios.has(scenarioId) || !currentStep) {
      return null;
    }
    const isSecure =
      scenarioId === "https-exchange" ||
      scenarioId === "tls-handshake" ||
      scenarioId === "quic-handshake" ||
      scenarioId === "websocket-upgrade";
    const urlText =
      scenarioId === "dns-lookup"
        ? "dns://katalyst.dev"
        : scenarioId === "websocket-upgrade"
        ? "wss://katalyst.dev/ws"
        : isSecure
        ? "https://katalyst.dev"
        : "http://katalyst.dev";
    const upperArrow = currentStep.arrowLabel.toUpperCase();
    const isLoaded =
      (totalSteps > 1 && stepIndex >= totalSteps - 1) ||
      upperArrow.includes("200 OK") ||
      upperArrow.includes("101") ||
      upperArrow.includes("RESPONSE A =");
    return {
      urlText,
      isSecure,
      isLoaded,
      isDropped: currentStep.status === "dropped",
    };
  }, [currentStep, scenarioId, stepIndex, totalSteps]);

  // Clamp pill horizontal offset near left/right viewBox boundaries
  const pillClamp = useMemo(() => {
    if (animState.x < 104) return 104 - animState.x;
    if (animState.x > 896) return 896 - animState.x;
    return 0;
  }, [animState.x]);

  const handleZoom = (factor: number) => {
    setAutoFocusCamera(false);
    setViewBox((prev) => {
      const nextW = Math.max(460, Math.min(1000, prev[2] * factor));
      const nextH = (nextW * 445) / 1000;
      const cx = prev[0] + prev[2] / 2;
      const cy = prev[1] + prev[3] / 2;
      const clampedX = Math.max(0, Math.min(1000 - nextW, cx - nextW / 2));
      const clampedY = Math.max(0, Math.min(445 - nextH, cy - nextH / 2));
      return [clampedX, clampedY, nextW, nextH];
    });
  };

  const isZoomed = Math.abs(viewBox[2] - 1000) > 4;
  const inspectedSlot = selectedSlot ? topology.slots[selectedSlot] : null;
  const activeStrokeColor =
    currentStep?.status === "dropped" ? "var(--pe-danger)" : packetColors.main;

  return (
    <div className="protocol-topology-canvas relative w-full overflow-hidden rounded-xl border border-[var(--pe-border)] bg-[var(--pe-surface)]">
      <svg
        viewBox={`${viewBox[0].toFixed(2)} ${viewBox[1].toFixed(2)} ${viewBox[2].toFixed(2)} ${viewBox[3].toFixed(2)}`}
        className="lab-network block w-full h-auto select-none"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Network Topology Map"
      >
        <defs>
          <pattern id={gridPatternId} width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.85" fill="var(--pe-grid-dot)" />
          </pattern>
          <marker
            id={arrowMarkerId}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path
              d="m1 1 5 3-5 3"
              fill="none"
              stroke={activeStrokeColor}
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>

        {/* Architectural Dot-Matrix Grid */}
        <rect width="1000" height="445" fill={`url(#${gridPatternId})`} />

        {/* Physical Network Cables: Idle dashed tracks + directional animated active flow */}
        <g>
          {PHYSICAL_CABLES.map((cable) => {
            const [x1, y1, x2, y2] = cable.coords;
            return (
              <path
                key={cable.id}
                d={`M${x1} ${y1} L${x2} ${y2}`}
                className="pe-lane is-idle"
                stroke="var(--pe-cable-idle)"
                strokeWidth="1.5"
                strokeDasharray="5 5"
                strokeLinecap="round"
                fill="none"
              />
            );
          })}

          {hops.map((hop) => {
            const [x1, y1, x2, y2] = hop.coords;
            return (
              <path
                key={`active-lane-${hop.key}`}
                d={`M${x1} ${y1} L${x2} ${y2}`}
                className="pe-lane is-active"
                stroke={activeStrokeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                markerEnd={`url(#${arrowMarkerId})`}
              />
            );
          })}
        </g>

        {/* Expanding Departure & Arrival Ripple Rings (a2aprotocol.ai pulse-layer) */}
        <g className="pointer-events-none">
          {animState.departSlot && animState.departPulse > 0 && animState.departPulse < 1 && (
            <circle
              cx={CANONICAL_SLOTS[animState.departSlot].center[0]}
              cy={CANONICAL_SLOTS[animState.departSlot].center[1] + 10}
              r={14 + animState.departPulse * 42}
              fill="none"
              stroke={activeStrokeColor}
              strokeWidth="2.2"
              opacity={(1 - animState.departPulse) * 0.72}
            />
          )}
          {animState.arriveSlot && animState.arrivePulse > 0 && animState.arrivePulse < 1 && (
            <>
              <circle
                cx={CANONICAL_SLOTS[animState.arriveSlot].center[0]}
                cy={CANONICAL_SLOTS[animState.arriveSlot].center[1] + 10}
                r={14 + animState.arrivePulse * 44}
                fill="none"
                stroke={activeStrokeColor}
                strokeWidth="2.4"
                opacity={(1 - animState.arrivePulse) * 0.85}
              />
              <circle
                cx={CANONICAL_SLOTS[animState.arriveSlot].center[0]}
                cy={CANONICAL_SLOTS[animState.arriveSlot].center[1] + 10}
                r={10 + animState.arrivePulse * 26}
                fill="none"
                stroke={activeStrokeColor}
                strokeWidth="1.6"
                opacity={(1 - animState.arrivePulse) * 0.5}
              />
            </>
          )}
        </g>

        {/* Canonical 5 Isometric Nodes */}
        <g>
          {(Object.keys(CANONICAL_SLOTS) as CanonicalSlotId[]).map((slotId) => {
            const geom = CANONICAL_SLOTS[slotId];
            const node = topology.slots[slotId];
            const hasStep = activeSlotIds.size > 0;
            const isActive = activeSlotIds.has(slotId);
            const isPending = hasStep && !isActive && slotId !== "router" && slotId !== "internet";
            const isSelected = selectedSlot === slotId;

            const hasParenSubtitle = node.label.length > 22 && node.label.includes(" (");
            const parenIdx = hasParenSubtitle ? node.label.indexOf(" (") : -1;
            const primaryLabel =
              parenIdx > 0
                ? node.label.slice(0, parenIdx)
                : node.label.length > 26
                ? `${node.label.slice(0, 24)}…`
                : node.label;
            const secondaryLabel = parenIdx > 0 ? node.label.slice(parenIdx + 1) : null;

            return (
              <g
                key={slotId}
                transform={`translate(${geom.center[0]} ${geom.center[1]})`}
                className={`pe-node cursor-pointer ${isPending ? "is-pending" : ""}`}
                opacity={isPending ? 0.42 : 1}
                onClick={() => setSelectedSlot((curr) => (curr === slotId ? null : slotId))}
              >
                <title>{`${node.label}${node.ip ? ` (${node.ip})` : ""}`}</title>
                {isSelected && (
                  <ellipse
                    cx="0"
                    cy="45"
                    rx="74"
                    ry="16"
                    fill="none"
                    stroke="var(--pe-accent)"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                )}
                <g transform="scale(0.78)">
                  <IsometricDevice
                    kind={node.deviceKind}
                    isActive={isActive || isSelected}
                    isLoaded={slotId === "client" && Boolean(urlBarState?.isLoaded)}
                  />
                </g>
                <text
                  y="74"
                  textAnchor="middle"
                  fill="var(--pe-text)"
                  fontSize="13"
                  fontWeight="600"
                  fontFamily="var(--font-geist), system-ui, sans-serif"
                >
                  {primaryLabel}
                </text>
                {secondaryLabel && (
                  <text
                    y="89"
                    textAnchor="middle"
                    fill="var(--pe-text-secondary)"
                    fontSize="11"
                    fontWeight="500"
                    fontFamily="var(--font-geist), system-ui, sans-serif"
                  >
                    {secondaryLabel}
                  </text>
                )}
                {node.ip && (
                  <text
                    y={secondaryLabel ? "105" : "92"}
                    textAnchor="middle"
                    fill="var(--pe-text-muted)"
                    fontSize="11"
                    fontFamily="var(--font-jetbrains-mono), ui-monospace, monospace"
                  >
                    {node.ip}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Browser URL Bar Callout over Client Laptop (a2aprotocol.ai signature) */}
        {urlBarState && !inspectedSlot && (!isZoomed || viewBox[0] < 30) && (
          <g className="pe-url-bar pointer-events-none">
            <path
              d="M115 112 L115 74"
              stroke="var(--pe-border-strong)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <rect
              x="22"
              y="38"
              width="214"
              height="34"
              rx="8"
              fill="var(--pe-surface)"
              stroke={urlBarState.isLoaded ? "var(--pe-green)" : "var(--pe-accent)"}
              strokeWidth="1.4"
            />
            {urlBarState.isSecure ? (
              <g
                transform="translate(34 48)"
                fill="none"
                stroke={urlBarState.isLoaded ? "var(--pe-green)" : "var(--pe-accent-text)"}
                strokeWidth="1.6"
              >
                <rect x="0" y="5.5" width="10" height="7.5" rx="1.5" />
                <path d="M2.2 5.5V3.6a2.8 2.8 0 0 1 5.6 0v1.9" />
              </g>
            ) : (
              <circle
                cx="39"
                cy="55"
                r="4"
                fill="none"
                stroke="var(--pe-accent-text)"
                strokeWidth="1.6"
              />
            )}
            <text
              x="51"
              y="59.5"
              fill="var(--pe-text)"
              fontSize="11.5"
              fontWeight="600"
              fontFamily="var(--font-jetbrains-mono), ui-monospace, monospace"
            >
              {urlBarState.urlText}
            </text>
            {urlBarState.isLoaded && !urlBarState.isDropped ? (
              <path
                d="m213 55.5 3.5 3.5 7-7"
                fill="none"
                stroke="var(--pe-green)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                className="pe-check-path"
              />
            ) : (
              <rect
                x="206"
                y="48"
                width="2"
                height="14"
                rx="1"
                fill="var(--pe-accent)"
                className="pe-url-caret"
              />
            )}
          </g>
        )}

        {/* Moving Packet + 3-Dot Wake Trail (a2aprotocol.ai packet-layer) */}
        {currentStep && hops.length > 0 && (
          <g className="pointer-events-none">
            {animState.trailStrength > 0.04 &&
              !animState.isDroppedMidway &&
              TRAIL_STEPS.map((dot, idx) => (
                <circle
                  key={idx}
                  cx={(animState.x - animState.ux * dot.offset).toFixed(2)}
                  cy={(animState.y - animState.uy * dot.offset).toFixed(2)}
                  r={dot.r}
                  fill={packetColors.main}
                  opacity={dot.opacity * animState.trailStrength}
                />
              ))}

            <g transform={`translate(${animState.x.toFixed(2)} ${animState.y.toFixed(2)})`}>
              {animState.isDroppedMidway ? (
                <g>
                  <circle r="15" fill="var(--pe-danger-soft)" stroke="var(--pe-danger)" strokeWidth="2" />
                  <foreignObject x="-9" y="-9" width="18" height="18" className="pointer-events-none">
                    <div className="flex h-full w-full items-center justify-center text-red-600 dark:text-red-300">
                      <AlertOctagon size={14} />
                    </div>
                  </foreignObject>
                  <g transform="translate(0, -10)">
                    <rect
                      x={-68 + pillClamp}
                      y="-38"
                      width="136"
                      height="24"
                      rx="6"
                      fill="#dc2626"
                    />
                    <text
                      x={pillClamp}
                      y="-22"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10.5"
                      fontWeight="700"
                      fontFamily="var(--font-jetbrains-mono), ui-monospace, monospace"
                    >
                      PACKET DROPPED
                    </text>
                  </g>
                </g>
              ) : (
                <IsometricPacketBadge
                  label={packetLabel}
                  colors={packetColors}
                  xOffsetClamp={pillClamp}
                  isEncrypted={isEncryptedPacket}
                />
              )}
            </g>
          </g>
        )}
      </svg>

      {/* Clickable Device Node Inspector Badge */}
      {inspectedSlot && (
        <div className="absolute top-3 left-3 z-10 flex items-start gap-2.5 max-w-[270px] rounded-lg border border-[var(--pe-border-strong)] bg-[var(--pe-surface)]/95 backdrop-blur-sm px-3 py-2 shadow-md">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--pe-accent)] shrink-0" />
              <span className="text-xs font-semibold text-[var(--pe-text)] truncate">
                {inspectedSlot.label}
              </span>
            </div>
            <div className="text-[11px] font-mono text-[var(--pe-text-muted)] mt-0.5">
              {inspectedSlot.ip}
              {inspectedSlot.mac ? ` · ${inspectedSlot.mac}` : ""}
            </div>
            <p className="text-[11px] text-[var(--pe-text-secondary)] mt-1 leading-snug">
              {inspectedSlot.roleDescription}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedSlot(null)}
            className="p-1 rounded text-[var(--pe-text-muted)] hover:text-[var(--pe-text)] hover:bg-[var(--pe-surface-alt)] transition-colors"
            aria-label="Close device details"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Subtle Camera & Zoom Controls (Bottom-left open dot-grid corner) */}
      <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface)]/90 backdrop-blur-sm p-1 shadow-sm">
        <button
          type="button"
          onClick={() => {
            setAutoFocusCamera((v) => !v);
            if (autoFocusCamera) setViewBox(DEFAULT_VIEWBOX);
          }}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
            autoFocusCamera
              ? "bg-[var(--pe-accent-soft)] text-[var(--pe-accent-text)]"
              : "text-[var(--pe-text-secondary)] hover:text-[var(--pe-text)] hover:bg-[var(--pe-surface-alt)]"
          }`}
          title={autoFocusCamera ? "Auto-focus camera on active hops (ON)" : "Enable auto-focus camera"}
          aria-label="Toggle camera auto-focus"
          aria-pressed={autoFocusCamera}
        >
          <Focus size={13} />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(0.8)}
          className="w-7 h-7 flex items-center justify-center rounded text-[var(--pe-text-secondary)] hover:text-[var(--pe-text)] hover:bg-[var(--pe-surface-alt)] transition-colors"
          title="Zoom in"
          aria-label="Zoom In"
        >
          <ZoomIn size={13} />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(1.25)}
          className="w-7 h-7 flex items-center justify-center rounded text-[var(--pe-text-secondary)] hover:text-[var(--pe-text)] hover:bg-[var(--pe-surface-alt)] transition-colors"
          title="Zoom out"
          aria-label="Zoom Out"
        >
          <ZoomOut size={13} />
        </button>
        {isZoomed && (
          <button
            type="button"
            onClick={() => {
              setAutoFocusCamera(false);
              setViewBox(DEFAULT_VIEWBOX);
            }}
            className="w-7 h-7 flex items-center justify-center rounded text-[var(--pe-accent-text)] hover:bg-[var(--pe-surface-alt)] transition-colors"
            title="Reset zoom"
            aria-label="Reset Zoom"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
