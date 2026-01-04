# API Reference

## Table of Contents

- [Core Functions](#core-functions)
  - [zip](#zip)
  - [unzip](#unzip)
- [Blob Functions](#blob-functions)
  - [zipToBlob](#ziptoblob)
  - [unzipFromBlob](#unzipfromblob)
- [Base64 Functions](#base64-functions)
  - [zipToBase64](#ziptobase64)
  - [unzipFromBase64](#unzipfrombase64)
- [Compression Functions](#compression-functions)
  - [compress](#compress)
  - [decompress](#decompress)
  - [compressWithGzip](#compresswithgzip)
  - [decompressWithGzip](#decompresswithgzip)
  - [compressWithBrotli](#compresswithbrotli)
  - [decompressWithBrotli](#decompresswithbrotli)
  - [compressWithDeflate](#compresswithdeflate)
  - [decompressWithDeflate](#decompresswithdeflate)
- [Utility Functions](#utility-functions)
  - [isMap](#ismap)
  - [normalizeInput](#normalizeinput)
  - [serializeFileMap](#serializefilemap)
  - [deserializeFileMap](#deserializefilemap)
- [Error Handling](#error-handling)
  - [SqurpError](#SqurpError)
  - [SqurpErrorCode](#SqurpErrorcode)
  - [createError](#createerror)
- [Types](#types)
  - [FileMap](#filemap)
  - [ZipInput](#zipinput)
  - [CompressionFormat](#compressionformat)
  - [ZipOptions](#zipoptions)
  - [UnzipOptions](#unzipoptions)

---

## Core Functions

### zip

Compresses a file map into a compressed Uint8Array.

```ts
async function zip(
  input: ZipInput,
  options?: ZipOptions
): Promise<Uint8Array>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `input` | `ZipInput` | A Map or object containing file paths as keys and contents as values |
| `options` | `ZipOptions` | Optional settings including compression format |

**Returns:** `Promise<Uint8Array>` - A compressed Uint8Array

**Throws:**
- `SqurpError(PATH_TOO_LONG)` - If any file path exceeds 65535 bytes
- `SqurpError(CONTENT_TOO_LARGE)` - If total content exceeds 4GB

**Example:**

```ts
const files = new Map([
  ['hello.txt', 'Hello, World!'],
  ['data.bin', new Uint8Array([1, 2, 3, 4, 5])],
]);

const zipped = await zip(files);
// Returns: Uint8Array containing compressed data

// With compression option
const brotliZipped = await zip(files, { compression: 'brotli' });
```

---

### unzip

Decompresses compressed data back to a file map.

```ts
async function unzip(
  data: Uint8Array,
  options?: UnzipOptions
): Promise<Map<string, string | Uint8Array>>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `data` | `Uint8Array` | A compressed Uint8Array |
| `options` | `UnzipOptions` | Optional settings including compression format |

**Returns:** `Promise<Map<string, string | Uint8Array>>` - A Map with file paths as keys

**Throws:**
- `SqurpError(INVALID_HEADER)` - If the header is invalid
- `SqurpError(CORRUPTED_DATA)` - If data is corrupted or malformed
- `SqurpError(UNEXPECTED_END)` - If data is truncated
- `SqurpError(ENTRY_EXCEEDS_BOUNDS)` - If an entry exceeds available data

**Example:**

```ts
try {
  const unzipped = await unzip(zippedData);
  console.log(unzipped.get('hello.txt')); // 'Hello, World!'
  console.log(unzipped.get('data.bin'));  // Uint8Array([1, 2, 3, 4, 5])
} catch (error) {
  if (error instanceof SqurpError) {
    console.error(`Error ${error.code}: ${error.message}`);
  }
}

// With explicit compression format
const unzipped = await unzip(data, { compression: 'brotli' });
```

---

## Blob Functions

### zipToBlob

Compresses a file map into a Blob for easy download/upload.

```ts
async function zipToBlob(
  input: ZipInput,
  options?: ZipOptions
): Promise<Blob>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `input` | `ZipInput` | A Map or object containing file paths and contents |
| `options` | `ZipOptions` | Optional settings including compression format |

**Returns:** `Promise<Blob>` - A Blob with MIME type "application/octet-stream"

**Example:**

```ts
const files = new Map([['test.txt', 'content']]);
const blob = await zipToBlob(files);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: blob,
});
```

---

### unzipFromBlob

Decompresses from a Blob.

```ts
async function unzipFromBlob(
  blob: Blob,
  options?: UnzipOptions
): Promise<Map<string, string | Uint8Array>>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `blob` | `Blob` | A Blob containing compressed data |
| `options` | `UnzipOptions` | Optional settings including compression format |

**Returns:** `Promise<Map<string, string | Uint8Array>>` - A Map with file paths and contents

**Throws:** See [unzip](#unzip)

**Example:**

```ts
const response = await fetch('/api/download').then(r => r.blob());
const unzipped = await unzipFromBlob(response);
```

---

## Base64 Functions

### zipToBase64

Compresses a file map into a base64-encoded string for JSON transport.

```ts
async function zipToBase64(
  input: ZipInput,
  options?: ZipOptions
): Promise<string>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `input` | `ZipInput` | A Map or object containing file paths and contents |
| `options` | `ZipOptions` | Optional settings including compression format |

**Returns:** `Promise<string>` - A base64-encoded string

**Example:**

```ts
const files = new Map([['msg.txt', 'Hello!']]);
const base64 = await zipToBase64(files);

await fetch('/api/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: base64 }),
});
```

---

### unzipFromBase64

Decompresses from a base64-encoded string.

```ts
async function unzipFromBase64(
  base64: string,
  options?: UnzipOptions
): Promise<Map<string, string | Uint8Array>>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `base64` | `string` | A base64-encoded string containing compressed data |
| `options` | `UnzipOptions` | Optional settings including compression format |

**Returns:** `Promise<Map<string, string | Uint8Array>>` - A Map with file paths and contents

**Throws:** See [unzip](#unzip)

**Example:**

```ts
const response = await fetch('/api/load').then(r => r.json());
const unzipped = await unzipFromBase64(response.data);
```

---

## Compression Functions

### compress

Compresses data using the specified compression format.

```ts
async function compress(
  data: Uint8Array,
  format?: CompressionFormat
): Promise<Uint8Array>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `data` | `Uint8Array` | The data to compress |
| `format` | `CompressionFormat` | Compression format (default: `"gzip"`) |

**Returns:** `Promise<Uint8Array>` - Compressed data

**Example:**

```ts
const raw = new Uint8Array([1, 2, 3, 4, 5]);
const compressed = await compress(raw, 'brotli');
```

---

### decompress

Decompresses data using the specified compression format.

```ts
async function decompress(
  data: Uint8Array,
  format?: CompressionFormat
): Promise<Uint8Array>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `data` | `Uint8Array` | The compressed data |
| `format` | `CompressionFormat` | Compression format (default: `"gzip"`) |

**Returns:** `Promise<Uint8Array>` - Decompressed data

**Throws:** `SqurpError(CORRUPTED_DATA)` if data is invalid

---

### compressWithGzip

Compresses data using gzip compression.

```ts
async function compressWithGzip(data: Uint8Array): Promise<Uint8Array>
```

---

### decompressWithGzip

Decompresses gzip-compressed data.

```ts
async function decompressWithGzip(data: Uint8Array): Promise<Uint8Array>
```

---

### compressWithBrotli

Compresses data using brotli compression.

```ts
async function compressWithBrotli(data: Uint8Array): Promise<Uint8Array>
```

---

### decompressWithBrotli

Decompresses brotli-compressed data.

```ts
async function decompressWithBrotli(data: Uint8Array): Promise<Uint8Array>
```

---

### compressWithDeflate

Compresses data using deflate compression.

```ts
async function compressWithDeflate(data: Uint8Array): Promise<Uint8Array>
```

---

### decompressWithDeflate

Decompresses deflate-compressed data.

```ts
async function decompressWithDeflate(data: Uint8Array): Promise<Uint8Array>
```

---

## Utility Functions

### isMap

Type guard to check if input is a Map.

```ts
function isMap(input: ZipInput): input is Map<string, string | Uint8Array>
```

**Returns:** `boolean` - True if input is a Map

---

### normalizeInput

Normalizes input to a Map, converting objects if necessary.

```ts
function normalizeInput(input: ZipInput): Map<string, string | Uint8Array>
```

**Returns:** `Map<string, string | Uint8Array>` - A normalized Map

---

### serializeFileMap

Serializes a file map into the binary squrp format.

```ts
async function serializeFileMap(
  map: Map<string, string | Uint8Array>
): Promise<Uint8Array>
```

**Returns:** `Promise<Uint8Array>` - Serialized binary data (uncompressed)

**Throws:**
- `SqurpError(PATH_TOO_LONG)` - If any path exceeds 65535 bytes
- `SqurpError(CONTENT_TOO_LARGE)` - If total content exceeds 4GB

---

### deserializeFileMap

Deserializes binary data in the squrp format back to a file map.

```ts
async function deserializeFileMap(
  data: Uint8Array
): Promise<Map<string, string | Uint8Array>>
```

**Returns:** `Promise<Map<string, string | Uint8Array>>` - Deserialized file map

**Throws:**
- `SqurpError(INVALID_HEADER)` - If the header is invalid
- `SqurpError(CORRUPTED_DATA)` - If length doesn't match
- `SqurpError(UNEXPECTED_END)` - If data is truncated
- `SqurpError(ENTRY_EXCEEDS_BOUNDS)` - If an entry exceeds bounds

---

## Error Handling

### SqurpError

Custom error class for squrp operations.

```ts
class SqurpError extends Error {
  code: SqurpErrorCode;
  constructor(code: SqurpErrorCode, message: string);
}
```

**Properties:**
- `code: SqurpErrorCode` - The error code
- `message: string` - Human-readable error message
- `name: string` - Always "SqurpError"

**Example:**

```ts
try {
  await unzip(data);
} catch (error) {
  if (error instanceof SqurpError) {
    console.log(`Code: ${error.code}`);
    console.log(`Message: ${error.message}`);
  }
}
```

---

### SqurpErrorCode

Error codes for squrp operations.

```ts
const SqurpErrorCode = {
  INVALID_HEADER: "INVALID_HEADER",
  CORRUPTED_DATA: "CORRUPTED_DATA",
  UNSUPPORTED_VERSION: "UNSUPPORTED_VERSION",
  PATH_TOO_LONG: "PATH_TOO_LONG",
  CONTENT_TOO_LARGE: "CONTENT_TOO_LARGE",
  UNEXPECTED_END: "UNEXPECTED_END",
  ENTRY_EXCEEDS_BOUNDS: "ENTRY_EXCEEDS_BOUNDS",
  UNSUPPORTED_COMPRESSION: "UNSUPPORTED_COMPRESSION",
  INVALID_COMPRESSION_FORMAT: "INVALID_COMPRESSION_FORMAT",
} as const;
```

| Code | Description |
|------|-------------|
| `INVALID_HEADER` | Invalid or missing header in the squrp format |
| `CORRUPTED_DATA` | Data is corrupted or malformed |
| `UNSUPPORTED_VERSION` | Unsupported version of the squrp format |
| `PATH_TOO_LONG` | File path exceeds maximum allowed length (65535 bytes) |
| `CONTENT_TOO_LARGE` | Total content size exceeds 4GB limit |
| `UNEXPECTED_END` | Unexpected end of data during parsing |
| `ENTRY_EXCEEDS_BOUNDS` | Entry data exceeds the bounds of available data |
| `UNSUPPORTED_COMPRESSION` | Unsupported compression format |
| `INVALID_COMPRESSION_FORMAT` | Invalid compression format specified |

---

### createError

Creates a new SqurpError.

```ts
function createError(code: SqurpErrorCode, message: string): SqurpError
```

**Returns:** `SqurpError` - A new error instance

---

## Types

### FileMap

A record type representing a file map.

```ts
interface FileMap {
  [path: string]: string | Uint8Array;
}
```

**Description:**
- Keys are file paths (strings)
- Values are either text content (string) or binary content (Uint8Array)

---

### ZipInput

The input type for zip operations.

```ts
type ZipInput = FileMap | Map<string, string | Uint8Array>;
```

**Description:**
- Can be either a FileMap (object) or a Map
- Provides flexibility in how files are specified

---

### CompressionFormat

Supported compression formats.

```ts
type CompressionFormat = "gzip" | "brotli" | "deflate";
```

| Format | Description | Use Case |
|--------|-------------|----------|
| `"gzip"` | GNU zip (default) | Best compatibility |
| `"brotli"` | Brotli compression | Best compression ratio |
| `"deflate"` | Deflate compression | Fast, moderate compression |

---

### ZipOptions

Options for zip operations.

```ts
interface ZipOptions {
  compression?: CompressionFormat;
}
```

---

### UnzipOptions

Options for unzip operations.

```ts
interface UnzipOptions {
  compression?: CompressionFormat;
}
```

---

## See Also

- [README](../README.md) - Main documentation
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
