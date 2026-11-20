import { z } from "zod";
import {
  C_PLAYGROUND_OUTPUT_LIMIT,
  C_PLAYGROUND_SOURCE_LIMIT,
  C_PLAYGROUND_STDIN_LIMIT,
} from "@/lib/c-playground";

const requestId = z.string().min(1).max(100);
const token = z.string().min(32).max(100);
const base = { version: z.literal(1), token, requestId };
const boundedUtf8 = (limit: number) => z.string().max(limit).refine(
  (value) => new TextEncoder().encode(value).byteLength <= limit,
  `Must be no more than ${limit} UTF-8 bytes`,
);

export const cLabParentMessageSchema = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("INIT"), autoInitialize: z.boolean() }).strict(),
  z.object({ ...base, type: z.literal("PREPARE") }).strict(),
  z.object({
    ...base,
    type: z.literal("RUN"),
    language: z.enum(["c", "cpp"]),
    code: boundedUtf8(C_PLAYGROUND_SOURCE_LIMIT),
    stdin: boundedUtf8(C_PLAYGROUND_STDIN_LIMIT),
    closeStdin: z.boolean(),
  }).strict(),
  z.object({ ...base, type: z.literal("INPUT"), value: boundedUtf8(C_PLAYGROUND_STDIN_LIMIT) }).strict(),
  z.object({ ...base, type: z.literal("EOF") }).strict(),
  z.object({ ...base, type: z.literal("STOP") }).strict(),
]);

export const cLabRunnerMessageSchema = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("READY") }).strict(),
  z.object({ ...base, type: z.literal("COMPILER_STATE"), state: z.enum(["idle", "initializing", "ready", "failed"]), message: z.string().max(1_000).optional() }).strict(),
  z.object({ ...base, type: z.literal("PROGRESS"), message: z.string().max(1_000) }).strict(),
  z.object({ ...base, type: z.literal("PHASE"), phase: z.enum(["compiling", "running"]) }).strict(),
  z.object({ ...base, type: z.literal("OUTPUT"), channel: z.enum(["stdout", "stderr"]), text: boundedUtf8(C_PLAYGROUND_OUTPUT_LIMIT) }).strict(),
  z.object({ ...base, type: z.literal("INPUT_STATE"), closed: z.boolean() }).strict(),
  z.object({
    ...base,
    type: z.literal("DONE"),
    outcome: z.enum(["success", "compile-error", "runtime-error", "timeout", "stopped"]),
    stdout: boundedUtf8(C_PLAYGROUND_OUTPUT_LIMIT),
    stderr: boundedUtf8(C_PLAYGROUND_OUTPUT_LIMIT),
    diagnostics: boundedUtf8(C_PLAYGROUND_OUTPUT_LIMIT),
    error: z.string().max(1_000),
    durationMs: z.number().finite().nonnegative().max(600_000),
    exitCode: z.number().int().optional(),
  }).strict(),
  z.object({ ...base, type: z.literal("ERROR"), stage: z.enum(["load", "run"]), message: z.string().max(1_000) }).strict(),
]);

export type CLabParentMessage = z.infer<typeof cLabParentMessageSchema>;
export type CLabRunnerMessage = z.infer<typeof cLabRunnerMessageSchema>;
