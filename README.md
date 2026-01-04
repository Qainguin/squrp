# squrp

<div align="center">

**Fast, browser-native file compression using the CompressionStream API**

[![npm version](https://img.shields.io/npm/v/squrp.svg)](https://www.npmjs.com/package/squrp)
[![bun](https://img.shields.io/badge/bun-v1.3.5-000?logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org)

</div>

## Features

- **Blazing Fast** — Uses the native CompressionStream API available in modern browsers
- **Multiple Formats** — Supports gzip, brotli, and deflate compression
- **Flexible I/O** — Works with Uint8Array, Blob, or Base64 output
- **TypeScript Ready** — Complete type definitions with JSDoc documentation
- **Zero Dependencies** — Lightweight and simple to use
- **Mixed Content** — Store both text and binary files in the same archive

## Quick Start

```bash
npm install squrp
```

```typescript
import { zip, unzip } from 'squrp';

const files = new Map([
  ['hello.txt', 'Hello, World!'],
  ['data.bin', new Uint8Array([1, 2, 3, 4, 5])],
]);

const compressed = await zip(files);
const unzipped = await unzip(compressed);

console.log(unzipped.get('hello.txt')); // 'Hello, World!'
console.log(unzipped.get('data.bin'));  // Uint8Array([1, 2, 3, 4, 5])
```

Objects work too:

```typescript
const files = {
  'config.json': '{"version": 1}',
  'script.js': 'console.log("hello")',
};

const compressed = await zip(files);
const unzipped = await unzip(compressed);
```

## Compression Formats

Choose the right balance of speed and compression ratio:

```typescript
import { zip } from 'squrp';

// Best compatibility (default)
await zip(files);                           // gzip
await zip(files, { compression: 'gzip' });

// Best compression ratio (slower)
await zip(files, { compression: 'brotli' });

// Fastest compression
await zip(files, { compression: 'deflate' });
```

## Output Formats

### Uint8Array

```typescript
import { zip, unzip } from 'squrp';

const compressed = await zip(files);
// compressed is Uint8Array
```

### Blob (for uploads/downloads)

```typescript
import { zipToBlob, unzipFromBlob } from 'squrp';

const blob = await zipToBlob(files);
await fetch('/api/upload', { method: 'POST', body: blob });

const response = await fetch('/download').then(r => r.blob());
const unzipped = await unzipFromBlob(response);
```

### Base64 (for JSON APIs)

```typescript
import { zipToBase64, unzipFromBase64 } from 'squrp';

const base64 = await zipToBase64(files);
await fetch('/api/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: base64 }),
});

const response = await fetch('/api/load').then(r => r.json());
const unzipped = await unzipFromBase64(response.data);
```

## Error Handling

```typescript
import { zip, unzip, SqurpError, SqurpErrorCode } from 'squrp';

try {
  const compressed = await zip(files);
  const unzipped = await unzip(compressed);
} catch (error) {
  if (error instanceof SqurpError) {
    console.error(`Error ${error.code}: ${error.message}`);

    switch (error.code) {
      case SqurpErrorCode.CORRUPTED_DATA:
        console.log('The data was corrupted');
        break;
      case SqurpErrorCode.PATH_TOO_LONG:
        console.log('A file path was too long');
        break;
      case SqurpErrorCode.UNEXPECTED_END:
        console.log('Data was truncated');
        break;
    }
  }
  throw error;
}
```

## Browser Support

Uses the CompressionStream API available in:
- Chrome 80+
- Firefox 113+
- Safari 17.2+
- Edge 80+

## Performance

Benchmarks on modern hardware (Apple M2 Pro):

| Operation | Size | Ops/Second | Time |
|-----------|------|------------|------|
| Zip | 1 KB text | ~2,000 | 0.5ms |
| Zip | 1 KB binary | ~11,000 | 0.09ms |
| Zip | 100 KB | ~400 | 2.5ms |
| Zip | 1 MB | ~38 | 26ms |
| Unzip | 1 KB | ~11,000 | 0.09ms |
| Unzip | 100 KB | ~1,700 | 0.6ms |

## API Reference

### `zip(input, options?)`

Compresses a file map into a compressed Uint8Array.

```typescript
async function zip(
  input: ZipInput,
  options?: ZipOptions
): Promise<Uint8Array>
```

### `unzip(data, options?)`

Decompresses data back to a file map.

```typescript
async function unzip(
  data: Uint8Array,
  options?: UnzipOptions
): Promise<Map<string, string | Uint8Array>>
```

### `zipToBlob(input, options?)`

Compresses to a Blob for easy download/upload.

```typescript
async function zipToBlob(
  input: ZipInput,
  options?: ZipOptions
): Promise<Blob>
```

### `unzipFromBlob(blob, options?)`

Decompresses from a Blob.

```typescript
async function unzipFromBlob(
  blob: Blob,
  options?: UnzipOptions
): Promise<Map<string, string | Uint8Array>>
```

### `zipToBase64(input, options?)`

Compresses to a base64-encoded string for JSON transport.

```typescript
async function zipToBase64(
  input: ZipInput,
  options?: ZipOptions
): Promise<string>
```

### `unzipFromBase64(base64, options?)`

Decompresses from a base64 string.

```typescript
async function unzipFromBase64(
  base64: string,
  options?: UnzipOptions
): Promise<Map<string, string | Uint8Array>>
```

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Type check
bun run typecheck

# Build
bun run build

# Lint
bun run lint

# Run benchmarks
bun run benchmark
```

## License

MIT
