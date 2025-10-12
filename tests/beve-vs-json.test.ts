// Comprehensive BEVE vs JSON comparison tests
import { describe, test, expect } from "bun:test";
import { faker } from '@faker-js/faker';
import { writeBeve, readBeve } from "../src/index";

// Helper functions to generate realistic data
function generateUser() {
    return {
        id: faker.string.uuid(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        age: faker.number.int({ min: 18, max: 80 }),
        address: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            country: faker.location.country(),
            lat: parseFloat(faker.location.latitude().toFixed(6)),
            lng: parseFloat(faker.location.longitude().toFixed(6))
        },
        salary: faker.number.int({ min: 30000, max: 150000 }),
        isActive: faker.datatype.boolean()
    };
}

function generateProduct() {
    return {
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        price: parseFloat(faker.commerce.price()),
        stock: faker.number.int({ min: 0, max: 1000 }),
        rating: parseFloat(faker.number.float({ min: 1, max: 5, fractionDigits: 1 }).toFixed(1))
    };
}

describe("BEVE vs JSON - Encoding Performance", () => {
    test("should compare encoding speed for 10 users", () => {
        const users = Array.from({ length: 10 }, generateUser);
        
        // BEVE encoding
        const beveStart = performance.now();
        for (let i = 0; i < 100; i++) {
            writeBeve(users);
        }
        const beveTime = performance.now() - beveStart;
        const beveOps = (100 / (beveTime / 1000)).toFixed(0);
        
        // JSON encoding
        const jsonStart = performance.now();
        for (let i = 0; i < 100; i++) {
            JSON.stringify(users);
        }
        const jsonTime = performance.now() - jsonStart;
        const jsonOps = (100 / (jsonTime / 1000)).toFixed(0);
        
        const speedup = (beveTime / jsonTime).toFixed(2);
        const winner = beveTime < jsonTime ? 'BEVE' : 'JSON';
        
        console.log(`\n⚡ Encoding 10 Users (100 iterations):`);
        console.log(`├─ BEVE: ${beveTime.toFixed(2)}ms (${beveOps} ops/sec)`);
        console.log(`├─ JSON: ${jsonTime.toFixed(2)}ms (${jsonOps} ops/sec)`);
        console.log(`└─ Winner: ${winner} ${winner === 'BEVE' ? `(${speedup}x faster)` : `(${(1/parseFloat(speedup)).toFixed(2)}x slower)`}`);
        
        expect(beveTime).toBeGreaterThan(0);
        expect(jsonTime).toBeGreaterThan(0);
    });

    test("should compare encoding speed for 100 users", () => {
        const users = Array.from({ length: 100 }, generateUser);
        
        // BEVE encoding
        const beveStart = performance.now();
        for (let i = 0; i < 10; i++) {
            writeBeve(users);
        }
        const beveTime = performance.now() - beveStart;
        
        // JSON encoding
        const jsonStart = performance.now();
        for (let i = 0; i < 10; i++) {
            JSON.stringify(users);
        }
        const jsonTime = performance.now() - jsonStart;
        
        const winner = beveTime < jsonTime ? 'BEVE' : 'JSON';
        const ratio = beveTime < jsonTime ? (jsonTime / beveTime) : (beveTime / jsonTime);
        
        console.log(`\n⚡ Encoding 100 Users (10 iterations):`);
        console.log(`├─ BEVE: ${beveTime.toFixed(2)}ms`);
        console.log(`├─ JSON: ${jsonTime.toFixed(2)}ms`);
        console.log(`└─ Winner: ${winner} (${ratio.toFixed(2)}x ${winner === 'BEVE' ? 'faster' : 'slower'})`);
        
        expect(beveTime).toBeGreaterThan(0);
    });

    test("should compare encoding speed for numeric arrays", () => {
        const numbers = Array.from({ length: 1000 }, () => faker.number.int({ min: 0, max: 1000000 }));
        
        // BEVE encoding
        const beveStart = performance.now();
        for (let i = 0; i < 100; i++) {
            writeBeve(numbers);
        }
        const beveTime = performance.now() - beveStart;
        
        // JSON encoding
        const jsonStart = performance.now();
        for (let i = 0; i < 100; i++) {
            JSON.stringify(numbers);
        }
        const jsonTime = performance.now() - jsonStart;
        
        const winner = beveTime < jsonTime ? 'BEVE' : 'JSON';
        const ratio = beveTime < jsonTime ? (jsonTime / beveTime) : (beveTime / jsonTime);
        
        console.log(`\n🔢 Encoding 1000 Numbers (100 iterations):`);
        console.log(`├─ BEVE: ${beveTime.toFixed(2)}ms`);
        console.log(`├─ JSON: ${jsonTime.toFixed(2)}ms`);
        console.log(`└─ Winner: ${winner} (${ratio.toFixed(2)}x ${winner === 'BEVE' ? 'faster' : 'slower'})`);
        
        expect(numbers.length).toBe(1000);
    });

    test("should compare encoding speed for products", () => {
        const products = Array.from({ length: 50 }, generateProduct);
        const iterations = 100;
        
        // BEVE encoding
        const beveStart = performance.now();
        for (let i = 0; i < iterations; i++) {
            writeBeve(products);
        }
        const beveTime = performance.now() - beveStart;
        
        // JSON encoding
        const jsonStart = performance.now();
        for (let i = 0; i < iterations; i++) {
            JSON.stringify(products);
        }
        const jsonTime = performance.now() - jsonStart;
        
        console.log(`\n📦 Encoding 50 Products (${iterations} iterations):`);
        console.log(`├─ BEVE: ${beveTime.toFixed(2)}ms (${(iterations / (beveTime / 1000)).toFixed(0)} ops/sec)`);
        console.log(`├─ JSON: ${jsonTime.toFixed(2)}ms (${(iterations / (jsonTime / 1000)).toFixed(0)} ops/sec)`);
        console.log(`└─ Difference: ${Math.abs(beveTime - jsonTime).toFixed(2)}ms`);
        
        expect(products.length).toBe(50);
    });
});

