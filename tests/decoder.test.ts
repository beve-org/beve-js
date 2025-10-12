// Unit tests for decoder
import { describe, test, expect } from "bun:test";
import { readBeve } from "../src/decoder";
import { writeBeve } from "../src/encoder";

describe("Decoder - Basic Types", () => {
    test("should decode null", () => {
        const encoded = writeBeve(null);
        const decoded = readBeve(encoded);
        expect(decoded).toBeNull();
    });

    test("should decode boolean true", () => {
        const encoded = writeBeve(true);
        const decoded = readBeve(encoded);
        expect(decoded).toBe(true);
    });

    test("should decode boolean false", () => {
        const encoded = writeBeve(false);
        const decoded = readBeve(encoded);
        expect(decoded).toBe(false);
    });

    test("should decode positive integer", () => {
        const value = 42;
        const encoded = writeBeve(value);
        const decoded = readBeve(encoded);
        expect(decoded).toBe(value);
    });

    test("should decode negative integer", () => {
        const value = -42;
        const encoded = writeBeve(value);
        const decoded = readBeve(encoded);
        expect(decoded).toBe(value);
    });

    test("should decode zero", () => {
        const encoded = writeBeve(0);
        const decoded = readBeve(encoded);
        expect(decoded).toBe(0);
    });

    test("should decode float", () => {
        const value = 3.14159;
        const encoded = writeBeve(value);
        const decoded = readBeve(encoded);
        expect(decoded).toBeCloseTo(value, 5);
    });

    test("should decode string", () => {
        const str = "Hello, BEVE!";
        const encoded = writeBeve(str);
        const decoded = readBeve(encoded);
        expect(decoded).toBe(str);
    });

    test("should decode empty string", () => {
        const encoded = writeBeve("");
        const decoded = readBeve(encoded);
        expect(decoded).toBe("");
    });

    test("should decode UTF-8 string", () => {
        const str = "Hello 世界 🌍";
        const encoded = writeBeve(str);
        const decoded = readBeve(encoded);
        expect(decoded).toBe(str);
    });

    test("should decode long string", () => {
        const str = "A".repeat(1000);
        const encoded = writeBeve(str);
        const decoded = readBeve(encoded);
        expect(decoded).toBe(str);
    });
});

describe("Decoder - Arrays", () => {
    test("should decode empty array", () => {
        const arr: any[] = [];
        const encoded = writeBeve(arr);
        const decoded = readBeve(encoded);
        expect(decoded).toEqual(arr);
    });

    test("should decode integer array", () => {
        const arr = [1, 2, 3, 4, 5];
        const encoded = writeBeve(arr);
        const decoded = readBeve(encoded);
        expect(decoded).toEqual(arr);
    });

    test("should decode float array", () => {
        const arr = [1.1, 2.2, 3.3, 4.4, 5.5];
        const encoded = writeBeve(arr);
        const decoded = readBeve(encoded);
        decoded.forEach((val: number, idx: number) => {
            expect(val).toBeCloseTo(arr[idx], 5);
        });
    });

    test("should decode string array", () => {
        const arr = ["apple", "banana", "cherry"];
        const encoded = writeBeve(arr);
        const decoded = readBeve(encoded);
        expect(decoded).toEqual(arr);
    });

    test("should decode mixed array", () => {
        const arr = [1, "two", true, 4.0, null];
        const encoded = writeBeve(arr);
        const decoded = readBeve(encoded);
        expect(JSON.stringify(decoded)).toBe(JSON.stringify(arr));
    });

    test("should decode large integer array", () => {
        const arr = Array.from({ length: 1000 }, (_, i) => i);
        const encoded = writeBeve(arr);
        const decoded = readBeve(encoded);
        expect(decoded).toEqual(arr);
    });

    test("should decode nested arrays", () => {
        const arr = [[1, 2], [3, 4], [5, 6]];
        const encoded = writeBeve(arr);
        const decoded = readBeve(encoded);
        expect(decoded).toEqual(arr);
    });
});

describe("Decoder - Objects", () => {
    test("should decode simple object", () => {
        const obj = { name: "test", age: 30 };
        const encoded = writeBeve(obj);
        const decoded = readBeve(encoded);
        expect(decoded).toEqual(obj);
    });

    test("should decode nested object", () => {
        const obj = {
            user: {
                name: "John",
                address: {
                    city: "NYC",
                    zip: "10001"
                }
            }
        };
        const encoded = writeBeve(obj);
        const decoded = readBeve(encoded);
        expect(decoded).toEqual(obj);
    });

    test("should decode object with array", () => {
        const obj = {
            name: "test",
            items: [1, 2, 3, 4, 5]
        };
        const encoded = writeBeve(obj);
        const decoded = readBeve(encoded);
        expect(decoded).toEqual(obj);
    });

    test("should decode complex object", () => {
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
        const encoded = writeBeve(obj);
        const decoded = readBeve(encoded);
        expect(JSON.stringify(decoded)).toBe(JSON.stringify(obj));
    });
});

describe("Decoder - Binary Data", () => {
    test("should decode Uint8Array", () => {
        const data = new Uint8Array([1, 2, 3, 4, 5]);
        const encoded = writeBeve(data);
        const decoded = readBeve(encoded);
        expect(decoded).toBeInstanceOf(Uint8Array);
        expect(Array.from(decoded)).toEqual(Array.from(data));
    });

    test("should decode large Uint8Array", () => {
        const data = new Uint8Array(1000);
        for (let i = 0; i < 1000; i++) {
            data[i] = i % 256;
        }
        const encoded = writeBeve(data);
        const decoded = readBeve(encoded);
        expect(Array.from(decoded)).toEqual(Array.from(data));
    });
});

describe("Decoder - Round-trip Tests", () => {
    test("should maintain data integrity for complex structure", () => {
        const original = {
            string: "test",
            number: 42,
            float: 3.14,
            boolean: true,
            null: null,
            array: [1, 2, 3],
            object: { nested: "value" }
        };
        
        const encoded = writeBeve(original);
        const decoded = readBeve(encoded);
        
        expect(JSON.stringify(decoded)).toBe(JSON.stringify(original));
    });

    test("should handle large dataset round-trip", () => {
        const original = {
            items: Array.from({ length: 100 }, (_, i) => ({
                id: i,
                name: `Item ${i}`,
                value: Math.random() * 100,
                active: i % 2 === 0
            }))
        };
        
        const encoded = writeBeve(original);
        const decoded = readBeve(encoded);
        
        expect(JSON.stringify(decoded)).toBe(JSON.stringify(original));
    });
});

describe("Decoder - Error Handling", () => {
    test("should throw on invalid buffer", () => {
        expect(() => {
            readBeve(new Uint8Array([255, 255, 255]));
        }).toThrow();
    });

    test("should throw on empty buffer", () => {
        expect(() => {
            readBeve(new Uint8Array([]));
        }).toThrow();
    });

    test("should throw on truncated buffer", () => {
        const encoded = writeBeve({ name: "test", value: 123 });
        const truncated = encoded.slice(0, encoded.length - 5);
        
        expect(() => {
            readBeve(truncated);
        }).toThrow();
    });
});
