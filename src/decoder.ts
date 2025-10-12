// Reference: https://github.com/stephenberry/beve

import {
    config,
    read_compressed,
    readInt8,
    readInt16,
    readInt32,
    readBigInt64,
    readUInt8,
    readUInt16,
    readUInt32,
    readBigUInt64,
    readFloat,
    readDouble
} from './utils';

// Reading BEVE
export function readBeve(buffer: Uint8Array): any {
    if (!buffer || !(buffer instanceof Uint8Array)) {
        throw new Error('Invalid buffer provided.');
    }

    let cursor = { value: 0 };

    function read_value(): any {
        if (cursor.value >= buffer.length) {
            throw new Error(`Buffer overflow: cursor at ${cursor.value}, buffer length ${buffer.length}`);
        }

        const header = buffer[cursor.value++];
        const type = header & 0b00000111;

        switch (type) {
            case 0: // null or boolean
                {
                    const is_bool = (header & 0b00001000) >> 3;
                    if (is_bool) {
                        return Boolean((header & 0b11110000) >> 4);
                    } else {
                        return null;
                    }
                }
            case 1: // number
                {
                    const num_type = (header & 0b00011000) >> 3;
                    const is_float = num_type === 0;
                    const is_signed = num_type === 1;
                    const byte_count_index = (header & 0b11100000) >> 5;
                    const byte_count = config[byte_count_index];

                    if (is_float) {
                        switch (byte_count) {
                            case 4:
                                return readFloat(buffer, cursor);
                            case 8:
                                return readDouble(buffer, cursor);
                        }
                    } else {
                        if (is_signed) {
                            switch (byte_count) {
                                case 1:
                                    return readInt8(buffer, cursor);
                                case 2:
                                    return readInt16(buffer, cursor);
                                case 4:
                                    return readInt32(buffer, cursor);
                                case 8:
                                    return readBigInt64(buffer, cursor);
                            }
                        } else {
                            switch (byte_count) {
                                case 1:
                                    return readUInt8(buffer, cursor);
                                case 2:
                                    return readUInt16(buffer, cursor);
                                case 4:
                                    return readUInt32(buffer, cursor);
                                case 8:
                                    return readBigUInt64(buffer, cursor);
                            }
                        }
                    }
                    break;
                }
            case 2: // string
                {
                    const size = read_compressed(buffer, cursor);
                    if (cursor.value + size > buffer.length) {
                        throw new Error(`Buffer overflow: string size ${size} at cursor ${cursor.value}, buffer length ${buffer.length}`);
                    }
                    const str = new TextDecoder().decode(buffer.subarray(cursor.value, cursor.value + size));
                    cursor.value += size;
                    return str;
                }
            case 3: // object
                {
                    const key_type = (header & 0b00011000) >> 3;
                    const is_string = key_type === 0;
                    // const is_signed = key_type === 1; // Reserved for future use
                    // const byte_count_index = (header & 0b11100000) >> 5; // Reserved for future use
                    // const byte_count = config[byte_count_index]; // Reserved for future use
                    const N = read_compressed(buffer, cursor);
                    const objectData: any = {};

                    for (let i = 0; i < N; ++i) {
                        if (is_string) {
                            const size = read_compressed(buffer, cursor);
                            if (cursor.value + size > buffer.length) {
                                throw new Error(`Buffer overflow: object key size ${size} at cursor ${cursor.value}, buffer length ${buffer.length}`);
                            }
                            const key = new TextDecoder().decode(buffer.subarray(cursor.value, cursor.value + size));
                            cursor.value += size;
                            objectData[key] = read_value();
                        } else {
                            throw new Error('TODO: support integer keys');
                        }
                    }

                    return objectData;
                }
            case 4: // typed array
                {
                    const num_type = (header & 0b00011000) >> 3;
                    const is_float = num_type === 0;
                    const is_signed = num_type === 1;
                    const byte_count_index_array = (header & 0b11100000) >> 5;
                    const byte_count_array = config[byte_count_index_array];

                    if (num_type === 3) {
                        const is_string = (header & 0b00100000) >> 5;
                        if (is_string) {
                            const N = read_compressed(buffer, cursor);
                            const array = new Array(N);
                            for (let i = 0; i < N; ++i) {
                                const size = read_compressed(buffer, cursor);
                                if (cursor.value + size > buffer.length) {
                                    throw new Error(`Buffer overflow: string array element ${i} size ${size} at cursor ${cursor.value}, buffer length ${buffer.length}`);
                                }
                                const str = new TextDecoder().decode(buffer.subarray(cursor.value, cursor.value + size));
                                cursor.value += size;
                                array[i] = str;
                            }
                            return array;
                        } else {
                            // Boolean array support
                            const N = read_compressed(buffer, cursor);
                            if (cursor.value + N > buffer.length) {
                                throw new Error(`Buffer overflow: boolean array size ${N} at cursor ${cursor.value}, buffer length ${buffer.length}`);
                            }
                            const array = new Array(N);
                            for (let i = 0; i < N; ++i) {
                                const value = buffer[cursor.value++];
                                array[i] = Boolean(value);
                            }
                            return array;
                        }
                    } else if (is_float) {
                        const N = read_compressed(buffer, cursor);
                        const array = new Array(N);
                        switch (byte_count_array) {
                            case 4:
                                for (let i = 0; i < N; ++i) {
                                    array[i] = readFloat(buffer, cursor);
                                }
                                break;
                            case 8:
                                for (let i = 0; i < N; ++i) {
                                    array[i] = readDouble(buffer, cursor);
                                }
                                break;
                        }
                        return array;
                    } else {
                        const N = read_compressed(buffer, cursor);
                        const array = new Array(N);

                        if (is_signed) {
                            switch (byte_count_array) {
                                case 1:
                                    for (let i = 0; i < N; ++i) {
                                        array[i] = readInt8(buffer, cursor);
                                    }
                                    break;
                                case 2:
                                    for (let i = 0; i < N; ++i) {
                                        array[i] = readInt16(buffer, cursor);
                                    }
                                    break;
                                case 4:
                                    for (let i = 0; i < N; ++i) {
                                        array[i] = readInt32(buffer, cursor);
                                    }
                                    break;
                                case 8:
                                    for (let i = 0; i < N; ++i) {
                                        array[i] = readBigInt64(buffer, cursor);
                                    }
                                    break;
                            }
                        } else {
                            switch (byte_count_array) {
                                case 1:
                                    for (let i = 0; i < N; ++i) {
                                        array[i] = readUInt8(buffer, cursor);
                                    }
                                    break;
                                case 2:
                                    for (let i = 0; i < N; ++i) {
                                        array[i] = readUInt16(buffer, cursor);
                                    }
                                    break;
                                case 4:
                                    for (let i = 0; i < N; ++i) {
                                        array[i] = readUInt32(buffer, cursor);
                                    }
                                    break;
                                case 8:
                                    for (let i = 0; i < N; ++i) {
                                        array[i] = readBigUInt64(buffer, cursor);
                                    }
                                    break;
                            }
                        }
                        return array;
                    }
                }
            case 5: // untyped array
                {
                    const N = read_compressed(buffer, cursor);
                    const unarray = new Array(N);

                    for (let i = 0; i < N; ++i) {
                        unarray[i] = read_value();
                    }

                    return unarray;
                }
            case 6: // binary data
                {
                    const size = read_compressed(buffer, cursor);
                    if (cursor.value + size > buffer.length) {
                        throw new Error(`Buffer overflow: binary data size ${size} at cursor ${cursor.value}, buffer length ${buffer.length}`);
                    }
                    const data = buffer.subarray(cursor.value, cursor.value + size);
                    cursor.value += size;
                    return data;
                }
            default:
                throw new Error(`Unknown type: ${type}`);
        }
    }

    return read_value();
}