#!/usr/bin/env node

// Beve Benchmark Script
// Tests encoding/decoding performance and size comparison

import { readBeve, writeBeve } from './index.js';

// Test data generators
function generateTestData(size: 'small' | 'medium' | 'large' | 'typed-arrays') {
    switch (size) {
        case 'small':
            return {
                name: "Small Test Object",
                version: 1.0,
                active: true,
                count: 42,
                items: ["item1", "item2", "item3"],
                nested: {
                    prop1: "value1",
                    prop2: 123,
                    prop3: false
                }
            };

        case 'medium':
            return {
                name: "Medium Test Object",
                version: 2.1,
                active: true,
                count: 100,
                items: Array.from({ length: 10 }, (_, i) => ({
                    id: i,
                    name: `Item ${i}`,
                    value: Math.random() * 100,
                    active: i % 2 === 0,
                    tags: [`tag${i % 10}`, `category${i % 5}`]
                })),
                metadata: {
                    created: new Date().toISOString(),
                    author: "Benchmark Test",
                    description: "Medium size test data for Beve performance testing",
                    settings: {
                        timeout: 5000,
                        retries: 3,
                        enabled: true
                    }
                },
                numbers: Array.from({ length: 50 }, () => Math.random() * 100),
                strings: Array.from({ length: 20 }, (_, i) => `String value ${i} with some additional text to make it longer`)
            };

        case 'typed-arrays':
            return {
                name: "Typed Arrays Test",
                description: "Test data optimized for typed array performance",
                integers: Array.from({ length: 1000 }, (_, i) => i),
                floats: Array.from({ length: 1000 }, () => Math.random() * 100),
                doubles: Array.from({ length: 1000 }, () => Math.random() * 1000000),
                booleans: Array.from({ length: 100 }, (_, i) => i % 2 === 0),
                strings: Array.from({ length: 100 }, (_, i) => `String ${i}`),
                mixed: [1, "test", true, 3.14, null, { key: "value" }],
                nested: {
                    moreIntegers: Array.from({ length: 500 }, (_, i) => i * 2),
                    moreFloats: Array.from({ length: 500 }, () => Math.random())
                }
            };

        case 'large':
            // Generate 10,000 elements for performance testing
            const itemCount = 10000;
            return {
                name: "Large Test Object with 100 Elements",
                version: 3.0,
                count: itemCount,
                description: `Large dataset containing ${itemCount} elements for performance testing`,
                items: Array.from({ length: itemCount }, (_, i) => ({
                    id: i,
                    name: `Item ${i}`,
                    value: Math.random() * 1000,
                    active: i % 2 === 0,
                    category: `category_${i % 10}`,
                    tags: [`tag${i % 20}`, `group${i % 5}`, `type${i % 3}`],
                    metadata: {
                        created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
                        priority: Math.floor(Math.random() * 10),
                        score: Math.random() * 100
                    },
                    data: {
                        numbers: Array.from({ length: 5 }, () => Math.random() * 100),
                        strings: Array.from({ length: 3 }, (_, j) => `String ${j} for item ${i}`)
                    }
                })),
                summary: {
                    totalItems: itemCount,
                    activeItems: Math.floor(itemCount / 2),
                    categories: Array.from({ length: 10 }, (_, i) => `category_${i}`),
                    generated: new Date().toISOString()
                },
                statistics: {
                    averageValue: 500,
                    minValue: 0,
                    maxValue: 1000,
                    totalValue: itemCount * 500
                }
            };
    }
}

