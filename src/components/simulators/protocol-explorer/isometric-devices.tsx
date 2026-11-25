"use client";

import React from "react";
import type { SlotDeviceKind } from "./isometric-engine";

interface DeviceGraphicProps {
  kind: SlotDeviceKind;
  isActive?: boolean;
  isLoaded?: boolean;
}

/**
 * Clean 2.5D isometric vector illustrations matching ProtocolExplorer's SVG engine.
 * All fills and strokes reference CSS custom properties (--pe-dev-*) so devices
 * automatically adapt between Katalyst Light and Dark themes.
 */
export function IsometricDevice({ kind, isActive = false, isLoaded = false }: DeviceGraphicProps) {
  const stroke = isActive ? "var(--pe-dev-stroke-active)" : "var(--pe-dev-stroke)";

  if (kind === "laptop") {
    return (
      <g
        className={`pe-device ${isActive ? "is-active" : ""}`}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <ellipse cx="0" cy="45" rx="80" ry="15" fill="var(--pe-dev-shadow)" />
        {/* Screen lid back edge */}
        <path
          d="M-68-73 29-97Q36-99 38-91L49-15-52 11Z"
          fill="var(--pe-dev-edge)"
          stroke={stroke}
          strokeWidth="1.8"
        />
        {/* Screen bezel */}
        <path
          d="m-59-67 89-22 10 69-89 22Z"
          fill="var(--pe-dev-screen)"
          stroke={stroke}
          strokeWidth="1.6"
        />
        {/* Browser viewport paper */}
        <path
          d="m-52-57 74-18 7 48-74 18Z"
          fill="var(--pe-dev-paper)"
          stroke="none"
        />
        {/* Simulated code/page lines */}
        <path
          d="m-46-46 59-14m-56 29 43-10m-40 20 50-12"
          fill="none"
          stroke={isLoaded ? "var(--pe-dev-accent)" : "var(--pe-dev-line)"}
          strokeOpacity={isLoaded ? 0.65 : 0.9}
          strokeWidth="2.4"
        />
        {/* Accent hero block */}
        <path
          d="m-46-40 50-12 2 10-50 12Z"
          fill={isLoaded ? "var(--pe-dev-led)" : "var(--pe-dev-accent)"}
          fillOpacity="0.92"
        />
        {/* Laptop base body */}
        <path
          d="m-52 9 101-25 36 40-101 28-65-24Z"
          fill="var(--pe-dev-body)"
          stroke={stroke}
          strokeWidth="1.8"
        />
        {/* Keyboard deck */}
        <path
          d="m-68 15 114-28 35 34-111 29Z"
          fill="var(--pe-dev-top)"
          stroke={stroke}
          strokeWidth="1.6"
        />
        {/* Keycaps block */}
        <path
          d="m-49 14 86-21 18 16-86 23Z"
          fill="var(--pe-dev-keys)"
          stroke={stroke}
          strokeWidth="1.1"
        />
        {/* Key grid lines */}
        <path
          d="m-40 20 86-21m-76 30 85-21m-78 7 15 15m0-19 15 15m0-19 15 15m0-19 15 15"
          fill="none"
          stroke="var(--pe-dev-line)"
          strokeWidth="0.9"
          strokeOpacity="0.65"
        />
        {/* Trackpad */}
        <path
          d="m-5 32 27-7 10 9-27 8Z"
          fill="var(--pe-dev-body)"
          stroke={stroke}
          strokeWidth="1.1"
        />
      </g>
    );
  }

  if (kind === "router") {
    return (
      <g
        className={`pe-device ${isActive ? "is-active" : ""}`}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <ellipse cx="0" cy="45" rx="80" ry="15" fill="var(--pe-dev-shadow)" />
        {/* Dual antennas */}
        <path
          d="M-39-15v-64m85 73v-61"
          fill="none"
          stroke={stroke}
          strokeWidth="3.2"
        />
        <path
          d="M-39-77v-8m85 20v-8"
          fill="none"
          stroke="var(--pe-dev-accent)"
          strokeWidth="3.6"
        />
        {/* Router chassis */}
        <path
          d="m-72-6 69-28 75 29v30L3 54-72 25Z"
          fill="var(--pe-dev-body)"
          stroke={stroke}
          strokeWidth="1.8"
        />
        <path
          d="M3 23 72-5v30L3 54Z"
          fill="var(--pe-dev-side)"
          stroke={stroke}
          strokeWidth="1.6"
        />
        <path
          d="m-72-6 69-28 75 29L3 23Z"
          fill="var(--pe-dev-top)"
          stroke={stroke}
          strokeWidth="1.8"
        />
        {/* Front LED panel */}
        <path
          d="m-62 10 54 21v13l-54-20Z"
          fill="var(--pe-dev-bay)"
          stroke={stroke}
          strokeWidth="1.2"
        />
        <ellipse cx="-45" cy="27" rx="2.8" ry="3.4" fill="var(--pe-dev-led)" />
        <ellipse cx="-31" cy="32.18" rx="2.8" ry="3.4" fill="var(--pe-dev-led)" />
        <ellipse cx="-17" cy="37.36" rx="2.8" ry="3.4" fill="var(--pe-dev-accent)" />
        {/* Right-side vents */}
        <path
          d="m26 25 33-13m-33 21 33-13"
          fill="none"
          stroke="var(--pe-dev-line)"
          strokeWidth="2"
        />
        {/* Wi-Fi emblem on top */}
        <path
          d="M-23-4Q-4-17 17-1m-31 0Q-4-8 6 1m-12 3h1"
          fill="none"
          stroke="var(--pe-dev-accent)"
          strokeWidth="2.1"
        />
      </g>
    );
  }

  if (kind === "cloud") {
    return (
      <g
        className={`pe-device ${isActive ? "is-active" : ""}`}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <ellipse cx="0" cy="45" rx="68" ry="15" fill="var(--pe-dev-shadow)" />
        {/* 3D cloud underside */}
        <path
          d="M-68 4c-16-27 4-52 28-46 3-35 49-42 67-14 33-12 59 15 48 42 29 14 23 51-9 54H-43C-71 40-86 19-68 4Z"
          fill="var(--pe-dev-side)"
          stroke={stroke}
          strokeWidth="1.8"
        />
        {/* Cloud top surface */}
        <path
          d="M-68-3c-16-27 4-52 28-46 3-35 49-42 67-14 33-12 59 15 48 42 29 14 23 51-9 54H-43C-71 33-86 12-68-3Z"
          fill="var(--pe-dev-top)"
          stroke={stroke}
          strokeWidth="1.8"
        />
        {/* Bidirectional transit arrows */}
        <path
          d="M-26-10h52m-39-13L-26-10l13 13m26-26L26-10 13 3"
          fill="none"
          stroke={isActive ? "var(--pe-dev-accent)" : "var(--pe-dev-line)"}
          strokeWidth="2.6"
        />
      </g>
    );
  }

  // Server rack / DNS resolver / Broker tower
  return (
    <g
      className={`pe-device ${isActive ? "is-active" : ""}`}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <ellipse cx="0" cy="45" rx="76" ry="15" fill="var(--pe-dev-shadow)" />
      <path
        d="m-50-75 46-25 59 22v110L9 55-50 32Z"
        fill="var(--pe-dev-body)"
        stroke={stroke}
        strokeWidth="1.8"
      />
      <path
        d="m-50-75 46-25 59 22L9-52Z"
        fill="var(--pe-dev-top)"
        stroke={stroke}
        strokeWidth="1.8"
      />
      <path
        d="M9-52 55-78v110L9 55Z"
        fill="var(--pe-dev-side)"
        stroke={stroke}
        strokeWidth="1.6"
      />
      <path
        d="m-42-62 43 17v86l-43-17Z"
        fill="var(--pe-dev-screen)"
        stroke={stroke}
        strokeWidth="1.2"
      />
      {/* 3 Drive Bays */}
      {[-47, -20, 7].map((bayY, idx) => (
        <g key={bayY}>
          <path
            d={`m-36 ${bayY} 30 12v14l-30-12Z`}
            fill="var(--pe-dev-bay)"
            stroke={stroke}
            strokeWidth="1.1"
          />
          <path
            d={`m-31 ${bayY + 8} 15 6`}
            fill="none"
            stroke="var(--pe-dev-line)"
            strokeWidth="1.8"
          />
          <ellipse
            cx="-11"
            cy={bayY + 17}
            rx="2.1"
            ry="2.5"
            fill={idx === 0 && isActive ? "var(--pe-dev-accent)" : "var(--pe-dev-led)"}
          />
        </g>
      ))}
      {/* Side ventilation slots */}
      <path
        d="m24 5 20-11m-20 21 20-11m-20 21 20-11"
        fill="none"
        stroke="var(--pe-dev-line)"
        strokeWidth="2"
      />
      {/* Top status bar */}
      <path
        d="m-30-76 15 5"
        fill="none"
        stroke="var(--pe-dev-accent)"
        strokeWidth="3"
      />
    </g>
  );
}

