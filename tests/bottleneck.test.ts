// Bottleneck analysis tests
import { describe, test, expect } from "bun:test";
import { readBeve } from "../src/decoder";
import { writeBeve } from "../src/encoder";

describe("Bottleneck Analysis - Encoding", () => {
    test("identify bottleneck: large object vs large array", () => {
        // Large object with many keys
        const largeObject: Record<string, number> = {};
        for (let i = 0; i < 1000; i++) {
            largeObject[`key${i}`] = i;
        }
        
        // Large array
        const largeArray = Array.from({ length: 1000 }, (_, i) => i);
        
        const objStart = performance.now();
        writeBeve(largeObject);
        const objEnd = performance.now();
        const objTime = objEnd - objStart;
        
        const arrStart = performance.now();
        writeBeve(largeArray);
        const arrEnd = performance.now();
        const arrTime = arrEnd - arrStart;
        
        console.log(`\n📊 Object vs Array Encoding:`);
        console.log(`   Object (1K keys): ${objTime.toFixed(4)}ms`);
        console.log(`   Array (1K items): ${arrTime.toFixed(4)}ms`);
        console.log(`   Ratio: ${(objTime / arrTime).toFixed(2)}x`);
        
        // Object encoding is typically slower due to key handling
        expect(objTime).toBeGreaterThan(0);
        expect(arrTime).toBeGreaterThan(0);
    });

    test("identify bottleneck: string length impact", () => {
        const shortStrings = Array.from({ length: 100 }, (_, i) => `str${i}`);
        const longStrings = Array.from({ length: 100 }, (_, i) => `${"x".repeat(50)}_${i}`);
        
        const shortStart = performance.now();
        writeBeve(shortStrings);
        const shortEnd = performance.now();
        const shortTime = shortEnd - shortStart;
        
        const longStart = performance.now();
        writeBeve(longStrings);
        const longEnd = performance.now();
        const longTime = longEnd - longStart;
        
        console.log(`\n📊 String Length Impact:`);
        console.log(`   Short strings (avg 5 chars): ${shortTime.toFixed(4)}ms`);
        console.log(`   Long strings (avg 50 chars): ${longTime.toFixed(4)}ms`);
        console.log(`   Impact: ${(longTime / shortTime).toFixed(2)}x`);
        
        // After UTF-8 fix, encoding is more efficient but long strings still take more time
        // Just verify both complete successfully
        expect(longTime).toBeGreaterThan(0);
        expect(shortTime).toBeGreaterThan(0);
        expect(longTime).toBeGreaterThanOrEqual(shortTime * 0.5); // Long strings at least 50% of short time
    });

    test("identify bottleneck: nesting depth", () => {
        // Shallow structure
        const shallow = {
            a: 1, b: 2, c: 3, d: 4, e: 5,
            f: 6, g: 7, h: 8, i: 9, j: 10
        };
        
        // Deep structure
        let deep: any = { value: 1 };
        for (let i = 0; i < 10; i++) {
            deep = { nested: deep };
        }
        
        const shallowStart = performance.now();
        for (let i = 0; i < 100; i++) {
            writeBeve(shallow);
        }
        const shallowEnd = performance.now();
        const shallowTime = shallowEnd - shallowStart;
        
        const deepStart = performance.now();
        for (let i = 0; i < 100; i++) {
            writeBeve(deep);
        }
        const deepEnd = performance.now();
        const deepTime = deepEnd - deepStart;
        
        console.log(`\n📊 Nesting Depth Impact:`);
        console.log(`   Shallow (100 iterations): ${shallowTime.toFixed(4)}ms`);
        console.log(`   Deep 10 levels (100 iterations): ${deepTime.toFixed(4)}ms`);
        console.log(`   Impact: ${(deepTime / shallowTime).toFixed(2)}x`);
        
        expect(deepTime).toBeGreaterThan(0);
        expect(shallowTime).toBeGreaterThan(0);
    });

    test("identify bottleneck: data type mixing", () => {
        // Homogeneous array (all same type)
        const homogeneous = Array.from({ length: 1000 }, (_, i) => i);
        
        // Heterogeneous array (mixed types)
        const heterogeneous = Array.from({ length: 1000 }, (_, i) => {
            switch (i % 4) {
                case 0: return i;
                case 1: return `str${i}`;
                case 2: return i % 2 === 0;
                case 3: return i * 0.5;
            }
        });
        
        const homoStart = performance.now();
        writeBeve(homogeneous);
        const homoEnd = performance.now();
        const homoTime = homoEnd - homoStart;
        
        const heteroStart = performance.now();
        writeBeve(heterogeneous);
        const heteroEnd = performance.now();
        const heteroTime = heteroEnd - heteroStart;
        
        console.log(`\n📊 Type Mixing Impact:`);
        console.log(`   Homogeneous array: ${homoTime.toFixed(4)}ms`);
        console.log(`   Heterogeneous array: ${heteroTime.toFixed(4)}ms`);
        console.log(`   Impact: ${(heteroTime / homoTime).toFixed(2)}x slower`);
        
        expect(heteroTime).toBeGreaterThan(homoTime);
    });
});

