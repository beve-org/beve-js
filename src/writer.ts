// Reference: https://github.com/stephenberry/beve

export class Writer {
    buffer: Uint8Array;
    offset: number;

    constructor(size = 256) {
        this.buffer = new Uint8Array(size);
        this.offset = 0;
    }

    ensureCapacity(size: number) {
        if (this.offset + size > this.buffer.length) {
            let newBuffer = new Uint8Array((this.buffer.length + size) * 2);
            newBuffer.set(this.buffer);
            this.buffer = newBuffer;
        }
    }

    append_uint8(value: number) {
        if (Number.isInteger(value) && value >= 0 && value <= 255) {
            this.ensureCapacity(1);
            this.buffer[this.offset] = value;
            this.offset += 1;
        } else {
            throw new Error('Value must be an integer between 0 and 255');
        }
    }

    append_uint16(value: number) {
        if (Number.isInteger(value) && value >= 0 && value <= 65535) {
            // 16-bit unsigned integer
            this.ensureCapacity(2);
            let view = new DataView(this.buffer.buffer);
            view.setUint16(this.offset, value, true); // little-endian
            this.offset += 2;
        } else {
            throw new Error('Value must be an integer between 0 and 65535');
        }
    }

    append_uint32(value: number) {
        if (Number.isInteger(value) && value >= 0 && value <= 4294967295) {
            // 32-bit unsigned integer
            this.ensureCapacity(4);
            let view = new DataView(this.buffer.buffer);
            view.setUint32(this.offset, value, true); // little-endian
            this.offset += 4;
        } else {
            throw new Error('Value must be an integer between 0 and 4294967295');
        }
    }

    append_uint64(value: number) {
        if (Number.isInteger(value) && value >= 0 && value <= 18446744073709551615) {
            // 64-bit unsigned integer
            this.ensureCapacity(8);
            let high = Math.floor(value / 0x100000000);
            let low = value % 0x100000000;
            let view = new DataView(this.buffer.buffer);
            view.setUint32(this.offset, low, true); // little-endian
            view.setUint32(this.offset + 4, high, true); // little-endian
            this.offset += 8;
        } else {
            throw new Error('Value must be an integer between 0 and 18446744073709551615');
        }
    }

    append(value: number | string | any[]) {
        if (Array.isArray(value)) {
            // Iterate over each element in the array and append
            for (const element of value) {
                this.append(element);
            }
        } else if (typeof value === 'string') {
            // Convert string to UTF-8 byte sequence
            const encoder = new TextEncoder();
            const bytes = encoder.encode(value);
            const length = bytes.length;

            // Ensure capacity for the string bytes
            this.ensureCapacity(length);

            // Append bytes to the buffer
            this.buffer.set(bytes, this.offset);
            this.offset += length;

            // Debugging:
            //const stringFromUint8Array = String.fromCharCode.apply(null, this.buffer);
            //console.log(stringFromUint8Array);
        } else if (Number.isInteger(value) && value >= -0x80000000 && value <= 0x7FFFFFFF) {
            // 32-bit signed integer
            this.ensureCapacity(4);
            let view = new DataView(this.buffer.buffer);
            view.setInt32(this.offset, value, true); // little-endian
            this.offset += 4;
        } else if (typeof value === 'number') {
            // 64-bit floating-point number (double)
            this.ensureCapacity(8);
            let view = new DataView(this.buffer.buffer);
            view.setFloat64(this.offset, value, true); // little-endian
            this.offset += 8;
        } else {
            throw new Error('Unsupported value type');
        }
    }
}