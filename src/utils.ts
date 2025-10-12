// Reference: https://github.com/stephenberry/beve

// Common utility functions for Beve format
export const config = [1, 2, 4, 8];

export function read_compressed(buffer: Uint8Array, cursor: { value: number }): number {
    if (cursor.value >= buffer.length) {
        throw new Error('Buffer overflow: trying to read compressed value beyond buffer end');
    }

    const header = buffer[cursor.value++];
    const type = header & 0b00000011;

    switch (type) {
        case 0:
            return header >> 2;
        case 1:
            {
                if (cursor.value + 1 > buffer.length) {
                    throw new Error('Buffer overflow: not enough data for compressed value type 1');
                }
                // Read the header byte we already consumed + next byte
                const byte0 = header;
                const byte1 = buffer[cursor.value];
                cursor.value += 1;
                const value = ((byte0 | (byte1 << 8)) >>> 2) & 0x3FFF; // 14 bits
                return value;
            }
        case 2:
            {
                if (cursor.value + 3 > buffer.length) {
                    throw new Error('Buffer overflow: not enough data for compressed value type 2');
                }
                // Read 4 bytes total (header + 3 more)
                const byte0 = header;
                const byte1 = buffer[cursor.value];
                const byte2 = buffer[cursor.value + 1];
                const byte3 = buffer[cursor.value + 2];
                cursor.value += 3;
                const value = ((byte0 | (byte1 << 8) | (byte2 << 16) | (byte3 << 24)) >>> 2) & 0x3FFFFFFF; // 30 bits
                return value;
            }
        case 3:
            {
                if (cursor.value + 7 > buffer.length) {
                    throw new Error('Buffer overflow: not enough data for compressed value type 3');
                }
                // Read 8 bytes total (header already consumed + 7 more)
                const start = cursor.value - 1; // Include the header we already read
                const view = new DataView(buffer.buffer, buffer.byteOffset + start, 8);
                const bigValue = view.getBigUint64(0, true); // little-endian
                const n = bigValue >> 2n;
                cursor.value += 7; // Advance by remaining 7 bytes
                return Number(n);
            }
        default:
            throw new Error('Invalid compressed value type');
    }
}

export function writeCompressed(writer: any, N: number) {
    if (N < 64) {
        const compressed = (N << 2) | 0;
        writer.append_uint8(compressed);
    } else if (N < 16384) {
        const compressed = (N << 2) | 1;
        writer.append_uint16(compressed);
    } else if (N < 1073741824) {
        const compressed = (N << 2) | 2;
        writer.append_uint32(compressed);
    } else if (N < 4611686018427387904) {
        // Use BigInt for large numbers to avoid JavaScript bit shift limitations
        const bigN = BigInt(N);
        const compressed = (bigN << 2n) | 3n;
        // Write as 64-bit unsigned integer (little-endian)
        writer.ensureCapacity(8);
        const view = new DataView(writer.buffer.buffer);
        view.setBigUint64(writer.offset, compressed, true); // little-endian
        writer.offset += 8;
    }
}

// Helper functions for reading primitive types
export function readInt8(buffer: Uint8Array, cursor: { value: number }): number {
    if (cursor.value + 1 > buffer.length) {
        throw new Error('Buffer overflow: not enough data for int8');
    }
    const value = buffer[cursor.value];
    cursor.value += 1;
    return value < 128 ? value : value - 256;
}

export function readInt16(buffer: Uint8Array, cursor: { value: number }): number {
    if (cursor.value + 2 > buffer.length) {
        throw new Error('Buffer overflow: not enough data for int16');
    }
    const view = new DataView(buffer.buffer, cursor.value, 2);
    const value = view.getInt16(0, true);
    cursor.value += 2;
    return value;
}

export function readInt32(buffer: Uint8Array, cursor: { value: number }): number {
    if (cursor.value + 4 > buffer.length) {
        throw new Error('Buffer overflow: not enough data for int32');
    }
    const view = new DataView(buffer.buffer, cursor.value, 4);
    const value = view.getInt32(0, true);
    cursor.value += 4;
    return value;
}

export function readBigInt64(buffer: Uint8Array, cursor: { value: number }): bigint {
    if (cursor.value + 8 > buffer.length) {
        throw new Error('Buffer overflow: not enough data for int64');
    }
    const view = new DataView(buffer.buffer, cursor.value, 8);
    const value = view.getBigInt64(0, true);
    cursor.value += 8;
    return value;
}

export function readUInt8(buffer: Uint8Array, cursor: { value: number }): number {
    if (cursor.value + 1 > buffer.length) {
        throw new Error('Buffer overflow: not enough data for uint8');
    }
    const value = buffer[cursor.value];
    cursor.value += 1;
    return value;
}

export function readUInt16(buffer: Uint8Array, cursor: { value: number }): number {
    if (cursor.value + 2 > buffer.length) {
        throw new Error('Buffer overflow: not enough data for uint16');
    }
    const view = new DataView(buffer.buffer, cursor.value, 2);
    const value = view.getUint16(0, true);
    cursor.value += 2;
    return value;
}

export function readUInt32(buffer: Uint8Array, cursor: { value: number }): number {
    if (cursor.value + 4 > buffer.length) {
        throw new Error('Buffer overflow: not enough data for uint32');
    }
    const view = new DataView(buffer.buffer, cursor.value, 4);
    const value = view.getUint32(0, true);
    cursor.value += 4;
    return value;
}

export function readBigUInt64(buffer: Uint8Array, cursor: { value: number }): bigint {
    if (cursor.value + 8 > buffer.length) {
        throw new Error('Buffer overflow: not enough data for uint64');
    }
    const view = new DataView(buffer.buffer, cursor.value, 8);
    const value = view.getBigUint64(0, true);
    cursor.value += 8;
    return value;
}

export function readFloat(buffer: Uint8Array, cursor: { value: number }): number {
    if (cursor.value + 4 > buffer.length) {
        throw new Error('Buffer overflow: not enough data for float32');
    }
    const view = new DataView(buffer.buffer, cursor.value, 4);
    const value = view.getFloat32(0, true);
    cursor.value += 4;
    return value;
}

export function readDouble(buffer: Uint8Array, cursor: { value: number }): number {
    if (cursor.value + 8 > buffer.length) {
        throw new Error('Buffer overflow: not enough data for float64');
    }
    const view = new DataView(buffer.buffer, cursor.value, 8);
    const value = view.getFloat64(0, true);
    cursor.value += 8;
    return value;
}