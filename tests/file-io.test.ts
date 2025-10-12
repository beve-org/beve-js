// File I/O benchmarks for BEVE format
import { describe, test, expect } from "bun:test";
import { faker } from '@faker-js/faker';
import { writeBeve, readBeve } from "../src/index";
import * as fs from 'fs';
import * as path from 'path';

const TEST_DIR = path.join(__dirname, '../.test-data');

// Ensure test directory exists
function ensureTestDir() {
    if (!fs.existsSync(TEST_DIR)) {
        fs.mkdirSync(TEST_DIR, { recursive: true });
    }
}

// Cleanup test directory
function cleanupTestDir() {
    if (fs.existsSync(TEST_DIR)) {
        const files = fs.readdirSync(TEST_DIR);
        for (const file of files) {
            fs.unlinkSync(path.join(TEST_DIR, file));
        }
    }
}

// Generate test user data
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
            state: faker.location.state(),
            zipCode: faker.location.zipCode(),
            country: faker.location.country()
        },
        company: faker.company.name(),
        jobTitle: faker.person.jobTitle(),
        isActive: faker.datatype.boolean()
    };
}

describe("File I/O - BEVE Format", () => {
    test("should write and read single user to file", () => {
        ensureTestDir();
        const user = generateUser();
        const filePath = path.join(TEST_DIR, 'user.beve');
        
        // Write to file
        const encoded = writeBeve(user);
        const writeStart = performance.now();
        fs.writeFileSync(filePath, encoded);
        const writeTime = performance.now() - writeStart;
        
        // Read from file
        const readStart = performance.now();
        const buffer = fs.readFileSync(filePath);
        const decoded = readBeve(buffer);
        const readTime = performance.now() - readStart;
        
        expect(decoded.id).toBe(user.id);
        expect(decoded.email).toBe(user.email);
        
        const fileSize = fs.statSync(filePath).size;
        
        console.log(`\n💾 Single User File I/O:`);
        console.log(`├─ Write: ${writeTime.toFixed(3)}ms`);
        console.log(`├─ Read: ${readTime.toFixed(3)}ms`);
        console.log(`└─ File Size: ${fileSize} bytes`);
        
        cleanupTestDir();
    });

    test("should write and read 100 users to file", () => {
        ensureTestDir();
        const users = Array.from({ length: 100 }, generateUser);
        const filePath = path.join(TEST_DIR, 'users-100.beve');
        
        const encoded = writeBeve(users);
        
        const writeStart = performance.now();
        fs.writeFileSync(filePath, encoded);
        const writeTime = performance.now() - writeStart;
        
        const readStart = performance.now();
        const buffer = fs.readFileSync(filePath);
        const decoded = readBeve(buffer);
        const readTime = performance.now() - readStart;
        
        expect(decoded.length).toBe(100);
        expect(decoded[0].id).toBe(users[0].id);
        
        const fileSize = fs.statSync(filePath).size;
        
        console.log(`\n💾 100 Users File I/O:`);
        console.log(`├─ Write: ${writeTime.toFixed(2)}ms`);
        console.log(`├─ Read: ${readTime.toFixed(2)}ms`);
        console.log(`├─ File Size: ${(fileSize / 1024).toFixed(2)} KB`);
        console.log(`└─ Throughput: ${((fileSize / 1024) / ((writeTime + readTime) / 1000)).toFixed(2)} KB/sec`);
        
        cleanupTestDir();
    });

    test("should write and read 1000 users to file", () => {
        ensureTestDir();
        const users = Array.from({ length: 1000 }, generateUser);
        const filePath = path.join(TEST_DIR, 'users-1000.beve');
        
        const encodeStart = performance.now();
        const encoded = writeBeve(users);
        const encodeTime = performance.now() - encodeStart;
        
        const writeStart = performance.now();
        fs.writeFileSync(filePath, encoded);
        const writeTime = performance.now() - writeStart;
        
        const readStart = performance.now();
        const buffer = fs.readFileSync(filePath);
        const readTime = performance.now() - readStart;
        
        const decodeStart = performance.now();
        const decoded = readBeve(buffer);
        const decodeTime = performance.now() - decodeStart;
        
        expect(decoded.length).toBe(1000);
        
        const fileSize = fs.statSync(filePath).size;
        const totalTime = encodeTime + writeTime + readTime + decodeTime;
        
        console.log(`\n💾 1000 Users File I/O:`);
        console.log(`├─ Encode: ${encodeTime.toFixed(2)}ms`);
        console.log(`├─ Write to disk: ${writeTime.toFixed(2)}ms`);
        console.log(`├─ Read from disk: ${readTime.toFixed(2)}ms`);
        console.log(`├─ Decode: ${decodeTime.toFixed(2)}ms`);
        console.log(`├─ Total: ${totalTime.toFixed(2)}ms`);
        console.log(`├─ File Size: ${(fileSize / 1024).toFixed(2)} KB`);
        console.log(`└─ Throughput: ${((fileSize / 1024) / (totalTime / 1000)).toFixed(2)} KB/sec`);
        
        cleanupTestDir();
    });
});

