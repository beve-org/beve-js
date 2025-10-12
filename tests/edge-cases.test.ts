// Edge case tests for robust error handling
import { describe, test, expect } from "bun:test";
import { readBeve } from "../src/decoder";
import { writeBeve } from "../src/encoder";

describe("Edge Cases - Boundary Values", () => {
    test("should handle maximum safe integer", () => {
        const value = Number.MAX_SAFE_INTEGER;
        const encoded = writeBeve(value);
        const decoded = readBeve(encoded);
        expect(decoded).toBe(value);
    });

    test("should handle minimum safe integer", () => {
        const value = Number.MIN_SAFE_INTEGER;
        const encoded = writeBeve(value);
        const decoded = readBeve(encoded);
        expect(decoded).toBe(value);
    });

    test("should handle very small float", () => {
        const value = Number.MIN_VALUE;
        const encoded = writeBeve(value);
        const decoded = readBeve(encoded);
        expect(decoded).toBeCloseTo(value, 100);
    });

    test("should handle very large float", () => {
        const value = Number.MAX_VALUE;
        const encoded = writeBeve(value);
        const decoded = readBeve(encoded);
        expect(decoded).toBe(value);
    });

    test("should handle negative zero", () => {
        const value = -0;
        const encoded = writeBeve(value);
        const decoded = readBeve(encoded);
        expect(Object.is(decoded, -0)).toBe(true);
    });

    test("should handle Infinity", () => {
        const value = Infinity;
        const encoded = writeBeve(value);
        const decoded = readBeve(encoded);
        expect(decoded).toBe(Infinity);
    });

    test("should handle -Infinity", () => {
        const value = -Infinity;
        const encoded = writeBeve(value);
        const decoded = readBeve(encoded);
        expect(decoded).toBe(-Infinity);
    });

    test("should handle NaN", () => {
        const value = NaN;
        const encoded = writeBeve(value);
        const decoded = readBeve(encoded);
        expect(Number.isNaN(decoded)).toBe(true);
    });
});

describe("Edge Cases - Empty Values", () => {
    test("should handle empty object", () => {
        const obj = {};
        const encoded = writeBeve(obj);
        const decoded = readBeve(encoded);
        expect(decoded).toEqual(obj);
    });

    test("should handle object with empty string keys", () => {
        const obj = { "": "value" };
        const encoded = writeBeve(obj);
        const decoded = readBeve(encoded);
        expect(decoded).toEqual(obj);
    });

    test("should handle array with null values", () => {
        const arr = [null, null, null];
        const encoded = writeBeve(arr);
        const decoded = readBeve(encoded);
        expect(decoded).toEqual(arr);
    });

    test("should handle nested empty structures", () => {
        const data = {
            emptyObj: {},
            emptyArr: [],
            emptyStr: "",
            nested: {
                alsoEmpty: {}
            }
        };
        const encoded = writeBeve(data);
        const decoded = readBeve(encoded);
        expect(JSON.stringify(decoded)).toBe(JSON.stringify(data));
    });
});

describe("Edge Cases - Large Structures", () => {
    test("should handle very wide object (many keys)", () => {
        const obj: Record<string, number> = {};
        for (let i = 0; i < 10000; i++) {
            obj[`key${i}`] = i;
        }
        
        const encoded = writeBeve(obj);
        const decoded = readBeve(encoded);
        
        expect(Object.keys(decoded).length).toBe(10000);
        expect(decoded.key0).toBe(0);
        expect(decoded.key9999).toBe(9999);
    });

    test("should handle very deep nesting", () => {
        let deep: any = { value: "deepest" };
        for (let i = 0; i < 50; i++) {
            deep = { nested: deep };
        }
        
        const encoded = writeBeve(deep);
        const decoded = readBeve(encoded);
        
        // Verify deepest value
        let current = decoded;
        for (let i = 0; i < 50; i++) {
            current = current.nested;
        }
        expect(current.value).toBe("deepest");
    });

    test("should handle array with single element", () => {
        const arr = [42];
        const encoded = writeBeve(arr);
        const decoded = readBeve(encoded);
        expect(decoded).toEqual(arr);
    });

    test("should handle very long string", () => {
        const longString = "A".repeat(100000);
        const encoded = writeBeve(longString);
        const decoded = readBeve(encoded);
        expect(decoded).toBe(longString);
        expect(decoded.length).toBe(100000);
    });
});

