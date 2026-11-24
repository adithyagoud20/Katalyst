/**
 * True 2.5D Isometric Network Projection Engine
 * Faithfully reproduces the isometric coordinate scheme, vector devices,
 * and multi-hop routing architecture of protocolexplorer.org
 */

export const ISO_VIEWBOX = "45 66 810 490";

// Mathematical constants for 30-degree isometric projection
const COS_30 = Math.cos(Math.PI / 6); // ~0.8660254
const SIN_30 = 0.5;

/**
 * Projects 3D isometric space (x, y, z) into 2D SVG screen coordinates
 * @param x0 SVG origin X
 * @param y0 SVG origin Y
 */
export function createIsoProjector(x0: number, y0: number) {
  return (x: number, y: number, z: number = 0): [number, number] => [
    x0 + (x - y) * COS_30,
    y0 + (x + y) * SIN_30 - z,
  ];
}

// Canonical isometric node centers and screen coordinates
export interface CanonicalNodeInfo {
  id: string;
  type: "client" | "router" | "resolver" | "server" | "internet";
  basePos: [number, number];
  center: [number, number];
  defaultName: string;
  defaultIp: string;
}

export const CANONICAL_NODES: Record<string, CanonicalNodeInfo> = {
  client: {
    id: "client",
    type: "client",
    basePos: [240, 446],
    center: [214, 446],
    defaultName: "Client Browser",
    defaultIp: "192.168.1.10",
  },
  router: {
    id: "router",
    type: "router",
    basePos: [440, 339],
    center: [440, 360],
    defaultName: "Edge Router / NAT",
    defaultIp: "192.168.1.1",
  },
  internet: {
    id: "internet",
    type: "internet",
    basePos: [728, 460],
    center: [732, 458],
    defaultName: "Internet (Transit)",
    defaultIp: "AS 64500",
  },
  dns: {
    id: "dns",
    type: "resolver",
    basePos: [701, 185],
    center: [701, 180],
    defaultName: "DNS Resolver",
    defaultIp: "8.8.8.8",
  },
  web: {
    id: "web",
    type: "server",
    basePos: [812, 203],
    center: [812, 206],
    defaultName: "Web Server",
    defaultIp: "203.0.113.10",
  },
};

// Aliases for scenario node ids
export const NODE_ALIAS_MAP: Record<string, string> = {
  client: "client",
  browser: "client",
  pc: "client",
  router: "router",
  gateway: "router",
  nat: "router",
  internet: "internet",
  cloud: "internet",
  wan: "internet",
  dns: "dns",
  resolver: "dns",
  nameserver: "dns",
  web: "web",
  server: "web",
  host: "web",
  katalyst: "web",
  broker: "web",
};

/**
 * Dual-directional isometric highway lane coordinates [x1, y1, x2, y2]
 */
export const HIGHWAY_LANES: Record<string, [number, number, number, number]> = {
  "client>router": [262, 430, 371, 383],
  "router>client": [376, 355, 268, 403],
  "router>internet": [508.4, 357.1, 668.4, 434.8],
  "internet>router": [663.6, 444.6, 503.6, 366.9],
  "internet>dns": [690, 418, 690, 231],
  "dns>internet": [712, 229, 712, 404],
  "internet>web": [776, 418, 776, 254],
  "web>internet": [797, 264, 797, 438],
  // Fallbacks for direct wiring if needed
  "client>dns": [262, 430, 371, 383],
  "dns>client": [376, 355, 268, 403],
  "client>web": [262, 430, 371, 383],
  "web>client": [376, 355, 268, 403],
  "router>web": [508.4, 357.1, 668.4, 434.8],
  "web>router": [663.6, 444.6, 503.6, 366.9],
};

/**
 * Multi-hop path sequence: maps any source->destination to intermediate physical wire hops
 */
export const MULTI_HOP_ROUTING: Record<string, string[]> = {
  "client>web": ["client>router", "router>internet", "internet>web"],
  "web>client": ["web>internet", "internet>router", "router>client"],
  "client>dns": ["client>router", "router>internet", "internet>dns"],
  "dns>client": ["dns>internet", "internet>router", "router>client"],
  "client>router": ["client>router"],
  "router>client": ["router>client"],
  "router>internet": ["router>internet"],
  "internet>router": ["internet>router"],
  "internet>dns": ["internet>dns"],
  "dns>internet": ["dns>internet"],
  "internet>web": ["internet>web"],
  "web>internet": ["web>internet"],
  "router>web": ["router>internet", "internet>web"],
  "web>router": ["web>internet", "internet>router"],
  "router>dns": ["router>internet", "internet>dns"],
  "dns>router": ["dns>internet", "internet>router"],
};

/**
 * Resolves a scenario from/to pair into an array of highway lane keys
 */
export function resolveMultiHopLanes(fromId: string, toId: string): string[] {
  const normFrom = NODE_ALIAS_MAP[fromId.toLowerCase()] ?? "client";
  const normTo = NODE_ALIAS_MAP[toId.toLowerCase()] ?? "web";
  const key = `${normFrom}>${normTo}`;
  if (MULTI_HOP_ROUTING[key]) {
    return MULTI_HOP_ROUTING[key];
  }
  // Generic fallback if not explicitly in table
  if (normFrom === normTo) return [];
  if (HIGHWAY_LANES[key]) return [key];
  return ["client>router", "router>internet", "internet>web"];
}

// Math easing functions matching protocolexplorer.org
export const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t: number) => t * t * t;
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export type CameraViewBox = [number, number, number, number]; // [x, y, width, height]

export const DEFAULT_VIEWBOX: CameraViewBox = [45, 66, 810, 490];

/**
 * Calculates the framed viewBox for active communicating nodes matching protocolexplorer.org
 */
export function calculateTargetViewBox(fromNodeId?: string, toNodeId?: string): CameraViewBox {
  if (!fromNodeId || !toNodeId) return DEFAULT_VIEWBOX;
  const normFrom = NODE_ALIAS_MAP[fromNodeId.toLowerCase()] ?? "client";
  const normTo = NODE_ALIAS_MAP[toNodeId.toLowerCase()] ?? "web";

  // Local LAN: client <-> router
  if (
    (normFrom === "client" && normTo === "router") ||
    (normFrom === "router" && normTo === "client")
  ) {
    // Zoom in to client and router
    return [68, 246, 520, 315];
  }

  // DNS Lookup: client/router <-> internet <-> dns
  if (
    normFrom === "dns" || normTo === "dns" ||
    normFrom === "resolver" || normTo === "resolver"
  ) {
    // Zoom to frame from client to DNS Resolver
    return [92, 118, 730, 440];
  }

  // Web Server: client/router <-> internet <-> web
  if (
    normFrom === "web" || normTo === "web" ||
    normFrom === "server" || normTo === "server"
  ) {
    // Zoom and pan to frame highway from client to web server
    return [96, 122, 770, 465];
  }

  return DEFAULT_VIEWBOX;
}

export function interpolateLine(
  [x1, y1, x2, y2]: [number, number, number, number],
  t: number
): { x: number; y: number } {
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    x: x1 + (x2 - x1) * clampedT,
    y: y1 + (y2 - y1) * clampedT,
  };
}

export function lineLength([x1, y1, x2, y2]: [number, number, number, number]): number {
  return Math.hypot(x2 - x1, y2 - y1);
}