interface PacketCubeProps {
  label: string;
  colors: {
    main: string;
    light: string;
    dark: string;
  };
  xOffsetClamp?: number;
  isDropped?: boolean;
  isEncrypted?: boolean;
}

/**
 * Animated moving packet beacon, 3D isometric cube & floating protocol badge
 * matching a2aprotocol.ai/tools/protocol-explorer's packet-layer engine.
 */
export function IsometricPacketBadge({
  label,
  colors,
  xOffsetClamp = 0,
  isDropped = false,
  isEncrypted = false,
}: PacketCubeProps) {
  const displayLabel = isDropped ? `DROPPED · ${label}` : label;
  const extraPad = isEncrypted ? 38 : 26;
  const pillWidth = Math.min(198, Math.max(92, displayLabel.length * 7.2 + extraPad));
  const pillX = -pillWidth / 2 + xOffsetClamp;

  return (
    <g>
      {/* Invisible hit target */}
      <rect x={pillX} y="-56" width={pillWidth} height="78" fill="transparent" />

      {/* Glowing Pulse Halo + Core Wire Beacon (matching a2aprotocol.ai packet-layer) */}
      <circle cx="0" cy="0" r="14" fill={colors.main} opacity="0.2" />
      <circle
        cx="0"
        cy="0"
        r="6"
        fill={colors.main}
        stroke="var(--pe-surface)"
        strokeWidth="2"
      />

      {/* 3D Isometric Packet Cube accent tucked at packet origin */}
      <g transform="translate(0 -9) scale(0.82)">
        <path d="m-12-8 8-5 18 7-8 5Z" fill={colors.light} />
        <path d="m-12-8 18 7v14l-18-7Z" fill={colors.main} />
        <path d="m6-1 8-5V8l-8 5Z" fill={colors.dark} />
      </g>

      {/* Floating Header Pill */}
      <rect
        x={pillX}
        y="-53"
        width={pillWidth}
        height="27"
        rx="6"
        fill={colors.main}
        stroke="var(--pe-surface)"
        strokeWidth="1.2"
      />

      {isEncrypted && (
        <g transform={`translate(${pillX + 10} -45)`} fill="none" stroke="#ffffff" strokeWidth="1.4">
          <rect x="0" y="4.5" width="9" height="7" rx="1.5" fill="rgba(255,255,255,0.18)" />
          <path d="M2 4.5V2.8a2.5 2.5 0 0 1 5 0v1.7" />
        </g>
      )}

      <text
        x={xOffsetClamp + (isEncrypted ? 7 : 0)}
        y="-35.5"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="11"
        fontWeight="700"
        fontFamily="var(--font-jetbrains-mono), ui-monospace, monospace"
        letterSpacing="0.03em"
      >
        {displayLabel}
      </text>
    </g>
  );
}
