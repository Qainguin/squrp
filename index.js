// src/errors.ts
var SqurpErrorCode = {
  INVALID_HEADER: "INVALID_HEADER",
  CORRUPTED_DATA: "CORRUPTED_DATA",
  UNSUPPORTED_VERSION: "UNSUPPORTED_VERSION",
  PATH_TOO_LONG: "PATH_TOO_LONG",
  CONTENT_TOO_LARGE: "CONTENT_TOO_LARGE",
  UNEXPECTED_END: "UNEXPECTED_END",
  ENTRY_EXCEEDS_BOUNDS: "ENTRY_EXCEEDS_BOUNDS",
  UNSUPPORTED_COMPRESSION: "UNSUPPORTED_COMPRESSION",
  INVALID_COMPRESSION_FORMAT: "INVALID_COMPRESSION_FORMAT",
};

class SqurpError extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "SqurpError";
  }
}
function createError(code, message) {
  return new SqurpError(code, message);
}

// src/core/compression.ts
async function compress(data, format = "gzip") {
  const chunks = [];
  const stream = new Blob([data])
    .stream()
    .pipeThrough(new CompressionStream(format));
  const reader = stream.getReader();
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    chunks.push(result.value);
  }
  return concatUint8Arrays(chunks);
}
async function decompress(data, format = "gzip") {
  try {
    const chunks = [];
    const stream = new Blob([data])
      .stream()
      .pipeThrough(new DecompressionStream(format));
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
      `Failed to decompress data: invalid or corrupted ${format} data`,
    );
  }
}
async function compressWithGzip(data) {
  return compress(data, "gzip");
}
async function decompressWithGzip(data) {
  return decompress(data, "gzip");
}
async function compressWithBrotli(data) {
  return compress(data, "brotli");
}
async function decompressWithBrotli(data) {
  return decompress(data, "brotli");
}
async function compressWithDeflate(data) {
  return compress(data, "deflate");
}
async function decompressWithDeflate(data) {
  return decompress(data, "deflate");
}
async function concatUint8Arrays(arrays) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// src/core/serialization.ts
var HEADER = new Uint8Array([115, 113, 117, 105, 114, 112, 0]);
function isMap(input) {
  return input instanceof Map;
}
function normalizeInput(input) {
  if (isMap(input)) {
    return input;
  }
  return new Map(Object.entries(input));
}
async function encodeText(text) {
  return new TextEncoder().encode(text);
}
async function decodeText(bytes) {
  return new TextDecoder().decode(bytes);
}
function encodeLE(value, bytes) {
  if (value < 0 || !Number.isInteger(value)) {
    throw createError(
      SqurpErrorCode.CORRUPTED_DATA,
      "Invalid integer value for encoding",
    );
  }
  const result = new Uint8Array(bytes);
  for (let i = 0; i < bytes; i++) {
    result[i] = value & 255;
    value >>= 8;
  }
  return result;
}
function decodeLE(bytes) {
  let result = 0;
  const len = bytes.length;
  for (let i = len - 1; i >= 0; i--) {
    const byte = bytes[i] ?? 0;
    result = (result << 8) | byte;
  }
  return result;
}
async function concatUint8Arrays2(arrays) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}
async function serializeFileMap(map) {
  const entries = [];
  const entriesIterator = map.entries();
  let entryResult = entriesIterator.next();
  while (!entryResult.done) {
    const [path, content] = entryResult.value;
    if (path.length > 65535) {
      throw createError(SqurpErrorCode.PATH_TOO_LONG, `Path too long: ${path}`);
    }
    const totalSize =
      entries.reduce((sum, e) => sum + e.content.length, 0) + content.length;
    if (totalSize > 4294967295) {
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
  const serializedEntries = [];
  for (const entry of entries) {
    const pathBytes = new TextEncoder().encode(entry.path);
    const contentLengthBytes = encodeLE(entry.content.length, 4);
    const pathLengthBytes = encodeLE(pathBytes.length, 2);
    const flagByte = new Uint8Array([entry.isBinary ? 1 : 0]);
    serializedEntries.push(
      await concatUint8Arrays2([
        pathLengthBytes,
        contentLengthBytes,
        flagByte,
        pathBytes,
        entry.content,
      ]),
    );
  }
  const entryData = await concatUint8Arrays2(serializedEntries);
  const entryCountBytes = encodeLE(entries.length, 4);
  const totalLength = HEADER.length + 4 + 4 + entryData.length;
  const totalLengthBytes = encodeLE(totalLength, 4);
  return concatUint8Arrays2([
    HEADER,
    totalLengthBytes,
    entryCountBytes,
    entryData,
  ]);
}
async function deserializeFileMap(data) {
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
  const result = new Map();
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

// src/index.ts
async function zip(input, options) {
  const map = normalizeInput(input);
  const serialized = await serializeFileMap(map);
  const format = options?.compression ?? "gzip";
  return compress(serialized, format);
}
async function unzip(data, options) {
  const format = options?.compression ?? "gzip";
  const decompressed = await decompress(data, format);
  return deserializeFileMap(decompressed);
}
async function zipToBlob(input, options) {
  const compressed = await zip(input, options);
  return new Blob([compressed], { type: "application/octet-stream" });
}
async function unzipFromBlob(blob, options) {
  const arrayBuffer = await blob.arrayBuffer();
  return unzip(new Uint8Array(arrayBuffer), options);
}
async function zipToBase64(input, options) {
  const compressed = await zip(input, options);
  const binary = Array.from(compressed, (byte) =>
    String.fromCharCode(byte),
  ).join("");
  return btoa(binary);
}
async function unzipFromBase64(base64, options) {
  const binary = atob(base64);
  const binaryLen = binary.length;
  const bytes = new Uint8Array(binaryLen);
  for (let i = 0; i < binaryLen; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return unzip(bytes, options);
}
export {
  zipToBlob,
  zipToBase64,
  zip,
  unzipFromBlob,
  unzipFromBase64,
  unzip,
  serializeFileMap,
  normalizeInput,
  isMap,
  deserializeFileMap,
  decompressWithGzip,
  decompressWithDeflate,
  decompressWithBrotli,
  decompress,
  createError,
  compressWithGzip,
  compressWithDeflate,
  compressWithBrotli,
  compress,
  SqurpErrorCode,
  SqurpError,
};
