"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertOctagon } from "lucide-react";
import type { TopologyMapProps } from "./types";
import {
  ISO_VIEWBOX,
  CANONICAL_NODES,
  HIGHWAY_LANES,
  resolveMultiHopLanes,
  interpolateLine,
  lineLength,
  NODE_ALIAS_MAP,
} from "./isometric-engine";
import {
  IsometricLaptop,
  IsometricRouter,
  IsometricDnsResolver,
  IsometricWebServer,
  IsometricInternetCloud,
} from "./isometric-devices";

export function TopologyMap({
  nodes,
  currentStep,
  isPlaying,
  speed,
}: TopologyMapProps) {
  // Determine protocol color matching protocolexplorer.org
  const packetColor = useMemo(() => {
    if (!currentStep) return "#38bdf8";
    if (currentStep.status === "dropped") return "#ef4444";
    if (currentStep.status === "corrupted") return "#f59e0b";
    const proto = currentStep.protocolName.toUpperCase();
    if (proto.includes("DNS")) return "#3b82f6"; // Blue
    if (proto.includes("TCP")) return "#22c55e"; // Green
    if (proto.includes("TLS") || proto.includes("SSL")) return "#06b6d4"; // Cyan
    if (proto.includes("QUIC")) return "#f97316"; // Orange
    if (proto.includes("MQTT")) return "#ec4899"; // Pink
    if (proto.includes("WS") || proto.includes("WEBSOCKET")) return "#8b5cf6"; // Purple
    if (proto.includes("HTTP")) {
      if (
        currentStep.arrowLabel.includes("200") ||
        currentStep.arrowLabel.includes("OK") ||
        currentStep.arrowLabel.includes("Response")
      ) {
        return "#a855f7"; // Purple for Response
      }
      return "#eab308"; // Yellow for Request
    }
    return "#38bdf8";
  }, [currentStep]);

  // Clean packet tag label
  const packetShortTag = useMemo(() => {
    if (!currentStep) return "DATA";
    const parts = currentStep.arrowLabel.split(" ");
    return parts.slice(0, 3).join(" ");
  }, [currentStep]);

  // Dynamic animation state driven by requestAnimationFrame
  const [animState, setAnimState] = useState<{
    hopIndex: number;
    t: number;
    leadX: number;
    leadY: number;
    trail: Array<{ x: number; y: number }>;
    activeLaneKey: string | null;
    isDroppedMidway: boolean;
  }>({
    hopIndex: 0,
    t: 0,
    leadX: 240,
    leadY: 446,
    trail: [],
    activeLaneKey: null,
    isDroppedMidway: false,
  });

  const [bouncingNode, setBouncingNode] = useState<string | null>(null);
  const [impactNode, setImpactNode] = useState<string | null>(null);

  // Resolved multi-hop sequence of lanes for current step
  const hops = useMemo(() => {
    if (!currentStep) return [];
    return resolveMultiHopLanes(currentStep.fromNodeId, currentStep.toNodeId);
  }, [currentStep]);

  // Animation frame loop
  useEffect(() => {
    if (!currentStep || hops.length === 0) return;

    let animId: number;
    let startTime: number | null = null;
    let currentHopIdx = 0;
    const isDropped = currentStep.status === "dropped";
    const dropHopIndex = isDropped ? Math.max(0, hops.length - 1) : -1;

    // Base speed: pixel rate per millisecond
    const pxPerMs = 0.22 * speed;

    const runFrame = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;

      const laneKey = hops[currentHopIdx];
      const laneCoords = HIGHWAY_LANES[laneKey] ?? [240, 446, 440, 339];
      const totalDist = lineLength(laneCoords);
      const hopDuration = Math.max(250, totalDist / pxPerMs);

      const rawT = Math.min(1, elapsed / hopDuration);
      const targetT = currentHopIdx === dropHopIndex ? Math.min(0.5, rawT) : rawT;

      const lead = interpolateLine(laneCoords, targetT);
      const trail = [0.08, 0.16, 0.24].map((offset) =>
        interpolateLine(laneCoords, Math.max(0, targetT - offset))
      );

      setAnimState({
        hopIndex: currentHopIdx,
        t: targetT,
        leadX: lead.x,
        leadY: lead.y,
        trail,
        activeLaneKey: laneKey,
        isDroppedMidway: isDropped && currentHopIdx === dropHopIndex && targetT >= 0.49,
      });

      // Hop completion logic
      if (rawT >= 1) {
        if (currentHopIdx === dropHopIndex) {
          // Packet dropped midway
          return;
        }

        const destNode = laneKey.split(">")[1];
        setBouncingNode(destNode);
        setTimeout(() => setBouncingNode(null), 320);

        if (currentHopIdx < hops.length - 1) {
          // Advance to next physical hop
          currentHopIdx += 1;
          startTime = now;
          animId = requestAnimationFrame(runFrame);
        } else {
          // Reached final destination
          const finalNode = NODE_ALIAS_MAP[currentStep.toNodeId.toLowerCase()] ?? "web";
          setImpactNode(finalNode);
          setTimeout(() => setImpactNode(null), 700);

          // If loop is running, reset after brief pause
          if (isPlaying) {
            setTimeout(() => {
              currentHopIdx = 0;
              startTime = null;
              animId = requestAnimationFrame(runFrame);
            }, 300);
          }
        }
      } else {
        animId = requestAnimationFrame(runFrame);
      }
    };

    animId = requestAnimationFrame(runFrame);
    return () => cancelAnimationFrame(animId);
  }, [currentStep, hops, speed, isPlaying]);

  // Labels and node overrides from scenario nodes
  const nodeOverrides = useMemo(() => {
    const map = new Map<string, { label?: string; ip?: string }>();
    for (const n of nodes) {
      const canonicalKey = NODE_ALIAS_MAP[n.id.toLowerCase()] ?? NODE_ALIAS_MAP[n.type.toLowerCase()];
      if (canonicalKey) {
        map.set(canonicalKey, { label: n.label, ip: n.ip });
      }
    }
    return map;
  }, [nodes]);

  return (
    <div className="protocol-topology-canvas relative w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[#070b14] shadow-2xl">
      <svg
        viewBox={ISO_VIEWBOX}
        className="w-full h-auto select-none block"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Network Topology Map"
      >
        <defs>
          {/* Authentic 2.5D Isometric Diamond Grid Pattern */}
          <pattern id="iso-grid" width="62.354" height="36" patternUnits="userSpaceOnUse" x="9" y="4">
            <path
              d="M0,0 L62.354,36 M62.354,0 L0,36"
              stroke="rgba(56, 189, 248, 0.08)"
              strokeWidth="0.9"
            />
          </pattern>

          {/* Grid Vignette - soft dark radial fade towards edges */}
          <radialGradient id="grid-vignette" gradientUnits="userSpaceOnUse" cx="450" cy="311" r="560">
            <stop offset="0%" stopColor="#070b14" stopOpacity="0" />
            <stop offset="60%" stopColor="#070b14" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#070b14" stopOpacity="0.95" />
          </radialGradient>

          {/* Directional Arrow Markers for Highway Lanes */}
          <marker
            id="head-idle"
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="5.5"
            markerHeight="5.5"
            orient="auto-start-reverse"
          >
            <path d="M0,0.6 L10,5 L0,9.4 Z" fill="rgba(148, 163, 184, 0.3)" />
          </marker>
          <marker
            id="head-active"
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
          >
            <path d="M0,0.6 L10,5 L0,9.4 Z" fill={packetColor} />
          </marker>

          {/* Glowing Filter for Live Packets */}
          <filter id="packetGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="impactWaveGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Isometric Grid & Vignette Background */}
        <rect x="-500" y="-500" width="1900" height="1500" fill="url(#iso-grid)" />
        <rect x="-500" y="-500" width="1900" height="1500" fill="url(#grid-vignette)" />

        {/* HIGHWAY LANES (Dual Directional Physical Cables) */}
        <g className="highway-lanes">
          {Object.entries(HIGHWAY_LANES).map(([laneKey, coords]) => {
            const isActive = animState.activeLaneKey === laneKey;
            const [x1, y1, x2, y2] = coords;

            return (
              <g key={laneKey}>
                {/* Cable Base Line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isActive ? packetColor : "rgba(148, 163, 184, 0.22)"}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  strokeDasharray={isActive ? "none" : "4 4"}
                  markerEnd={`url(#${isActive ? "head-active" : "head-idle"})`}
                  opacity={isActive ? 0.95 : 0.6}
                  className="transition-colors duration-200"
                />

                {/* Energetic pulse line along active wire */}
                {isActive && (
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={packetColor}
                    strokeWidth="3.5"
                    strokeDasharray="8 8"
                    opacity="0.4"
                    filter="url(#packetGlow)"
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* DESTINATION ARRIVAL SHOCKWAVE (Expanding Ripple Ring) */}
        {impactNode && CANONICAL_NODES[impactNode] && (
          <g
            transform={`translate(${CANONICAL_NODES[impactNode].center[0]}, ${CANONICAL_NODES[impactNode].center[1]})`}
            filter="url(#impactWaveGlow)"
          >
            <circle r="18" fill="none" stroke={packetColor} strokeWidth="2">
              <animate attributeName="r" values="18;64" dur="0.7s" fill="freeze" />
              <animate attributeName="opacity" values="0.75;0" dur="0.7s" fill="freeze" />
            </circle>
          </g>
        )}

        {/* LIVE PACKET PARTICLES & TRAIL STREAM */}
        {currentStep && (
          <g key={`packet-${currentStep.stepIndex}-${animState.hopIndex}`}>
            {/* 3 Trailing Dots */}
            {animState.trail.map((pos, idx) => (
              <circle
                key={idx}
                cx={pos.x}
                cy={pos.y}
                r={3.4 - idx * 0.9}
                fill={packetColor}
                opacity={0.45 - idx * 0.12}
              />
            ))}

            {/* Lead Packet Bead */}
            <circle
              cx={animState.leadX}
              cy={animState.leadY}
              r={12}
              fill={packetColor}
              opacity={0.2}
              filter="url(#packetGlow)"
            />
            <circle
              cx={animState.leadX}
              cy={animState.leadY}
              r={5.5}
              fill={packetColor}
              stroke="#070b14"
              strokeWidth="1.8"
            />
            <circle
              cx={animState.leadX}
              cy={animState.leadY}
              r={2}
              fill="#ffffff"
            />

            {/* Floating Packet Tag Pill */}
            {!animState.isDroppedMidway && (
              <g
                transform={`translate(${animState.leadX}, ${animState.leadY - 24})`}
                filter="url(#packetGlow)"
              >
                <rect
                  x="-42"
                  y="-11"
                  width="84"
                  height="22"
                  rx="4"
                  fill="#0b1324"
                  stroke={packetColor}
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {packetShortTag}
                </text>
              </g>
            )}

            {/* Dropped Packet Explosion Cross in Chaos Mode */}
            {animState.isDroppedMidway && (
              <g transform={`translate(${animState.leadX}, ${animState.leadY})`}>
                <circle r="18" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="1.5">
                  <animate attributeName="r" values="10;28" dur="0.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0" dur="0.6s" repeatCount="indefinite" />
                </circle>
                <circle r="13" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
                <foreignObject x="-9" y="-9" width="18" height="18" className="pointer-events-none">
                  <div className="flex h-full w-full items-center justify-center text-red-200">
                    <AlertOctagon size={13} />
                  </div>
                </foreignObject>
                <text
                  x="0"
                  y="26"
                  textAnchor="middle"
                  fill="#ef4444"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  DROPPED
                </text>
              </g>
            )}
          </g>
        )}

        {/* CANONICAL ISOMETRIC DEVICE NODES */}
        <g className="devices-layer">
          {/* 1. Client Laptop */}
          <g>
            <IsometricLaptop
              x={CANONICAL_NODES.client.basePos[0]}
              y={CANONICAL_NODES.client.basePos[1]}
              isActive={currentStep?.fromNodeId === "client" || currentStep?.toNodeId === "client"}
              isBounce={bouncingNode === "client"}
            />
            <g className="node-label">
              <text
                x={73}
                y={494}
                textAnchor="start"
                fill="#f8fafc"
                fontSize="12"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
              >
                {nodeOverrides.get("client")?.label ?? CANONICAL_NODES.client.defaultName}
              </text>
              <text
                x={73}
                y={510}
                textAnchor="start"
                fill="#94a3b8"
                fontSize="10"
                fontFamily="monospace"
              >
                {nodeOverrides.get("client")?.ip ?? CANONICAL_NODES.client.defaultIp}
              </text>
            </g>
          </g>

          {/* 2. Edge Router */}
          <g>
            <IsometricRouter
              x={CANONICAL_NODES.router.basePos[0]}
              y={CANONICAL_NODES.router.basePos[1]}
              isActive={bouncingNode === "router" || currentStep?.fromNodeId === "router" || currentStep?.toNodeId === "router"}
              isBounce={bouncingNode === "router"}
            />
            <g className="node-label">
              <text
                x={407}
                y={426}
                textAnchor="start"
                fill="#f8fafc"
                fontSize="12"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
              >
                {nodeOverrides.get("router")?.label ?? CANONICAL_NODES.router.defaultName}
              </text>
              <text
                x={407}
                y={442}
                textAnchor="start"
                fill="#94a3b8"
                fontSize="10"
                fontFamily="monospace"
              >
                {nodeOverrides.get("router")?.ip ?? CANONICAL_NODES.router.defaultIp}
              </text>
            </g>
          </g>

          {/* 3. Internet Transit Cloud */}
          <g>
            <IsometricInternetCloud
              x={CANONICAL_NODES.internet.basePos[0]}
              y={CANONICAL_NODES.internet.basePos[1]}
              isActive={bouncingNode === "internet" || currentStep?.fromNodeId === "internet" || currentStep?.toNodeId === "internet"}
              isBounce={bouncingNode === "internet"}
            />
            <g className="node-label">
              <text
                x={726}
                y={524}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="12"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
              >
                {nodeOverrides.get("internet")?.label ?? CANONICAL_NODES.internet.defaultName}
              </text>
            </g>
          </g>

          {/* 4. DNS Resolver */}
          <g>
            <IsometricDnsResolver
              x={CANONICAL_NODES.dns.basePos[0]}
              y={CANONICAL_NODES.dns.basePos[1]}
              isActive={currentStep?.fromNodeId === "resolver" || currentStep?.toNodeId === "resolver" || currentStep?.fromNodeId === "dns" || currentStep?.toNodeId === "dns"}
              isBounce={bouncingNode === "dns"}
            />
            <g className="node-label">
              <text
                x={654}
                y={160}
                textAnchor="end"
                fill="#f8fafc"
                fontSize="12"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
              >
                {nodeOverrides.get("dns")?.label ?? CANONICAL_NODES.dns.defaultName}
              </text>
              <text
                x={654}
                y={176}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="10"
                fontFamily="monospace"
              >
                {nodeOverrides.get("dns")?.ip ?? CANONICAL_NODES.dns.defaultIp}
              </text>
            </g>
          </g>

          {/* 5. Web Server */}
          <g>
            <IsometricWebServer
              x={CANONICAL_NODES.web.basePos[0]}
              y={CANONICAL_NODES.web.basePos[1]}
              isActive={currentStep?.fromNodeId === "server" || currentStep?.toNodeId === "server" || currentStep?.fromNodeId === "web" || currentStep?.toNodeId === "web"}
              isBounce={bouncingNode === "web"}
            />
            <g className="node-label">
              <text
                x={773}
                y={106}
                textAnchor="start"
                fill="#f8fafc"
                fontSize="12"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
              >
                {nodeOverrides.get("web")?.label ?? CANONICAL_NODES.web.defaultName}
              </text>
              <text
                x={773}
                y={122}
                textAnchor="start"
                fill="#94a3b8"
                fontSize="10"
                fontFamily="monospace"
              >
                {nodeOverrides.get("web")?.ip ?? CANONICAL_NODES.web.defaultIp}
              </text>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
