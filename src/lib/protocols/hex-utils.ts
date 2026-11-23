/**
 * Hex dump & byte offset utilities for Protocol Explorer
 */

export interface HexByte {
  offset: number;
  hex: string;
  ascii: string;
}

export interface HexRow {
  rowOffset: number;
  formattedOffset: string;
  bytes: HexByte[];
}

/**
 * Normalizes raw hex strings (strips whitespace, ensures even length)
 */
export function cleanHexString(rawHex: string): string {
  return rawHex.replace(/\s+/g, "").toLowerCase();
}

/**
 * Parses raw hex string into array of byte objects
 */
export function parseRawHexToBytes(rawHex: string): HexByte[] {
  const clean = cleanHexString(rawHex);
  const bytes: HexByte[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    const hex = clean.slice(i, i + 2);
    const byteVal = parseInt(hex, 16);
    // Printable ASCII is 32-126
    const ascii = byteVal >= 32 && byteVal <= 126 ? String.fromCharCode(byteVal) : ".";
    bytes.push({
      offset: i / 2,
      hex,
      ascii,
    });
  }
  return bytes;
}

/**
 * Groups bytes into rows of specified column width (16 for desktop, 8 for mobile)
 */
export function buildHexRows(bytes: HexByte[], bytesPerRow: number = 16): HexRow[] {
  const rows: HexRow[] = [];
  for (let i = 0; i < bytes.length; i += bytesPerRow) {
    const rowBytes = bytes.slice(i, i + bytesPerRow);
    rows.push({
      rowOffset: i,
      formattedOffset: i.toString(16).padStart(4, "0"),
      bytes: rowBytes,
    });
  }
  return rows;
}

/**
 * Checks if a byte offset falls within an active byte range [startOffset, endOffset)
 */
export function isOffsetInRange(offset: number, range: [number, number] | null): boolean {
  if (!range) return false;
  return offset >= range[0] && offset < range[1];
}

/**
 * Formats byte slice as human-readable hex string
 */
export function formatByteSlice(rawHex: string, start: number, end: number): string {
  const clean = cleanHexString(rawHex);
  const startChar = start * 2;
  const endChar = end * 2;
  const slice = clean.slice(startChar, endChar);
  const pairs: string[] = [];
  for (let i = 0; i < slice.length; i += 2) {
    pairs.push(slice.slice(i, i + 2));
  }
  return pairs.join(" ");
}
