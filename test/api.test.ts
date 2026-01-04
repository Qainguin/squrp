import { describe, expect, it } from "bun:test";
import { unzip, unzipFromBase64, unzipFromBlob, zip, zipToBase64, zipToBlob } from "../src/index";

describe("zip/unzip roundtrip", () => {
  it("should roundtrip string content", async () => {
    const files = new Map<string, string | Uint8Array>();
    files.set("hello.txt", "Hello, World!");
    files.set("config.json", '{"version": 1}');
    const zipped = await zip(files);
    const unzipped = await unzip(zipped);
    expect(unzipped.get("hello.txt")).toBe("Hello, World!");
    expect(unzipped.get("config.json")).toBe('{"version": 1}');
  });

  it("should roundtrip binary content", async () => {
    const files = new Map<string, string | Uint8Array>();
    files.set("data.bin", new Uint8Array([1, 2, 3, 4, 5]));
    files.set("image.png", new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    const zipped = await zip(files);
    const unzipped = await unzip(zipped);
    expect(new Uint8Array(unzipped.get("data.bin") as Uint8Array)).toEqual(
      new Uint8Array([1, 2, 3, 4, 5]),
    );
    expect(new Uint8Array(unzipped.get("image.png") as Uint8Array)).toEqual(
      new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
    );
  });

  it("should roundtrip mixed content", async () => {
    const files = new Map<string, string | Uint8Array>();
    files.set("text.txt", "Hello");
    files.set("binary.bin", new Uint8Array([1, 2, 3]));
    const zipped = await zip(files);
    const unzipped = await unzip(zipped);
    expect(unzipped.get("text.txt")).toBe("Hello");
    expect(new Uint8Array(unzipped.get("binary.bin") as Uint8Array)).toEqual(
      new Uint8Array([1, 2, 3]),
    );
  });
});

describe("object notation input", () => {
  it("should accept object as input", async () => {
    const files: Record<string, string | Uint8Array> = {
      "test.txt": "content",
      "data.bin": new Uint8Array([1, 2, 3]),
    };
    const zipped = await zip(files);
    const unzipped = await unzip(zipped);
    expect(unzipped.get("test.txt")).toBe("content");
    expect(new Uint8Array(unzipped.get("data.bin") as Uint8Array)).toEqual(
      new Uint8Array([1, 2, 3]),
    );
  });
});

describe("empty file map", () => {
  it("should handle empty file map", async () => {
    const files = new Map<string, string | Uint8Array>();
    const zipped = await zip(files);
    const unzipped = await unzip(zipped);
    expect(unzipped.size).toBe(0);
  });
});

describe("unicode filenames", () => {
  it("should handle unicode filenames", async () => {
    const files = new Map<string, string | Uint8Array>();
    files.set("日本語.txt", "Japanese content");
    files.set("한국어.txt", "Korean content");
    files.set("Ελληνικά.txt", "Greek content");
    files.set("🚀.txt", "Rocket emoji");
    const zipped = await zip(files);
    const unzipped = await unzip(zipped);
    expect(unzipped.get("日本語.txt")).toBe("Japanese content");
    expect(unzipped.get("한국어.txt")).toBe("Korean content");
    expect(unzipped.get("Ελληνικά.txt")).toBe("Greek content");
    expect(unzipped.get("🚀.txt")).toBe("Rocket emoji");
  });
});

describe("special characters in paths", () => {
  it("should handle special characters in paths", async () => {
    const files = new Map<string, string | Uint8Array>();
    files.set("path/with/slashes.txt", "content");
    files.set("path-with-dashes.txt", "content");
    files.set("path_with_underscores.txt", "content");
    files.set("file with spaces.txt", "content");
    files.set("file.with.dots.txt", "content");
    const zipped = await zip(files);
    const unzipped = await unzip(zipped);
    expect(unzipped.get("path/with/slashes.txt")).toBe("content");
    expect(unzipped.get("path-with-dashes.txt")).toBe("content");
    expect(unzipped.get("path_with_underscores.txt")).toBe("content");
    expect(unzipped.get("file with spaces.txt")).toBe("content");
    expect(unzipped.get("file.with.dots.txt")).toBe("content");
  });
});

describe("large file", () => {
  it("should handle large files (10MB)", async () => {
    const largeContent = "x".repeat(10 * 1024 * 1024);
    const files = new Map<string, string | Uint8Array>();
    files.set("large.txt", largeContent);
    const zipped = await zip(files);
    const unzipped = await unzip(zipped);
    expect(unzipped.get("large.txt")).toBe(largeContent);
  });
});

describe("zipToBlob/unzipFromBlob", () => {
  it("should roundtrip via blob", async () => {
    const files = new Map<string, string | Uint8Array>();
    files.set("test.txt", "content");
    const blob = await zipToBlob(files);
    expect(blob.type).toBe("application/octet-stream");
    const unzipped = await unzipFromBlob(blob);
    expect(unzipped.get("test.txt")).toBe("content");
  });
});

describe("zipToBase64/unzipFromBase64", () => {
  it("should roundtrip via base64", async () => {
    const files = new Map<string, string | Uint8Array>();
    files.set("test.txt", "Hello!");
    const base64 = await zipToBase64(files);
    expect(typeof base64).toBe("string");
    expect(base64.length > 0);
    const unzipped = await unzipFromBase64(base64);
    expect(unzipped.get("test.txt")).toBe("Hello!");
  });

  it("should produce valid base64 string", async () => {
    const files = new Map<string, string | Uint8Array>();
    files.set("msg.txt", "Test");
    const base64 = await zipToBase64(files);
    expect(() => atob(base64)).not.toThrow();
  });
});
