/**
 * BEVE Extension 8: UUID
 * 
 * Binary UUID encoding - 50% smaller than string representation.
 * 
 * Performance: 18 bytes (vs 36 bytes string + quotes)
 * 
 * Format:
 * [0xC6]                  // Extension 8 header (0b110 | 8<<3 = 0x46, then 0x80 | 0x46 = 0xC6)
 * [version: byte]         // UUID version (1-5)
 * [uuid: 16 bytes]        // Binary UUID data
 */

import { Writer } from '../writer';
import { ExtensionID, createExtensionHeader, BeveUUID, parseUUID, formatUUID, getUUIDVersion } from './types';

// ============================================================================
// Encoder
// ============================================================================

/**
 * Encode UUID in binary format (Extension 8)
 * 
 * @example
 * const uuid = parseUUID("550e8400-e29b-41d4-a716-446655440000");
 * const bytes = encodeUUID(uuid, writer);
 * 
 * // Size: 18 bytes (vs 38 bytes for "550e8400-e29b-41d4-a716-446655440000")
 */
export function encodeUUID(uuid: BeveUUID, writer: Writer): void {
    // Write extension header
    const header = createExtensionHeader(ExtensionID.UUID);
    writer.append_uint8(header);
    
    // Write version
    writer.append_uint8(uuid.version);
    
    // Write UUID bytes
    writer.ensureCapacity(16);
    writer.buffer.set(uuid.bytes, writer.offset);
    writer.offset += 16;
}

/**
 * Encode UUID from string format
 * 
 * @example
 * const bytes = encodeUUIDString("550e8400-e29b-41d4-a716-446655440000", writer);
 */
export function encodeUUIDString(uuidString: string, writer: Writer): void {
    const bytes = parseUUID(uuidString);
    const version = getUUIDVersion(bytes);
    
    encodeUUID({ version, bytes }, writer);
}

/**
 * Encode UUID from byte array
 */
export function encodeUUIDBytes(bytes: Uint8Array, writer: Writer): void {
    if (bytes.length !== 16) {
        throw new Error(`Invalid UUID length: ${bytes.length} (expected 16)`);
    }
    
    const version = getUUIDVersion(bytes);
    encodeUUID({ version, bytes }, writer);
}

// ============================================================================
// Decoder
// ============================================================================

/**
 * Decode UUID (Extension 8)
 * 
 * @param buffer - BEVE binary data
 * @param cursor - Current position in buffer (will be updated)
 * @returns Decoded UUID
 */
export function decodeUUID(buffer: Uint8Array, cursor: { value: number }): BeveUUID {
    // Header already consumed by caller
    
    // Read version
    const version = buffer[cursor.value++];
    
    // Read UUID bytes
    const bytes = buffer.slice(cursor.value, cursor.value + 16);
    cursor.value += 16;
    
    return { version, bytes };
}

/**
 * Decode UUID as string
 */
export function decodeUUIDString(buffer: Uint8Array, cursor: { value: number }): string {
    const uuid = decodeUUID(buffer, cursor);
    return formatUUID(uuid.bytes);
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate random UUID v4
 */
export function generateUUIDv4(): BeveUUID {
    const bytes = new Uint8Array(16);
    
    // Fill with random values
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    } else {
        // Fallback for Node.js
        for (let i = 0; i < 16; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
    }
    
    // Set version (4) and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xx
    
    return { version: 4, bytes };
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: BeveUUID): boolean {
    if (!uuid.bytes || !(uuid.bytes instanceof Uint8Array)) {
        return false;
    }
    
    if (uuid.bytes.length !== 16) {
        return false;
    }
    
    if (uuid.version < 1 || uuid.version > 5) {
        return false;
    }
    
    // Verify version matches byte 6
    const versionFromBytes = getUUIDVersion(uuid.bytes);
    if (versionFromBytes !== uuid.version) {
        return false;
    }
    
    return true;
}

/**
 * Validate UUID string format
 */
export function validateUUIDString(uuidString: string): boolean {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuidString);
}

/**
 * Compare two UUIDs
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareUUIDs(a: BeveUUID, b: BeveUUID): number {
    for (let i = 0; i < 16; i++) {
        if (a.bytes[i] < b.bytes[i]) return -1;
        if (a.bytes[i] > b.bytes[i]) return 1;
    }
    return 0;
}

/**
 * Check if UUID is nil (all zeros)
 */