describe("BEVE vs JSON - Decoding Performance", () => {
    test("should compare decoding speed for 10 users", () => {
        const users = Array.from({ length: 10 }, generateUser);
        
        const beveEncoded = writeBeve(users);
        const jsonEncoded = JSON.stringify(users);
        
        // BEVE decoding
        const beveStart = performance.now();
        for (let i = 0; i < 100; i++) {
            readBeve(beveEncoded);
        }
        const beveTime = performance.now() - beveStart;
        const beveOps = (100 / (beveTime / 1000)).toFixed(0);
        
        // JSON decoding
        const jsonStart = performance.now();
        for (let i = 0; i < 100; i++) {
            JSON.parse(jsonEncoded);
        }
        const jsonTime = performance.now() - jsonStart;
        const jsonOps = (100 / (jsonTime / 1000)).toFixed(0);
        
        const winner = beveTime < jsonTime ? 'BEVE' : 'JSON';
        const ratio = beveTime < jsonTime ? (jsonTime / beveTime) : (beveTime / jsonTime);
        
        console.log(`\n⚡ Decoding 10 Users (100 iterations):`);
        console.log(`├─ BEVE: ${beveTime.toFixed(2)}ms (${beveOps} ops/sec)`);
        console.log(`├─ JSON: ${jsonTime.toFixed(2)}ms (${jsonOps} ops/sec)`);
        console.log(`└─ Winner: ${winner} (${ratio.toFixed(2)}x ${winner === 'BEVE' ? 'faster 🏆' : 'slower'})`);
        
        expect(beveTime).toBeGreaterThan(0);
    });

    test("should compare decoding speed for 100 users", () => {
        const users = Array.from({ length: 100 }, generateUser);
        
        const beveEncoded = writeBeve(users);
        const jsonEncoded = JSON.stringify(users);
        
        // BEVE decoding
        const beveStart = performance.now();
        for (let i = 0; i < 10; i++) {
            readBeve(beveEncoded);
        }
        const beveTime = performance.now() - beveStart;
        
        // JSON decoding
        const jsonStart = performance.now();
        for (let i = 0; i < 10; i++) {
            JSON.parse(jsonEncoded);
        }
        const jsonTime = performance.now() - jsonStart;
        
        const winner = beveTime < jsonTime ? 'BEVE' : 'JSON';
        const ratio = beveTime < jsonTime ? (jsonTime / beveTime) : (beveTime / jsonTime);
        
        console.log(`\n⚡ Decoding 100 Users (10 iterations):`);
        console.log(`├─ BEVE: ${beveTime.toFixed(2)}ms`);
        console.log(`├─ JSON: ${jsonTime.toFixed(2)}ms`);
        console.log(`└─ Winner: ${winner} (${ratio.toFixed(2)}x ${winner === 'BEVE' ? 'faster 🏆' : 'slower'})`);
        
        expect(beveTime).toBeGreaterThan(0);
    });

    test("should compare decoding speed for numeric arrays", () => {
        const numbers = Array.from({ length: 1000 }, () => faker.number.int({ min: 0, max: 1000000 }));
        
        const beveEncoded = writeBeve(numbers);
        const jsonEncoded = JSON.stringify(numbers);
        
        // BEVE decoding
        const beveStart = performance.now();
        for (let i = 0; i < 100; i++) {
            readBeve(beveEncoded);
        }
        const beveTime = performance.now() - beveStart;
        
        // JSON decoding
        const jsonStart = performance.now();
        for (let i = 0; i < 100; i++) {
            JSON.parse(jsonEncoded);
        }
        const jsonTime = performance.now() - jsonStart;
        
        const winner = beveTime < jsonTime ? 'BEVE' : 'JSON';
        const ratio = beveTime < jsonTime ? (jsonTime / beveTime) : (beveTime / jsonTime);
        
        console.log(`\n🔢 Decoding 1000 Numbers (100 iterations):`);
        console.log(`├─ BEVE: ${beveTime.toFixed(2)}ms`);
        console.log(`├─ JSON: ${jsonTime.toFixed(2)}ms`);
        console.log(`└─ Winner: ${winner} (${ratio.toFixed(2)}x ${winner === 'BEVE' ? 'faster 🏆' : 'slower'})`);
        
        expect(numbers.length).toBe(1000);
    });

    test("should compare decoding speed for float arrays", () => {
        const floats = Array.from({ length: 1000 }, () => faker.number.float({ min: 0, max: 100, fractionDigits: 6 }));
        
        const beveEncoded = writeBeve(floats);
        const jsonEncoded = JSON.stringify(floats);
        
        // BEVE decoding
        const beveStart = performance.now();
        for (let i = 0; i < 100; i++) {
            readBeve(beveEncoded);
        }
        const beveTime = performance.now() - beveStart;
        
        // JSON decoding
        const jsonStart = performance.now();
        for (let i = 0; i < 100; i++) {
            JSON.parse(jsonEncoded);
        }
        const jsonTime = performance.now() - jsonStart;
        
        const winner = beveTime < jsonTime ? 'BEVE' : 'JSON';
        const ratio = beveTime < jsonTime ? (jsonTime / beveTime) : (beveTime / jsonTime);
        
        console.log(`\n📊 Decoding 1000 Floats (100 iterations):`);
        console.log(`├─ BEVE: ${beveTime.toFixed(2)}ms`);
        console.log(`├─ JSON: ${jsonTime.toFixed(2)}ms`);
        console.log(`└─ Winner: ${winner} (${ratio.toFixed(2)}x ${winner === 'BEVE' ? 'faster 🏆' : 'slower'})`);
        
        expect(floats.length).toBe(1000);
    });
});

