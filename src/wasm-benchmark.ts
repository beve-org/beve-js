#!/usr/bin/env node

/**
 * WASM vs TypeScript Benchmark
 * 
 * Compares performance of WASM and TypeScript implementations
 * Shows automatic fallback and performance characteristics
 */

import { performance } from 'node:perf_hooks';
import { initWasm, getImplementationInfo } from './adaptive';
import { writeBeve } from './encoder';
import { readBeve } from './decoder';
import { getWasmModule, type BeveWasmModule } from './wasm-loader';

interface BenchmarkResult {
  name: string;
  avgTime: number;
  minTime: number;
  maxTime: number;
  opsPerSec: number;
  totalTime: number;
}

interface BenchmarkOutcome {
  name: string;
  result: BenchmarkResult | null;
  error?: string;
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

function printFailure(name: string, error?: string) {
  console.log(`   ${name}:`);
  console.log(`      ⚠️  ${error ?? 'Benchmark failed'}`);
}

function printOutcome(outcome: BenchmarkOutcome) {
  if (outcome.result) {
    printResult(outcome.result);
  } else {
    printFailure(outcome.name, outcome.error);
  }
}

function runBenchmarkSafe(
  name: string,
  fn: () => any,
  iterations: number = 1000,
  warmupIterations: number = 100
): BenchmarkOutcome {
  try {
    const result = benchmark(name, fn, iterations, warmupIterations);
    return { name, result };
  } catch (error) {
    return { name, result: null, error: (error as Error).message };
  }
}

function formatOutcomeValue(outcome: BenchmarkOutcome | null | undefined): string {
  if (!outcome) {
    return 'n/a';
  }
  if (outcome.result) {
    return formatNumber(outcome.result.avgTime);
  }
  return `⚠️ ${outcome.error ?? 'n/a'}`;
}

function formatRatio(
  base: BenchmarkOutcome | null | undefined,
  candidate: BenchmarkOutcome | null | undefined
): string {
  if (!base?.result || !candidate?.result) {
    return 'n/a';
  }

  const ratio = base.result.avgTime / candidate.result.avgTime;
  return `${ratio.toFixed(2)}x`;
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

  const wasmModule: BeveWasmModule | null = await getWasmModule();

  console.log('\n' + '═'.repeat(70) + '\n');

  const testSizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
  const summaryRows: Array<{
    Dataset: string;
    'BEVE TS Encode (ms/op)': string;
    'BEVE WASM Encode (ms/op)': string;
    'JSON Encode (ms/op)': string;
    'BEVE TS Decode (ms/op)': string;
    'BEVE WASM Decode (ms/op)': string;
    'JSON Decode (ms/op)': string;
    'TS→WASM Encode Ratio': string;
    'TS→JSON Encode Ratio': string;
    'TS→WASM Decode Ratio': string;
    'TS→JSON Decode Ratio': string;
  }> = [];
  const iterations = 1000;

  for (const size of testSizes) {
    const testData = generateTestData(size);
    const dataSize = JSON.stringify(testData).length;

    console.log(`📊 Testing ${size.toUpperCase()} dataset (${dataSize.toLocaleString()} bytes JSON):`);
    console.log('─'.repeat(70));

    // TypeScript encode benchmark
    const tsEncodeOutcome = runBenchmarkSafe(
      'TypeScript Encode (TS)',
      () => writeBeve(testData),
      iterations
    );
    printOutcome(tsEncodeOutcome);
    console.log();

    const tsSample = writeBeve(testData);

    // TypeScript decode benchmark
    const tsDecodeOutcome = runBenchmarkSafe(
      'TypeScript Decode (TS)',
      () => readBeve(tsSample),
      iterations
    );
    printOutcome(tsDecodeOutcome);
    console.log();

    const jsonSample = JSON.stringify(testData);

    const jsonEncodeOutcome = runBenchmarkSafe(
      'JSON Encode (JSON.stringify)',
      () => JSON.stringify(testData),
      iterations
    );
    printOutcome(jsonEncodeOutcome);
    console.log();

    const jsonDecodeOutcome = runBenchmarkSafe(
      'JSON Decode (JSON.parse)',
      () => JSON.parse(jsonSample),
      iterations
    );
    printOutcome(jsonDecodeOutcome);
    console.log();

    let wasmEncodeOutcome: BenchmarkOutcome | null = null;
    let wasmDecodeOutcome: BenchmarkOutcome | null = null;
    let wasmEncodeError: string | undefined;
    let wasmDecodeError: string | undefined;

    if (wasmModule) {
      let wasmEncodedSample: Uint8Array | null = null;

      const encodeOutcome = runBenchmarkSafe(
        'WASM Encode',
        () => {
          const result = wasmModule.marshal(testData);
          if (result.error) {
            throw new Error(result.error);
          }
          if (!result.data) {
            throw new Error('WASM marshal returned no data');
          }
          wasmEncodedSample = result.data;
          return result.data;
        },
        iterations
      );
      wasmEncodeOutcome = encodeOutcome;
      printOutcome(encodeOutcome);
      console.log();

      if (encodeOutcome.result && wasmEncodedSample) {
        const sample = wasmEncodedSample;
        const decodeOutcome = runBenchmarkSafe(
          'WASM Decode',
          () => {
            const result = wasmModule.unmarshal(sample);
            if (result.error) {
              throw new Error(result.error);
            }
            return result.data;
          },
          iterations
        );
        wasmDecodeOutcome = decodeOutcome;
        printOutcome(decodeOutcome);
        console.log();
      } else {
        wasmDecodeError = encodeOutcome.error ?? 'WASM encode failed';
        printFailure('WASM Decode', wasmDecodeError);
        console.log();
      }
    } else {
      wasmEncodeError = 'WASM module not available';
      wasmDecodeError = 'WASM module not available';
      printFailure('WASM Encode', wasmEncodeError);
      console.log();
      printFailure('WASM Decode', wasmDecodeError);
      console.log();
    }

    console.log('🔬 Encoding Comparison:');
    if (tsEncodeOutcome.result && wasmEncodeOutcome?.result) {
      compareResults(tsEncodeOutcome.result, wasmEncodeOutcome.result);
    } else if (wasmEncodeOutcome?.error || wasmEncodeError) {
      console.log(`   ⚠️  ${wasmEncodeOutcome?.error ?? wasmEncodeError}`);
    }
    if (tsEncodeOutcome.result && jsonEncodeOutcome.result) {
      compareResults(tsEncodeOutcome.result, jsonEncodeOutcome.result);
    } else if (jsonEncodeOutcome.error) {
      console.log(`   ⚠️  ${jsonEncodeOutcome.error}`);
    }
    console.log();

    console.log('🔬 Decoding Comparison:');
    if (tsDecodeOutcome.result && wasmDecodeOutcome?.result) {
      compareResults(tsDecodeOutcome.result, wasmDecodeOutcome.result);
    } else if (wasmDecodeOutcome?.error || wasmDecodeError) {
      console.log(`   ⚠️  ${wasmDecodeOutcome?.error ?? wasmDecodeError}`);
    }
    if (tsDecodeOutcome.result && jsonDecodeOutcome.result) {
      compareResults(tsDecodeOutcome.result, jsonDecodeOutcome.result);
    } else if (jsonDecodeOutcome.error) {
      console.log(`   ⚠️  ${jsonDecodeOutcome.error}`);
    }
    console.log();

    const summaryRow = {
      Dataset: size.toUpperCase(),
      'BEVE TS Encode (ms/op)': formatOutcomeValue(tsEncodeOutcome),
      'BEVE WASM Encode (ms/op)': formatOutcomeValue(wasmEncodeOutcome),
      'JSON Encode (ms/op)': formatOutcomeValue(jsonEncodeOutcome),
      'BEVE TS Decode (ms/op)': formatOutcomeValue(tsDecodeOutcome),
      'BEVE WASM Decode (ms/op)': formatOutcomeValue(wasmDecodeOutcome),
      'JSON Decode (ms/op)': formatOutcomeValue(jsonDecodeOutcome),
      'TS→WASM Encode Ratio': formatRatio(tsEncodeOutcome, wasmEncodeOutcome),
      'TS→JSON Encode Ratio': formatRatio(tsEncodeOutcome, jsonEncodeOutcome),
      'TS→WASM Decode Ratio': formatRatio(tsDecodeOutcome, wasmDecodeOutcome),
      'TS→JSON Decode Ratio': formatRatio(tsDecodeOutcome, jsonDecodeOutcome),
    };

    summaryRows.push(summaryRow);

    console.log('═'.repeat(70) + '\n');
  }

  console.log('✅ WASM Benchmark completed!\n');

  if (summaryRows.length) {
    console.log('📈 Summary (lower is better):');
    console.table(summaryRows);
  }

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
