// Realistic data benchmarks with Faker.js
import { describe, test, expect } from "bun:test";
import { faker } from '@faker-js/faker';
import { writeBeve, readBeve } from "../src/index";

// Helper to generate realistic user data
function generateUser() {
    return {
        id: faker.string.uuid(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        avatar: faker.image.avatar(),
        age: faker.number.int({ min: 18, max: 80 }),
        birthDate: faker.date.birthdate().toISOString(),
        phone: faker.phone.number(),
        address: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
            zipCode: faker.location.zipCode(),
            country: faker.location.country(),
            latitude: parseFloat(faker.location.latitude().toFixed(6)),
            longitude: parseFloat(faker.location.longitude().toFixed(6))
        },
        company: {
            name: faker.company.name(),
            department: faker.commerce.department(),
            jobTitle: faker.person.jobTitle(),
            salary: faker.number.int({ min: 30000, max: 200000 })
        },
        bio: faker.person.bio(),
        website: faker.internet.url(),
        isActive: faker.datatype.boolean(),
        registeredAt: faker.date.past().toISOString(),
        lastLogin: faker.date.recent().toISOString()
    };
}

// Helper to generate product data
function generateProduct() {
    return {
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price()),
        category: faker.commerce.department(),
        sku: faker.string.alphanumeric(10).toUpperCase(),
        stock: faker.number.int({ min: 0, max: 1000 }),
        rating: parseFloat(faker.number.float({ min: 1, max: 5, fractionDigits: 1 }).toFixed(1)),
        reviews: faker.number.int({ min: 0, max: 500 }),
        images: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, 
            () => faker.image.url()),
        tags: Array.from({ length: faker.number.int({ min: 2, max: 8 }) }, 
            () => faker.commerce.productAdjective()),
        inStock: faker.datatype.boolean(),
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.recent().toISOString()
    };
}

// Helper to generate order data
function generateOrder() {
    const itemCount = faker.number.int({ min: 1, max: 10 });
    return {
        id: faker.string.uuid(),
        orderNumber: faker.string.alphanumeric(12).toUpperCase(),
        customerId: faker.string.uuid(),
        status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
        items: Array.from({ length: itemCount }, () => ({
            productId: faker.string.uuid(),
            productName: faker.commerce.productName(),
            quantity: faker.number.int({ min: 1, max: 5 }),
            price: parseFloat(faker.commerce.price())
        })),
        subtotal: parseFloat(faker.number.float({ min: 50, max: 5000, fractionDigits: 2 }).toFixed(2)),
        tax: parseFloat(faker.number.float({ min: 5, max: 500, fractionDigits: 2 }).toFixed(2)),
        shipping: parseFloat(faker.number.float({ min: 0, max: 50, fractionDigits: 2 }).toFixed(2)),
        total: parseFloat(faker.number.float({ min: 60, max: 5500, fractionDigits: 2 }).toFixed(2)),
        shippingAddress: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
            zipCode: faker.location.zipCode(),
            country: faker.location.country()
        },
        paymentMethod: faker.helpers.arrayElement(['credit_card', 'paypal', 'bank_transfer', 'cash']),
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.recent().toISOString()
    };
}

describe("Realistic Data - Single User", () => {
    test("should encode/decode realistic user data", () => {
        const user = generateUser();
        const encoded = writeBeve(user);
        const decoded = readBeve(encoded);
        
        expect(decoded.id).toBe(user.id);
        expect(decoded.email).toBe(user.email);
        expect(decoded.address.city).toBe(user.address.city);
        
        console.log(`📊 Single User: ${encoded.length} bytes`);
    });

    test("should handle user with complex nested data", () => {
        const user = generateUser();
        const start = performance.now();
        const encoded = writeBeve(user);
        const encodeTime = performance.now() - start;
        
        const decodeStart = performance.now();
        const decoded = readBeve(encoded);
        const decodeTime = performance.now() - decodeStart;
        
        expect(decoded.firstName).toBe(user.firstName);
        
        console.log(`User Encoding: ${encodeTime.toFixed(3)}ms`);
        console.log(`User Decoding: ${decodeTime.toFixed(3)}ms`);
        console.log(`User Size: ${encoded.length} bytes`);
    });
});

