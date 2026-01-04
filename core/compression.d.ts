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
export declare function compress(
  data: Uint8Array,
  format?: CompressionFormat,
): Promise<Uint8Array>;
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
export declare function decompress(
  data: Uint8Array,
  format?: CompressionFormat,
): Promise<Uint8Array>;
/**
 * Compresses data using gzip compression (default).
 * @param data - The data to compress.
 * @returns A Promise resolving to the gzip-compressed data.
 */
export declare function compressWithGzip(data: Uint8Array): Promise<Uint8Array>;
/**
 * Decompresses gzip-compressed data.
 * @param data - The gzip-compressed data to decompress.
 * @returns A Promise resolving to the decompressed data.
 *
 * @throws {SqurpError} CORRUPTED_DATA if the gzip data is invalid or corrupted.
 */
export declare function decompressWithGzip(
  data: Uint8Array,
): Promise<Uint8Array>;
/**
 * Compresses data using brotli compression.
 * @param data - The data to compress.
 * @returns A Promise resolving to the brotli-compressed data.
 */
export declare function compressWithBrotli(
  data: Uint8Array,
): Promise<Uint8Array>;
/**
 * Decompresses brotli-compressed data.
 * @param data - The brotli-compressed data to decompress.
 * @returns A Promise resolving to the decompressed data.
 *
 * @throws {SqurpError} CORRUPTED_DATA if the brotli data is invalid or corrupted.
 */
export declare function decompressWithBrotli(
  data: Uint8Array,
): Promise<Uint8Array>;
/**
 * Compresses data using deflate compression.
 * @param data - The data to compress.
 * @returns A Promise resolving to the deflate-compressed data.
 */
export declare function compressWithDeflate(
  data: Uint8Array,
): Promise<Uint8Array>;
/**
 * Decompresses deflate-compressed data.
 * @param data - The deflate-compressed data to decompress.
 * @returns A Promise resolving to the decompressed data.
 *
 * @throws {SqurpError} CORRUPTED_DATA if the deflate data is invalid or corrupted.
 */
export declare function decompressWithDeflate(
  data: Uint8Array,
): Promise<Uint8Array>;