// Performance measurement function with throughput calculation
function measurePerformance<T>(
    fn: () => T,
    iterations: number = 1000,
    warmupIterations: number = 10
): {
    result: T;
    averageTime: number;
    totalTime: number;
    minTime: number;
    maxTime: number;
    operationsPerSecond: number;
    throughput: string;
} {
    // Warmup phase
    for (let i = 0; i < warmupIterations; i++) {
        fn();
    }

    const times: number[] = [];
    let totalTime = 0;
    let lastResult: T;

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        lastResult = fn();
        const end = performance.now();
        const duration = end - start;
        times.push(duration);
        totalTime += duration;
    }

    const averageTime = totalTime / iterations;
    const operationsPerSecond = 1000 / averageTime; // Convert ms to operations per second

    // Format throughput
    let throughput: string;
    if (operationsPerSecond >= 1000) {
        throughput = `${(operationsPerSecond / 1000).toFixed(2)} K ops/sec`;
    } else {
        throughput = `${operationsPerSecond.toFixed(2)} ops/sec`;
    }

    return {
        result: lastResult!,
        averageTime,
        totalTime,
        minTime: Math.min(...times),
        maxTime: Math.max(...times),
        operationsPerSecond,
        throughput
    };
}

// Size comparison function
function compareSizes(jsonData: any): {
    jsonSize: number;
    beveSize: number;
    compressionRatio: number;
} {
    const jsonString = JSON.stringify(jsonData);
    const jsonSize = Buffer.byteLength(jsonString, 'utf8');

    const beveData = writeBeve(jsonData);
    const beveSize = beveData.length;

    return {
        jsonSize,
        beveSize,
        compressionRatio: (jsonSize - beveSize) / jsonSize * 100
    };
}

// Memory usage measurement
function getMemoryUsage(): { heapUsed: number; heapTotal: number; external: number } {
    const memUsage = process.memoryUsage();
    return {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
        external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100 // MB
    };
}

