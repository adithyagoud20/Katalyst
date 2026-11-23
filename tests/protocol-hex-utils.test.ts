import { describe, it, expect } from "vitest";
import {
  cleanHexString,
  parseRawHexToBytes,
  buildHexRows,
  isOffsetInRange,
  formatByteSlice,
} from "@/lib/protocols/hex-utils";

describe("Protocol Hex Utilities", () => {
  it("cleans whitespace and normalizes case", () => {
    expect(cleanHexString("  52 54 00 12  34 56  ")).toBe("525400123456");
    expect(cleanHexString("DEADBEEF")).toBe("deadbeef");
  });

  it("parses raw hex string into bytes with printable ASCII", () => {
    // 0x41 = 'A', 0x42 = 'B', 0x00 = '.', 0x20 = ' '
    const hex = "41420020";
    const bytes = parseRawHexToBytes(hex);
    expect(bytes).toHaveLength(4);
    expect(bytes[0]).toEqual({ offset: 0, hex: "41", ascii: "A" });
    expect(bytes[1]).toEqual({ offset: 1, hex: "42", ascii: "B" });
    expect(bytes[2]).toEqual({ offset: 2, hex: "00", ascii: "." });
    expect(bytes[3]).toEqual({ offset: 3, hex: "20", ascii: " " });
  });

  it("builds 16-byte desktop rows and 8-byte mobile rows", () => {
    const hex = "000102030405060708090a0b0c0d0e0f10111213";
    const bytes = parseRawHexToBytes(hex);
    expect(bytes).toHaveLength(20);

    // 16 bytes per row
    const rows16 = buildHexRows(bytes, 16);
    expect(rows16).toHaveLength(2);
    expect(rows16[0].rowOffset).toBe(0);
    expect(rows16[0].formattedOffset).toBe("0000");
    expect(rows16[0].bytes).toHaveLength(16);
    expect(rows16[1].rowOffset).toBe(16);
    expect(rows16[1].formattedOffset).toBe("0010");
    expect(rows16[1].bytes).toHaveLength(4);

    // 8 bytes per row (mobile)
    const rows8 = buildHexRows(bytes, 8);
    expect(rows8).toHaveLength(3);
    expect(rows8[0].bytes).toHaveLength(8);
    expect(rows8[1].bytes).toHaveLength(8);
    expect(rows8[2].bytes).toHaveLength(4);
  });

  it("evaluates byte offset in range accurately", () => {
    expect(isOffsetInRange(5, null)).toBe(false);
    expect(isOffsetInRange(5, [2, 6])).toBe(true);
    expect(isOffsetInRange(2, [2, 6])).toBe(true);
    expect(isOffsetInRange(6, [2, 6])).toBe(false); // Exclusive end
    expect(isOffsetInRange(1, [2, 6])).toBe(false);
  });

  it("formats byte slices cleanly as spaced hex pairs", () => {
    const raw = "525400123456";
    expect(formatByteSlice(raw, 0, 3)).toBe("52 54 00");
    expect(formatByteSlice(raw, 3, 6)).toBe("12 34 56");
  });
});
