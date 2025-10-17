/**
 * BEVE Extension 4: Timestamp
 * 
 * Nanosecond-precision timestamps with optional timezone support.
 * 
 * Performance: 14-16 bytes (vs 24+ bytes for ISO 8601 string)
 * 
 * Format:
 * [0xA6]                  // Extension 4 header (0b110 | 4<<3 = 0x26, then 0x80 | 0x26 = 0xA6)
 * [precision: byte]       // Bits 1-3=precision, bit 0=has_tz
 * [seconds: int64]        // Little-endian epoch seconds
 * [nanos: uint32]         // Little-endian nanoseconds
 * [tz_offset: int16]      // Optional timezone (minutes from UTC)
 */

import { Writer } from '../writer';
import { ExtensionID, createExtensionHeader, BeveTimestamp, dateToTimestamp, timestampToDate } from './types';

// ============================================================================
// Encoder
// ============================================================================

/**
 * Encode timestamp with nanosecond precision (Extension 4)
 * 
 * @example
 * const ts = { seconds: 1697550000, nanoseconds: 123456789, timezoneOffset: -300 };
 * const bytes = encodeTimestamp(ts, writer);
 * 
 * // From JavaScript Date
 * const bytes = encodeDateAsTimestamp(new Date(), writer);
 */
export function encodeTimestamp(ts: BeveTimestamp, writer: Writer): void {
    // Write extension header
    const header = createExtensionHeader(ExtensionID.TIMESTAMP);
    writer.append_uint8(header);
    
    // Precision byte
    const hasTz = ts.timezoneOffset !== undefined && ts.timezoneOffset !== null;
    const precision = 0b001 << 1 | (hasTz ? 1 : 0); // Nanosecond precision (001), tz flag
    writer.append_uint8(precision);
    
    // Write seconds (int64, little-endian)
    const seconds = typeof ts.seconds === 'bigint' ? Number(ts.seconds) : ts.seconds;
    const secondsLow = seconds & 0xFFFFFFFF;
    const secondsHigh = Math.floor(seconds / 0x100000000);
    writer.append_uint32(secondsLow);
    writer.append_uint32(secondsHigh);
    
    // Write nanoseconds (uint32, little-endian)
    writer.append_uint32(ts.nanoseconds);
    
    // Write timezone offset if present
    if (hasTz) {
        // Write int16 manually (little-endian)
        const offset = ts.timezoneOffset!;
        writer.append_uint8(offset & 0xFF);
        writer.append_uint8((offset >> 8) & 0xFF);
    }
}

/**
 * Encode JavaScript Date as BEVE timestamp
 */
export function encodeDateAsTimestamp(date: Date, writer: Writer): void {
    const ts = dateToTimestamp(date);
    encodeTimestamp(ts, writer);
}

/**
 * Create timestamp from current time
 */
export function encodeNow(writer: Writer): void {
    encodeDateAsTimestamp(new Date(), writer);
}

// ============================================================================
// Decoder
// ============================================================================

/**
 * Decode timestamp (Extension 4)
 * 
 * @param buffer - BEVE binary data
 * @param cursor - Current position in buffer (will be updated)
 * @returns Decoded timestamp
 */
export function decodeTimestamp(buffer: Uint8Array, cursor: { value: number }): BeveTimestamp {
    // Header already consumed by caller
    
    // Read precision byte
    const precision = buffer[cursor.value++];
    const hasTz = (precision & 0b1) === 1;
    
    // Read seconds (int64, little-endian)
    const seconds = buffer[cursor.value] |
                   (buffer[cursor.value + 1] << 8) |
                   (buffer[cursor.value + 2] << 16) |
                   (buffer[cursor.value + 3] << 24);
    cursor.value += 8;
    
    // Read nanoseconds (uint32, little-endian)
    const nanoseconds = buffer[cursor.value] |
                       (buffer[cursor.value + 1] << 8) |
                       (buffer[cursor.value + 2] << 16) |
                       (buffer[cursor.value + 3] << 24);
    cursor.value += 4;
    
    // Read timezone offset if present
    let timezoneOffset: number | null = null;
    if (hasTz) {
        const low = buffer[cursor.value];
        const high = buffer[cursor.value + 1];
        timezoneOffset = (high << 8) | low;
        // Handle sign extension for negative values
        if (timezoneOffset & 0x8000) {
            timezoneOffset |= 0xFFFF0000;
        }
        cursor.value += 2;
    }
    
    return {
        seconds,
        nanoseconds,
        timezoneOffset,
    };
}

/**
 * Decode timestamp as JavaScript Date
 */