describe("File I/O - BEVE vs JSON Comparison", () => {
    test("should compare BEVE vs JSON file sizes", () => {
        ensureTestDir();
        const users = Array.from({ length: 500 }, generateUser);
        
        const bevePath = path.join(TEST_DIR, 'users.beve');
        const jsonPath = path.join(TEST_DIR, 'users.json');
        
        // Write BEVE
        const beveEncoded = writeBeve(users);
        fs.writeFileSync(bevePath, beveEncoded);
        
        // Write JSON
        const jsonEncoded = JSON.stringify(users);
        fs.writeFileSync(jsonPath, jsonEncoded);
        
        const beveSize = fs.statSync(bevePath).size;
        const jsonSize = fs.statSync(jsonPath).size;
        const savings = ((jsonSize - beveSize) / jsonSize * 100).toFixed(1);
        
        console.log(`\n📊 File Size Comparison (500 Users):`);
        console.log(`├─ JSON: ${(jsonSize / 1024).toFixed(2)} KB`);
        console.log(`├─ BEVE: ${(beveSize / 1024).toFixed(2)} KB`);
        console.log(`└─ Savings: ${savings}% ${parseFloat(savings) > 0 ? '✅' : ''}`);
        
        expect(beveSize).toBeGreaterThan(0);
        expect(jsonSize).toBeGreaterThan(0);
        
        cleanupTestDir();
    });

    test("should compare BEVE vs JSON read/write performance", () => {
        ensureTestDir();
        const users = Array.from({ length: 500 }, generateUser);
        
        const bevePath = path.join(TEST_DIR, 'perf-test.beve');
        const jsonPath = path.join(TEST_DIR, 'perf-test.json');
        
        // BEVE write
        const beveEncoded = writeBeve(users);
        const beveWriteStart = performance.now();
        fs.writeFileSync(bevePath, beveEncoded);
        const beveWriteTime = performance.now() - beveWriteStart;
        
        // BEVE read
        const beveReadStart = performance.now();
        const beveBuffer = fs.readFileSync(bevePath);
        const beveDecoded = readBeve(beveBuffer);
        const beveReadTime = performance.now() - beveReadStart;
        
        // JSON write
        const jsonEncoded = JSON.stringify(users);
        const jsonWriteStart = performance.now();
        fs.writeFileSync(jsonPath, jsonEncoded);
        const jsonWriteTime = performance.now() - jsonWriteStart;
        
        // JSON read
        const jsonReadStart = performance.now();
        const jsonBuffer = fs.readFileSync(jsonPath, 'utf-8');
        const jsonDecoded = JSON.parse(jsonBuffer);
        const jsonReadTime = performance.now() - jsonReadStart;
        
        const writeSpeedup = (jsonWriteTime / beveWriteTime).toFixed(2);
        const readSpeedup = (jsonReadTime / beveReadTime).toFixed(2);
        
        expect(beveDecoded.length).toBe(500);
        expect(jsonDecoded.length).toBe(500);
        
        console.log(`\n⚡ Performance Comparison (500 Users):`);
        console.log(`├─ Write to Disk:`);
        console.log(`│  ├─ JSON: ${jsonWriteTime.toFixed(2)}ms`);
        console.log(`│  ├─ BEVE: ${beveWriteTime.toFixed(2)}ms`);
        console.log(`│  └─ Speedup: ${writeSpeedup}x`);
        console.log(`└─ Read from Disk:`);
        console.log(`   ├─ JSON: ${jsonReadTime.toFixed(2)}ms`);
        console.log(`   ├─ BEVE: ${beveReadTime.toFixed(2)}ms`);
        console.log(`   └─ Speedup: ${readSpeedup}x ${parseFloat(readSpeedup) > 1 ? '🏆' : ''}`);
        
        cleanupTestDir();
    });
});