// Main benchmark function with enhanced metrics
async function runBenchmark() {
    console.log('🚀 Beve Performance Benchmark Test Starting...\n');
    console.log('📋 Test Configuration:');
    console.log('   • Large dataset: 10,000 elements');
    console.log('   • Iterations: 1,000 per test');
    console.log('   • Warmup: 10 iterations\n');

    const testSizes: ('small' | 'medium' | 'large' | 'typed-arrays')[] = ['small', 'medium', 'typed-arrays', 'large'];

    for (const size of testSizes) {
        console.log(`📊 Testing ${size.toUpperCase()} dataset:`);
        console.log('═'.repeat(70));

        const testData = generateTestData(size);
        const dataSize = JSON.stringify(testData).length;

        console.log(`📏 Data Size: ${dataSize.toLocaleString()} characters`);
        const elementCount = size === 'large' ? '10,000' : 
                            size === 'typed-arrays' ? '~3,000 (typed arrays)' : 
                            size === 'medium' ? '~50' : '~10';
        console.log(`📊 Element Count: ${elementCount}\n`);

        // Size comparison
        console.log('📏 Size Comparison:');
        const sizes = compareSizes(testData);
        console.log(`   JSON Size:  ${sizes.jsonSize.toLocaleString()} bytes`);
        console.log(`   Beve Size:  ${sizes.beveSize.toLocaleString()} bytes`);
        console.log(`   Ratio:      ${sizes.compressionRatio.toFixed(2)}% smaller`);
        console.log(`   Savings:    ${(sizes.jsonSize - sizes.beveSize).toLocaleString()} bytes\n`);

        // Memory usage before operations
        const memBefore = getMemoryUsage();
        console.log('🧠 Memory Usage (before operations):');
        console.log(`   Heap Used:  ${memBefore.heapUsed} MB`);
        console.log(`   Heap Total: ${memBefore.heapTotal} MB\n`);

        // Encoding performance with high iteration count
        const encodeIterations = size === 'large' ? 100 : 1000; // Reduce iterations for large dataset
        console.log(`⚡ Encoding Performance (${encodeIterations.toLocaleString()} iterations):`);
        const encodePerf = measurePerformance(() => writeBeve(testData), encodeIterations, 10);
        console.log(`   Average:     ${encodePerf.averageTime.toFixed(4)} ms/op`);
        console.log(`   Min:         ${encodePerf.minTime.toFixed(4)} ms`);
        console.log(`   Max:         ${encodePerf.maxTime.toFixed(4)} ms`);
        console.log(`   Throughput:  ${encodePerf.throughput}`);
        console.log(`   Total Time:  ${(encodePerf.totalTime / 1000).toFixed(2)} seconds\n`);

        // Decoding performance with high iteration count
        console.log(`⚡ Decoding Performance (${encodeIterations.toLocaleString()} iterations):`);
        const beveData = writeBeve(testData); // Pre-encode for decode test
        const decodePerf = measurePerformance(() => readBeve(beveData), encodeIterations, 10);
        console.log(`   Average:     ${decodePerf.averageTime.toFixed(4)} ms/op`);
        console.log(`   Min:         ${decodePerf.minTime.toFixed(4)} ms`);
        console.log(`   Max:         ${decodePerf.maxTime.toFixed(4)} ms`);
        console.log(`   Throughput:  ${decodePerf.throughput}`);
        console.log(`   Total Time:  ${(decodePerf.totalTime / 1000).toFixed(2)} seconds\n`);

        // JSON comparison
        console.log(`⚡ JSON.stringify Performance (${encodeIterations.toLocaleString()} iterations):`);
        const jsonEncodePerf = measurePerformance(() => JSON.stringify(testData), encodeIterations, 10);
        console.log(`   Average:     ${jsonEncodePerf.averageTime.toFixed(4)} ms/op`);
        console.log(`   Throughput:  ${jsonEncodePerf.throughput}`);
        console.log(`   vs Beve:     ${(jsonEncodePerf.averageTime / encodePerf.averageTime).toFixed(2)}x ${jsonEncodePerf.averageTime > encodePerf.averageTime ? 'slower' : 'faster'}\n`);

        console.log(`⚡ JSON.parse Performance (${encodeIterations.toLocaleString()} iterations):`);
        const jsonString = JSON.stringify(testData);
        const jsonDecodePerf = measurePerformance(() => JSON.parse(jsonString), encodeIterations, 10);
        console.log(`   Average:     ${jsonDecodePerf.averageTime.toFixed(4)} ms/op`);
        console.log(`   Throughput:  ${jsonDecodePerf.throughput}`);
        console.log(`   vs Beve:     ${(jsonDecodePerf.averageTime / decodePerf.averageTime).toFixed(2)}x ${jsonDecodePerf.averageTime > decodePerf.averageTime ? 'slower' : 'faster'}\n`);

        // Memory usage after operations
        const memAfter = getMemoryUsage();
        console.log('🧠 Memory Usage (after operations):');
        console.log(`   Heap Used:  ${memAfter.heapUsed} MB`);
        console.log(`   Heap Total: ${memAfter.heapTotal} MB`);
        console.log(`   Change:     ${(memAfter.heapUsed - memBefore.heapUsed).toFixed(2)} MB\n`);

        // Round-trip test (encode -> decode -> compare)
        console.log('🔄 Round-trip Test:');
        const encoded = writeBeve(testData);
        const decoded = readBeve(encoded);
        const roundTripSuccess = JSON.stringify(testData) === JSON.stringify(decoded);
        console.log(`   Success:    ${roundTripSuccess ? '✅ PASS' : '❌ FAIL'}\n`);

        // Performance summary
        console.log('📈 Performance Summary:');
        console.log(`   Encode Rate: ${encodePerf.throughput}`);
        console.log(`   Decode Rate: ${decodePerf.throughput}`);
        console.log(`   Size Ratio:  ${(sizes.compressionRatio).toFixed(2)}% compression`);
        console.log(`   Memory Δ:    ${(memAfter.heapUsed - memBefore.heapUsed).toFixed(2)} MB\n`);

        console.log('═'.repeat(70));
        console.log();
    }

    console.log('✅ Performance benchmark completed!');
    console.log('\n💡 Optimization Recommendations:');
    console.log('   • Focus on encoding/decoding bottlenecks');
    console.log('   • Monitor memory usage for large datasets');
    console.log('   • Consider streaming for very large files');
}

// Run benchmark if this script is executed directly
// For ES modules, we'll run it directly when imported
// Use tsx or node to run: tsx src/benchmark.ts or node dist/benchmark.js
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].includes('benchmark')) {
    runBenchmark().catch(console.error);
}

export { runBenchmark, generateTestData, measurePerformance, compareSizes };