describe("Realistic Data - User Database", () => {
    test("should handle 100 users efficiently", () => {
        const users = Array.from({ length: 100 }, generateUser);
        
        const encodeStart = performance.now();
        const encoded = writeBeve(users);
        const encodeTime = performance.now() - encodeStart;
        
        const decodeStart = performance.now();
        const decoded = readBeve(encoded);
        const decodeTime = performance.now() - decodeStart;
        
        expect(decoded.length).toBe(100);
        expect(decoded[0].email).toBe(users[0].email);
        
        console.log(`\n📊 100 Users Benchmark:`);
        console.log(`├─ Encode: ${encodeTime.toFixed(2)}ms`);
        console.log(`├─ Decode: ${decodeTime.toFixed(2)}ms`);
        console.log(`├─ Size: ${(encoded.length / 1024).toFixed(2)} KB`);
        console.log(`└─ Avg per user: ${(encoded.length / 100).toFixed(0)} bytes`);
    });

    test("should handle 1000 users with performance tracking", () => {
        const users = Array.from({ length: 1000 }, generateUser);
        
        const encodeStart = performance.now();
        const encoded = writeBeve(users);
        const encodeTime = performance.now() - encodeStart;
        
        const decodeStart = performance.now();
        const decoded = readBeve(encoded);
        const decodeTime = performance.now() - decodeStart;
        
        const encodeOps = (1000 / (encodeTime / 1000)).toFixed(0);
        const decodeOps = (1000 / (decodeTime / 1000)).toFixed(0);
        
        expect(decoded.length).toBe(1000);
        
        console.log(`\n📊 1000 Users Benchmark:`);
        console.log(`├─ Encode: ${encodeTime.toFixed(2)}ms (${encodeOps} users/sec)`);
        console.log(`├─ Decode: ${decodeTime.toFixed(2)}ms (${decodeOps} users/sec)`);
        console.log(`├─ Total Size: ${(encoded.length / 1024).toFixed(2)} KB`);
        console.log(`└─ Avg per user: ${(encoded.length / 1000).toFixed(0)} bytes`);
    });
});

describe("Realistic Data - Product Catalog", () => {
    test("should handle 500 products", () => {
        const products = Array.from({ length: 500 }, generateProduct);
        
        const encodeStart = performance.now();
        const encoded = writeBeve(products);
        const encodeTime = performance.now() - encodeStart;
        
        const decodeStart = performance.now();
        const decoded = readBeve(encoded);
        const decodeTime = performance.now() - decodeStart;
        
        expect(decoded.length).toBe(500);
        expect(decoded[0].name).toBe(products[0].name);
        
        console.log(`\n📦 500 Products Benchmark:`);
        console.log(`├─ Encode: ${encodeTime.toFixed(2)}ms`);
        console.log(`├─ Decode: ${decodeTime.toFixed(2)}ms`);
        console.log(`├─ Size: ${(encoded.length / 1024).toFixed(2)} KB`);
        console.log(`└─ Throughput: ${((encoded.length / 1024) / (decodeTime / 1000)).toFixed(2)} KB/sec`);
    });
});

