import type { ProtocolNode } from "@/lib/protocols/schema";

/**
 * Canonical SVG coordinate engine matching ProtocolExplorer's 1000x445 isometric topology.
 * Every device has a fixed visual center and cable anchor so nodes never overlap and
 * multi-hop packets traverse clean straight-line wires across any protocol scenario.
 */

export const LAB_VIEWBOX = "0 0 1000 445";
export type CameraViewBox = [number, number, number, number];
export const DEFAULT_VIEWBOX: CameraViewBox = [0, 0, 1000, 445];

export type CanonicalSlotId = "client" | "router" | "internet" | "dns" | "web";
export type SlotDeviceKind = "laptop" | "router" | "cloud" | "server";

export interface SlotGeometry {
  slotId: CanonicalSlotId;
  center: [number, number];
  anchor: [number, number];
  defaultName: string;
  defaultIp: string;
  defaultKind: SlotDeviceKind;
  defaultRole: string;
}

export const CANONICAL_SLOTS: Record<CanonicalSlotId, SlotGeometry> = {
  client: {
    slotId: "client",
    center: [115, 215],
    anchor: [115, 250],
    defaultName: "Client",
    defaultIp: "192.168.1.10",
    defaultKind: "laptop",
    defaultRole: "Originating client endpoint",
  },
  router: {
    slotId: "router",
    center: [370, 215],
    anchor: [370, 250],
    defaultName: "Edge Router / NAT",
    defaultIp: "192.168.1.1",
    defaultKind: "router",
    defaultRole: "Local gateway performing NAT & L3 forwarding",
  },
  internet: {
    slotId: "internet",
    center: [625, 215],
    anchor: [625, 250],
    defaultName: "Internet",
    defaultIp: "WAN Transit",
    defaultKind: "cloud",
    defaultRole: "Autonomous ISP backbone routing packets across WAN",
  },
  dns: {
    slotId: "dns",
    center: [855, 96],
    anchor: [855, 131],
    defaultName: "DNS Resolver",
    defaultIp: "8.8.8.8",
    defaultKind: "server",
    defaultRole: "Resolves domain names into routable IP addresses",
  },
  web: {
    slotId: "web",
    center: [855, 312],
    anchor: [855, 347],
    defaultName: "Web Server",
    defaultIp: "203.0.113.10",
    defaultKind: "server",
    defaultRole: "Destination host serving the application protocol",
  },
};

export interface PhysicalCableSpec {
  id: string;
  fromSlot: CanonicalSlotId;
  toSlot: CanonicalSlotId;
  coords: [number, number, number, number];
}

export const PHYSICAL_CABLES: PhysicalCableSpec[] = [
  {
    id: "client-router",
    fromSlot: "client",
    toSlot: "router",
    coords: [115, 250, 370, 250],
  },
  {
    id: "router-internet",
    fromSlot: "router",
    toSlot: "internet",
    coords: [370, 250, 625, 250],
  },
  {
    id: "internet-dns",
    fromSlot: "internet",
    toSlot: "dns",
    coords: [625, 250, 855, 131],
  },
  {
    id: "internet-web",
    fromSlot: "internet",
    toSlot: "web",
    coords: [625, 250, 855, 347],
  },
];

const ADJACENCY: Record<CanonicalSlotId, CanonicalSlotId[]> = {
  client: ["router"],
  router: ["client", "internet"],
  internet: ["router", "dns", "web"],
  dns: ["internet"],
  web: ["internet"],
};

export interface ResolvedSlotNode {
  slotId: CanonicalSlotId;
  nodeId: string;
  label: string;
  ip: string;
  mac?: string;
  deviceKind: SlotDeviceKind;
  roleDescription: string;
  inScenario: boolean;
}

export interface ResolvedTopology {
  slots: Record<CanonicalSlotId, ResolvedSlotNode>;
  aliasToSlot: Record<string, CanonicalSlotId>;
}

const STATIC_ALIAS_DEFAULTS: Record<string, CanonicalSlotId> = {
  client: "client",
  browser: "client",
  pc: "client",
  router: "router",
  gateway: "router",
  nat: "router",
  internet: "internet",
  cloud: "internet",
  wan: "internet",
  proxy: "internet",
  dns: "dns",
  resolver: "dns",
  nameserver: "dns",
  "root-dns": "dns",
  "auth-dns": "web",
  web: "web",
  server: "web",
  host: "web",
  katalyst: "web",
  broker: "web",
};

/**
 * Maps arbitrary scenario node definitions cleanly onto the 5 canonical isometric slots.
 * Ensures multi-node scenarios (e.g. DNS recursive + root + auth, or HTTP client + proxy + origin)
 * place every participating node on a distinct physical slot with proper icons and labels.
 */
