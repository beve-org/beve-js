// Reference: https://github.com/stephenberry/beve

import { Writer } from './writer';
import { writeCompressed } from './utils';

// Writing BEVE
export function writeBeve(data: any): Uint8Array {
    const writer = new Writer();
    write_value(writer, data);
    return writer.buffer.slice(0, writer.offset);
}

function write_value(writer: Writer, value: any) {
    // Handle undefined as null
    if (value === undefined) {
        value = null;
    }
    
    // Check for Uint8Array BEFORE Array.isArray (because Uint8Array is array-like but should be binary)
    if (value instanceof Uint8Array) {
        // binary data
        let header: number = 6;
        writer.append_uint8(header);
        writeCompressed(writer, value.length);
        writer.ensureCapacity(value.length);
        writer.buffer.set(value, writer.offset);
        writer.offset += value.length;
        return;
    }
    
    if (Array.isArray(value)) {
        // Check if it's a typed array (all elements same type)
        if (value.length > 0) {
            const firstType = typeof value[0];
            const isTypedArray = value.every(item => typeof item === firstType);

            if (isTypedArray && value.length > 1) {
                if (firstType === 'number') {
                    // Check if all numbers are integers
                    const allIntegers = value.every((v: number) => Number.isInteger(v));
                    
                    if (allIntegers) {
                        // Integer typed array - use untyped array for simplicity
                        let header = 5;
                        writer.append_uint8(header);
                        writeCompressed(writer, value.length);
                        for (let i = 0; i < value.length; i++) {
                            write_value(writer, value[i]);
                        }
                    } else {
                        // Float array - use untyped array
                        let header = 5;
                        writer.append_uint8(header);
                        writeCompressed(writer, value.length);
                        for (let i = 0; i < value.length; i++) {
                            write_value(writer, value[i]);
                        }
                    }
                } else if (firstType === 'string') {
                    // String array - encode as untyped array
                    let header = 5;
                    writer.append_uint8(header);
                    writeCompressed(writer, value.length);
                    for (let i = 0; i < value.length; i++) {
                        write_value(writer, value[i]);
                    }
                } else {
                    // Other types (booleans, etc.) - encode as mixed array
                    let header = 5;
                    writer.append_uint8(header);
                    writeCompressed(writer, value.length);
                    for (let i = 0; i < value.length; i++) {
                        write_value(writer, value[i]);
                    }
                }
            } else {
                // Empty array or mixed types
                let header = 5;
                writer.append_uint8(header);
                writeCompressed(writer, value.length);
                for (let i = 0; i < value.length; i++) {
                    write_value(writer, value[i]);
                }
            }
        } else {
            // Empty array
            let header = 5;
            writer.append_uint8(header);
            writeCompressed(writer, 0);
        }
    } else if (value === null) {
        let header: number = 0;
        header |= 0b00000000;
        writer.append_uint8(header);
    } else if (typeof value === 'boolean') {
        let header: number = 0;
        if (value) {
            header |= 0b00011000;
        } else {
            header |= 0b00001000;
        }
        writer.append_uint8(header);
    } else if (typeof value === 'number') {
        // Check for special values
        if (!Number.isFinite(value)) {
            // Handle Infinity, -Infinity, NaN
            let header = 1 | (0b00 << 3) | (3 << 5); // TYPE_NUMBER | FLOAT | 8 bytes
            writer.append_uint8(header);
            writer.append(value);
        } else if (Number.isInteger(value)) {
            // Integer - pick signed vs unsigned based on sign
            if (value < 0) {
                // Negative = Signed integer (NUM_TYPE = 0b01)
                if (value >= -0x80) {
                    let header = 1 | (0b01 << 3) | (0 << 5); // int8_t
                    writer.append_uint8(header);
                    writer.append_int8(value);
                } else if (value >= -0x8000) {
                    let header = 1 | (0b01 << 3) | (1 << 5); // int16_t
                    writer.append_uint8(header);
                    writer.append_int16(value);
                } else if (value >= -0x80000000) {
                    let header = 1 | (0b01 << 3) | (2 << 5); // int32_t
                    writer.append_uint8(header);
                    writer.append_int32(value);
                } else {
                    let header = 1 | (0b01 << 3) | (3 << 5); // int64_t
                    writer.append_uint8(header);
                    writer.append_int64(BigInt(value));
                }
            } else {
                // Non-negative = Unsigned integer (NUM_TYPE = 0b10)
                if (value <= 0xFF) {
                    let header = 1 | (0b10 << 3) | (0 << 5); // uint8_t
                    writer.append_uint8(header);
                    writer.append_uint8(value);
                } else if (value <= 0xFFFF) {
                    let header = 1 | (0b10 << 3) | (1 << 5); // uint16_t
                    writer.append_uint8(header);
                    writer.append_uint16(value);
                } else if (value <= 0xFFFFFFFF) {
                    let header = 1 | (0b10 << 3) | (2 << 5); // uint32_t
                    writer.append_uint8(header);
                    writer.append_uint32(value);
                } else {
                    let header = 1 | (0b10 << 3) | (3 << 5); // uint64_t
                    writer.append_uint8(header);
                    writer.append_uint64(value);
                }
            }
        } else {
            // Float value
            let header = 1 | (0b00 << 3) | (3 << 5); // float64_t
            writer.append_uint8(header);
            writer.append(value);
        }
    } else if (typeof value === 'string') {
        let header: number = 2;
        writer.append_uint8(header);
        // Use byte length, not character length for UTF-8
        const encoder = new TextEncoder();
        const bytes = encoder.encode(value);
        writeCompressed(writer, bytes.length);
        writer.append(value);
    } else if (Array.isArray(value)) {
        let header: number = 5;
        writer.append_uint8(header);
        writeCompressed(writer, value.length);
        for (let i = 0; i < value.length; i++) {
            write_value(writer, value[i]);
        }
    } else if (typeof value === 'object' && value !== null) {
        let header: number = 3;
        let keyType = 0; // Assuming keys are always strings
        let isSigned = 0; // 0 for false, 1 for true
        header |= keyType << 3;
        header |= isSigned << 5;
        writer.append_uint8(header);
        
        // Filter out undefined values
        const keys = Object.keys(value).filter(key => value[key] !== undefined);
        writeCompressed(writer, keys.length);
        
        for (const key of keys) {
            writeCompressed(writer, key.length);
            writer.append(key);
            write_value(writer, value[key]);
        }
    } else {
        throw new Error('Unsupported data type');
    }
}