export function decodeTimestampAsDate(buffer: Uint8Array, cursor: { value: number }): Date {
    const ts = decodeTimestamp(buffer, cursor);
    return timestampToDate(ts);
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get current timestamp
 */
export function getCurrentTimestamp(): BeveTimestamp {
    return dateToTimestamp(new Date());
}

/**
 * Compare two timestamps
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareTimestamps(a: BeveTimestamp, b: BeveTimestamp): number {
    const aSeconds = typeof a.seconds === 'bigint' ? Number(a.seconds) : a.seconds;
    const bSeconds = typeof b.seconds === 'bigint' ? Number(b.seconds) : b.seconds;
    
    if (aSeconds < bSeconds) return -1;
    if (aSeconds > bSeconds) return 1;
    
    if (a.nanoseconds < b.nanoseconds) return -1;
    if (a.nanoseconds > b.nanoseconds) return 1;
    
    return 0;
}

/**
 * Add duration to timestamp
 */
export function addToTimestamp(ts: BeveTimestamp, seconds: number, nanoseconds: number): BeveTimestamp {
    const tsSeconds = typeof ts.seconds === 'bigint' ? Number(ts.seconds) : ts.seconds;
    
    let newNanos = ts.nanoseconds + nanoseconds;
    let carrySeconds = Math.floor(newNanos / 1_000_000_000);
    newNanos = newNanos % 1_000_000_000;
    
    return {
        seconds: tsSeconds + seconds + carrySeconds,
        nanoseconds: newNanos,
        timezoneOffset: ts.timezoneOffset,
    };
}

/**
 * Format timestamp as ISO 8601 string
 */
export function formatTimestamp(ts: BeveTimestamp): string {
    const date = timestampToDate(ts);
    let isoString = date.toISOString();
    
    // Add timezone if present
    if (ts.timezoneOffset !== null && ts.timezoneOffset !== undefined) {
        const offsetMinutes = ts.timezoneOffset;
        const sign = offsetMinutes >= 0 ? '+' : '-';
        const absMinutes = Math.abs(offsetMinutes);
        const hours = Math.floor(absMinutes / 60);
        const minutes = absMinutes % 60;
        isoString = isoString.replace('Z', `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }
    
    return isoString;
}

/**
 * Parse ISO 8601 string to timestamp
 */
export function parseTimestamp(isoString: string): BeveTimestamp {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid ISO 8601 string: ${isoString}`);
    }
    
    const ts = dateToTimestamp(date);
    
    // Extract timezone offset from string if present
    const tzMatch = isoString.match(/([+-])(\d{2}):(\d{2})$/);
    if (tzMatch) {
        const sign = tzMatch[1] === '+' ? 1 : -1;
        const hours = parseInt(tzMatch[2], 10);
        const minutes = parseInt(tzMatch[3], 10);
        ts.timezoneOffset = sign * (hours * 60 + minutes);
    }
    
    return ts;
}

/**
 * Validate timestamp
 */
export function validateTimestamp(ts: BeveTimestamp): boolean {
    if (typeof ts.seconds !== 'number' && typeof ts.seconds !== 'bigint') {
        return false;
    }
    
    if (typeof ts.nanoseconds !== 'number' || ts.nanoseconds < 0 || ts.nanoseconds >= 1_000_000_000) {
        return false;
    }
    
    if (ts.timezoneOffset !== null && ts.timezoneOffset !== undefined) {
        if (typeof ts.timezoneOffset !== 'number' || ts.timezoneOffset < -12 * 60 || ts.timezoneOffset > 14 * 60) {
            return false;
        }
    }
    
    return true;
}

/**
 * Example usage demonstration
 */
export function demonstrateTimestamp() {
    console.log('=== Timestamp Performance ===');
    
    // Current time
    const now = new Date();
    const ts = dateToTimestamp(now);
    
    console.log(`JavaScript Date: ${now.toISOString()}`);
    console.log(`BEVE Timestamp:  ${JSON.stringify(ts)}`);
    console.log(`Formatted:       ${formatTimestamp(ts)}`);
    
    // Size comparison
    const writer = new Writer();
    encodeTimestamp(ts, writer);
    const beveSize = writer.offset;
    const jsonSize = JSON.stringify(now.toISOString()).length;
    
    console.log(`\nSize comparison:`);
    console.log(`  JSON (ISO 8601): ${jsonSize} bytes`);
    console.log(`  BEVE Timestamp:  ${beveSize} bytes`);
    console.log(`  Savings:         ${((1 - beveSize / jsonSize) * 100).toFixed(1)}%`);
    
    // Round-trip test
    const cursor = { value: 0 };
    const decoded = decodeTimestamp(writer.buffer, cursor);
    const decodedDate = timestampToDate(decoded);
    
    console.log(`\nRound-trip test:`);
    console.log(`  Original:  ${now.toISOString()}`);
    console.log(`  Decoded:   ${decodedDate.toISOString()}`);
    console.log(`  Match:     ${now.getTime() === decodedDate.getTime()}`);
}
