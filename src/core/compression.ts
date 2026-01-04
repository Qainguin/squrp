import { createError, SqurpError, SqurpErrorCode } from "../errors";

/**
 * Supported compression formats.
 * - "gzip": GNU zip compression (default, best compatibility)
 * - "brotli": Brotli compression (best compression ratio)
 * - "deflate": Deflate compression (fast, moderate compression)
 */
export type CompressionFormat = "gzip" | "brotli" | "deflate";

/**
 * Compresses data using the specified compression format via the CompressionStream API.
 *
 * @param data - The data to compress.
 * @param format - The compression format to use (default: "gzip").
 * @returns A Promise resolving to the compressed data.
 *
 * @throws {SqurpError} UNSUPPORTED_COMPRESSION if the browser doesn't support the format.
 */
export async function compress(
  data: Uint8Array,
  format: CompressionFormat = "gzip",
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const stream = new Blob([data] as any)
    .stream()
    .pipeThrough(
      new CompressionStream(format) as unknown as TransformStream<
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

/**
 * Decompresses data using the specified compression format via the DecompressionStream API.
 *
 * @param data - The compressed data to decompress.
 * @param format - The compression format (default: "gzip").
 * @returns A Promise resolving to the decompressed data.
 *
 * @throws {SqurpError} CORRUPTED_DATA if the data is invalid or corrupted.
 * @throws {SqurpError} UNSUPPORTED_COMPRESSION if the browser doesn't support the format.
 */
export async function decompress(
  data: Uint8Array,
  format: CompressionFormat = "gzip",
): Promise<Uint8Array> {
  try {
    const chunks: Uint8Array[] = [];
    const stream = new Blob([data] as any)
      .stream()
      .pipeThrough(
        new DecompressionStream(format) as unknown as TransformStream<
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
      `Failed to decompress data: invalid or corrupted ${format} data`,
    );
  }
}

/**
 * Compresses data using gzip compression (default).
 * @param data - The data to compress.
 * @returns A Promise resolving to the gzip-compressed data.
 */
export async function compressWithGzip(data: Uint8Array): Promise<Uint8Array> {
  return compress(data, "gzip");
}

/**
 * Decompresses gzip-compressed data.
 * @param data - The gzip-compressed data to decompress.
 * @returns A Promise resolving to the decompressed data.
 *
 * @throws {SqurpError} CORRUPTED_DATA if the gzip data is invalid or corrupted.
 */
export async function decompressWithGzip(
  data: Uint8Array,
): Promise<Uint8Array> {
  return decompress(data, "gzip");
}

/**
 * Compresses data using brotli compression.
 * @param data - The data to compress.
 * @returns A Promise resolving to the brotli-compressed data.
 */
export async function compressWithBrotli(
  data: Uint8Array,
): Promise<Uint8Array> {
  return compress(data, "brotli");
}

/**
 * Decompresses brotli-compressed data.
 * @param data - The brotli-compressed data to decompress.
 * @returns A Promise resolving to the decompressed data.
 *
 * @throws {SqurpError} CORRUPTED_DATA if the brotli data is invalid or corrupted.
 */
export async function decompressWithBrotli(
  data: Uint8Array,
): Promise<Uint8Array> {
  return decompress(data, "brotli");
}

/**
 * Compresses data using deflate compression.
 * @param data - The data to compress.
 * @returns A Promise resolving to the deflate-compressed data.
 */
export async function compressWithDeflate(
  data: Uint8Array,
): Promise<Uint8Array> {
  return compress(data, "deflate");
}

/**
 * Decompresses deflate-compressed data.
 * @param data - The deflate-compressed data to decompress.
 * @returns A Promise resolving to the decompressed data.
 *
 * @throws {SqurpError} CORRUPTED_DATA if the deflate data is invalid or corrupted.
 */
export async function decompressWithDeflate(
  data: Uint8Array,
): Promise<Uint8Array> {
  return decompress(data, "deflate");
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
