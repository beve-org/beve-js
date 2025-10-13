#!/usr/bin/env node

/**
 * WASM vs TypeScript Benchmark
 * 
 * Compares performance of WASM and TypeScript implementations
 * Shows automatic fallback and performance characteristics
 */

import {
  marshal,
  unmarshal,
  marshalSync,
  unmarshalSync,
  initWasm,
  getImplementationInfo,
} from './adaptive';

interface BenchmarkResult {
  name: string;
  avgTime: number;
  minTime: number;
  maxTime: number;
  opsPerSec: number;
  totalTime: number;
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

function formatOpsPerSec(ops: number): string {
  if (ops > 1000000) {
    return `${(ops / 1000000).toFixed(2)}M ops/sec`;
  } else if (ops > 1000) {
    return `${(ops / 1000).toFixed(2)}K ops/sec`;
  } else {
    return `${ops.toFixed(0)} ops/sec`;
  }
}

/**
 * Measure performance of a function
 */
function benchmark(
  name: string,
  fn: () => any,
  iterations: number = 1000,
  warmupIterations: number = 100
): BenchmarkResult {
  // Warmup
  for (let i = 0; i < warmupIterations; i++) {
    fn();
  }

  // Measure
  const times: number[] = [];
  const startTotal = performance.now();

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  const endTotal = performance.now();
  const totalTime = endTotal - startTotal;

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const opsPerSec = (iterations / totalTime) * 1000;

  return {
    name,
    avgTime,
    minTime,
    maxTime,
    opsPerSec,
    totalTime,
  };
}

/**
 * Async benchmark wrapper
 */
async function benchmarkAsync(
  name: string,
  fn: () => Promise<void>,
  iterations: number = 1000,
  warmupIterations: number = 100
): Promise<BenchmarkResult> {
  // Warmup
  for (let i = 0; i < warmupIterations; i++) {
    await fn();
  }

  // Measure
  const times: number[] = [];
  const startTotal = performance.now();

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  const endTotal = performance.now();
  const totalTime = endTotal - startTotal;

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const opsPerSec = (iterations / totalTime) * 1000;

  return {
    name,
    avgTime,
    minTime,
    maxTime,
    opsPerSec,
    totalTime,
  };
}

/**
 * Generate test data
 */
function generateTestData(type: 'small' | 'medium' | 'large') {
  switch (type) {
    case 'small':
      return {
        id: 123,
        name: 'Alice',
        email: 'alice@example.com',
        active: true,
        score: 98.5,
      };

    case 'medium':
      return {
        id: 456,
        name: 'Bob',
        email: 'bob@example.com',
        active: true,
        score: 87.3,
        tags: ['developer', 'golang', 'javascript', 'python'],
        metadata: {
          created: '2024-01-01T00:00:00Z',
          updated: '2024-10-13T00:00:00Z',
          version: 2,
        },
        items: Array.from({ length: 50 }, (_, i) => ({
          id: i,
          value: Math.random() * 100,
          active: i % 2 === 0,
        })),
      };

    case 'large':
      return {
        id: 789,
        name: 'Charlie',
        email: 'charlie@example.com',
        active: true,
        score: 92.1,
        tags: Array.from({ length: 100 }, (_, i) => `tag_${i}`),
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: Math.random() * 1000,
          active: i % 2 === 0,
          category: `category_${i % 10}`,
          metadata: {
            created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            priority: Math.floor(Math.random() * 10),
          },
        })),
      };
  }
}

/**
 * Print benchmark result
 */
function printResult(result: BenchmarkResult) {
  console.log(`   ${result.name}:`);
  console.log(`      Avg:        ${formatNumber(result.avgTime)} ms/op`);
  console.log(`      Min:        ${formatNumber(result.minTime)} ms`);
  console.log(`      Max:        ${formatNumber(result.maxTime)} ms`);
  console.log(`      Throughput: ${formatOpsPerSec(result.opsPerSec)}`);
  console.log(`      Total:      ${formatNumber(result.totalTime)} ms`);
}