describe("Edge Cases - Special Characters", () => {
    test("should handle string with null bytes", () => {
        const str = "Hello\x00World";
        const encoded = writeBeve(str);
        const decoded = readBeve(encoded);
        expect(decoded).toBe(str);
    });

    test("should handle unicode characters", () => {
        const str = "Hello 世界 مرحبا שלום";
        const encoded = writeBeve(str);
        const decoded = readBeve(encoded);
        expect(decoded).toBe(str);
    });

    test("should handle control characters", () => {
        const str = "Line1\nLine2\tTabbed\rReturn";
        const encoded = writeBeve(str);
        const decoded = readBeve(encoded);
        expect(decoded).toBe(str);
    });

    test("should handle special JSON characters", () => {
        const obj = {
            "key\"with\"quotes": "value\"with\"quotes",
            "key\\with\\backslash": "value\\with\\backslash",
            "key/with/slash": "value/with/slash"
        };
        const encoded = writeBeve(obj);
        const decoded = readBeve(encoded);
        expect(decoded).toEqual(obj);
    });
});

describe("Edge Cases - Type Boundaries", () => {
    test("should distinguish between 0 and false", () => {
        const data = { zero: 0, false: false };
        const encoded = writeBeve(data);
        const decoded = readBeve(encoded);
        expect(decoded.zero).toBe(0);
        expect(decoded.false).toBe(false);
        expect(decoded.zero).not.toBe(decoded.false);
    });

    test("should distinguish between empty string and null", () => {
        const data = { empty: "", null: null };
        const encoded = writeBeve(data);
        const decoded = readBeve(encoded);
        expect(decoded.empty).toBe("");
        expect(decoded.null).toBe(null);
        expect(decoded.empty).not.toBe(decoded.null);
    });

    test("should handle array with all falsy values", () => {
        const arr = [0, false, "", null, undefined];
        const encoded = writeBeve(arr);
        const decoded = readBeve(encoded);
        // undefined is not supported, will be encoded as null
        expect(decoded[0]).toBe(0);
        expect(decoded[1]).toBe(false);
        expect(decoded[2]).toBe("");
        expect(decoded[3]).toBe(null);
    });

    test("should handle mixed number types", () => {
        const data = {
            integer: 42,
            float: 3.14,
            negative: -10,
            negativeFloat: -2.5,
            zero: 0
        };
        const encoded = writeBeve(data);
        const decoded = readBeve(encoded);
        expect(decoded.integer).toBe(42);
        expect(decoded.float).toBeCloseTo(3.14, 5);
        expect(decoded.negative).toBe(-10);
        expect(decoded.negativeFloat).toBeCloseTo(-2.5, 5);
        expect(decoded.zero).toBe(0);
    });
});

describe("Edge Cases - Circular References", () => {
    test("should handle duplicate object references (not circular)", () => {
        const shared = { shared: "value" };
        const data = {
            ref1: shared,
            ref2: shared
        };
        
        // Note: This will create two separate copies, not preserve references
        const encoded = writeBeve(data);
        const decoded = readBeve(encoded);
        
        expect(decoded.ref1).toEqual(shared);
        expect(decoded.ref2).toEqual(shared);
        // They won't be the same reference in decoded
        expect(decoded.ref1).not.toBe(decoded.ref2);
    });
});

