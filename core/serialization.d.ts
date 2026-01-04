/**
 * A record type representing a file map with string paths and string or binary content.
 * Keys are file paths, values are either text content (string) or binary content (Uint8Array).
 */
export interface FileMap {
  [path: string]: string | Uint8Array;
}
/**
 * The input type for zip operations.
 * Can be either a FileMap (object) or a Map with string paths and string/Uint8Array values.
 */
export type ZipInput = FileMap | Map<string, string | Uint8Array>;
/**
 * Type guard to check if input is a Map.
 * @param input - The input to check.
 * @returns True if input is a Map.
 */
export declare function isMap(
  input: ZipInput,
): input is Map<string, string | Uint8Array>;
/**
 * Normalizes input to a Map, converting objects if necessary.
 * @param input - Either a Map or a plain object.
 * @returns A Map with string keys and string/Uint8Array values.
 */
export declare function normalizeInput(
  input: ZipInput,
): Map<string, string | Uint8Array>;
/**
 * Serializes a file map into the binary squrp format.
 * The format consists of:
 * - 7-byte header: "squrp\0"
 * - 4-byte total length (big-endian)
 * - 4-byte entry count (big-endian)
 * - Entry data:
 *   - 2-byte path length
 *   - 4-byte content length
 *   - 1-byte flag (1=binary, 0=text)
 *   - path bytes
 *   - content bytes
 *
 * @param map - A Map with file paths as keys and content as values.
 * @returns A Promise resolving to the serialized binary data (uncompressed).
 *
 * @throws {SqurpError} PATH_TOO_LONG if any path exceeds 65535 bytes.
 * @throws {SqurpError} CONTENT_TOO_LARGE if total content exceeds 4GB.
 */
export declare function serializeFileMap(
  map: Map<string, string | Uint8Array>,
): Promise<Uint8Array>;
/**
 * Deserializes binary data in the squrp format back to a file map.
 *
 * @param data - Binary data in the squrp format.
 * @returns A Promise resolving to a Map with file paths as keys and content as values.
 *
 * @throws {SqurpError} INVALID_HEADER if the header is invalid.
 * @throws {SqurpError} CORRUPTED_DATA if the length field doesn't match actual data.
 * @throws {SqurpError} UNEXPECTED_END if data is truncated.
 * @throws {SqurpError} ENTRY_EXCEEDS_BOUNDS if an entry exceeds available data.
 */
export declare function deserializeFileMap(
  data: Uint8Array,
): Promise<Map<string, string | Uint8Array>>;
