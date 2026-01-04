/**
 * Error codes for squrp operations.
 * Each code represents a specific error condition that can occur during zip/unzip operations.
 */
export declare const SqurpErrorCode: {
  /** Invalid or missing header in the squrp format */
  readonly INVALID_HEADER: "INVALID_HEADER";
  /** Data is corrupted or malformed */
  readonly CORRUPTED_DATA: "CORRUPTED_DATA";
  /** Unsupported version of the squrp format */
  readonly UNSUPPORTED_VERSION: "UNSUPPORTED_VERSION";
  /** File path exceeds maximum allowed length (65535 bytes) */
  readonly PATH_TOO_LONG: "PATH_TOO_LONG";
  /** Total content size exceeds 4GB limit */
  readonly CONTENT_TOO_LARGE: "CONTENT_TOO_LARGE";
  /** Unexpected end of data during parsing */
  readonly UNEXPECTED_END: "UNEXPECTED_END";
  /** Entry data exceeds the bounds of the available data */
  readonly ENTRY_EXCEEDS_BOUNDS: "ENTRY_EXCEEDS_BOUNDS";
  /** Unsupported compression format */
  readonly UNSUPPORTED_COMPRESSION: "UNSUPPORTED_COMPRESSION";
  /** Invalid compression format specified */
  readonly INVALID_COMPRESSION_FORMAT: "INVALID_COMPRESSION_FORMAT";
};
/**
 * Type representing all possible squrp error codes.
 */
export type SqurpErrorCode =
  (typeof SqurpErrorCode)[keyof typeof SqurpErrorCode];
/**
 * Custom error class for squrp operations.
 * Includes an error code for programmatic error handling.
 */
export declare class SqurpError extends Error {
  /** The error code identifying the type of error */
  code: SqurpErrorCode;
  /**
   * Creates a new SqurpError.
   * @param code - The error code identifying the type of error.
   * @param message - A human-readable description of the error.
   */
  constructor(code: SqurpErrorCode, message: string);
}
/**
 * Creates a new SqurpError with the specified code and message.
 * @param code - The error code.
 * @param message - The error message.
 * @returns A new SqurpError instance.
 */
export declare function createError(
  code: SqurpErrorCode,
  message: string,
): SqurpError;