/**
 * Compare two benchmark results
 */
function compareResults(baseline: BenchmarkResult, candidate: BenchmarkResult) {
  const speedup = baseline.avgTime / candidate.avgTime;
  const diff = ((candidate.avgTime - baseline.avgTime) / baseline.avgTime) * 100;

  if (speedup > 1) {
    console.log(`   ✅ ${candidate.name} is ${speedup.toFixed(2)}x FASTER (${Math.abs(diff).toFixed(1)}% faster)`);
  } else {
    console.log(`   ⚠️  ${candidate.name} is ${(1 / speedup).toFixed(2)}x SLOWER (${Math.abs(diff).toFixed(1)}% slower)`);
  }
}

/**
 * Main benchmark
 */
async function runWasmBenchmark() {
  console.log('🚀 BEVE WASM vs TypeScript Benchmark\n');
  console.log('═'.repeat(70));

  // Initialize WASM
  console.log('🔧 Initializing WASM...');
  const wasmLoaded = await initWasm();
  
  const info = getImplementationInfo();
  console.log(`   Implementation: ${info.implementation}`);
  console.log(`   Runtime:        ${info.runtime}`);
  console.log(`   WASM Supported: ${info.wasmSupported ? '✅ Yes' : '❌ No'}`);
  console.log(`   WASM Loaded:    ${info.wasmLoaded ? '✅ Yes' : '❌ No'}`);
  
  if (info.error) {
    console.log(`   Error:          ${info.error}`);
  }
  
  console.log('\n' + '═'.repeat(70) + '\n');

  const testSizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
  const iterations = 1000;

  for (const size of testSizes) {
    const testData = generateTestData(size);
    const dataSize = JSON.stringify(testData).length;

    console.log(`📊 Testing ${size.toUpperCase()} dataset (${dataSize.toLocaleString()} bytes JSON):`);
    console.log('─'.repeat(70));

    // TypeScript Marshal (Sync)
    const tsEncodeResult = benchmark(
      'TypeScript Marshal (Sync)',
      () => marshalSync(testData),
      iterations
    );
    printResult(tsEncodeResult);
    console.log();

    // Adaptive Marshal (may use WASM)
    const adaptiveEncodeResult = await benchmarkAsync(
      'Adaptive Marshal (WASM/TS)',
      async () => { await marshal(testData); },
      iterations
    );
    printResult(adaptiveEncodeResult);
    console.log();

    // Compare encoding
    console.log('🔬 Encoding Comparison:');
    compareResults(tsEncodeResult, adaptiveEncodeResult);
    console.log();

    // Pre-encode for decode tests
    const tsEncoded = marshalSync(testData);
    const adaptiveEncoded = await marshal(testData);

    // TypeScript Unmarshal (Sync)
    const tsDecodeResult = benchmark(
      'TypeScript Unmarshal (Sync)',
      () => unmarshalSync(tsEncoded),
      iterations
    );
    printResult(tsDecodeResult);
    console.log();

    // Adaptive Unmarshal (may use WASM)
    const adaptiveDecodeResult = await benchmarkAsync(
      'Adaptive Unmarshal (WASM/TS)',
      async () => { await unmarshal(adaptiveEncoded); },
      iterations
    );
    printResult(adaptiveDecodeResult);
    console.log();

    // Compare decoding
    console.log('🔬 Decoding Comparison:');
    compareResults(tsDecodeResult, adaptiveDecodeResult);
    console.log();

    console.log('═'.repeat(70) + '\n');
  }

  console.log('✅ WASM Benchmark completed!\n');

  if (wasmLoaded) {
    console.log('💡 WASM is active and being used for encode/decode operations.');
  } else {
    console.log('💡 WASM not available - using TypeScript fallback.');
    console.log('   To enable WASM: ensure wasm/beve.wasm exists and is accessible.');
  }
}

// Run benchmark
runWasmBenchmark().catch(console.error);

export { runWasmBenchmark };
