#!/usr/bin/env bun

// BEVE-JS Demo with Faker.js - Realistic Data Showcase
import { faker } from '@faker-js/faker';
import { writeBeve, readBeve } from './dist/index.js';
import * as fs from 'fs';
import * as path from 'path';

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║       BEVE-JS with Faker.js - Realistic Data Demo             ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Generate realistic user
function generateUser() {
    return {
        id: faker.string.uuid(),
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        email: faker.internet.email(),
        age: faker.number.int({ min: 18, max: 80 }),
        address: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            country: faker.location.country()
        },
        company: faker.company.name(),
        salary: faker.number.int({ min: 30000, max: 150000 }),
        isActive: faker.datatype.boolean()
    };
}

// Demo 1: Single User
console.log('1️⃣  Single User Demo');
console.log('─'.repeat(60));
const user = generateUser();
console.log('Generated user:', JSON.stringify(user, null, 2));

const encodedUser = writeBeve(user);
const decodedUser = readBeve(encodedUser);

console.log(`\n✅ Encoded size: ${encodedUser.length} bytes`);
console.log(`✅ Decoded successfully: ${decodedUser.name}`);
console.log(`✅ Data integrity: ${JSON.stringify(user) === JSON.stringify(decodedUser) ? 'PASSED' : 'FAILED'}\n`);

// Demo 2: User Database
console.log('2️⃣  User Database (100 users)');
console.log('─'.repeat(60));
const users = Array.from({ length: 100 }, generateUser);

const encStart = performance.now();
const encodedUsers = writeBeve(users);
const encTime = performance.now() - encStart;

const decStart = performance.now();
const decodedUsers = readBeve(encodedUsers);
const decTime = performance.now() - decStart;

console.log(`📊 Statistics:`);
console.log(`├─ Users: ${users.length}`);
console.log(`├─ Encode time: ${encTime.toFixed(2)}ms`);
console.log(`├─ Decode time: ${decTime.toFixed(2)}ms`);
console.log(`├─ Total size: ${(encodedUsers.length / 1024).toFixed(2)} KB`);
console.log(`├─ Avg per user: ${(encodedUsers.length / users.length).toFixed(0)} bytes`);
console.log(`└─ Throughput: ${((encodedUsers.length / 1024) / ((encTime + decTime) / 1000)).toFixed(0)} KB/sec\n`);

// Demo 3: File I/O
console.log('3️⃣  File I/O Operations');
console.log('─'.repeat(60));
const testDir = './.demo-data';
if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
}

const filePath = path.join(testDir, 'users.beve');
const jsonPath = path.join(testDir, 'users.json');

// Write BEVE
const writeStart = performance.now();
fs.writeFileSync(filePath, encodedUsers);
const writeTime = performance.now() - writeStart;

// Write JSON
const jsonWriteStart = performance.now();
fs.writeFileSync(jsonPath, JSON.stringify(users));
const jsonWriteTime = performance.now() - jsonWriteStart;

// Read BEVE
const readStart = performance.now();
const beveBuffer = fs.readFileSync(filePath);
const beveData = readBeve(beveBuffer);
const readTime = performance.now() - readStart;

// Read JSON
const jsonReadStart = performance.now();
const jsonBuffer = fs.readFileSync(jsonPath, 'utf-8');
const jsonData = JSON.parse(jsonBuffer);
const jsonReadTime = performance.now() - jsonReadStart;

const beveSize = fs.statSync(filePath).size;
const jsonSize = fs.statSync(jsonPath).size;
const savings = ((jsonSize - beveSize) / jsonSize * 100).toFixed(1);

console.log(`💾 BEVE Format:`);
console.log(`├─ Write: ${writeTime.toFixed(2)}ms`);
console.log(`├─ Read: ${readTime.toFixed(2)}ms`);
console.log(`└─ File size: ${(beveSize / 1024).toFixed(2)} KB`);

console.log(`\n📄 JSON Format:`);
console.log(`├─ Write: ${jsonWriteTime.toFixed(2)}ms`);
console.log(`├─ Read: ${jsonReadTime.toFixed(2)}ms`);
console.log(`└─ File size: ${(jsonSize / 1024).toFixed(2)} KB`);

console.log(`\n🏆 Comparison:`);
console.log(`├─ Size savings: ${savings}% ${parseFloat(savings) > 0 ? '(BEVE wins!)' : ''}`);
console.log(`├─ Write speed: ${jsonWriteTime > writeTime ? 'BEVE faster' : 'JSON faster'} (${Math.abs(jsonWriteTime - writeTime).toFixed(2)}ms difference)`);
console.log(`└─ Read speed: ${jsonReadTime > readTime ? 'BEVE faster' : 'JSON faster'} (${Math.abs(jsonReadTime - readTime).toFixed(2)}ms difference)\n`);

// Demo 4: Products
console.log('4️⃣  E-commerce Products');
console.log('─'.repeat(60));
const products = Array.from({ length: 50 }, () => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    price: parseFloat(faker.commerce.price()),
    category: faker.commerce.department(),
    stock: faker.number.int({ min: 0, max: 1000 }),
    rating: parseFloat(faker.number.float({ min: 1, max: 5, fractionDigits: 1 }).toFixed(1))
}));

const prodEncoded = writeBeve(products);
const prodDecoded = readBeve(prodEncoded);

console.log(`📦 Product Catalog:`);
console.log(`├─ Products: ${products.length}`);
console.log(`├─ Total size: ${(prodEncoded.length / 1024).toFixed(2)} KB`);
console.log(`├─ Avg per product: ${(prodEncoded.length / products.length).toFixed(0)} bytes`);
console.log(`└─ Sample: ${prodDecoded[0].name} - $${prodDecoded[0].price}\n`);

// Demo 5: Performance Comparison
console.log('5️⃣  Performance Benchmark (1000 iterations)');
console.log('─'.repeat(60));
const testData = { id: faker.string.uuid(), name: faker.person.fullName(), value: faker.number.int() };
const iterations = 1000;

// BEVE benchmark
const beveEncStart = performance.now();
for (let i = 0; i < iterations; i++) {
    const enc = writeBeve(testData);
    readBeve(enc);
}
const beveTime = performance.now() - beveEncStart;

// JSON benchmark
const jsonEncStart = performance.now();
for (let i = 0; i < iterations; i++) {
    const json = JSON.stringify(testData);
    JSON.parse(json);
}
const jsonTime = performance.now() - jsonEncStart;

const speedup = (jsonTime / beveTime).toFixed(2);
console.log(`⚡ BEVE: ${beveTime.toFixed(2)}ms (${(iterations / (beveTime / 1000)).toFixed(0)} ops/sec)`);
console.log(`⚡ JSON: ${jsonTime.toFixed(2)}ms (${(iterations / (jsonTime / 1000)).toFixed(0)} ops/sec)`);
console.log(`🏆 Winner: ${beveTime < jsonTime ? 'BEVE' : 'JSON'} (${Math.abs(speedup)}x ${beveTime < jsonTime ? 'faster' : 'slower'})\n`);

// Cleanup
fs.rmSync(testDir, { recursive: true, force: true });

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                    Demo Complete! ✨                           ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('\n💡 Tips:');
console.log('   • BEVE excels with numeric and binary data');
console.log('   • Use BEVE for large datasets requiring compression');
console.log('   • JSON may be faster for simple string-heavy objects');
console.log('   • File size savings: typically 10-15% with BEVE\n');