export function isNilUUID(uuid: BeveUUID): boolean {
    return uuid.bytes.every(b => b === 0);
}

/**
 * Calculate size savings
 */
export function calculateUUIDSavings(): { stringSize: number; binarySize: number; savings: number } {
    // String: "550e8400-e29b-41d4-a716-446655440000" = 36 chars + 2 quotes = 38 bytes
    const stringSize = 38;
    
    // Binary: 1 (header) + 1 (version) + 16 (bytes) = 18 bytes
    const binarySize = 18;
    
    const savings = ((stringSize - binarySize) / stringSize) * 100;
    
    return { stringSize, binarySize, savings };
}

/**
 * Example usage demonstration
 */
export function demonstrateUUID() {
    console.log('=== UUID Performance ===');
    
    // Generate UUID
    const uuid = generateUUIDv4();
    const uuidString = formatUUID(uuid.bytes);
    
    console.log(`Generated UUID: ${uuidString}`);
    console.log(`Version:        ${uuid.version}`);
    
    // Size comparison
    const writer = new Writer();
    encodeUUID(uuid, writer);
    const beveSize = writer.offset;
    const stringSize = JSON.stringify(uuidString).length;
    
    console.log(`\nSize comparison:`);
    console.log(`  String:      ${stringSize} bytes`);
    console.log(`  BEVE Binary: ${beveSize} bytes`);
    console.log(`  Savings:     ${((1 - beveSize / stringSize) * 100).toFixed(1)}%`);
    
    // Round-trip test
    const cursor = { value: 0 };
    const decoded = decodeUUID(writer.buffer, cursor);
    const decodedString = formatUUID(decoded.bytes);
    
    console.log(`\nRound-trip test:`);
    console.log(`  Original: ${uuidString}`);
    console.log(`  Decoded:  ${decodedString}`);
    console.log(`  Match:    ${uuidString === decodedString}`);
    
    // Performance comparison
    const iterations = 10000;
    
    // String encoding
    const stringStart = performance.now();
    for (let i = 0; i < iterations; i++) {
        JSON.stringify(uuidString);
    }
    const stringTime = performance.now() - stringStart;
    
    // Binary encoding
    const binaryStart = performance.now();
    for (let i = 0; i < iterations; i++) {
        const w = new Writer();
        encodeUUID(uuid, w);
    }
    const binaryTime = performance.now() - binaryStart;
    
    console.log(`\nPerformance (${iterations} iterations):`);
    console.log(`  String encoding: ${stringTime.toFixed(2)}ms`);
    console.log(`  Binary encoding: ${binaryTime.toFixed(2)}ms`);
    console.log(`  Speedup:         ${(stringTime / binaryTime).toFixed(1)}×`);
}

/**
 * Batch UUID operations
 */
export function encodeUUIDBatch(uuids: string[], writer: Writer): void {
    writer.append_uint32(uuids.length); // Write count
    
    for (const uuidString of uuids) {
        encodeUUIDString(uuidString, writer);
    }
}

/**
 * Decode batch of UUIDs
 */
export function decodeUUIDBatch(buffer: Uint8Array, cursor: { value: number }): string[] {
    // Read count (assuming it was written as uint32)
    const count = buffer[cursor.value] |
                 (buffer[cursor.value + 1] << 8) |
                 (buffer[cursor.value + 2] << 16) |
                 (buffer[cursor.value + 3] << 24);
    cursor.value += 4;
    
    const uuids: string[] = [];
    
    for (let i = 0; i < count; i++) {
        // Skip extension header
        cursor.value++; // header
        uuids.push(decodeUUIDString(buffer, cursor));
    }
    
    return uuids;
}

/**
 * Create UUID namespace for v5 (for future implementation)
 */
export const UUID_NAMESPACE_DNS = parseUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
export const UUID_NAMESPACE_URL = parseUUID('6ba7b811-9dad-11d1-80b4-00c04fd430c8');
export const UUID_NAMESPACE_OID = parseUUID('6ba7b812-9dad-11d1-80b4-00c04fd430c8');
export const UUID_NAMESPACE_X500 = parseUUID('6ba7b814-9dad-11d1-80b4-00c04fd430c8');