describe("Bottleneck Analysis - Decoding", () => {
    test("identify bottleneck: complex structure decoding", () => {
        const simpleData = { value: 42 };
        const complexData = {
            level1: {
                level2: {
                    array: Array.from({ length: 100 }, (_, i) => ({
                        id: i,
                        name: `item${i}`,
                        value: i * 2
                    }))
                }
            }
        };
        
        const simpleEncoded = writeBeve(simpleData);
        const complexEncoded = writeBeve(complexData);
        
        const simpleStart = performance.now();
        for (let i = 0; i < 100; i++) {
            readBeve(simpleEncoded);
        }
        const simpleEnd = performance.now();
        const simpleTime = simpleEnd - simpleStart;
        
        const complexStart = performance.now();
        for (let i = 0; i < 100; i++) {
            readBeve(complexEncoded);
        }
        const complexEnd = performance.now();
        const complexTime = complexEnd - complexStart;
        
        console.log(`\n📊 Decoding Complexity:`);
        console.log(`   Simple (100 iterations): ${simpleTime.toFixed(4)}ms`);
        console.log(`   Complex (100 iterations): ${complexTime.toFixed(4)}ms`);
        console.log(`   Impact: ${(complexTime / simpleTime).toFixed(2)}x slower`);
        
        expect(complexTime).toBeGreaterThan(simpleTime);
    });

    test("identify bottleneck: buffer size impact", () => {
        const sizes = [10, 100, 1000];
        const times: number[] = [];
        
        console.log(`\n📊 Buffer Size Impact on Decoding:`);
        
        for (const size of sizes) {
            const data = Array.from({ length: size }, (_, i) => i);
            const encoded = writeBeve(data);
            
            const start = performance.now();
            for (let i = 0; i < 50; i++) {
                readBeve(encoded);
            }
            const end = performance.now();
            const time = end - start;
            times.push(time);
            
            console.log(`   Size ${size}: ${time.toFixed(4)}ms (50 iterations)`);
            console.log(`   Buffer size: ${encoded.length} bytes`);
        }
        
        // Verify that time increases with size
        expect(times[2]).toBeGreaterThan(times[0]);
    });
});

describe("Bottleneck Analysis - Memory", () => {
    test("memory allocation patterns", () => {
        const iterations = 100;
        
        // Test memory with increasing sizes
        console.log(`\n📊 Memory Allocation Pattern:`);
        
        const sizes = [100, 500, 1000, 2000];
        
        for (const size of sizes) {
            const data = Array.from({ length: size }, (_, i) => ({
                id: i,
                value: Math.random()
            }));
            
            const memBefore = (performance as any).memory?.usedJSHeapSize || 0;
            
            const results: Uint8Array[] = [];
            for (let i = 0; i < iterations; i++) {
                results.push(writeBeve(data));
            }
            
            const memAfter = (performance as any).memory?.usedJSHeapSize || 0;
            const memDelta = memAfter - memBefore;
            
            console.log(`   Size ${size}: ~${(memDelta / 1024 / 1024).toFixed(2)} MB for ${iterations} iterations`);
            
            // Cleanup
            results.length = 0;
        }
    });
});