describe("Realistic Data - E-commerce Orders", () => {
    test("should handle 200 orders with items", () => {
        const orders = Array.from({ length: 200 }, generateOrder);
        
        const encodeStart = performance.now();
        const encoded = writeBeve(orders);
        const encodeTime = performance.now() - encodeStart;
        
        const decodeStart = performance.now();
        const decoded = readBeve(encoded);
        const decodeTime = performance.now() - decodeStart;
        
        expect(decoded.length).toBe(200);
        expect(decoded[0].items.length).toBeGreaterThan(0);
        
        const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0);
        
        console.log(`\n🛒 200 Orders Benchmark:`);
        console.log(`├─ Total Items: ${totalItems}`);
        console.log(`├─ Encode: ${encodeTime.toFixed(2)}ms`);
        console.log(`├─ Decode: ${decodeTime.toFixed(2)}ms`);
        console.log(`├─ Size: ${(encoded.length / 1024).toFixed(2)} KB`);
        console.log(`└─ Avg per order: ${(encoded.length / 200).toFixed(0)} bytes`);
    });
});

describe("Realistic Data - JSON Comparison", () => {
    test("should compare BEVE vs JSON for user data", () => {
        const users = Array.from({ length: 100 }, generateUser);
        
        // BEVE encoding
        const beveEncodeStart = performance.now();
        const beveEncoded = writeBeve(users);
        const beveEncodeTime = performance.now() - beveEncodeStart;
        
        const beveDecodeStart = performance.now();
        const beveDecoded = readBeve(beveEncoded);
        const beveDecodeTime = performance.now() - beveDecodeStart;
        
        // JSON encoding
        const jsonEncodeStart = performance.now();
        const jsonEncoded = JSON.stringify(users);
        const jsonEncodeTime = performance.now() - jsonEncodeStart;
        
        const jsonDecodeStart = performance.now();
        const jsonDecoded = JSON.parse(jsonEncoded);
        const jsonDecodeTime = performance.now() - jsonDecodeStart;
        
        const jsonSize = new TextEncoder().encode(jsonEncoded).length;
        const beveSize = beveEncoded.length;
        const sizeSavings = ((jsonSize - beveSize) / jsonSize * 100).toFixed(1);
        const encodeSpeedup = jsonEncodeTime / beveEncodeTime;
        const decodeSpeedup = jsonDecodeTime / beveDecodeTime;
        
        expect(beveDecoded.length).toBe(100);
        expect(jsonDecoded.length).toBe(100);
        
        console.log(`\n🏆 BEVE vs JSON (100 Users):`);
        console.log(`├─ Size:`);
        console.log(`│  ├─ JSON: ${(jsonSize / 1024).toFixed(2)} KB`);
        console.log(`│  ├─ BEVE: ${(beveSize / 1024).toFixed(2)} KB`);
        console.log(`│  └─ Savings: ${sizeSavings}%`);
        console.log(`├─ Encoding Speed:`);
        console.log(`│  ├─ JSON: ${jsonEncodeTime.toFixed(2)}ms`);
        console.log(`│  ├─ BEVE: ${beveEncodeTime.toFixed(2)}ms`);
        console.log(`│  └─ Speedup: ${encodeSpeedup.toFixed(2)}x`);
        console.log(`└─ Decoding Speed:`);
        console.log(`   ├─ JSON: ${jsonDecodeTime.toFixed(2)}ms`);
        console.log(`   ├─ BEVE: ${beveDecodeTime.toFixed(2)}ms`);
        console.log(`   └─ Speedup: ${decodeSpeedup.toFixed(2)}x ${decodeSpeedup > 1 ? '🏆' : ''}`);
    });

    test("should compare BEVE vs JSON for product catalog", () => {
        const products = Array.from({ length: 500 }, generateProduct);
        
        const beveEncoded = writeBeve(products);
        const jsonEncoded = JSON.stringify(products);
        const jsonSize = new TextEncoder().encode(jsonEncoded).length;
        
        const beveDecodeStart = performance.now();
        readBeve(beveEncoded);
        const beveDecodeTime = performance.now() - beveDecodeStart;
        
        const jsonDecodeStart = performance.now();
        JSON.parse(jsonEncoded);
        const jsonDecodeTime = performance.now() - jsonDecodeStart;
        
        const sizeSavings = ((jsonSize - beveEncoded.length) / jsonSize * 100).toFixed(1);
        const decodeSpeedup = jsonDecodeTime / beveDecodeTime;
        
        console.log(`\n📦 BEVE vs JSON (500 Products):`);
        console.log(`├─ Size: ${sizeSavings}% smaller`);
        console.log(`└─ Decode: ${decodeSpeedup.toFixed(2)}x faster ${decodeSpeedup > 1 ? '🏆' : ''}`);
    });
});

