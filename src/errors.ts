/**
 * Error codes for squrp operations.
 * Each code represents a specific error condition that can occur during zip/unzip operations.
 */
export const SqurpErrorCode = {
  /** Invalid or missing header in the squrp format */
  INVALID_HEADER: "INVALID_HEADER",
  /** Data is corrupted or malformed */
  CORRUPTED_DATA: "CORRUPTED_DATA",
  /** Unsupported version of the squrp format */
  UNSUPPORTED_VERSION: "UNSUPPORTED_VERSION",
  /** File path exceeds maximum allowed length (65535 bytes) */
  PATH_TOO_LONG: "PATH_TOO_LONG",
  /** Total content size exceeds 4GB limit */
  CONTENT_TOO_LARGE: "CONTENT_TOO_LARGE",
  /** Unexpected end of data during parsing */
  UNEXPECTED_END: "UNEXPECTED_END",
  /** Entry data exceeds the bounds of the available data */
  ENTRY_EXCEEDS_BOUNDS: "ENTRY_EXCEEDS_BOUNDS",
  /** Unsupported compression format */
  UNSUPPORTED_COMPRESSION: "UNSUPPORTED_COMPRESSION",
  /** Invalid compression format specified */
  INVALID_COMPRESSION_FORMAT: "INVALID_COMPRESSION_FORMAT",
} as const;

/**
 * Type representing all possible squrp error codes.
 */
export type SqurpErrorCode =
  (typeof SqurpErrorCode)[keyof typeof SqurpErrorCode];

/**
 * Custom error class for squrp operations.
 * Includes an error code for programmatic error handling.
 */
export class SqurpError extends Error {
  /** The error code identifying the type of error */
  code: SqurpErrorCode;

  /**
   * Creates a new SqurpError.
   * @param code - The error code identifying the type of error.
   * @param message - A human-readable description of the error.
   */
  constructor(code: SqurpErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "SqurpError";
  }
}

/**
 * Creates a new SqurpError with the specified code and message.
 * @param code - The error code.
 * @param message - The error message.
 * @returns A new SqurpError instance.
 */
export function createError(code: SqurpErrorCode, message: string): SqurpError {
  return new SqurpError(code, message);
}
