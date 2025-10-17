/**
 * BEVE Extension System Types and Constants
 * Based on BEVE Specification v1.0 §6 (Extensions)
 * 
 * Extensions provide specialized data types and optimizations while maintaining
 * backward compatibility with standard BEVE parsers.
 */

// ============================================================================
// Extension IDs (Specification §6)
// ============================================================================

export const enum ExtensionID {
    /** Extension 0: Field Index - O(1) field access in objects */
    FIELD_INDEX = 0,
    
    /** Extension 1: Typed Object Array - 48% size reduction for struct arrays */
    TYPED_ARRAY = 1,
    
    /** Extension 2: Typed Nested Array - Exponential gains for nested structures */
    TYPED_NESTED_ARRAY = 2,
    
    /** Extension 3: Complex Numbers - Pairs of numerical types */
    COMPLEX_NUMBERS = 3,
    
    /** Extension 4: Timestamp - Nanosecond precision with timezone */
    TIMESTAMP = 4,
    
    /** Extension 5: Duration - High-precision time intervals */
    DURATION = 5,
    
    /** Extension 6: Interval - Start/end time pairs */
    INTERVAL = 6,
    
    /** Extension 7: Reserved for future use */
    RESERVED_7 = 7,
    
    /** Extension 8: UUID - Binary UUID encoding (50% smaller) */
    UUID = 8,
    
    /** Extension 9: RegExp - Regular expressions with flags */
    REGEXP = 9,
}

// ============================================================================
// Extension Headers
// ============================================================================

/**
 * Extension header format:
 * Bits 0-2: Type (0b110 = extension)
 * Bits 3-7: Extension ID (0-31)
 */
export function createExtensionHeader(extId: ExtensionID): number {
    return 0b00000110 | (extId << 3);
}

export function parseExtensionHeader(header: number): { isExtension: boolean; extId: ExtensionID } {
    const type = header & 0b00000111;
    const isExtension = type === 0b110;
    const extId = (header & 0b11111000) >> 3;
    
    return { isExtension, extId };
}

// ============================================================================
// Extension Type Definitions
// ============================================================================

/**
 * Timestamp with nanosecond precision and optional timezone
 * Extension 4 format (14-16 bytes):
 * - 1 byte: precision flags
 * - 8 bytes: seconds (int64, little-endian)
 * - 4 bytes: nanoseconds (uint32, little-endian)
 * - 2 bytes: timezone offset in minutes (optional, int16)
 */
export interface BeveTimestamp {
    /** Seconds since Unix epoch */
    seconds: number | bigint;
    /** Nanoseconds (0-999,999,999) */
    nanoseconds: number;
    /** Timezone offset in minutes from UTC (null = UTC) */
    timezoneOffset?: number | null;
}

/**
 * Duration with nanosecond precision
 * Extension 5 format (14 bytes):
 * - 1 byte: header
 * - 8 bytes: seconds (int64, little-endian)
 * - 4 bytes: nanoseconds (uint32, little-endian)
 */
export interface BeveDuration {
    /** Seconds component */
    seconds: number | bigint;
    /** Nanoseconds component (0-999,999,999) */
    nanoseconds: number;
}

/**
 * Time interval (start + end timestamps)
 * Extension 6 format (29 bytes):
 * - 1 byte: header
 * - 14 bytes: start timestamp
 * - 14 bytes: end timestamp
 */
export interface BeveInterval {
    /** Start time */
    start: BeveTimestamp;
    /** End time */
    end: BeveTimestamp;
}

/**
 * UUID in binary format
 * Extension 8 format (18 bytes):
 * - 1 byte: header
 * - 1 byte: version (1-5)
 * - 16 bytes: UUID binary data
 */
export interface BeveUUID {
    /** UUID version (1-5) */
    version: number;
    /** UUID as 16 bytes */
    bytes: Uint8Array;
}

/**
 * Regular expression with flags
 * Extension 9 format (variable):
 * - 1 byte: header
 * - 1 byte: flags
 * - N bytes: pattern (UTF-8 string with size prefix)
 */
export interface BeveRegExp {
    /** Pattern string */
    pattern: string;
    /** Flags byte (case-insensitive, multiline, dotall, etc.) */
    flags: number;
}

// ============================================================================
// RegExp Flags (Extension 9)
// ============================================================================

