import { createError, SqurpErrorCode } from "../errors";

export interface FileMap {
  [path: string]: string | Uint8Array;
}

export type ZipInput = FileMap | Map<string, string | Uint8Array>;

const HEADER = new Uint8Array([0x73, 0x71, 0x75, 0x72, 0x70, 0x00]);

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function isMap(input: ZipInput): input is Map<string, string | Uint8Array> {
  return input instanceof Map;
}

export function normalizeInput(input: ZipInput): Map<string, string | Uint8Array> {
  if (isMap(input)) {
    return input;
  }
  return new Map(Object.entries(input));
}

function encodeTextSync(text: string): Uint8Array {
  return textEncoder.encode(text);
}

function decodeTextSync(bytes: Uint8Array): string {
  return textDecoder.decode(bytes);
}

function encodeLE(value: number, bytes: number): Uint8Array {
  if (value < 0 || !Number.isInteger(value)) {
    throw createError(SqurpErrorCode.CORRUPTED_DATA, "Invalid integer value for encoding");
  }
  const result = new Uint8Array(bytes);
  for (let i = 0; i < bytes; i++) {
    result[i] = value & 0xff;
    value >>= 8;
  }
  return result;
}

function decodeLE(bytes: Uint8Array): number {
  let result = 0;
  const len = bytes.length;
  for (let i = len - 1; i >= 0; i--) {
    const byte = bytes[i] ?? 0;
    result = (result << 8) | byte;
  }
  return result;
}

async function concatUint8Arrays(arrays: Uint8Array[]): Promise<Uint8Array> {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export async function serializeFileMap(map: Map<string, string | Uint8Array>): Promise<Uint8Array> {
  const entries: Array<{
    path: string;
    isBinary: boolean;
    content: Uint8Array;
  }> = [];

  let totalContentSize = 0;
  const entriesIterator = map.entries();
  let entryResult = entriesIterator.next();
  while (!entryResult.done) {
    const [path, content] = entryResult.value;
    if (path.length > 65535) {
      throw createError(SqurpErrorCode.PATH_TOO_LONG, `Path too long: ${path}`);
    }
    const contentBytes = typeof content === "string" ? encodeTextSync(content) : content;
    totalContentSize += contentBytes.length;
    if (totalContentSize > 0xffffffff) {
      throw createError(SqurpErrorCode.CONTENT_TOO_LARGE, "Total content size exceeds 4GB limit");
    }
    entries.push({
      path,
      isBinary: typeof content !== "string",
      content: contentBytes,
    });
    entryResult = entriesIterator.next();
  }

  let serializedEntriesSize = 0;
  const serializedEntries: Uint8Array[] = new Array(entries.length);
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const pathBytes = encodeTextSync(entry.path);
    const pathLength = pathBytes.length;
    const contentLength = entry.content.length;
    const entrySize = 2 + 4 + 1 + pathLength + contentLength;
    serializedEntriesSize += entrySize;
    const entryBytes = new Uint8Array(entrySize);
    serializedEntries[i] = entryBytes;
    const pathLengthBytes = encodeLE(pathLength, 2);
    const contentLengthBytes = encodeLE(contentLength, 4);
    entryBytes.set(pathLengthBytes, 0);
    entryBytes.set(contentLengthBytes, 2);
    entryBytes[6] = entry.isBinary ? 1 : 0;
    entryBytes.set(pathBytes, 7);
    entryBytes.set(entry.content, 7 + pathLength);
  }

  const entryData = await concatUint8Arrays(serializedEntries);

  const entryCountBytes = encodeLE(entries.length, 4);
  const totalLength = HEADER.length + 4 + 4 + entryData.length;
  const totalLengthBytes = encodeLE(totalLength, 4);

  return concatUint8Arrays([HEADER, totalLengthBytes, entryCountBytes, entryData]);
}

export async function deserializeFileMap(
  data: Uint8Array,
): Promise<Map<string, string | Uint8Array>> {
  let offset = 0;

  const headerLen = HEADER.length;
  for (let i = 0; i < headerLen; i++) {
    if (data[i] !== HEADER[i]) {
      throw createError(SqurpErrorCode.INVALID_HEADER, "Invalid squrp format: invalid header");
    }
  }
  offset += headerLen;

  if (offset + 4 > data.length) {
    throw createError(
      SqurpErrorCode.UNEXPECTED_END,
      "Invalid squrp format: unexpected end of data while reading total length",
    );
  }
  const totalLength = decodeLE(data.slice(offset, offset + 4));
  offset += 4;

  if (totalLength !== data.length) {
    throw createError(
      SqurpErrorCode.CORRUPTED_DATA,
      `Invalid squrp format: expected ${totalLength} bytes, got ${data.length}`,
    );
  }

  if (offset + 4 > data.length) {
    throw createError(
      SqurpErrorCode.UNEXPECTED_END,
      "Invalid squrp format: unexpected end of data while reading entry count",
    );
  }
  const entryCount = decodeLE(data.slice(offset, offset + 4));
  offset += 4;

  const result = new Map<string, string | Uint8Array>();

  for (let i = 0; i < entryCount; i++) {
    if (offset + 7 > data.length) {
      throw createError(
        SqurpErrorCode.UNEXPECTED_END,
        "Invalid squrp format: unexpected end of data while reading entry header",
      );
    }

    const pathLength = decodeLE(data.slice(offset, offset + 2));
    offset += 2;

    const contentLength = decodeLE(data.slice(offset, offset + 4));
    offset += 4;

    const isBinary = data[offset] === 1;
    offset += 1;

    if (offset + pathLength + contentLength > data.length) {
      throw createError(
        SqurpErrorCode.ENTRY_EXCEEDS_BOUNDS,
        "Invalid squrp format: entry exceeds data bounds",
      );
    }

    const pathBytes = data.slice(offset, offset + pathLength);
    offset += pathLength;

    const content = data.slice(offset, offset + contentLength);
    offset += contentLength;

    const path = decodeTextSync(pathBytes);
    result.set(path, isBinary ? content : decodeTextSync(content));
  }

  return result;
}
