/**
 * BEVE Extension 5: Duration
 * 
 * High-precision time intervals with nanosecond accuracy.
 * 
 * Performance: 14 bytes (vs 20+ bytes for ISO 8601 duration)
 * 
 * Format:
 * [0xAE]                  // Extension 5 header (0b110 | 5<<3 = 0x2E, then 0x80 | 0x2E = 0xAE)
 * [seconds: int64]        // Little-endian seconds
 * [nanos: uint32]         // Little-endian nanoseconds
 */

import { Writer } from '../writer';
import { ExtensionID, createExtensionHeader, BeveDuration } from './types';

// ============================================================================
// Encoder
// ============================================================================

export function encodeDuration(duration: BeveDuration, writer: Writer): void {
    const header = createExtensionHeader(ExtensionID.DURATION);
    writer.append_uint8(header);
    
    // Write seconds (int64)
    const seconds = typeof duration.seconds === 'bigint' ? Number(duration.seconds) : duration.seconds;
    const secondsLow = seconds & 0xFFFFFFFF;
    const secondsHigh = Math.floor(seconds / 0x100000000);
    writer.append_uint32(secondsLow);
    writer.append_uint32(secondsHigh);
    
    // Write nanoseconds (uint32)
    writer.append_uint32(duration.nanoseconds);
}

export function encodeMilliseconds(ms: number, writer: Writer): void {
    const seconds = Math.floor(ms / 1000);
    const nanoseconds = (ms % 1000) * 1_000_000;
    encodeDuration({ seconds, nanoseconds }, writer);
}

// ============================================================================
// Decoder
// ============================================================================

export function decodeDuration(buffer: Uint8Array, cursor: { value: number }): BeveDuration {
    // Read seconds (int64)
    const secondsLow = buffer[cursor.value] |
                      (buffer[cursor.value + 1] << 8) |
                      (buffer[cursor.value + 2] << 16) |
                      (buffer[cursor.value + 3] << 24);
    const secondsHigh = buffer[cursor.value + 4] |
                       (buffer[cursor.value + 5] << 8) |
                       (buffer[cursor.value + 6] << 16) |
                       (buffer[cursor.value + 7] << 24);
    cursor.value += 8;
    
    const seconds = secondsLow + secondsHigh * 0x100000000;
    
    // Read nanoseconds (uint32)
    const nanoseconds = buffer[cursor.value] |
                       (buffer[cursor.value + 1] << 8) |
                       (buffer[cursor.value + 2] << 16) |
                       (buffer[cursor.value + 3] << 24);
    cursor.value += 4;
    
    return { seconds, nanoseconds };
}

export function durationToMilliseconds(duration: BeveDuration): number {
    const seconds = typeof duration.seconds === 'bigint' ? Number(duration.seconds) : duration.seconds;
    return seconds * 1000 + Math.floor(duration.nanoseconds / 1_000_000);
}