describe("BEVE vs JSON - Size Comparison", () => {
    test("should compare size for 10 users", () => {
        const users = Array.from({ length: 10 }, generateUser);
        
        const beveEncoded = writeBeve(users);
        const jsonEncoded = JSON.stringify(users);
        const jsonSize = new TextEncoder().encode(jsonEncoded).length;
        
        const savings = ((jsonSize - beveEncoded.length) / jsonSize * 100).toFixed(1);
        const winner = beveEncoded.length < jsonSize ? 'BEVE' : 'JSON';
        
        console.log(`\n📏 Size Comparison - 10 Users:`);
        console.log(`├─ BEVE: ${beveEncoded.length} bytes`);
        console.log(`├─ JSON: ${jsonSize} bytes`);
        console.log(`└─ Savings: ${savings}% (${winner} is smaller)`);
        
        expect(beveEncoded.length).toBeGreaterThan(0);
        expect(jsonSize).toBeGreaterThan(0);
    });

    test("should compare size for 100 users", () => {
        const users = Array.from({ length: 100 }, generateUser);
        
        const beveEncoded = writeBeve(users);
        const jsonEncoded = JSON.stringify(users);
        const jsonSize = new TextEncoder().encode(jsonEncoded).length;
        
        const savings = ((jsonSize - beveEncoded.length) / jsonSize * 100).toFixed(1);
        
        console.log(`\n📏 Size Comparison - 100 Users:`);
        console.log(`├─ BEVE: ${(beveEncoded.length / 1024).toFixed(2)} KB`);
        console.log(`├─ JSON: ${(jsonSize / 1024).toFixed(2)} KB`);
        console.log(`└─ Savings: ${savings}% ${parseFloat(savings) > 0 ? '✅' : '❌'}`);
        
        expect(users.length).toBe(100);
    });

    test("should compare size for numeric arrays", () => {
        const numbers = Array.from({ length: 1000 }, () => faker.number.int({ min: 0, max: 1000000 }));
        
        const beveEncoded = writeBeve(numbers);
        const jsonEncoded = JSON.stringify(numbers);
        const jsonSize = new TextEncoder().encode(jsonEncoded).length;
        
        const savings = ((jsonSize - beveEncoded.length) / jsonSize * 100).toFixed(1);
        
        console.log(`\n🔢 Size Comparison - 1000 Numbers:`);
        console.log(`├─ BEVE: ${(beveEncoded.length / 1024).toFixed(2)} KB`);
        console.log(`├─ JSON: ${(jsonSize / 1024).toFixed(2)} KB`);
        console.log(`└─ Savings: ${savings}% ${parseFloat(savings) > 0 ? '✅' : '❌'}`);
        
        expect(numbers.length).toBe(1000);
    });

    test("should compare size for float arrays", () => {
        const floats = Array.from({ length: 1000 }, () => faker.number.float({ min: 0, max: 100, fractionDigits: 6 }));
        
        const beveEncoded = writeBeve(floats);
        const jsonEncoded = JSON.stringify(floats);
        const jsonSize = new TextEncoder().encode(jsonEncoded).length;
        
        const savings = ((jsonSize - beveEncoded.length) / jsonSize * 100).toFixed(1);
        
        console.log(`\n📊 Size Comparison - 1000 Floats:`);
        console.log(`├─ BEVE: ${(beveEncoded.length / 1024).toFixed(2)} KB`);
        console.log(`├─ JSON: ${(jsonSize / 1024).toFixed(2)} KB`);
        console.log(`└─ Savings: ${savings}% ${parseFloat(savings) > 0 ? '✅' : '❌'}`);
        
        expect(floats.length).toBe(1000);
    });

    test("should compare size for products", () => {
        const products = Array.from({ length: 100 }, generateProduct);
        
        const beveEncoded = writeBeve(products);
        const jsonEncoded = JSON.stringify(products);
        const jsonSize = new TextEncoder().encode(jsonEncoded).length;
        
        const savings = ((jsonSize - beveEncoded.length) / jsonSize * 100).toFixed(1);
        
        console.log(`\n📦 Size Comparison - 100 Products:`);
        console.log(`├─ BEVE: ${(beveEncoded.length / 1024).toFixed(2)} KB`);
        console.log(`├─ JSON: ${(jsonSize / 1024).toFixed(2)} KB`);
        console.log(`└─ Savings: ${savings}% ${parseFloat(savings) > 0 ? '✅' : '❌'}`);
        
        expect(products.length).toBe(100);
    });
});

