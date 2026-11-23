import { describe, it, expect } from "vitest";
import {
  ProtocolScenarioSchema,
  ProtocolManifestEntrySchema,
} from "@/lib/protocols/schema";
import { protocolManifest } from "@/data/protocols/manifest";
import { dnsLookupScenario } from "@/data/protocols/dns-lookup";
import { tcpHandshakeScenario } from "@/data/protocols/tcp-handshake";
import { httpExchangeScenario } from "@/data/protocols/http-exchange";
import { tlsHandshakeScenario } from "@/data/protocols/tls-handshake";
import { websocketUpgradeScenario } from "@/data/protocols/websocket-upgrade";
import { quicHandshakeScenario } from "@/data/protocols/quic-handshake";
import { mqttTelemetryScenario } from "@/data/protocols/mqtt-telemetry";

describe("Protocol Scenarios & Schema Verification", () => {
  it("validates protocol manifest entries", () => {
    expect(protocolManifest.length).toBeGreaterThanOrEqual(7);
    for (const entry of protocolManifest) {
      const parsed = ProtocolManifestEntrySchema.safeParse(entry);
      expect(parsed.success).toBe(true);
    }
  });

  const scenarios = [
    dnsLookupScenario,
    tcpHandshakeScenario,
    httpExchangeScenario,
    tlsHandshakeScenario,
    websocketUpgradeScenario,
    quicHandshakeScenario,
    mqttTelemetryScenario,
  ];

  for (const scenario of scenarios) {
    it(`validates scenario '${scenario.id}' against ProtocolScenarioSchema`, () => {
      const parsed = ProtocolScenarioSchema.safeParse(scenario);
      if (!parsed.success) {
        console.error(`Validation failed for ${scenario.id}:`, parsed.error.issues);
      }
      expect(parsed.success).toBe(true);
    });

    it(`verifies byte ranges and hex consistency for '${scenario.id}'`, () => {
      for (const step of scenario.steps) {
        const rawByteLength = step.rawHex.length / 2;
        expect(Number.isInteger(rawByteLength)).toBe(true);

        for (const layer of step.layers) {
          for (const field of layer.fields) {
            const [start, end] = field.byteRange;
            expect(start).toBeLessThan(end);
            expect(start).toBeGreaterThanOrEqual(0);
            expect(end).toBeLessThanOrEqual(rawByteLength);
          }
        }
      }
    });

    it(`verifies chaos variants for '${scenario.id}' if present`, () => {
      if (scenario.chaosVariants) {
        for (const variant of scenario.chaosVariants) {
          expect(variant.triggerStepIndex).toBeLessThan(scenario.steps.length);
          expect(variant.alternateSteps.length).toBeGreaterThan(0);
        }
      }
    });

    it(`verifies exam challenge for '${scenario.id}' if present`, () => {
      if (scenario.examChallenge) {
        const challenge = scenario.examChallenge;
        expect(challenge.shuffledStepIds.length).toBe(challenge.correctSequence.length);
        const sortedShuffled = [...challenge.shuffledStepIds].sort((a, b) => a - b);
        const sortedCorrect = [...challenge.correctSequence].sort((a, b) => a - b);
        expect(sortedShuffled).toEqual(sortedCorrect);
      }
    });
  }
});
