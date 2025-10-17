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
            let header = 1 | 0b01100000; // float64_t
            writer.append_uint8(header);
            writer.append(value);
        } else if (Number.isInteger(value) && value >= -0x80000000 && value <= 0x7FFFFFFF) {
            // Integer value in int32 range
            let header = 1 | 0b01001000; // int32_t
            writer.append_uint8(header);
            writer.append(value);
        } else {
            // Float value or integer outside int32 range
            let header = 1 | 0b01100000; // float64_t
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