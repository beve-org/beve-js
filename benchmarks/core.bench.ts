/**
 * BEVE TypeScript Core Benchmarks
 * 
 * Run with: bun benchmarks/core.bench.ts
 * 
 * Manual benchmarking using performance.now()
 */

import { writeBeve } from "../src/encoder";
import { readBeve } from "../src/decoder";

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

// Benchmark function
function benchmark(name: string, fn: () => void, iterations = 10000) {
  // Warmup
  for (let i = 0; i < 100; i++) {
    fn();
  }

  // Actual benchmark
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  
  const totalTime = end - start;
  const avgTime = totalTime / iterations;
  const opsPerSec = (iterations / totalTime) * 1000;

  console.log(
    `${colors.cyan}${name.padEnd(45)}${colors.reset}` +
    `${colors.yellow}${avgTime.toFixed(6)}ms${colors.reset}` +
    ` | ${colors.green}${opsPerSec.toFixed(0).padStart(10)} ops/sec${colors.reset}`
  );

  return { totalTime, avgTime, opsPerSec };
}

// Test data
const smallObject = {
  id: 123,
  name: "John Doe",
  active: true,
  score: 95.5,
};

const mediumObject = {
  users: Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    active: i % 2 === 0,
    score: Math.random() * 100,
  })),
  metadata: {
    total: 100,
    timestamp: Date.now(),
    version: "1.0.0",
  },
};

const largeArray = Array.from({ length: 10000 }, (_, i) => i);

const deepNested = (() => {
  let obj: any = { value: 42 };
  for (let i = 0; i < 10; i++) {
    obj = { nested: obj };
  }
  return obj;
})();

const mixedArray = [
  1, "hello", true, null, 3.14,
  { key: "value" },
  [1, 2, 3],
  false,
  "world",
  42,
];

const binaryData = new Uint8Array(1024).fill(0xFF);
const stringArray = Array.from({ length: 1000 }, (_, i) => `String_${i}`);
const numberArray = Array.from({ length: 1000 }, (_, i) => Math.random() * 1000);

// Pre-encode data for decode benchmarks
const encodedSmall = writeBeve(smallObject);
const encodedMedium = writeBeve(mediumObject);
const encodedLarge = writeBeve(largeArray);
const encodedDeep = writeBeve(deepNested);
const encodedMixed = writeBeve(mixedArray);
const encodedBinary = writeBeve(binaryData);
const encodedStrings = writeBeve(stringArray);
const encodedNumbers = writeBeve(numberArray);

console.log("\n" + colors.bright + "🚀 BEVE TypeScript Benchmarks" + colors.reset);
console.log("═".repeat(80) + "\n");

// ============================================================================
// ENCODING BENCHMARKS
// ============================================================================

console.log(colors.bright + "📤 ENCODING BENCHMARKS" + colors.reset);
console.log("─".repeat(80));

benchmark("encode: null", () => writeBeve(null), 100000);
benchmark("encode: boolean (true)", () => writeBeve(true), 100000);
benchmark("encode: integer (42)", () => writeBeve(42), 100000);
benchmark("encode: float (3.14159)", () => writeBeve(3.14159), 100000);
benchmark("encode: string (short, 5 chars)", () => writeBeve("hello"), 100000);
benchmark("encode: string (long, 1K chars)", () => writeBeve("x".repeat(1000)), 10000);
benchmark("encode: empty array", () => writeBeve([]), 100000);
benchmark("encode: empty object", () => writeBeve({}), 100000);
benchmark("encode: small object (5 fields)", () => writeBeve(smallObject), 10000);
benchmark("encode: medium object (100 users)", () => writeBeve(mediumObject), 1000);
benchmark("encode: large array (10K integers)", () => writeBeve(largeArray), 1000);
benchmark("encode: deep nested (10 levels)", () => writeBeve(deepNested), 10000);
benchmark("encode: mixed array (10 items)", () => writeBeve(mixedArray), 10000);
benchmark("encode: binary data (1KB Uint8Array)", () => writeBeve(binaryData), 10000);
benchmark("encode: string array (1K strings)", () => writeBeve(stringArray), 1000);
benchmark("encode: number array (1K floats)", () => writeBeve(numberArray), 1000);

console.log("");

// ============================================================================
// DECODING BENCHMARKS
// ============================================================================

console.log(colors.bright + "📥 DECODING BENCHMARKS" + colors.reset);
console.log("─".repeat(80));

benchmark("decode: small object (5 fields)", () => readBeve(encodedSmall), 10000);
benchmark("decode: medium object (100 users)", () => readBeve(encodedMedium), 1000);
benchmark("decode: large array (10K integers)", () => readBeve(encodedLarge), 1000);
benchmark("decode: deep nested (10 levels)", () => readBeve(encodedDeep), 10000);
benchmark("decode: mixed array (10 items)", () => readBeve(encodedMixed), 10000);
benchmark("decode: binary data (1KB Uint8Array)", () => readBeve(encodedBinary), 10000);
benchmark("decode: string array (1K strings)", () => readBeve(encodedStrings), 1000);
benchmark("decode: number array (1K floats)", () => readBeve(encodedNumbers), 1000);

console.log("");

// ============================================================================
// ROUND-TRIP BENCHMARKS
// ============================================================================

console.log(colors.bright + "🔄 ROUND-TRIP BENCHMARKS" + colors.reset);
console.log("─".repeat(80));

benchmark("round-trip: small object", () => {
  const encoded = writeBeve(smallObject);
  readBeve(encoded);
}, 10000);

benchmark("round-trip: medium object", () => {
  const encoded = writeBeve(mediumObject);
  readBeve(encoded);
}, 1000);

benchmark("round-trip: large array", () => {
  const encoded = writeBeve(largeArray);
  readBeve(encoded);
}, 1000);

benchmark("round-trip: binary data", () => {
  const encoded = writeBeve(binaryData);
  readBeve(encoded);
}, 10000);

console.log("");

// ============================================================================
// SIZE ANALYSIS
// ============================================================================

console.log(colors.bright + "📊 SIZE ANALYSIS" + colors.reset);
console.log("─".repeat(80));

const sizes = [
  { name: "small object", size: encodedSmall.length },
  { name: "medium object (100 users)", size: encodedMedium.length },
  { name: "large array (10K integers)", size: encodedLarge.length },
  { name: "deep nested", size: encodedDeep.length },
  { name: "mixed array", size: encodedMixed.length },
  { name: "binary data (1KB)", size: encodedBinary.length },
  { name: "string array (1K)", size: encodedStrings.length },
  { name: "number array (1K)", size: encodedNumbers.length },
];

for (const { name, size } of sizes) {
  const sizeStr = size < 1024 
    ? `${size} bytes` 
    : `${(size / 1024).toFixed(2)} KB`;
  console.log(`${colors.cyan}${name.padEnd(35)}${colors.reset} ${colors.yellow}${sizeStr.padStart(15)}${colors.reset}`);
}

console.log("\n" + "═".repeat(80));
console.log(colors.bright + colors.green + "✅ Benchmarks complete!" + colors.reset + "\n");