describe("BEVE vs JSON - Round-trip Performance", () => {
    test("should compare full encode-decode cycle for 50 users", () => {
        const users = Array.from({ length: 50 }, generateUser);
        const iterations = 20;
        
        // BEVE full cycle
        const beveStart = performance.now();
        for (let i = 0; i < iterations; i++) {
            const encoded = writeBeve(users);
            readBeve(encoded);
        }
        const beveTime = performance.now() - beveStart;
        
        // JSON full cycle
        const jsonStart = performance.now();
        for (let i = 0; i < iterations; i++) {
            const encoded = JSON.stringify(users);
            JSON.parse(encoded);
        }
        const jsonTime = performance.now() - jsonStart;
        
        const winner = beveTime < jsonTime ? 'BEVE' : 'JSON';
        const ratio = beveTime < jsonTime ? (jsonTime / beveTime) : (beveTime / jsonTime);
        
        console.log(`\n🔄 Full Round-trip - 50 Users (${iterations} iterations):`);
        console.log(`├─ BEVE: ${beveTime.toFixed(2)}ms`);
        console.log(`├─ JSON: ${jsonTime.toFixed(2)}ms`);
        console.log(`└─ Winner: ${winner} (${ratio.toFixed(2)}x ${winner === 'BEVE' ? 'faster' : 'slower'})`);
        
        expect(beveTime).toBeGreaterThan(0);
    });

    test("should compare memory efficiency", () => {
        const users = Array.from({ length: 100 }, generateUser);
        
        const beveEncoded = writeBeve(users);
        const jsonEncoded = JSON.stringify(users);
        
        const beveSize = beveEncoded.length;
        const jsonSize = new TextEncoder().encode(jsonEncoded).length;
        
        // Decode to measure reconstructed size
        const beveDecoded = readBeve(beveEncoded);
        const jsonDecoded = JSON.parse(jsonEncoded);
        
        const beveReconstructed = JSON.stringify(beveDecoded);
        const jsonReconstructed = JSON.stringify(jsonDecoded);
        
        console.log(`\n💾 Memory Efficiency - 100 Users:`);
        console.log(`├─ Original JSON: ${(jsonSize / 1024).toFixed(2)} KB`);
        console.log(`├─ BEVE binary: ${(beveSize / 1024).toFixed(2)} KB`);
        console.log(`├─ BEVE reconstructed: ${(beveReconstructed.length / 1024).toFixed(2)} KB`);
        console.log(`├─ JSON reconstructed: ${(jsonReconstructed.length / 1024).toFixed(2)} KB`);
        console.log(`└─ Savings: ${((jsonSize - beveSize) / jsonSize * 100).toFixed(1)}%`);
        
        expect(beveDecoded.length).toBe(users.length);
        expect(jsonDecoded.length).toBe(users.length);
    });
});

