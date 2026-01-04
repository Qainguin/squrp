export interface FileMap {
  [path: string]: string | Uint8Array;
}

export type ZipInput = FileMap | Map<string, string | Uint8Array>;

export const SqurpErrorCode = {
  INVALID_HEADER: "INVALID_HEADER",
  CORRUPTED_DATA: "CORRUPTED_DATA",
  UNSUPPORTED_VERSION: "UNSUPPORTED_VERSION",
  PATH_TOO_LONG: "PATH_TOO_LONG",
  CONTENT_TOO_LARGE: "CONTENT_TOO_LARGE",
  UNEXPECTED_END: "UNEXPECTED_END",
  ENTRY_EXCEEDS_BOUNDS: "ENTRY_EXCEEDS_BOUNDS",
} as const;

export type SqurpErrorCode =
  (typeof SqurpErrorCode)[keyof typeof SqurpErrorCode];

export class SqurpError extends Error {
  code: SqurpErrorCode;

  constructor(code: SqurpErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "SqurpError";
  }
}

function createError(code: SqurpErrorCode, message: string): SqurpError {
  return new SqurpError(code, message);
}

const HEADER = new Uint8Array([0x73, 0x71, 0x75, 0x69, 0x72, 0x70, 0x00]);

function isMap(input: ZipInput): input is Map<string, string | Uint8Array> {
  return input instanceof Map;
}

function normalizeInput(input: ZipInput): Map<string, string | Uint8Array> {
  if (isMap(input)) {
    return input;
  }
  return new Map(Object.entries(input));
}

async function encodeText(text: string): Promise<Uint8Array> {
  return new TextEncoder().encode(text);
}

async function decodeText(bytes: Uint8Array): Promise<string> {
  return new TextDecoder().decode(bytes);
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

function encodeLE(value: number, bytes: number): Uint8Array {
  if (value < 0 || !Number.isInteger(value)) {
    throw createError(
      SqurpErrorCode.CORRUPTED_DATA,
      "Invalid integer value for encoding",
    );
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

async function compressWithGzip(data: Uint8Array): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const stream = new Blob([data] as any)
    .stream()
    .pipeThrough(
      new CompressionStream("gzip") as unknown as TransformStream<
        Uint8Array,
        Uint8Array
      >,
    );
  const reader = stream.getReader();
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    chunks.push(result.value);
  }
  return concatUint8Arrays(chunks);
}

async function decompressWithGzip(data: Uint8Array): Promise<Uint8Array> {
  try {
    const chunks: Uint8Array[] = [];
    const stream = new Blob([data] as any)
      .stream()
      .pipeThrough(
        new DecompressionStream("gzip") as unknown as TransformStream<
          Uint8Array,
          Uint8Array
        >,
      );
    const reader = stream.getReader();
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      chunks.push(result.value);
    }
    return concatUint8Arrays(chunks);
  } catch (error) {
    if (error instanceof SqurpError) {
      throw error;
    }
    throw createError(
      SqurpErrorCode.CORRUPTED_DATA,
      "Failed to decompress data: invalid or corrupted gzip data",
    );
  }
}

async function serializeFileMap(
  map: Map<string, string | Uint8Array>,
): Promise<Uint8Array> {
  const entries: Array<{
    path: string;
    isBinary: boolean;
    content: Uint8Array;
  }> = [];

  const entriesIterator = map.entries();
  let entryResult = entriesIterator.next();
  while (!entryResult.done) {
    const [path, content] = entryResult.value;
    if (path.length > 65535) {
      throw createError(SqurpErrorCode.PATH_TOO_LONG, `Path too long: ${path}`);
    }
    const totalSize =
      entries.reduce((sum, e) => sum + e.content.length, 0) + content.length;
    if (totalSize > 0xffffffff) {
      throw createError(
        SqurpErrorCode.CONTENT_TOO_LARGE,
        "Total content size exceeds 4GB limit",
      );
    }
    const contentBytes =
      typeof content === "string" ? await encodeText(content) : content;
    entries.push({
      path,
      isBinary: typeof content !== "string",
      content: contentBytes,
    });
    entryResult = entriesIterator.next();
  }

  const serializedEntries: Uint8Array[] = [];
  for (const entry of entries) {
    const pathBytes = new TextEncoder().encode(entry.path);
    const contentLengthBytes = encodeLE(entry.content.length, 4);
    const pathLengthBytes = encodeLE(pathBytes.length, 2);
    const flagByte = new Uint8Array([entry.isBinary ? 1 : 0]);
    serializedEntries.push(
      await concatUint8Arrays([
        pathLengthBytes,
        contentLengthBytes,
        flagByte,
        pathBytes,
        entry.content,
      ]),
    );
  }

  const entryData = await concatUint8Arrays(serializedEntries);

  const entryCountBytes = encodeLE(entries.length, 4);
  const totalLength = HEADER.length + 4 + 4 + entryData.length;
  const totalLengthBytes = encodeLE(totalLength, 4);

  return concatUint8Arrays([
    HEADER,
    totalLengthBytes,
    entryCountBytes,
    entryData,
  ]);
}

async function deserializeFileMap(
  data: Uint8Array,
): Promise<Map<string, string | Uint8Array>> {
  let offset = 0;

  const headerLen = HEADER.length;
  for (let i = 0; i < headerLen; i++) {
    if (data[i] !== HEADER[i]) {
      throw createError(
        SqurpErrorCode.INVALID_HEADER,
        "Invalid squrp format: invalid header",
      );
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

    const path = new TextDecoder().decode(pathBytes);
    result.set(path, isBinary ? content : await decodeText(content));
  }

  return result;
}

export async function zip(input: ZipInput): Promise<Uint8Array> {
  const map = normalizeInput(input);
  const serialized = await serializeFileMap(map);
  return compressWithGzip(serialized);
}

export async function unzip(
  data: Uint8Array,
): Promise<Map<string, string | Uint8Array>> {
  const decompressed = await decompressWithGzip(data);
  return deserializeFileMap(decompressed);
}

export async function zipToBlob(input: ZipInput): Promise<Blob> {
  const compressed = await zip(input);
  return new Blob([compressed] as any, { type: "application/octet-stream" });
}

export async function unzipFromBlob(
  blob: Blob,
): Promise<Map<string, string | Uint8Array>> {
  const arrayBuffer = await blob.arrayBuffer();
  return unzip(new Uint8Array(arrayBuffer));
}

export async function zipToBase64(input: ZipInput): Promise<string> {
  const compressed = await zip(input);
  const binary = Array.from(compressed, (byte) =>
    String.fromCharCode(byte),
  ).join("");
  return btoa(binary);
}

export async function unzipFromBase64(
  base64: string,
): Promise<Map<string, string | Uint8Array>> {
  const binary = atob(base64);
  const binaryLen = binary.length;
  const bytes = new Uint8Array(binaryLen);
  for (let i = 0; i < binaryLen; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return unzip(bytes);
}
