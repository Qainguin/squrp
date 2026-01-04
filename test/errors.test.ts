import { describe, expect, it } from "bun:test";
import { SqurpError, SqurpErrorCode, unzip, zip } from "../src/index";

describe("SqurpError", () => {
  it("should create error with code and message", () => {
    const error = new SqurpError(SqurpErrorCode.INVALID_HEADER, "Test message");
    expect(error.code).toBe(SqurpErrorCode.INVALID_HEADER);
    expect(error.message).toBe("Test message");
    expect(error.name).toBe("SqurpError");
    expect(error instanceof Error).toBe(true);
  });

  it("should have all error codes defined", () => {
    expect(SqurpErrorCode.INVALID_HEADER).toBe("INVALID_HEADER");
    expect(SqurpErrorCode.CORRUPTED_DATA).toBe("CORRUPTED_DATA");
    expect(SqurpErrorCode.UNSUPPORTED_VERSION).toBe("UNSUPPORTED_VERSION");
    expect(SqurpErrorCode.PATH_TOO_LONG).toBe("PATH_TOO_LONG");
    expect(SqurpErrorCode.CONTENT_TOO_LARGE).toBe("CONTENT_TOO_LARGE");
    expect(SqurpErrorCode.UNEXPECTED_END).toBe("UNEXPECTED_END");
    expect(SqurpErrorCode.ENTRY_EXCEEDS_BOUNDS).toBe("ENTRY_EXCEEDS_BOUNDS");
  });
});

describe("error handling", () => {
  it("should throw SqurpError for invalid gzip data", async () => {
    const invalidData = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    let caughtError: any;
    try {
      await unzip(invalidData);
    } catch (error) {
      caughtError = error;
    }
    expect(caughtError).not.toBeUndefined();
    expect(caughtError.name).toBe("SqurpError");
    expect(caughtError.code).toBe(SqurpErrorCode.CORRUPTED_DATA);
  });

  it("should throw SqurpError for truncated gzip data", async () => {
    const files = new Map<string, string | Uint8Array>();
    files.set("test.txt", "content");
    const zipped = await zip(files);
    const truncated = zipped.slice(0, zipped.length - 5);
    let caughtError: any;
    try {
      await unzip(truncated);
    } catch (error) {
      caughtError = error;
    }
    expect(caughtError).not.toBeUndefined();
    expect(caughtError.name).toBe("SqurpError");
    expect(caughtError.code).toBe(SqurpErrorCode.CORRUPTED_DATA);
  });

  it("should throw SqurpError for path too long", async () => {
    const files = new Map<string, string | Uint8Array>();
    const longPath = "a".repeat(70000);
    files.set(longPath, "content");
    let caughtError: any;
    try {
      await zip(files);
    } catch (error) {
      caughtError = error;
    }
    expect(caughtError).not.toBeUndefined();
    expect(caughtError.name).toBe("SqurpError");
    expect(caughtError.code).toBe(SqurpErrorCode.PATH_TOO_LONG);
  });
});
