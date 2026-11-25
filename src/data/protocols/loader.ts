import "server-only";
import type { ProtocolScenario } from "@/lib/protocols/schema";
import { protocolManifest } from "./manifest";

type ProtocolLoader = () => Promise<ProtocolScenario>;

const protocolLoaders: Record<string, ProtocolLoader> = {
  "dns-lookup": async () => (await import("./dns-lookup")).dnsLookupScenario,
  "tcp-handshake": async () => (await import("./tcp-handshake")).tcpHandshakeScenario,
  "http-exchange": async () => (await import("./http-exchange")).httpExchangeScenario,
  "https-exchange": async () => (await import("./https-exchange")).httpsExchangeScenario,
  "tls-handshake": async () => (await import("./tls-handshake")).tlsHandshakeScenario,
  "websocket-upgrade": async () => (await import("./websocket-upgrade")).websocketUpgradeScenario,
  "quic-handshake": async () => (await import("./quic-handshake")).quicHandshakeScenario,
  "mqtt-telemetry": async () => (await import("./mqtt-telemetry")).mqttTelemetryScenario,
  "udp-datagram": async () => (await import("./udp-datagram")).udpDatagramScenario,
  "icmp-ping": async () => (await import("./icmp-ping")).icmpPingScenario,
};

export async function loadProtocolScenario(id: string): Promise<ProtocolScenario | undefined> {
  const loader = protocolLoaders[id];
  if (!loader) return undefined;
  return loader();
}

export async function getProtocolManifest() {
  return protocolManifest;
}