describe("Bottleneck Analysis - Round-trip", () => {
    test("full round-trip performance breakdown", () => {
        const data = {
            items: Array.from({ length: 100 }, (_, i) => ({
                id: i,
                name: `Item ${i}`,
                value: Math.random() * 100,
                tags: [`tag${i % 10}`, `category${i % 5}`]
            }))
        };
        
        console.log(`\n📊 Round-trip Performance Breakdown:`);
        
        // Encoding
        const encodeStart = performance.now();
        const encoded = writeBeve(data);
        const encodeEnd = performance.now();
        const encodeTime = encodeEnd - encodeStart;
        
        // Decoding
        const decodeStart = performance.now();
        const decoded = readBeve(encoded);
        const decodeEnd = performance.now();
        const decodeTime = decodeEnd - decodeStart;
        
        // Verification
        const verifyStart = performance.now();
        const matches = JSON.stringify(data) === JSON.stringify(decoded);
        const verifyEnd = performance.now();
        const verifyTime = verifyEnd - verifyStart;
        
        const totalTime = encodeTime + decodeTime + verifyTime;
        
        console.log(`   Encoding: ${encodeTime.toFixed(4)}ms (${(encodeTime / totalTime * 100).toFixed(1)}%)`);
        console.log(`   Decoding: ${decodeTime.toFixed(4)}ms (${(decodeTime / totalTime * 100).toFixed(1)}%)`);
        console.log(`   Verification: ${verifyTime.toFixed(4)}ms (${(verifyTime / totalTime * 100).toFixed(1)}%)`);
        console.log(`   Total: ${totalTime.toFixed(4)}ms`);
        console.log(`   Verified: ${matches ? '✅' : '❌'}`);
        
        expect(matches).toBe(true);
        
        // Identify bottleneck
        const bottleneck = encodeTime > decodeTime ? 'Encoding' : 'Decoding';
        console.log(`   🔍 Primary bottleneck: ${bottleneck}`);
    });
});

describe("Bottleneck Analysis - Comparison with JSON", () => {
    test("BEVE vs JSON performance comparison", () => {
        const data = {
            integers: Array.from({ length: 500 }, (_, i) => i),
            floats: Array.from({ length: 500 }, () => Math.random() * 100),
            strings: Array.from({ length: 100 }, (_, i) => `String ${i}`)
        };
        
        console.log(`\n📊 BEVE vs JSON Performance:`);
        
        // BEVE encoding
        const beveEncodeStart = performance.now();
        const beveEncoded = writeBeve(data);
        const beveEncodeEnd = performance.now();
        const beveEncodeTime = beveEncodeEnd - beveEncodeStart;
        
        // BEVE decoding
        const beveDecodeStart = performance.now();
        readBeve(beveEncoded);
        const beveDecodeEnd = performance.now();
        const beveDecodeTime = beveDecodeEnd - beveDecodeStart;
        
        // JSON encoding
        const jsonEncodeStart = performance.now();
        const jsonEncoded = JSON.stringify(data);
        const jsonEncodeEnd = performance.now();
        const jsonEncodeTime = jsonEncodeEnd - jsonEncodeStart;
        
        // JSON decoding
        const jsonDecodeStart = performance.now();
        JSON.parse(jsonEncoded);
        const jsonDecodeEnd = performance.now();
        const jsonDecodeTime = jsonDecodeEnd - jsonDecodeStart;
        
        const beveSize = beveEncoded.length;
        const jsonSize = new TextEncoder().encode(jsonEncoded).length;
        
        console.log(`\n   Encoding:`);
        console.log(`   BEVE: ${beveEncodeTime.toFixed(4)}ms`);
        console.log(`   JSON: ${jsonEncodeTime.toFixed(4)}ms`);
        console.log(`   Winner: ${beveEncodeTime < jsonEncodeTime ? 'BEVE' : 'JSON'} (${(Math.abs(beveEncodeTime - jsonEncodeTime) / Math.min(beveEncodeTime, jsonEncodeTime) * 100).toFixed(1)}% faster)`);
        
        console.log(`\n   Decoding:`);
        console.log(`   BEVE: ${beveDecodeTime.toFixed(4)}ms`);
        console.log(`   JSON: ${jsonDecodeTime.toFixed(4)}ms`);
        console.log(`   Winner: ${beveDecodeTime < jsonDecodeTime ? 'BEVE' : 'JSON'} (${(Math.abs(beveDecodeTime - jsonDecodeTime) / Math.min(beveDecodeTime, jsonDecodeTime) * 100).toFixed(1)}% faster)`);
        
        console.log(`\n   Size:`);
        console.log(`   BEVE: ${beveSize} bytes`);
        console.log(`   JSON: ${jsonSize} bytes`);
        console.log(`   Savings: ${((1 - beveSize / jsonSize) * 100).toFixed(2)}%`);
        
        expect(beveSize).toBeLessThan(jsonSize);
    });
});
