import { zip, unzip } from "./src/index";

function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789\n\t ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface BenchmarkResult {
  name: string;
  opsPerSec: number;
  avgMs: number;
  totalMs: number;
  iterations: number;
  dataSize: number;
  compressedSize: number;
}

async function runBenchmark<T>(
  name: string,
  fn: () => Promise<T>,
  iterations: number,
  dataSize: number,
): Promise<BenchmarkResult> {
  const times: number[] = [];
  let result: T = undefined as T;
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    result = await fn();
    const end = performance.now();
    times.push(end - start);
  }

  const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
  const opsPerSec = 1000 / avgMs;
  const totalMs = times.reduce((a, b) => a + b, 0);

  const compressed = result instanceof Uint8Array ? result : new Uint8Array();

  return {
    name,
    opsPerSec: Math.round(opsPerSec * 100) / 100,
    avgMs: Math.round(avgMs * 1000) / 1000,
    totalMs: Math.round(totalMs * 100) / 100,
    iterations,
    dataSize,
    compressedSize: compressed.length,
  };
}

function printResult(result: BenchmarkResult): void {
  const ratio =
    result.dataSize > 0 ? ((result.compressedSize / result.dataSize) * 100).toFixed(1) : "N/A";
  console.log(
    `${result.name.padEnd(45)} | ` +
      `${result.opsPerSec.toLocaleString().padStart(10)} ops/s | ` +
      `${result.avgMs.toString().padStart(8)}ms | ` +
      `Ratio: ${ratio}%`,
  );
}

async function benchmarkZip(): Promise<void> {
  console.log("\n=== ZIP BENCHMARKS ===\n");

  const testCases = [
    {
      name: "Small text (1 KB)",
      data: { "file.txt": generateRandomString(1024) },
      iterations: 100,
    },
    {
      name: "Medium text (100 KB)",
      data: { "file.txt": generateRandomString(100 * 1024) },
      iterations: 50,
    },
    {
      name: "Large text (1 MB)",
      data: { "file.txt": generateRandomString(1024 * 1024) },
      iterations: 20,
    },
    {
      name: "Small binary (1 KB)",
      data: { "file.bin": generateRandomBytes(1024) },
      iterations: 100,
    },
    {
      name: "Medium binary (100 KB)",
      data: { "file.bin": generateRandomBytes(100 * 1024) },
      iterations: 50,
    },
    {
      name: "Large binary (1 MB)",
      data: { "file.bin": generateRandomBytes(1024 * 1024) },
      iterations: 20,
    },
    {
      name: "Many small files (100x10 KB)",
      data: Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [`file${i}.txt`, generateRandomString(10 * 1024)]),
      ),
      iterations: 20,
    },
  ];

  for (const tc of testCases) {
    const result = await runBenchmark(
      tc.name,
      () => zip(tc.data),
      tc.iterations,
      Object.values(tc.data).reduce(
        (sum, v) => sum + (typeof v === "string" ? v.length : v.length),
        0,
      ),
    );
    printResult(result);
  }
}

async function benchmarkZipFormats(): Promise<void> {
  console.log("\n=== ZIP FORMAT COMPARISON (100 KB text) ===\n");

  const data = { "file.txt": generateRandomString(100 * 1024) };
  const formats = ["gzip", "brotli", "deflate"] as const;

  for (const format of formats) {
    const result = await runBenchmark(
      `${format.padEnd(10)} compression`,
      () => zip(data, { compression: format }),
      50,
      data["file.txt"].length,
    );
    printResult(result);
  }
}

async function benchmarkUnzip(): Promise<void> {
  console.log("\n=== UNZIP BENCHMARKS ===\n");

  const sizes = [
    {
      name: "Small (1 KB)",
      generator: () => ({ "file.txt": generateRandomString(1024) }),
      iterations: 100,
    },
    {
      name: "Medium (100 KB)",
      generator: () => ({ "file.txt": generateRandomString(100 * 1024) }),
      iterations: 50,
    },
    {
      name: "Large (1 MB)",
      generator: () => ({ "file.txt": generateRandomString(1024 * 1024) }),
      iterations: 20,
    },
  ];

  for (const tc of sizes) {
    const originalData = tc.generator();
    const compressed = await zip(originalData);
    const dataSize = Object.values(originalData).reduce((sum, v) => sum + v.length, 0);

    const result = await runBenchmark(
      `Unzip ${tc.name}`,
      () => unzip(compressed),
      tc.iterations,
      dataSize,
    );
    printResult(result);
  }
}

async function benchmarkRoundTrip(): Promise<void> {
  console.log("\n=== ROUND-TRIP BENCHMARKS ===\n");

  const testCases = [
    {
      name: "Small (10 KB)",
      generator: () => ({ "file.txt": generateRandomString(10 * 1024) }),
      iterations: 50,
    },
    {
      name: "Medium (500 KB)",
      generator: () => ({ "file.txt": generateRandomString(500 * 1024) }),
      iterations: 20,
    },
    {
      name: "Large (5 MB)",
      generator: () => ({ "file.txt": generateRandomString(5 * 1024 * 1024) }),
      iterations: 10,
    },
  ];

  for (const tc of testCases) {
    const originalData = tc.generator();
    const dataSize = Object.values(originalData)[0].length;

    const result = await runBenchmark(
      `Round-trip ${tc.name}`,
      async () => {
        const compressed = await zip(originalData);
        const decompressed = await unzip(compressed);
        return compressed;
      },
      tc.iterations,
      dataSize,
    );
    printResult(result);
  }
}

async function main(): Promise<void> {
  console.clear();
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║                     SQURP BENCHMARKS                          ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");

  await benchmarkZip();
  await benchmarkZipFormats();
  await benchmarkUnzip();
  await benchmarkRoundTrip();

  console.log("\n✓ All benchmarks completed\n");
}

main().catch(console.error);