export const enum RegExpFlags {
    NONE = 0x00,
    CASE_INSENSITIVE = 0x01,  // (?i) - /i
    MULTILINE = 0x02,         // (?m) - /m
    DOT_ALL = 0x04,           // (?s) - /s
    UNICODE = 0x08,           // Unicode mode
    GLOBAL = 0x10,            // /g - global search
}

// ============================================================================
// Typed Array Schema
// ============================================================================

/**
 * Schema for typed object arrays (Extension 1)
 * Stores field names once, then only values for each object
 */
export interface TypedArraySchema {
    /** Field names in order */
    fields: string[];
    /** Number of objects */
    count: number;
}

// ============================================================================
// Encoding Options
// ============================================================================

export interface EncodeOptions {
    /** Use typed schema for arrays of objects (Extension 1) */
    useTypedSchema?: boolean;
    
    /** Use field index for large objects (Extension 0) */
    useFieldIndex?: boolean;
    
    /** Minimum array size to use typed schema (default: 5) */
    minArraySize?: number;
    
    /** Auto-detect best encoding format */
    autoDetect?: boolean;
    
    /** Include fallback for backward compatibility */
    includeFallback?: boolean;
}

export const DEFAULT_ENCODE_OPTIONS: EncodeOptions = {
    useTypedSchema: false,
    useFieldIndex: false,
    minArraySize: 5,
    autoDetect: true,
    includeFallback: false,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if data is an array of objects with the same schema
 */
export function isTypedObjectArray(data: any): boolean {
    if (!Array.isArray(data) || data.length === 0) {
        return false;
    }
    
    // Check if all elements are objects
    if (!data.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
        return false;
    }
    
    // Get keys from first object
    const firstKeys = Object.keys(data[0]).sort();
    
    // Check if all objects have the same keys
    return data.every(obj => {
        const keys = Object.keys(obj).sort();
        return keys.length === firstKeys.length &&
               keys.every((key, i) => key === firstKeys[i]);
    });
}

/**
 * Detect if byte array contains extension header
 */
export function detectExtension(buffer: Uint8Array): { hasExtension: boolean; extId?: ExtensionID } {
    if (buffer.length === 0) {
        return { hasExtension: false };
    }
    
    const header = buffer[0];
    const { isExtension, extId } = parseExtensionHeader(header);
    
    return {
        hasExtension: isExtension,
        extId: isExtension ? extId : undefined,
    };
}

/**
 * Convert JavaScript Date to BeveTimestamp
 */
export function dateToTimestamp(date: Date): BeveTimestamp {
    const ms = date.getTime();
    const seconds = Math.floor(ms / 1000);
    const nanoseconds = (ms % 1000) * 1_000_000;
    
    return {
        seconds,
        nanoseconds,
        timezoneOffset: null, // UTC by default
    };
}

/**
 * Convert BeveTimestamp to JavaScript Date
 */
export function timestampToDate(ts: BeveTimestamp): Date {
    const seconds = typeof ts.seconds === 'bigint' ? Number(ts.seconds) : ts.seconds;
    const ms = seconds * 1000 + Math.floor(ts.nanoseconds / 1_000_000);
    return new Date(ms);
}

/**
 * Parse UUID string to bytes
 * Format: "550e8400-e29b-41d4-a716-446655440000"
 */
export function parseUUID(uuid: string): Uint8Array {
    const hex = uuid.replace(/-/g, '');
    if (hex.length !== 32) {
        throw new Error(`Invalid UUID format: ${uuid}`);
    }
    
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    
    return bytes;
}

/**
 * Format UUID bytes to string
 */
export function formatUUID(bytes: Uint8Array): string {
    if (bytes.length !== 16) {
        throw new Error(`Invalid UUID length: ${bytes.length}`);
    }
    
    const hex = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    return `${hex.substr(0, 8)}-${hex.substr(8, 4)}-${hex.substr(12, 4)}-${hex.substr(16, 4)}-${hex.substr(20, 12)}`;
}

/**
 * Extract UUID version from bytes (RFC 4122)
 */
export function getUUIDVersion(bytes: Uint8Array): number {
    if (bytes.length !== 16) {
        throw new Error(`Invalid UUID length: ${bytes.length}`);
    }
    
    // Version is in bits 12-15 of time_hi_and_version (byte 6)
    return (bytes[6] & 0xf0) >> 4;
}

/**
 * Calculate savings from typed encoding
 */
export function calculateSavings(standardSize: number, typedSize: number): number {
    return ((standardSize - typedSize) / standardSize) * 100;
}