describe("Edge Cases - Array Types", () => {
    test("should handle sparse array (with holes)", () => {
        const arr = [1, , 3, , 5]; // sparse array
        const encoded = writeBeve(arr);
        const decoded = readBeve(encoded);
        
        // Holes become undefined, which may serialize as null
        expect(decoded.length).toBe(5);
        expect(decoded[0]).toBe(1);
        expect(decoded[2]).toBe(3);
        expect(decoded[4]).toBe(5);
    });

    test("should handle array with only one type", () => {
        const booleans = [true, false, true, true, false];
        const encoded = writeBeve(booleans);
        const decoded = readBeve(encoded);
        expect(decoded).toEqual(booleans);
    });

    test("should handle alternating types in array", () => {
        const alternating = [1, "a", 2, "b", 3, "c"];
        const encoded = writeBeve(alternating);
        const decoded = readBeve(encoded);
        expect(decoded).toEqual(alternating);
    });
});

describe("Edge Cases - Buffer Management", () => {
    test("should handle exactly buffer boundary sizes", () => {
        // Test data that might hit buffer resize boundaries
        const sizes = [63, 64, 65, 255, 256, 257, 16383, 16384, 16385];
        
        for (const size of sizes) {
            const arr = Array.from({ length: size }, (_, i) => i);
            const encoded = writeBeve(arr);
            const decoded = readBeve(encoded);
            expect(decoded.length).toBe(size);
            expect(decoded[0]).toBe(0);
            expect(decoded[size - 1]).toBe(size - 1);
        }
    });

    test("should handle multiple sequential encode/decode", () => {
        const data = { test: "value", num: 42 };
        
        for (let i = 0; i < 100; i++) {
            const encoded = writeBeve(data);
            const decoded = readBeve(encoded);
            expect(decoded).toEqual(data);
        }
    });
});

describe("Edge Cases - Real World Scenarios", () => {
    test("should handle JSON-like API response", () => {
        const apiResponse = {
            status: "success",
            code: 200,
            data: {
                users: [
                    { id: 1, name: "Alice", active: true },
                    { id: 2, name: "Bob", active: false }
                ],
                pagination: {
                    page: 1,
                    perPage: 10,
                    total: 2
                }
            },
            timestamp: "2025-10-12T10:00:00Z"
        };
        
        const encoded = writeBeve(apiResponse);
        const decoded = readBeve(encoded);
        expect(JSON.stringify(decoded)).toBe(JSON.stringify(apiResponse));
    });

    test("should handle configuration object", () => {
        const config = {
            server: {
                host: "localhost",
                port: 8080,
                ssl: false,
                timeout: 30000
            },
            database: {
                url: "postgresql://localhost/db",
                pool: { min: 2, max: 10 }
            },
            features: {
                auth: true,
                cache: true,
                logging: "debug"
            }
        };
        
        const encoded = writeBeve(config);
        const decoded = readBeve(encoded);
        expect(JSON.stringify(decoded)).toBe(JSON.stringify(config));
    });

    test("should handle time series data", () => {
        const timeSeries = {
            sensor: "temperature",
            unit: "celsius",
            readings: Array.from({ length: 100 }, (_, i) => ({
                timestamp: Date.now() + i * 1000,
                value: 20 + Math.random() * 5,
                quality: i % 10 === 0 ? "poor" : "good"
            }))
        };
        
        const encoded = writeBeve(timeSeries);
        const decoded = readBeve(encoded);
        expect(decoded.readings.length).toBe(100);
        expect(decoded.sensor).toBe("temperature");
    });
});

describe("Edge Cases - Performance Critical", () => {
    test("should handle repeated encoding efficiently", () => {
        const data = { key: "value", num: 42 };
        
        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
            writeBeve(data);
        }
        const end = performance.now();
        
        console.log(`1000 encodings: ${(end - start).toFixed(2)}ms`);
        expect(end - start).toBeLessThan(1000); // Should be well under 1 second
    });

    test("should handle repeated decoding efficiently", () => {
        const data = { key: "value", num: 42 };
        const encoded = writeBeve(data);
        
        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
            readBeve(encoded);
        }
        const end = performance.now();
        
        console.log(`1000 decodings: ${(end - start).toFixed(2)}ms`);
        expect(end - start).toBeLessThan(1000); // Should be well under 1 second
    });
});
