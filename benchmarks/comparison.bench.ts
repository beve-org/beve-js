/**
 * BEVE vs JSON Comparison Benchmark
 * 
 * Run with: bun benchmarks/comparison.bench.ts
 * 
 * Direct comparison between BEVE and JSON performance
 */

import { writeBeve } from "../src/encoder";
import { readBeve } from "../src/decoder";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function benchmark(name: string, fn: () => void, iterations = 10000) {
  // Warmup
  for (let i = 0; i < 100; i++) fn();

  // Benchmark
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const end = performance.now();
  
  return {
    totalTime: end - start,
    avgTime: (end - start) / iterations,
    opsPerSec: (iterations / (end - start)) * 1000,
  };
}

function compareEncodeDecode(name: string, data: any, iterations = 10000) {
  console.log(`\n${colors.bright}${colors.cyan}${name}${colors.reset}`);
  console.log("─".repeat(80));

  // BEVE Encode
  const beveEncode = benchmark("encode", () => writeBeve(data), iterations);
  
  // JSON Encode
  const jsonEncode = benchmark("encode", () => JSON.stringify(data), iterations);
  
  // Pre-encode for decode tests
  const beveEncoded = writeBeve(data);
  const jsonEncoded = JSON.stringify(data);
  
  // BEVE Decode
  const beveDecode = benchmark("decode", () => readBeve(beveEncoded), iterations);
  
  // JSON Decode
  const jsonDecode = benchmark("decode", () => JSON.parse(jsonEncoded), iterations);
  
  // Size comparison
  const beveSize = beveEncoded.length;
  const jsonSize = jsonEncoded.length;
  const sizeSavings = ((jsonSize - beveSize) / jsonSize) * 100;

  // Print results
  console.log(`${colors.yellow}📤 Encoding:${colors.reset}`);
  console.log(
    `  BEVE: ${beveEncode.avgTime.toFixed(6)}ms | ` +
    `${beveEncode.opsPerSec.toFixed(0).padStart(10)} ops/sec`
  );
  console.log(
    `  JSON: ${jsonEncode.avgTime.toFixed(6)}ms | ` +
    `${jsonEncode.opsPerSec.toFixed(0).padStart(10)} ops/sec`
  );
  
  const encodeWinner = beveEncode.avgTime < jsonEncode.avgTime ? "BEVE" : "JSON";
  const encodeFaster = beveEncode.avgTime < jsonEncode.avgTime 
    ? (jsonEncode.avgTime / beveEncode.avgTime).toFixed(2)
    : (beveEncode.avgTime / jsonEncode.avgTime).toFixed(2);
  console.log(
    `  ${colors.green}Winner: ${encodeWinner} (${encodeFaster}x faster)${colors.reset}`
  );

  console.log(`\n${colors.yellow}📥 Decoding:${colors.reset}`);
  console.log(
    `  BEVE: ${beveDecode.avgTime.toFixed(6)}ms | ` +
    `${beveDecode.opsPerSec.toFixed(0).padStart(10)} ops/sec`
  );
  console.log(
    `  JSON: ${jsonDecode.avgTime.toFixed(6)}ms | ` +
    `${jsonDecode.opsPerSec.toFixed(0).padStart(10)} ops/sec`
  );
  
  const decodeWinner = beveDecode.avgTime < jsonDecode.avgTime ? "BEVE" : "JSON";
  const decodeFaster = beveDecode.avgTime < jsonDecode.avgTime 
    ? (jsonDecode.avgTime / beveDecode.avgTime).toFixed(2)
    : (beveDecode.avgTime / jsonDecode.avgTime).toFixed(2);
  console.log(
    `  ${colors.green}Winner: ${decodeWinner} (${decodeFaster}x faster)${colors.reset}`
  );

  console.log(`\n${colors.yellow}💾 Size:${colors.reset}`);
  const beveStr = beveSize < 1024 ? `${beveSize} bytes` : `${(beveSize / 1024).toFixed(2)} KB`;
  const jsonStr = jsonSize < 1024 ? `${jsonSize} bytes` : `${(jsonSize / 1024).toFixed(2)} KB`;
  console.log(`  BEVE: ${beveStr}`);
  console.log(`  JSON: ${jsonStr}`);
  
  if (sizeSavings > 0) {
    console.log(`  ${colors.green}BEVE is ${sizeSavings.toFixed(1)}% smaller ✅${colors.reset}`);
  } else {
    console.log(`  ${colors.red}JSON is ${Math.abs(sizeSavings).toFixed(1)}% smaller${colors.reset}`);
  }

  return {
    beveEncode,
    jsonEncode,
    beveDecode,
    jsonDecode,
    beveSize,
    jsonSize,
    sizeSavings,
  };
}

