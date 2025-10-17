/**
 * BEVE Extensions - Example Usage
 * 
 * Demonstrates performance benefits of BEVE extensions
 */

import {
    encodeAuto,
    encodeTyped,
    decodeAuto,
    encodeTimestamp,
    decodeTimestamp,
    encodeDuration,
    decodeDuration,
    encodeUUID,
    decodeUUID,
    generateUUIDv4,
    getCurrentTimestamp,
    formatUUID,
    formatTimestamp,
    Writer,
} from '../src';

// ============================================================================
// Extension 1: Typed Object Arrays
// ============================================================================

console.log('=== Extension 1: Typed Object Arrays ===\n');

const users = [
    { name: 'Alice', age: 30, email: 'alice@example.com' },
    { name: 'Bob', age: 25, email: 'bob@example.com' },
    { name: 'Charlie', age: 35, email: 'charlie@example.com' },
    { name: 'Diana', age: 28, email: 'diana@example.com' },
    { name: 'Eve', age: 32, email: 'eve@example.com' },
];

// Standard encoding
const standardBytes = encodeAuto(users, { autoDetect: false });
console.log(`Standard BEVE: ${standardBytes.length} bytes`);

// Typed encoding (Extension 1)
const typedBytes = encodeTyped(users);
console.log(`Typed Array:   ${typedBytes.length} bytes`);

const savings = ((standardBytes.length - typedBytes.length) / standardBytes.length) * 100;
console.log(`Savings:       ${savings.toFixed(1)}% smaller\n`);

// Decode and verify
const decoded = decodeAuto(typedBytes);
console.log('Decoded:', JSON.stringify(decoded[0], null, 2));
console.log(`Round-trip OK: ${JSON.stringify(users) === JSON.stringify(decoded)}\n`);

// ============================================================================
// Extension 4: Timestamps
// ============================================================================

console.log('=== Extension 4: Timestamps ===\n');

const now = new Date();
const ts = getCurrentTimestamp();

console.log(`JavaScript Date: ${now.toISOString()}`);
console.log(`BEVE Timestamp:  ${JSON.stringify(ts)}`);
console.log(`Formatted:       ${formatTimestamp(ts)}\n`);

// Encode timestamp
const writer = new Writer();
encodeTimestamp(ts, writer);
const tsBytes = writer.buffer.slice(0, writer.offset);

// Size comparison
const jsonSize = JSON.stringify(now.toISOString()).length;
console.log(`JSON (ISO 8601): ${jsonSize} bytes`);
console.log(`BEVE Timestamp:  ${tsBytes.length} bytes`);
console.log(`Savings:         ${((1 - tsBytes.length / jsonSize) * 100).toFixed(1)}%\n`);

// Round-trip test
const cursor = { value: 1 }; // Skip header
const decodedTs = decodeTimestamp(tsBytes, cursor);
console.log('Decoded:', decodedTs);
console.log(`Round-trip OK: ${ts.seconds === decodedTs.seconds && ts.nanoseconds === decodedTs.nanoseconds}\n`);

// ============================================================================
// Extension 5: Duration
// ============================================================================

console.log('=== Extension 5: Duration ===\n');

const duration = { seconds: 3600, nanoseconds: 500_000_000 }; // 1 hour 0.5 sec

const durationWriter = new Writer();
encodeDuration(duration, durationWriter);
const durationBytes = durationWriter.buffer.slice(0, durationWriter.offset);

console.log(`Duration: ${duration.seconds}s ${duration.nanoseconds}ns`);
console.log(`Encoded:  ${durationBytes.length} bytes`);

// Decode
const durationCursor = { value: 1 }; // Skip header
const decodedDuration = decodeDuration(durationBytes, durationCursor);
console.log('Decoded:', decodedDuration);
console.log(`Round-trip OK: ${duration.seconds === decodedDuration.seconds && duration.nanoseconds === decodedDuration.nanoseconds}\n`);

// ============================================================================
// Extension 8: UUID
// ============================================================================

console.log('=== Extension 8: UUID ===\n');

const uuid = generateUUIDv4();
const uuidString = formatUUID(uuid.bytes);

console.log(`Generated UUID: ${uuidString}`);
console.log(`Version:        ${uuid.version}`);

// Encode UUID
const uuidWriter = new Writer();
encodeUUID(uuid, uuidWriter);
const uuidBytes = uuidWriter.buffer.slice(0, uuidWriter.offset);

// Size comparison
const stringSize = JSON.stringify(uuidString).length;
console.log(`\nSize comparison:`);
console.log(`  String:      ${stringSize} bytes`);
console.log(`  BEVE Binary: ${uuidBytes.length} bytes`);
console.log(`  Savings:     ${((1 - uuidBytes.length / stringSize) * 100).toFixed(1)}%\n`);

// Decode
const uuidCursor = { value: 1 }; // Skip header
const decodedUuid = decodeUUID(uuidBytes, uuidCursor);
const decodedString = formatUUID(decodedUuid.bytes);

console.log('Decoded:', decodedString);
console.log(`Round-trip OK: ${uuidString === decodedString}\n`);

// ============================================================================
// Performance Benchmark
// ============================================================================

console.log('=== Performance Benchmark ===\n');

const iterations = 10000;

// Typed Array Performance
const typedStart = performance.now();
for (let i = 0; i < iterations; i++) {
    const bytes = encodeTyped(users);
    decodeAuto(bytes);
}
const typedTime = performance.now() - typedStart;

// Standard Array Performance
const standardStart = performance.now();
for (let i = 0; i < iterations; i++) {
    const bytes = encodeAuto(users, { autoDetect: false });
    decodeAuto(bytes);
}
const standardTime = performance.now() - standardStart;

console.log(`Iterations: ${iterations}`);
console.log(`Standard BEVE: ${standardTime.toFixed(2)}ms`);
console.log(`Typed Array:   ${typedTime.toFixed(2)}ms`);
console.log(`Speedup:       ${(standardTime / typedTime).toFixed(1)}×\n`);

console.log('✅ All extension examples completed successfully!');