describe("Realistic Data - Stress Test", () => {
    test("should handle 5000 users (large dataset)", () => {
        console.log(`\n🔥 Stress Test: 5000 Users`);
        
        const generateStart = performance.now();
        const users = Array.from({ length: 5000 }, generateUser);
        const generateTime = performance.now() - generateStart;
        
        const encodeStart = performance.now();
        const encoded = writeBeve(users);
        const encodeTime = performance.now() - encodeStart;
        
        const decodeStart = performance.now();
        const decoded = readBeve(encoded);
        const decodeTime = performance.now() - decodeStart;
        
        expect(decoded.length).toBe(5000);
        
        console.log(`├─ Data Generation: ${generateTime.toFixed(2)}ms`);
        console.log(`├─ Encode: ${encodeTime.toFixed(2)}ms (${(5000 / (encodeTime / 1000)).toFixed(0)} users/sec)`);
        console.log(`├─ Decode: ${decodeTime.toFixed(2)}ms (${(5000 / (decodeTime / 1000)).toFixed(0)} users/sec)`);
        console.log(`├─ Total Size: ${(encoded.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`└─ Throughput: ${((encoded.length / 1024) / (decodeTime / 1000)).toFixed(2)} KB/sec`);
    });
});

describe("Realistic Data - Mixed Dataset", () => {
    test("should handle complex mixed business data", () => {
        const businessData = {
            company: {
                name: faker.company.name(),
                industry: faker.company.buzzPhrase(),
                founded: faker.date.past({ years: 50 }).toISOString(),
                employees: faker.number.int({ min: 10, max: 10000 })
            },
            users: Array.from({ length: 50 }, generateUser),
            products: Array.from({ length: 100 }, generateProduct),
            orders: Array.from({ length: 200 }, generateOrder),
            analytics: {
                totalRevenue: parseFloat(faker.number.float({ min: 100000, max: 10000000, fractionDigits: 2 }).toFixed(2)),
                totalOrders: faker.number.int({ min: 1000, max: 100000 }),
                activeUsers: faker.number.int({ min: 100, max: 10000 }),
                conversionRate: parseFloat(faker.number.float({ min: 1, max: 10, fractionDigits: 2 }).toFixed(2)),
                metrics: Array.from({ length: 365 }, () => ({
                    date: faker.date.past().toISOString(),
                    revenue: parseFloat(faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 }).toFixed(2)),
                    orders: faker.number.int({ min: 10, max: 500 }),
                    visitors: faker.number.int({ min: 100, max: 5000 })
                }))
            }
        };
        
        const encodeStart = performance.now();
        const encoded = writeBeve(businessData);
        const encodeTime = performance.now() - encodeStart;
        
        const decodeStart = performance.now();
        const decoded = readBeve(encoded);
        const decodeTime = performance.now() - decodeStart;
        
        expect(decoded.users.length).toBe(50);
        expect(decoded.products.length).toBe(100);
        expect(decoded.orders.length).toBe(200);
        expect(decoded.analytics.metrics.length).toBe(365);
        
        console.log(`\n🏢 Complex Business Data:`);
        console.log(`├─ Users: 50`);
        console.log(`├─ Products: 100`);
        console.log(`├─ Orders: 200`);
        console.log(`├─ Daily Metrics: 365`);
        console.log(`├─ Encode: ${encodeTime.toFixed(2)}ms`);
        console.log(`├─ Decode: ${decodeTime.toFixed(2)}ms`);
        console.log(`└─ Total Size: ${(encoded.length / 1024).toFixed(2)} KB`);
    });
});
