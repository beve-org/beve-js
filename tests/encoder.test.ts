// Unit tests for encoder
import { describe, test, expect } from "bun:test";
import { writeBeve } from "../src/encoder";

describe("Encoder - Basic Types", () => {
    test("should encode null", () => {
        const result = writeBeve(null);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    test("should encode boolean true", () => {
        const result = writeBeve(true);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result[0]).toBe(0b00011000); // true header
    });

    test("should encode boolean false", () => {
        const result = writeBeve(false);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result[0]).toBe(0b00001000); // false header
    });

    test("should encode integer", () => {
        const result = writeBeve(42);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    test("should encode negative integer", () => {
        const result = writeBeve(-42);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    test("should encode float", () => {
        const result = writeBeve(3.14159);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    test("should encode string", () => {
        const str = "Hello, BEVE!";
        const result = writeBeve(str);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(str.length);
    });

    test("should encode empty string", () => {
        const result = writeBeve("");
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    test("should encode UTF-8 string", () => {
        const str = "Hello 世界 🌍";
        const result = writeBeve(str);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });
});

describe("Encoder - Arrays", () => {
    test("should encode empty array", () => {
        const result = writeBeve([]);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    test("should encode integer array", () => {
        const arr = [1, 2, 3, 4, 5];
        const result = writeBeve(arr);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    test("should encode float array", () => {
        const arr = [1.1, 2.2, 3.3, 4.4, 5.5];
        const result = writeBeve(arr);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    test("should encode string array", () => {
        const arr = ["apple", "banana", "cherry"];
        const result = writeBeve(arr);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    test("should encode mixed array", () => {
        const arr = [1, "two", true, 4.0, null];
        const result = writeBeve(arr);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    test("should encode large integer array", () => {
        const arr = Array.from({ length: 1000 }, (_, i) => i);
        const result = writeBeve(arr);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(1000);
    });
});

describe("Encoder - Objects", () => {
    test("should encode simple object", () => {
        const obj = { name: "test", age: 30 };
        const result = writeBeve(obj);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    test("should encode nested object", () => {
        const obj = {
            user: {
                name: "John",
                address: {
                    city: "NYC",
                    zip: "10001"
                }
            }
        };
        const result = writeBeve(obj);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    test("should encode object with array", () => {
        const obj = {
            name: "test",
            items: [1, 2, 3, 4, 5]
        };
        const result = writeBeve(obj);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    test("should encode complex object", () => {
        const obj = {
            name: "Complex Test",
            version: 1.0,
            active: true,
            items: [
                { id: 1, value: "first" },
                { id: 2, value: "second" }
            ],
            metadata: {
                created: "2025-10-12",
                tags: ["test", "benchmark"]
            }
        };
        const result = writeBeve(obj);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });
});

describe("Encoder - Binary Data", () => {
    test("should encode Uint8Array", () => {
        const data = new Uint8Array([1, 2, 3, 4, 5]);
        const result = writeBeve(data);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(5);
    });

    test("should encode large Uint8Array", () => {
        const data = new Uint8Array(1000);
        for (let i = 0; i < 1000; i++) {
            data[i] = i % 256;
        }
        const result = writeBeve(data);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(1000);
    });
});

describe("Encoder - Performance", () => {
    test("should encode large dataset efficiently", () => {
        const largeData = {
            items: Array.from({ length: 100 }, (_, i) => ({
                id: i,
                name: `Item ${i}`,
                value: Math.random() * 100,
                active: i % 2 === 0
            }))
        };
        
        const start = performance.now();
        const result = writeBeve(largeData);
        const end = performance.now();
        
        expect(result).toBeInstanceOf(Uint8Array);
        expect(end - start).toBeLessThan(50); // Should be fast
    });
});