// Export write_value for extension use
export function write_value_internal(writer: Writer, value: any) {
    write_value(writer, value);
}

// ============================================================================
// Extension-Enhanced Encoding
// ============================================================================

import { 
    EncodeOptions, 
    DEFAULT_ENCODE_OPTIONS, 
    shouldUseTypedArray,
    encodeTypedObjectArray 
} from './extensions';

/**
 * Encode with automatic format selection (Extension-aware)
 * 
 * @param data - Data to encode
 * @param options - Encoding options
 * @returns BEVE binary data
 * 
 * @example
 * const users = [
 *   { name: "Alice", age: 30 },
 *   { name: "Bob", age: 25 }
 * ];
 * 
 * // Auto-detect: uses typed array if N >= 5
 * const bytes = encodeAuto(users);
 */
export function encodeAuto(data: any, options: EncodeOptions = {}): Uint8Array {
    const opts = { ...DEFAULT_ENCODE_OPTIONS, ...options };
    const writer = new Writer();
    
    // Check if data should use typed array encoding
    if (opts.autoDetect && Array.isArray(data) && shouldUseTypedArray(data, opts.minArraySize)) {
        encodeTypedObjectArray(data, writer);
    } else if (opts.useTypedSchema && Array.isArray(data) && shouldUseTypedArray(data, 1)) {
        encodeTypedObjectArray(data, writer);
    } else {
        write_value(writer, data);
    }
    
    return writer.buffer.slice(0, writer.offset);
}

/**
 * Encode with typed schema (Extension 1)
 * Forces use of typed object array encoding
 * 
 * @param data - Array of objects with same schema
 * @returns BEVE binary data with Extension 1
 */
export function encodeTyped(data: any[]): Uint8Array {
    return encodeAuto(data, { useTypedSchema: true, minArraySize: 1 });
}