describe("BEVE vs JSON - Data Type Specific", () => {
    test("should compare performance for boolean arrays", () => {
        const booleans = Array.from({ length: 1000 }, () => faker.datatype.boolean());
        
        const beveEncoded = writeBeve(booleans);
        const jsonEncoded = JSON.stringify(booleans);
        const jsonSize = new TextEncoder().encode(jsonEncoded).length;
        
        const savings = ((jsonSize - beveEncoded.length) / jsonSize * 100).toFixed(1);
        
        console.log(`\n✅ Boolean Arrays - 1000 items:`);
        console.log(`├─ BEVE: ${beveEncoded.length} bytes`);
        console.log(`├─ JSON: ${jsonSize} bytes`);
        console.log(`└─ Savings: ${savings}%`);
        
        expect(booleans.length).toBe(1000);
    });

    test("should compare performance for string arrays", () => {
        const strings = Array.from({ length: 100 }, () => faker.person.fullName());
        
        const beveEncoded = writeBeve(strings);
        const jsonEncoded = JSON.stringify(strings);
        const jsonSize = new TextEncoder().encode(jsonEncoded).length;
        
        const savings = ((jsonSize - beveEncoded.length) / jsonSize * 100).toFixed(1);
        
        console.log(`\n📝 String Arrays - 100 names:`);
        console.log(`├─ BEVE: ${(beveEncoded.length / 1024).toFixed(2)} KB`);
        console.log(`├─ JSON: ${(jsonSize / 1024).toFixed(2)} KB`);
        console.log(`└─ Savings: ${savings}%`);
        
        expect(strings.length).toBe(100);
    });

    test("should compare performance for mixed type arrays", () => {
        const mixed = Array.from({ length: 100 }, (_, i) => {
            if (i % 4 === 0) return faker.number.int();
            if (i % 4 === 1) return faker.person.firstName();
            if (i % 4 === 2) return faker.datatype.boolean();
            return { id: i, value: faker.number.float() };
        });
        
        const beveEncoded = writeBeve(mixed);
        const jsonEncoded = JSON.stringify(mixed);
        const jsonSize = new TextEncoder().encode(jsonEncoded).length;
        
        const savings = ((jsonSize - beveEncoded.length) / jsonSize * 100).toFixed(1);
        
        console.log(`\n🎯 Mixed Type Arrays - 100 items:`);
        console.log(`├─ BEVE: ${(beveEncoded.length / 1024).toFixed(2)} KB`);
        console.log(`├─ JSON: ${(jsonSize / 1024).toFixed(2)} KB`);
        console.log(`└─ Savings: ${savings}%`);
        
        expect(mixed.length).toBe(100);
    });
});

