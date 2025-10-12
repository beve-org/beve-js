// BEVE-JS Quick Usage Examples
// Run with: bun run example.ts or npx tsx example.ts

import { writeBeve, readBeve } from './dist/index.js';

console.log('🚀 BEVE-JS Usage Examples\n');

// Example 1: Simple Values
console.log('1️⃣ Simple Values');
const simpleData = {
    name: "Alice",
    age: 30,
    active: true,
    balance: 1234.56
};

const encoded1 = writeBeve(simpleData);
const decoded1 = readBeve(encoded1);

console.log('Original:', simpleData);
console.log('Encoded size:', encoded1.length, 'bytes');
console.log('Decoded:', decoded1);
console.log('Match:', JSON.stringify(simpleData) === JSON.stringify(decoded1) ? '✅' : '❌');
console.log('');

// Example 2: Arrays
console.log('2️⃣ Arrays');
const arrayData = {
    integers: [1, 2, 3, 4, 5],
    floats: [1.1, 2.2, 3.3],
    strings: ["apple", "banana", "cherry"],
    mixed: [1, "two", 3.0, true, null]
};

const encoded2 = writeBeve(arrayData);
const decoded2 = readBeve(encoded2);

console.log('Original arrays:', arrayData);
console.log('Encoded size:', encoded2.length, 'bytes');
console.log('Decoded:', decoded2);
console.log('Match:', JSON.stringify(arrayData) === JSON.stringify(decoded2) ? '✅' : '❌');
console.log('');

// Example 3: Nested Objects
console.log('3️⃣ Nested Objects');
const nestedData = {
    user: {
        id: 123,
        profile: {
            name: "Bob",
            email: "bob@example.com",
            tags: ["developer", "typescript"]
        }
    },
    metadata: {
        created: "2025-10-12",
        version: 1
    }
};

const encoded3 = writeBeve(nestedData);
const decoded3 = readBeve(encoded3);

console.log('Original nested:', nestedData);
console.log('Encoded size:', encoded3.length, 'bytes');
console.log('Decoded:', decoded3);
console.log('Match:', JSON.stringify(nestedData) === JSON.stringify(decoded3) ? '✅' : '❌');
console.log('');

// Example 4: Size Comparison with JSON
console.log('4️⃣ Size Comparison: BEVE vs JSON');
const testData = {
    id: 1,
    name: "Test User",
    scores: [95, 87, 92, 88, 91],
    active: true,
    balance: 1500.75
};

const beveSize = writeBeve(testData).length;
const jsonSize = new TextEncoder().encode(JSON.stringify(testData)).length;
const savings = ((jsonSize - beveSize) / jsonSize * 100).toFixed(1);

console.log('Test data:', testData);
console.log('JSON size:', jsonSize, 'bytes');
console.log('BEVE size:', beveSize, 'bytes');
console.log('Savings:', savings + '%', beveSize < jsonSize ? '✅ BEVE is smaller!' : '');
console.log('');

// Example 5: Performance Benchmark
console.log('5️⃣ Performance Benchmark');
const benchData = { key: "value", num: 42, flag: true };
const iterations = 10000;

// Encode benchmark
const encodeStart = performance.now();
for (let i = 0; i < iterations; i++) {
    writeBeve(benchData);
}
const encodeTime = performance.now() - encodeStart;
const encodeOps = (iterations / (encodeTime / 1000)).toFixed(0);

// Decode benchmark
const encodedData = writeBeve(benchData);
const decodeStart = performance.now();
for (let i = 0; i < iterations; i++) {
    readBeve(encodedData);
}
const decodeTime = performance.now() - decodeStart;
const decodeOps = (iterations / (decodeTime / 1000)).toFixed(0);

console.log(`Encoding: ${encodeTime.toFixed(2)}ms for ${iterations} iterations`);
console.log(`└─ ${encodeOps} ops/sec`);
console.log(`Decoding: ${decodeTime.toFixed(2)}ms for ${iterations} iterations`);
console.log(`└─ ${decodeOps} ops/sec`);
console.log('');

// Example 6: Binary Data
console.log('6️⃣ Binary Data (Uint8Array)');
const binaryData = {
    filename: "image.png",
    data: new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]) // PNG header bytes
};

const encoded6 = writeBeve(binaryData);
const decoded6 = readBeve(encoded6);

console.log('Original binary:', {
    filename: binaryData.filename,
    data: Array.from(binaryData.data)
});
console.log('Decoded binary:', {
    filename: decoded6.filename,
    data: Array.from(decoded6.data)
});
console.log('Match:', binaryData.filename === decoded6.filename ? '✅' : '❌');
console.log('');

// Example 7: Large Dataset
console.log('7️⃣ Large Dataset Performance');
const largeData = {
    users: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        score: Math.random() * 100,
        active: i % 2 === 0
    }))
};

const largeStart = performance.now();
const encodedLarge = writeBeve(largeData);
const largeEncodeTime = performance.now() - largeStart;

const largeDecodeStart = performance.now();
const decodedLarge = readBeve(encodedLarge);
const largeDecodeTime = performance.now() - largeDecodeStart;

console.log(`Dataset: 1000 user objects`);
console.log(`Encode: ${largeEncodeTime.toFixed(2)}ms`);
console.log(`Decode: ${largeDecodeTime.toFixed(2)}ms`);
console.log(`Total size: ${encodedLarge.length} bytes`);
console.log(`Match: ${decodedLarge.users.length === 1000 ? '✅' : '❌'}`);
console.log('');

console.log('✨ All examples completed successfully!');
