// Basic usage example for Beve library
import { readBeve, writeBeve } from '../src/index.js';

// Example 1: Simple object encoding and decoding
console.log('Example 1: Simple Object\n' + '='.repeat(50));
const simpleObject = {
    name: "John Doe",
    age: 30,
    active: true,
    balance: 1234.56
};

console.log('Original:', simpleObject);
const encoded = writeBeve(simpleObject);
console.log('Encoded size:', encoded.length, 'bytes');
const decoded = readBeve(encoded);
console.log('Decoded:', decoded);
console.log('Match:', JSON.stringify(simpleObject) === JSON.stringify(decoded));
console.log();

// Example 2: Arrays with typed data
console.log('Example 2: Typed Arrays\n' + '='.repeat(50));
const typedData = {
    integers: [1, 2, 3, 4, 5],
    floats: [1.1, 2.2, 3.3, 4.4, 5.5],
    strings: ["hello", "world", "beve"],
    mixed: [1, "two", true, 4.0, null]
};

console.log('Original:', typedData);
const encodedTyped = writeBeve(typedData);
console.log('Encoded size:', encodedTyped.length, 'bytes');
const decodedTyped = readBeve(encodedTyped);
console.log('Decoded:', decodedTyped);
console.log();

// Example 3: Nested objects
console.log('Example 3: Nested Objects\n' + '='.repeat(50));
const nestedObject = {
    user: {
        name: "Jane Smith",
        contact: {
            email: "jane@example.com",
            phone: "+1234567890"
        },
        preferences: {
            theme: "dark",
            notifications: true,
            language: "en"
        }
    },
    posts: [
        { id: 1, title: "First Post", likes: 10 },
        { id: 2, title: "Second Post", likes: 25 }
    ]
};

console.log('Original:', JSON.stringify(nestedObject, null, 2));
const encodedNested = writeBeve(nestedObject);
console.log('Encoded size:', encodedNested.length, 'bytes');
const decodedNested = readBeve(encodedNested);
console.log('Decoded:', JSON.stringify(decodedNested, null, 2));
console.log();

// Example 4: Size comparison with JSON
console.log('Example 4: Size Comparison\n' + '='.repeat(50));
const largeData = {
    items: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        value: Math.random() * 100,
        active: i % 2 === 0
    }))
};

const jsonString = JSON.stringify(largeData);
const beveBuffer = writeBeve(largeData);

console.log('JSON size:', Buffer.byteLength(jsonString, 'utf8'), 'bytes');
console.log('Beve size:', beveBuffer.length, 'bytes');
console.log('Compression:', ((1 - beveBuffer.length / Buffer.byteLength(jsonString, 'utf8')) * 100).toFixed(2) + '%');
console.log();

// Example 5: Binary data
console.log('Example 5: Binary Data\n' + '='.repeat(50));
const binaryData = {
    name: "Binary Example",
    data: new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]) // "Hello" in ASCII
};

console.log('Original:', binaryData);
const encodedBinary = writeBeve(binaryData);
console.log('Encoded size:', encodedBinary.length, 'bytes');
const decodedBinary = readBeve(encodedBinary);
console.log('Decoded:', decodedBinary);
console.log('Binary data match:', 
    binaryData.data.every((val, idx) => val === decodedBinary.data[idx])
);
