import { z } from "zod";

export const ProtocolLayerSchema = z.enum([
  "physical",
  "data-link",
  "network",
  "transport",
  "application",
  "security",
]);
export type ProtocolLayer = z.infer<typeof ProtocolLayerSchema>;

export const HeaderFieldSchema = z.object({
  name: z.string().min(1).max(64),
  value: z.string().min(1).max(256),
  byteRange: z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]), // [startOffset, endOffset] (exclusive end)
  description: z.string().max(1000),
  katContext: z.string().max(1500).optional(),
});
export type HeaderField = z.infer<typeof HeaderFieldSchema>;

export const DecodedLayerSchema = z.object({
  name: z.string().min(1).max(64),
  layer: ProtocolLayerSchema,
  fields: z.array(HeaderFieldSchema),
});
export type DecodedLayer = z.infer<typeof DecodedLayerSchema>;

export const ProtocolNodeSchema = z.object({
  id: z.string().min(1).max(32),
  label: z.string().min(1).max(64),
  type: z.enum(["client", "router", "resolver", "server", "proxy"]),
  ip: z.string().max(45),
  mac: z.string().max(17).optional(),
  xPercent: z.number().min(0).max(100),
  yPercent: z.number().min(0).max(100),
});
export type ProtocolNode = z.infer<typeof ProtocolNodeSchema>;

export const ProtocolWireSchema = z.object({
  id: z.string().min(1).max(32),
  fromNodeId: z.string(),
  toNodeId: z.string(),
  label: z.string().optional(),
});
export type ProtocolWire = z.infer<typeof ProtocolWireSchema>;

export const PacketStepSchema = z.object({
  stepIndex: z.number().int().nonnegative(),
  timeMs: z.number().int().nonnegative(),
  fromNodeId: z.string(),
  toNodeId: z.string(),
  protocolName: z.string(),
  arrowLabel: z.string(),
  summary: z.string(),
  status: z.enum(["normal", "retransmission", "dropped", "corrupted"]).default("normal"),
  rawHex: z.string().regex(/^[0-9a-fA-F\s]*$/),
  layers: z.array(DecodedLayerSchema),
});
export type PacketStep = z.infer<typeof PacketStepSchema>;

export const ChaosVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  triggerStepIndex: z.number().int().nonnegative(),
  action: z.enum(["drop_packet", "corrupt_checksum", "expire_tls_cert"]),
  alternateSteps: z.array(PacketStepSchema),
});
export type ChaosVariant = z.infer<typeof ChaosVariantSchema>;

export const ExamChallengeSchema = z.object({
  id: z.string(),
  title: z.string(),
  prompt: z.string(),
  shuffledStepIds: z.array(z.number().int()),
  correctSequence: z.array(z.number().int()),
  hints: z.array(z.string()),
  explanation: z.string(),
});
export type ExamChallenge = z.infer<typeof ExamChallengeSchema>;

export const ProtocolScenarioSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(1).max(120),
  category: z.enum(["web", "transport", "resolution", "security"]),
  summary: z.string().max(1000),
  nodes: z.array(ProtocolNodeSchema).min(2),
  wires: z.array(ProtocolWireSchema).min(1),
  steps: z.array(PacketStepSchema).min(1),
  chaosVariants: z.array(ChaosVariantSchema).optional(),
  examChallenge: ExamChallengeSchema.optional(),
  codeSnippetBridge: z.object({
    language: z.enum(["c", "python", "javascript"]),
    title: z.string(),
    code: z.string(),
  }).optional(),
  osiLayer: z.number().int().min(1).max(7).optional(),
  overviewDescription: z.string().optional(),
  defaultPort: z.string().optional(),
  transportType: z.string().optional(),
  dataFormat: z.string().optional(),
  commonMethods: z.string().optional(),
  rfc: z.string().optional(),
});
export type ProtocolScenario = z.infer<typeof ProtocolScenarioSchema>;

export const ProtocolManifestEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(["web", "transport", "resolution", "security"]),
  summary: z.string(),
  stepCount: z.number().int().positive(),
  hasChaos: z.boolean(),
  hasExam: z.boolean(),
});
export type ProtocolManifestEntry = z.infer<typeof ProtocolManifestEntrySchema>;
