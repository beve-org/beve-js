// Performance benchmark tests with detailed profiling
import { describe, test, expect } from "bun:test";
import { readBeve } from "../src/decoder";
import { writeBeve } from "../src/encoder";

// Helper function to measure performance
function measureOperation<T>(
    fn: () => T,
    iterations: number = 100
): { avgTime: number; minTime: number; maxTime: number; opsPerSec: number } {
    const times: number[] = [];
    
    // Warmup
    for (let i = 0; i < 10; i++) {
        fn();
    }
    
    // Measure
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        fn();
        const end = performance.now();
        times.push(end - start);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const opsPerSec = 1000 / avgTime;
    
    return { avgTime, minTime, maxTime, opsPerSec };
}

describe("Performance - Small Data", () => {
    const smallData = {
        name: "Small Test",
        value: 42,
        active: true,
        items: [1, 2, 3]
    };

    test("encoding small object should be fast", () => {
        const perf = measureOperation(() => writeBeve(smallData), 1000);
        
        console.log(`Small Object Encoding: ${perf.avgTime.toFixed(4)}ms avg, ${perf.opsPerSec.toFixed(0)} ops/sec`);
        
        expect(perf.avgTime).toBeLessThan(1); // Should be under 1ms
        expect(perf.opsPerSec).toBeGreaterThan(1000); // At least 1K ops/sec
    });

    test("decoding small object should be fast", () => {
        const encoded = writeBeve(smallData);
        const perf = measureOperation(() => readBeve(encoded), 1000);
        
        console.log(`Small Object Decoding: ${perf.avgTime.toFixed(4)}ms avg, ${perf.opsPerSec.toFixed(0)} ops/sec`);
        
        expect(perf.avgTime).toBeLessThan(1); // Should be under 1ms
        expect(perf.opsPerSec).toBeGreaterThan(1000); // At least 1K ops/sec
    });
});

describe("Performance - Medium Data", () => {
    const mediumData = {
        name: "Medium Test",
        items: Array.from({ length: 50 }, (_, i) => ({
            id: i,
            name: `Item ${i}`,
            value: Math.random() * 100,
            active: i % 2 === 0
        })),
        metadata: {
            created: new Date().toISOString(),
            tags: ["test", "benchmark", "performance"]
        }
    };

    test("encoding medium object should be efficient", () => {
        const perf = measureOperation(() => writeBeve(mediumData), 500);
        
        console.log(`Medium Object Encoding: ${perf.avgTime.toFixed(4)}ms avg, ${perf.opsPerSec.toFixed(0)} ops/sec`);
        
        expect(perf.avgTime).toBeLessThan(10); // Should be under 10ms
        expect(perf.opsPerSec).toBeGreaterThan(100); // At least 100 ops/sec
    });

    test("decoding medium object should be efficient", () => {
        const encoded = writeBeve(mediumData);
        const perf = measureOperation(() => readBeve(encoded), 500);
        
        console.log(`Medium Object Decoding: ${perf.avgTime.toFixed(4)}ms avg, ${perf.opsPerSec.toFixed(0)} ops/sec`);
        
        expect(perf.avgTime).toBeLessThan(10); // Should be under 10ms
        expect(perf.opsPerSec).toBeGreaterThan(100); // At least 100 ops/sec
    });
});

describe("Performance - Integer Arrays", () => {
    test("encoding large integer array", () => {
        const data = Array.from({ length: 1000 }, (_, i) => i);
        const perf = measureOperation(() => writeBeve(data), 200);
        
        console.log(`Integer Array (1K) Encoding: ${perf.avgTime.toFixed(4)}ms avg, ${perf.opsPerSec.toFixed(0)} ops/sec`);
        
        expect(perf.avgTime).toBeLessThan(50); // Should be under 50ms
        expect(perf.opsPerSec).toBeGreaterThan(20); // At least 20 ops/sec
    });

    test("decoding large integer array", () => {
        const data = Array.from({ length: 1000 }, (_, i) => i);
        const encoded = writeBeve(data);
        const perf = measureOperation(() => readBeve(encoded), 200);
        
        console.log(`Integer Array (1K) Decoding: ${perf.avgTime.toFixed(4)}ms avg, ${perf.opsPerSec.toFixed(0)} ops/sec`);
        
        expect(perf.avgTime).toBeLessThan(50); // Should be under 50ms
        expect(perf.opsPerSec).toBeGreaterThan(20); // At least 20 ops/sec
    });
});

describe("Performance - Float Arrays", () => {
    test("encoding large float array", () => {
        const data = Array.from({ length: 1000 }, () => Math.random() * 100);
        const perf = measureOperation(() => writeBeve(data), 200);
        
        console.log(`Float Array (1K) Encoding: ${perf.avgTime.toFixed(4)}ms avg, ${perf.opsPerSec.toFixed(0)} ops/sec`);
        
        expect(perf.avgTime).toBeLessThan(50); // Should be under 50ms
        expect(perf.opsPerSec).toBeGreaterThan(20); // At least 20 ops/sec
    });

    test("decoding large float array", () => {
        const data = Array.from({ length: 1000 }, () => Math.random() * 100);
        const encoded = writeBeve(data);
        const perf = measureOperation(() => readBeve(encoded), 200);
        
        console.log(`Float Array (1K) Decoding: ${perf.avgTime.toFixed(4)}ms avg, ${perf.opsPerSec.toFixed(0)} ops/sec`);
        
        expect(perf.avgTime).toBeLessThan(50); // Should be under 50ms
        expect(perf.opsPerSec).toBeGreaterThan(20); // At least 20 ops/sec
    });
});