export function resolveScenarioTopology(nodes: ProtocolNode[]): ResolvedTopology {
  const slots: Record<CanonicalSlotId, ResolvedSlotNode> = {
    client: {
      slotId: "client",
      nodeId: "client",
      label: CANONICAL_SLOTS.client.defaultName,
      ip: CANONICAL_SLOTS.client.defaultIp,
      deviceKind: "laptop",
      roleDescription: CANONICAL_SLOTS.client.defaultRole,
      inScenario: false,
    },
    router: {
      slotId: "router",
      nodeId: "router",
      label: CANONICAL_SLOTS.router.defaultName,
      ip: CANONICAL_SLOTS.router.defaultIp,
      deviceKind: "router",
      roleDescription: CANONICAL_SLOTS.router.defaultRole,
      inScenario: false,
    },
    internet: {
      slotId: "internet",
      nodeId: "internet",
      label: CANONICAL_SLOTS.internet.defaultName,
      ip: CANONICAL_SLOTS.internet.defaultIp,
      deviceKind: "cloud",
      roleDescription: CANONICAL_SLOTS.internet.defaultRole,
      inScenario: false,
    },
    dns: {
      slotId: "dns",
      nodeId: "dns",
      label: CANONICAL_SLOTS.dns.defaultName,
      ip: CANONICAL_SLOTS.dns.defaultIp,
      deviceKind: "server",
      roleDescription: CANONICAL_SLOTS.dns.defaultRole,
      inScenario: false,
    },
    web: {
      slotId: "web",
      nodeId: "web",
      label: CANONICAL_SLOTS.web.defaultName,
      ip: CANONICAL_SLOTS.web.defaultIp,
      deviceKind: "server",
      roleDescription: CANONICAL_SLOTS.web.defaultRole,
      inScenario: false,
    },
  };

  const aliasToSlot: Record<string, CanonicalSlotId> = { ...STATIC_ALIAS_DEFAULTS };
  const hasRootOrAuthDns = nodes.some((n) => n.id === "root-dns" || n.id === "auth-dns");

  for (const node of nodes) {
    const idLower = node.id.toLowerCase();
    let targetSlot: CanonicalSlotId = "web";
    let deviceKind: SlotDeviceKind = "server";
    let roleDescription = CANONICAL_SLOTS.web.defaultRole;

    if (idLower === "client" || node.type === "client") {
      targetSlot = "client";
      deviceKind = "laptop";
      roleDescription = "Initiates requests and inspects protocol responses";
    } else if (idLower === "router" || node.type === "router") {
      targetSlot = "router";
      deviceKind = "router";
      roleDescription = "Forwards LAN packets to upstream transit links";
    } else if (node.type === "proxy" || idLower === "proxy") {
      targetSlot = "internet";
      deviceKind = "cloud";
      roleDescription = "Edge reverse proxy terminating & forwarding traffic";
    } else if (hasRootOrAuthDns && idLower === "resolver") {
      targetSlot = "internet";
      deviceKind = "server";
      roleDescription = "Recursive DNS resolver querying root & authoritative nameservers";
    } else if (idLower === "root-dns" || idLower === "dns" || node.type === "resolver") {
      targetSlot = "dns";
      deviceKind = "server";
      roleDescription =
        idLower === "root-dns"
          ? "Root nameserver returning TLD delegation referrals"
          : "DNS nameserver resolving hostnames to IP records";
    } else if (idLower === "auth-dns") {
      targetSlot = "web";
      deviceKind = "server";
      roleDescription = "Authoritative nameserver holding final domain DNS records";
    } else {
      targetSlot = "web";
      deviceKind = "server";
      roleDescription = "Target destination host processing protocol frames";
    }

    slots[targetSlot] = {
      slotId: targetSlot,
      nodeId: node.id,
      label: node.label,
      ip: node.ip,
      mac: node.mac,
      deviceKind,
      roleDescription,
      inScenario: true,
    };
    aliasToSlot[idLower] = targetSlot;
  }

  return { slots, aliasToSlot };
}

export interface HopSegment {
  key: string;
  cableId: string;
  fromSlot: CanonicalSlotId;
  toSlot: CanonicalSlotId;
  coords: [number, number, number, number];
}

function slotToSlotPath(start: CanonicalSlotId, end: CanonicalSlotId): CanonicalSlotId[] {
  if (start === end) return [start];
  const queue: CanonicalSlotId[][] = [[start]];
  const visited = new Set<CanonicalSlotId>([start]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    for (const neighbor of ADJACENCY[current]) {
      if (neighbor === end) {
        return [...path, neighbor];
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return [start, end];
}

/**
 * Resolves a scenario step's fromNodeId -> toNodeId into sequential physical cable hops.
 */
export function resolveStepHops(
  fromNodeId: string,
  toNodeId: string,
  aliasToSlot: Record<string, CanonicalSlotId> = STATIC_ALIAS_DEFAULTS
): HopSegment[] {
  const fromSlot = aliasToSlot[fromNodeId.toLowerCase()] ?? "client";
  const toSlot = aliasToSlot[toNodeId.toLowerCase()] ?? "web";
  if (fromSlot === toSlot) return [];

  const path = slotToSlotPath(fromSlot, toSlot);
  const hops: HopSegment[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const cable = PHYSICAL_CABLES.find(
      (c) => (c.fromSlot === a && c.toSlot === b) || (c.fromSlot === b && c.toSlot === a)
    );
    if (!cable) continue;

    const [x1, y1] = CANONICAL_SLOTS[a].anchor;
    const [x2, y2] = CANONICAL_SLOTS[b].anchor;
    hops.push({
      key: `${a}>${b}`,
      cableId: cable.id,
      fromSlot: a,
      toSlot: b,
      coords: [x1, y1, x2, y2],
    });
  }

  return hops;
}

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function interpolateLine(
  [x1, y1, x2, y2]: [number, number, number, number],
  t: number
): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    x: x1 + (x2 - x1) * clamped,
    y: y1 + (y2 - y1) * clamped,
  };
}

export function lineLength([x1, y1, x2, y2]: [number, number, number, number]): number {
  return Math.hypot(x2 - x1, y2 - y1);
}