describe("BEVE vs JSON - Summary Report", () => {
    test("should generate comprehensive comparison report", () => {
        console.log(`\n${'═'.repeat(60)}`);
        console.log(`📊 BEVE vs JSON - Comprehensive Comparison Report`);
        console.log(`${'═'.repeat(60)}\n`);
        
        // Test various data types
        const testCases = [
            { name: '10 Users', data: Array.from({ length: 10 }, generateUser) },
            { name: '100 Users', data: Array.from({ length: 100 }, generateUser) },
            { name: '1000 Numbers', data: Array.from({ length: 1000 }, () => faker.number.int()) },
            { name: '1000 Floats', data: Array.from({ length: 1000 }, () => faker.number.float()) },
            { name: '100 Products', data: Array.from({ length: 100 }, generateProduct) }
        ];
        
        console.log(`📏 Size Comparison:`);
        console.log(`${'─'.repeat(60)}`);
        
        for (const testCase of testCases) {
            const beveEncoded = writeBeve(testCase.data);
            const jsonEncoded = JSON.stringify(testCase.data);
            const jsonSize = new TextEncoder().encode(jsonEncoded).length;
            const savings = ((jsonSize - beveEncoded.length) / jsonSize * 100).toFixed(1);
            
            console.log(`${testCase.name.padEnd(20)} | BEVE: ${String(beveEncoded.length).padStart(7)} bytes | JSON: ${String(jsonSize).padStart(7)} bytes | ${savings}% savings`);
        }
        
        console.log(`\n⚡ Performance Summary:`);
        console.log(`${'─'.repeat(60)}`);
        
        const perfTest = Array.from({ length: 50 }, generateUser);
        const iterations = 10;
        
        // Encode performance
        let beveEncStart = performance.now();
        for (let i = 0; i < iterations; i++) writeBeve(perfTest);
        const beveEncTime = performance.now() - beveEncStart;
        
        let jsonEncStart = performance.now();
        for (let i = 0; i < iterations; i++) JSON.stringify(perfTest);
        const jsonEncTime = performance.now() - jsonEncStart;
        
        console.log(`Encoding (50 users, ${iterations} iter):`);
        console.log(`  BEVE: ${beveEncTime.toFixed(2)}ms | JSON: ${jsonEncTime.toFixed(2)}ms`);
        console.log(`  Winner: ${beveEncTime < jsonEncTime ? 'BEVE' : 'JSON'} (${(Math.min(beveEncTime, jsonEncTime) / Math.max(beveEncTime, jsonEncTime) * 100).toFixed(0)}% of slower)`);
        
        // Decode performance
        const beveEnc = writeBeve(perfTest);
        const jsonEnc = JSON.stringify(perfTest);
        
        let beveDecStart = performance.now();
        for (let i = 0; i < iterations; i++) readBeve(beveEnc);
        const beveDecTime = performance.now() - beveDecStart;
        
        let jsonDecStart = performance.now();
        for (let i = 0; i < iterations; i++) JSON.parse(jsonEnc);
        const jsonDecTime = performance.now() - jsonDecStart;
        
        console.log(`\nDecoding (50 users, ${iterations} iter):`);
        console.log(`  BEVE: ${beveDecTime.toFixed(2)}ms | JSON: ${jsonDecTime.toFixed(2)}ms`);
        console.log(`  Winner: ${beveDecTime < jsonDecTime ? 'BEVE 🏆' : 'JSON'} (${(Math.min(beveDecTime, jsonDecTime) / Math.max(beveDecTime, jsonDecTime) * 100).toFixed(0)}% of slower)`);
        
        console.log(`\n${'═'.repeat(60)}\n`);
        
        expect(testCases.length).toBe(5);
    });
});
