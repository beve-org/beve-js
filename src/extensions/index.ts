/**
 * BEVE Extensions - Main Export
 * 
 * This module exports all BEVE extensions and provides high-level APIs
 * for automatic format selection and encoding/decoding.
 */

// Type definitions
export * from './types';

// Extension implementations
export * from './typed-array';
export * from './timestamp';
export * from './duration';
export * from './uuid';

// Re-export key functions for convenience
export {
    // Typed Arrays
    encodeTypedObjectArray,
    decodeTypedObjectArray,
    shouldUseTypedArray,
    calculateTypedArraySavings,
} from './typed-array';

export {
    // Timestamps
    encodeTimestamp,
    decodeTimestamp,
    encodeDateAsTimestamp,
    decodeTimestampAsDate,
    getCurrentTimestamp,
    formatTimestamp,
    parseTimestamp,
} from './timestamp';

export {
    // Durations
    encodeDuration,
    decodeDuration,
    encodeMilliseconds,
    durationToMilliseconds,
} from './duration';

export {
    // UUIDs
    encodeUUID,
    decodeUUID,
    encodeUUIDString,
    decodeUUIDString,
    generateUUIDv4,
    validateUUID,
    validateUUIDString,
} from './uuid';
