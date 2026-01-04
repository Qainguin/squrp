import {
  type CompressionFormat,
  compress,
  compressWithBrotli,
  compressWithDeflate,
  compressWithGzip,
  decompress,
  decompressWithBrotli,
  decompressWithDeflate,
  decompressWithGzip,
} from "./core/compression";
import {
  deserializeFileMap,
  type FileMap,
  isMap,
  normalizeInput,
  serializeFileMap,
  type ZipInput,
} from "./core/serialization";
import { createError, SqurpError, SqurpErrorCode } from "./errors";

export {
  SqurpErrorCode,
  SqurpError,
  createError,
  compress,
  decompress,
  compressWithGzip,
  decompressWithGzip,
  compressWithBrotli,
  decompressWithBrotli,
  compressWithDeflate,
  decompressWithDeflate,
  isMap,
  normalizeInput,
  serializeFileMap,
  deserializeFileMap,
};
export type { FileMap, ZipInput, CompressionFormat };
export type { SqurpErrorCode as SqurpErrorCodeType };

/**
 * Options for zip operations.
 */
export interface ZipOptions {
  /** Compression format to use (default: "gzip") */
  compression?: CompressionFormat;
}

/**
 * Options for unzip operations.
 */
export interface UnzipOptions {
  /** Expected compression format (auto-detected if not specified) */
  compression?: CompressionFormat;
}

/**
 * Compresses a file map into a compressed Uint8Array.
 *
 * @param input - A Map or object containing file paths as keys and file contents as values.
 *                Contents can be strings (text files) or Uint8Arrays (binary files).
 * @param options - Optional settings including compression format.
 * @returns A Promise that resolves to a compressed Uint8Array.
 *
 * @example
 * ```ts
 * const files = new Map([
 *   ['hello.txt', 'Hello, World!'],
 *   ['data.bin', new Uint8Array([1, 2, 3, 4, 5])],
 * ]);
 * const zipped = await zip(files);
 * ```
 *
 * @example
 * ```ts
 * // Using brotli compression
 * const zipped = await zip(files, { compression: 'brotli' });
 * ```
 */
export async function zip(
  input: ZipInput,
  options?: ZipOptions,
): Promise<Uint8Array> {
  const map = normalizeInput(input);
  const serialized = await serializeFileMap(map);
  const format = options?.compression ?? "gzip";
  return compress(serialized, format);
}

/**
 * Decompresses data back to a file map.
 *
 * @param data - A compressed Uint8Array to decompress.
 * @param options - Optional settings including compression format.
 * @returns A Promise that resolves to a Map with file paths as keys and file contents as values.
 *          Text files return strings, binary files return Uint8Arrays.
 *
 * @throws {SqurpError} If the data is invalid, corrupted, or has an invalid format.
 *
 * @example
 * ```ts
 * const unzipped = await unzip(zippedData);
 * console.log(unzipped.get('hello.txt')); // 'Hello, World!'
 * console.log(unzipped.get('data.bin'));  // Uint8Array([1, 2, 3, 4, 5])
 * ```
 */
export async function unzip(
  data: Uint8Array,
  options?: UnzipOptions,
): Promise<Map<string, string | Uint8Array>> {
  const format = options?.compression ?? "gzip";
  const decompressed = await decompress(data, format);
  return deserializeFileMap(decompressed);
}

/**
 * Compresses a file map into a Blob for easy download/upload.
 *
 * @param input - A Map or object containing file paths and contents.
 * @param options - Optional settings including compression format.
 * @returns A Promise that resolves to a Blob with MIME type "application/octet-stream".
 *
 * @example
 * ```ts
 * const blob = await zipToBlob(files);
 * const response = await fetch('/api/upload', {
 *   method: 'POST',
 *   body: blob,
 * });
 * ```
 */
export async function zipToBlob(
  input: ZipInput,
  options?: ZipOptions,
): Promise<Blob> {
  const compressed = await zip(input, options);
  return new Blob([compressed] as any, { type: "application/octet-stream" });
}

/**
 * Decompresses from a Blob.
 *
 * @param blob - A Blob containing compressed data.
 * @param options - Optional settings including compression format.
 * @returns A Promise that resolves to a Map with file paths and contents.
 *
 * @throws {SqurpError} If the blob data is invalid or corrupted.
 *
 * @example
 * ```ts
 * const response = await fetch('/api/download').then(r => r.blob());
 * const unzipped = await unzipFromBlob(response);
 * ```
 */
export async function unzipFromBlob(
  blob: Blob,
  options?: UnzipOptions,
): Promise<Map<string, string | Uint8Array>> {
  const arrayBuffer = await blob.arrayBuffer();
  return unzip(new Uint8Array(arrayBuffer), options);
}

/**
 * Compresses a file map into a base64-encoded string for JSON transport.
 *
 * @param input - A Map or object containing file paths and contents.
 * @param options - Optional settings including compression format.
 * @returns A Promise that resolves to a base64-encoded string representing the compressed data.
 *
 * @example
 * ```ts
 * const base64 = await zipToBase64(files);
 * await fetch('/api/save', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ data: base64 }),
 * });
 * ```
 */
export async function zipToBase64(
  input: ZipInput,
  options?: ZipOptions,
): Promise<string> {
  const compressed = await zip(input, options);
  const binary = Array.from(compressed, (byte) =>
    String.fromCharCode(byte),
  ).join("");
  return btoa(binary);
}

/**
 * Decompresses from a base64-encoded string.
 *
 * @param base64 - A base64-encoded string containing compressed data.
 * @param options - Optional settings including compression format.
 * @returns A Promise that resolves to a Map with file paths and contents.
 *
 * @throws {SqurpError} If the base64 data is invalid or corrupted.
 *
 * @example
 * ```ts
 * const response = await fetch('/api/load').then(r => r.json());
 * const unzipped = await unzipFromBase64(response.data);
 * ```
 */
export async function unzipFromBase64(
  base64: string,
  options?: UnzipOptions,
): Promise<Map<string, string | Uint8Array>> {
  const binary = atob(base64);
  const binaryLen = binary.length;
  const bytes = new Uint8Array(binaryLen);
  for (let i = 0; i < binaryLen; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return unzip(bytes, options);
}