describe("File I/O - Streaming Simulation", () => {
    test("should handle chunked data writing", () => {
        ensureTestDir();
        const chunkSize = 100;
        const chunks = 10;
        const filePath = path.join(TEST_DIR, 'chunked-data.beve');
        
        const allData: any[] = [];
        const writeTimes: number[] = [];
        
        // Simulate streaming writes
        for (let i = 0; i < chunks; i++) {
            const users = Array.from({ length: chunkSize }, generateUser);
            allData.push(...users);
            
            const encoded = writeBeve(users);
            const writeStart = performance.now();
            
            if (i === 0) {
                fs.writeFileSync(filePath, encoded);
            } else {
                fs.appendFileSync(filePath, encoded);
            }
            
            writeTimes.push(performance.now() - writeStart);
        }
        
        const totalWriteTime = writeTimes.reduce((a, b) => a + b, 0);
        const avgWriteTime = totalWriteTime / chunks;
        const fileSize = fs.statSync(filePath).size;
        
        console.log(`\n🔄 Chunked Writing (${chunks} chunks x ${chunkSize} users):`);
        console.log(`├─ Total Write Time: ${totalWriteTime.toFixed(2)}ms`);
        console.log(`├─ Avg Chunk Time: ${avgWriteTime.toFixed(2)}ms`);
        console.log(`├─ File Size: ${(fileSize / 1024).toFixed(2)} KB`);
        console.log(`└─ Throughput: ${((fileSize / 1024) / (totalWriteTime / 1000)).toFixed(2)} KB/sec`);
        
        expect(fileSize).toBeGreaterThan(0);
        
        cleanupTestDir();
    });
});

describe("File I/O - Large File Handling", () => {
    test("should handle 5000 users file", () => {
        ensureTestDir();
        const users = Array.from({ length: 5000 }, generateUser);
        const filePath = path.join(TEST_DIR, 'large-users.beve');
        
        console.log(`\n🗄️  Large File Test (5000 Users):`);
        
        const encodeStart = performance.now();
        const encoded = writeBeve(users);
        const encodeTime = performance.now() - encodeStart;
        
        const writeStart = performance.now();
        fs.writeFileSync(filePath, encoded);
        const writeTime = performance.now() - writeStart;
        
        const fileSize = fs.statSync(filePath).size;
        
        const readStart = performance.now();
        const buffer = fs.readFileSync(filePath);
        const readTime = performance.now() - readStart;
        
        const decodeStart = performance.now();
        const decoded = readBeve(buffer);
        const decodeTime = performance.now() - decodeStart;
        
        expect(decoded.length).toBe(5000);
        
        const totalTime = encodeTime + writeTime + readTime + decodeTime;
        
        console.log(`├─ Encode: ${encodeTime.toFixed(2)}ms`);
        console.log(`├─ Write: ${writeTime.toFixed(2)}ms`);
        console.log(`├─ File Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`├─ Read: ${readTime.toFixed(2)}ms`);
        console.log(`├─ Decode: ${decodeTime.toFixed(2)}ms`);
        console.log(`├─ Total: ${totalTime.toFixed(2)}ms`);
        console.log(`└─ Throughput: ${((fileSize / 1024) / (totalTime / 1000)).toFixed(2)} KB/sec`);
        
        cleanupTestDir();
    });
});

describe("File I/O - Multiple File Operations", () => {
    test("should handle multiple concurrent file operations", () => {
        ensureTestDir();
        const fileCount = 10;
        const usersPerFile = 100;
        
        console.log(`\n📁 Multiple Files (${fileCount} files x ${usersPerFile} users):`);
        
        const writeStart = performance.now();
        const filePaths: string[] = [];
        
        for (let i = 0; i < fileCount; i++) {
            const users = Array.from({ length: usersPerFile }, generateUser);
            const filePath = path.join(TEST_DIR, `batch-${i}.beve`);
            const encoded = writeBeve(users);
            fs.writeFileSync(filePath, encoded);
            filePaths.push(filePath);
        }
        
        const writeTime = performance.now() - writeStart;
        
        const readStart = performance.now();
        let totalRecords = 0;
        
        for (const filePath of filePaths) {
            const buffer = fs.readFileSync(filePath);
            const decoded = readBeve(buffer);
            totalRecords += decoded.length;
        }
        
        const readTime = performance.now() - readStart;
        
        expect(totalRecords).toBe(fileCount * usersPerFile);
        
        const totalSize = filePaths.reduce((sum, fp) => sum + fs.statSync(fp).size, 0);
        
        console.log(`├─ Write All: ${writeTime.toFixed(2)}ms`);
        console.log(`├─ Read All: ${readTime.toFixed(2)}ms`);
        console.log(`├─ Total Size: ${(totalSize / 1024).toFixed(2)} KB`);
        console.log(`├─ Avg File Size: ${(totalSize / fileCount / 1024).toFixed(2)} KB`);
        console.log(`└─ Total Throughput: ${((totalSize / 1024) / ((writeTime + readTime) / 1000)).toFixed(2)} KB/sec`);
        
        cleanupTestDir();
    });
});