// Test data
const testCases = [
  {
    name: "Primitives (null, bool, number, string)",
    data: { null: null, bool: true, int: 42, float: 3.14, str: "hello" },
    iterations: 100000,
  },
  {
    name: "Small Object (5 fields)",
    data: { id: 123, name: "John Doe", active: true, score: 95.5, email: "john@example.com" },
    iterations: 50000,
  },
  {
    name: "Array of 100 Numbers",
    data: Array.from({ length: 100 }, (_, i) => i),
    iterations: 10000,
  },
  {
    name: "Array of 1000 Numbers",
    data: Array.from({ length: 1000 }, (_, i) => i),
    iterations: 1000,
  },
  {
    name: "10 Users",
    data: Array.from({ length: 10 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      active: i % 2 === 0,
      score: Math.random() * 100,
    })),
    iterations: 10000,
  },
  {
    name: "100 Users",
    data: Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      active: i % 2 === 0,
      score: Math.random() * 100,
    })),
    iterations: 1000,
  },
  {
    name: "Binary Data (1KB Uint8Array)",
    data: new Uint8Array(1024).fill(0xFF),
    iterations: 10000,
  },
  {
    name: "Mixed Array (various types)",
    data: [1, "hello", true, null, 3.14, { key: "value" }, [1, 2, 3]],
    iterations: 10000,
  },
  {
    name: "Deep Nested Object (10 levels)",
    data: (() => {
      let obj: any = { value: 42 };
      for (let i = 0; i < 10; i++) {
        obj = { nested: obj };
      }
      return obj;
    })(),
    iterations: 10000,
  },
];

console.log("\n" + colors.bright + "⚡ BEVE vs JSON Performance Comparison" + colors.reset);
console.log("═".repeat(80));

const results = [];

for (const { name, data, iterations } of testCases) {
  const result = compareEncodeDecode(name, data, iterations);
  results.push({ name, ...result });
}

// Summary
console.log("\n" + colors.bright + "📊 SUMMARY" + colors.reset);
console.log("═".repeat(80));

let beveEncodeWins = 0;
let jsonEncodeWins = 0;
let beveDecodeWins = 0;
let jsonDecodeWins = 0;
let beveSmallerCount = 0;
let jsonSmallerCount = 0;

for (const result of results) {
  if (result.beveEncode.avgTime < result.jsonEncode.avgTime) beveEncodeWins++;
  else jsonEncodeWins++;
  
  if (result.beveDecode.avgTime < result.jsonDecode.avgTime) beveDecodeWins++;
  else jsonDecodeWins++;
  
  if (result.sizeSavings > 0) beveSmallerCount++;
  else jsonSmallerCount++;
}

console.log(`\n${colors.yellow}Encoding Performance:${colors.reset}`);
console.log(`  BEVE wins: ${colors.green}${beveEncodeWins}${colors.reset} / ${testCases.length}`);
console.log(`  JSON wins: ${colors.green}${jsonEncodeWins}${colors.reset} / ${testCases.length}`);

console.log(`\n${colors.yellow}Decoding Performance:${colors.reset}`);
console.log(`  BEVE wins: ${colors.green}${beveDecodeWins}${colors.reset} / ${testCases.length}`);
console.log(`  JSON wins: ${colors.green}${jsonDecodeWins}${colors.reset} / ${testCases.length}`);

console.log(`\n${colors.yellow}Size Efficiency:${colors.reset}`);
console.log(`  BEVE smaller: ${colors.green}${beveSmallerCount}${colors.reset} / ${testCases.length}`);
console.log(`  JSON smaller: ${colors.green}${jsonSmallerCount}${colors.reset} / ${testCases.length}`);

console.log("\n" + "═".repeat(80));
console.log(colors.bright + colors.green + "✅ Comparison complete!" + colors.reset + "\n");