describe("Performance - String Arrays", () => {
    test("encoding string array", () => {
        const data = Array.from({ length: 100 }, (_, i) => `String value number ${i}`);
        const perf = measureOperation(() => writeBeve(data), 200);
        
        console.log(`String Array (100) Encoding: ${perf.avgTime.toFixed(4)}ms avg, ${perf.opsPerSec.toFixed(0)} ops/sec`);
        
        expect(perf.avgTime).toBeLessThan(20); // Should be under 20ms
        expect(perf.opsPerSec).toBeGreaterThan(50); // At least 50 ops/sec
    });

    test("decoding string array", () => {
        const data = Array.from({ length: 100 }, (_, i) => `String value number ${i}`);
        const encoded = writeBeve(data);
        const perf = measureOperation(() => readBeve(encoded), 200);
        
        console.log(`String Array (100) Decoding: ${perf.avgTime.toFixed(4)}ms avg, ${perf.opsPerSec.toFixed(0)} ops/sec`);
        
        expect(perf.avgTime).toBeLessThan(20); // Should be under 20ms
        expect(perf.opsPerSec).toBeGreaterThan(50); // At least 50 ops/sec
    });
});

describe("Performance - Nested Structures", () => {
    const nestedData = {
        level1: {
            level2: {
                level3: {
                    level4: {
                        data: Array.from({ length: 100 }, (_, i) => i)
                    }
                }
            }
        }
    };

    test("encoding deeply nested structure", () => {
        const perf = measureOperation(() => writeBeve(nestedData), 200);
        
        console.log(`Nested Structure Encoding: ${perf.avgTime.toFixed(4)}ms avg, ${perf.opsPerSec.toFixed(0)} ops/sec`);
        
        expect(perf.avgTime).toBeLessThan(20); // Should be under 20ms
        expect(perf.opsPerSec).toBeGreaterThan(50); // At least 50 ops/sec
    });

    test("decoding deeply nested structure", () => {
        const encoded = writeBeve(nestedData);
        const perf = measureOperation(() => readBeve(encoded), 200);
        
        console.log(`Nested Structure Decoding: ${perf.avgTime.toFixed(4)}ms avg, ${perf.opsPerSec.toFixed(0)} ops/sec`);
        
        expect(perf.avgTime).toBeLessThan(20); // Should be under 20ms
        expect(perf.opsPerSec).toBeGreaterThan(50); // At least 50 ops/sec
    });
});

describe("Performance - Binary Data", () => {
    test("encoding binary data", () => {
        const data = new Uint8Array(1000);
        for (let i = 0; i < 1000; i++) {
            data[i] = i % 256;
        }
        
        const perf = measureOperation(() => writeBeve(data), 200);
        
        console.log(`Binary Data (1K) Encoding: ${perf.avgTime.toFixed(4)}ms avg, ${perf.opsPerSec.toFixed(0)} ops/sec`);
        
        expect(perf.avgTime).toBeLessThan(10); // Should be under 10ms
        expect(perf.opsPerSec).toBeGreaterThan(100); // At least 100 ops/sec
    });

    test("decoding binary data", () => {
        const data = new Uint8Array(1000);
        for (let i = 0; i < 1000; i++) {
            data[i] = i % 256;
        }
        const encoded = writeBeve(data);
        
        const perf = measureOperation(() => readBeve(encoded), 200);
        
        console.log(`Binary Data (1K) Decoding: ${perf.avgTime.toFixed(4)}ms avg, ${perf.opsPerSec.toFixed(0)} ops/sec`);
        
        expect(perf.avgTime).toBeLessThan(10); // Should be under 10ms
        expect(perf.opsPerSec).toBeGreaterThan(100); // At least 100 ops/sec
    });
});

describe("Performance - Size Comparison", () => {
    test("BEVE should be smaller than JSON for typed data", () => {
        const data = {
            integers: Array.from({ length: 100 }, (_, i) => i),
            floats: Array.from({ length: 100 }, () => Math.random() * 100)
        };
        
        const beveSize = writeBeve(data).length;
        const jsonSize = new TextEncoder().encode(JSON.stringify(data)).length;
        
        console.log(`Size comparison - BEVE: ${beveSize} bytes, JSON: ${jsonSize} bytes`);
        console.log(`BEVE is ${((1 - beveSize / jsonSize) * 100).toFixed(2)}% smaller`);
        
        expect(beveSize).toBeLessThan(jsonSize);
    });

    test("should efficiently encode large object", () => {
        const data = {
            items: Array.from({ length: 100 }, (_, i) => ({
                id: i,
                name: `Item ${i}`,
                value: Math.random() * 100
            }))
        };
        
        const beveSize = writeBeve(data).length;
        const jsonSize = new TextEncoder().encode(JSON.stringify(data)).length;
        
        console.log(`Large object - BEVE: ${beveSize} bytes, JSON: ${jsonSize} bytes`);
        console.log(`Compression ratio: ${((1 - beveSize / jsonSize) * 100).toFixed(2)}%`);
        
        expect(beveSize).toBeLessThan(jsonSize);
    });
});
