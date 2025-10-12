# BEVE - Binary Efficient Versatile Encoding
Version 1.0

*High performance, tagged binary data specification like JSON, MessagePack, CBOR, etc. But, designed for higher performance and scientific computing.*

> See [Discussions](https://github.com/stephenberry/eve/discussions) for polls and active development on the specification.

- Maps to and from JSON
- Schema less, fully described, like JSON (can be used in documents)
- Little endian for maximum performance on modern CPUs
- Blazingly fast, designed for SIMD
- Future proof, supports large numerical types (such as 128 bit integers and higher)
- Designed for scientific computing, supports [brain floats](https://en.wikipedia.org/wiki/Bfloat16_floating-point_format), matrices, and complex numbers
- Simple, designed to be easy to integrate

> BEVE is designed to be faster on modern hardware than CBOR, BSON, and MessagePack, but it is also more space efficient for typed arrays.

## Performance vs MessagePack

The following table lists the performance increase between BEVE with [Glaze](https://github.com/stephenberry/glaze) versus other libraries and their binary formats.

| Test                                                         | Libraries (vs [Glaze](https://github.com/stephenberry/glaze)) | Read (Times Faster) | Write (Times Faster) |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------- | -------------------- |
| [Test Object](https://github.com/stephenberry/json_performance) | [msgpack-c](https://github.com/msgpack/msgpack-c) (c++)      | 1.9X                | 13X                  |
| double array                                                 | [msgpack-c](https://github.com/msgpack/msgpack-c) (c++)      | 14X                 | 50X                  |
| float array                                                  | [msgpack-c](https://github.com/msgpack/msgpack-c) (c++)      | 29X                 | 81X                  |
| uint16_t array                                               | [msgpack-c](https://github.com/msgpack/msgpack-c) (c++)      | 73X                 | 167X                 |

[Performance test code](https://github.com/stephenberry/binary_performance)

The table below shows binary message size versus BEVE. A positive value means the binary produced is larger than BEVE.

| Test                                                         | Libraries (vs [Glaze](https://github.com/stephenberry/glaze)) | Message Size |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------ |
| [Test Object](https://github.com/stephenberry/json_performance) | [msgpack-c](https://github.com/msgpack/msgpack-c) (c++)      | -3.4%        |
| double array                                                 | [msgpack-c](https://github.com/msgpack/msgpack-c) (c++)      | +12%         |
| float array                                                  | [msgpack-c](https://github.com/msgpack/msgpack-c) (c++)      | +25%         |
| uint16_t array                                               | [msgpack-c](https://github.com/msgpack/msgpack-c) (c++)      | +50%         |

## Why Tagged Messages?

*Flexibility and efficiency*

JSON is ubiquitous because it is tagged (has keys), and therefore messages can be sent in part. Furthermore, extending specifications and adding more fields is far easier with tagged messages and unordered mapping. Tags also make the format more human friendly. However, tags are entirely optional, and structs can be serialized as generic arrays.

## Endianness

The endianness must be `little endian`.

## File Extension

The standard extension for BEVE files is `.beve`

## Implementations

### C++

- [Glaze](https://github.com/stephenberry/glaze) (supports JSON and BEVE through the same API)

### Matlab

- [load_beve.m](https://github.com/stephenberry/eve/blob/main/matlab/load_beve.m) (this repository)
- [write_beve.m](https://github.com/stephenberry/eve/blob/main/matlab/write_beve.m) (this repository)

### Python

- [load_beve.py](https://github.com/stephenberry/eve/blob/main/python/load_beve.py) (this repository)

### Rust

- [beve crate](https://crates.io/crates/beve) (developed by author)

- [serde-beve crate](https://crates.io/crates/serde-beve)

## Right Most Bit Ordering

The right most bit is denoted as the first bit, or bit of index 0.

## Concerning Compression

Note that BEVE is not a compression algorithm. It uses some bit packing to be more space efficient, but strings and numerical values see no compression. This means that BEVE binary is very compressible, like JSON, and it is encouraged to use compression algorithms like [LZ4](https://lz4.org), [Zstandard](https://github.com/facebook/zstd), [Brotli](https://github.com/google/brotli), etc. where size is critical.

## Compressed Unsigned Integer

A compressed unsigned integer uses the first two bits to denote the number of bytes used to express an integer. The rest of the bits indicate the integer value.

> Wherever all caps `SIZE` is used in the specification, it refers to a size indicator that uses a compressed unsigned integer.
>
> `SIZE` refers to the count of array members, object members, or bytes in a string. It does **not** refer to the number of raw bytes except for UTF-8 strings.

| #    | Number of Bytes | Integer Value (N)                |
| ---- | --------------- | -------------------------------- |
| 0    | 1               | N < 64 `[2^6]`                   |
| 1    | 2               | N < 16384 `[2^14]`               |
| 2    | 4               | N < 1073741824 `[2^30]`          |
| 3    | 8               | N < 4611686018427387904 `[2^62]` |

## Byte Count Indicator

> Wherever all caps `BYTE COUNT` is used, it describes this mapping.

```c++
#      Number of bytes
0      1
1      2
2      4
3      8
4      16
5      32
6      64
7      128
...
```

## Header

Every `VALUE` begins with a byte header. Any unspecified bits must be set to zero.

> Wherever all caps `HEADER` is used, it describes this header.

The first three bits denote types:

```c++
0 -> null or boolean                          0b00000'000
1 -> number                                   0b00000'001
2 -> string                                   0b00000'010
3 -> object                                   0b00000'011
4 -> typed array                              0b00000'100
5 -> generic array                            0b00000'101
6 -> extension                                0b00000'110
7 -> reserved                                 0b00000'111
```

## Nomenclature

Wherever `DATA` is used, it denotes bytes of data without a `HEADER`.

Wherever `VALUE` is used, it denotes a binary structure that begins with a `HEADER`.

Wherever `SIZE` is used, it refers to a compressed unsigned integer that denotes a count of array members, object members, or bytes in a string.

## 0 - Null

Null is simply `0`

## 0 - Boolean

The next bit is set to indicate a boolean. The 5th bit is set to denote true or false.

```c++
false      0b000'01'000
true       0b000'11'000
```

## 1 - Number

The next two bits of the HEADER indicates whether the number is floating point, signed integer, or unsigned integer.

Float point types must conform to the IEEE-754 standard.

```c++
0 -> floating point      0b000'00'001
1 -> signed integer      0b000'01'001
2 -> unsigned integer    0b000'10'001
```

The next three bits of the HEADER are used as the BYTE COUNT.

> Note: brain floats use a byte count indicator of 1, even though they use 2 bytes per value. This is used because float8_t is not supported and not typically useful.

> See [Fixed width integer types](https://en.cppreference.com/w/cpp/types/integer) for integer specification.

```c++
bfloat16_t    0b000'00'001 // brain float
float16_t     0b001'00'001
float32_t     0b010'00'001 // float
float64_t     0b011'00'001 // double
float128_t    0b100'00'001
```

```c++
int8_t        0b000'01'001
int16_t       0b001'01'001
int32_t       0b010'01'001
int64_t       0b011'01'001
int128_t      0b100'01'001
```

```c++
uint8_t       0b000'10'001
uint16_t      0b001'10'001
uint32_t      0b010'10'001
uint64_t      0b011'10'001
uint128_t     0b100'10'001
```

## 2 - Strings

Strings must be encoded with UTF-8.

Layout: `HEADER | SIZE | DATA`

### Strings as Object Keys or Typed String Arrays

When strings are used as keys in objects or typed string arrays the HEADER is not included.

Layout: `SIZE | DATA`

## 3 - Object

The next two bits of the HEADER indicates the type of key.

```c++
0 -> string
1 -> signed integer
2 -> unsigned integer
```

For integer keys the next three bits of the HEADER indicate the BYTE COUNT.

> An object `KEY` must not contain a HEADER as the type of the key has already been defined.

Layout: `HEADER | SIZE | KEY[0] | VALUE[0] | ... KEY[N] | VALUE[N]`

## 4 - Typed Array

The next two bits indicate the type stored in the array:

```c++
0 -> floating point
1 -> signed integer
2 -> unsigned integer
3 -> boolean or string
```

For integral and floating point types, the next three bits of the type header are the BYTE COUNT.

For boolean or string types the next bit indicates whether the type is a boolean or a string

```c++
0 -> boolean // packed as single bits to the nearest byte
1 -> string // an array of strings (not an array of characters)
```

Layout: `HEADER | SIZE | data`

### Boolean Arrays

Boolean arrays are stored as single bits and packed into consecutive bytes.

- `SIZE` is the number of booleans; the payload length is `ceil(SIZE / 8)` bytes.
- Bits are packed per byte in LSB-first order. Within each byte, bit 0 (the least-significant bit) corresponds to the lowest array index for that byte; bit `i` corresponds to array index `byte_index * 8 + i`.
- Bytes are written in order: the first byte packs indices 0–7, the second 8–15, and so on.
- A bit value of 1 encodes `true`; 0 encodes `false`.
- If `SIZE` is not a multiple of 8, the remaining high bits of the final byte are padding and must be zero.

Examples

```text
0b00000001  -> index 0 is true (indices 1–7 are false)
0b00000010  -> index 1 is true
[true, false, true] -> 0b00000101
```

### String Arrays

String arrays do not include the string HEADER for each element.

Layout: `HEADER | SIZE | string[0] | ... string[N]`

## 5 - Generic Array

Generic arrays expect elements to have headers.

Layout: `HEADER | SIZE | VALUE[0] | ... VALUE[N]`

## 6 - Extensions

Extensions are considered to be a formal part of the BEVE specification, but are not expected to be as broadly implemented.

Following the first three HEADER bits, the next five bits denote various extensions. These extensions are not expected to be implemented in every parser/serializer, but they provide convenient binary storage for more specialized use cases, such as variants, matrices, and complex numbers.

```c++
0 -> data delimiter // for specs like Newline Delimited JSON
1 -> type tag // for variant like structures
2 -> matrices
3 -> complex numbers
```

### 0 - Data Delimiter

Used to separate chunks of data to match specifications like [NDJSON](http://ndjson.org).

When converted to JSON this should add a new line (`'\n'`) character to the JSON.

### 1 - Type Tag (Variants)

Expects a subsequent compressed unsigned integer to denote a type tag. A compressed SIZE indicator is used to efficiently store the tag.

Layout : `HEADER | SIZE (i.e. type tag) | VALUE`

The converted JSON format should look like:

```json
{
  "index": 0,
  "value": "the JSON value"
}
```

The `"index"` should refer to an array of types, from zero to one less than the count of types.

The `"value"` is any JSON value.

### 2 - Matrices

Matrices can be stored as object or array types. However, this tag provides a more compact mechanism to introspect matrices.

Matrices add a one byte MATRIX HEADER.

The first bit of the matrix header denotes the data layout of the matrix.

```c++
0 -> layout_right // row-major
1 -> layout_left // column-major
```

Layout: `HEADER | MATRIX HEADER | EXTENTS | VALUE`

EXTENTS are written out as a typed array of integers.

> The VALUE in the matrix must be a typed array of numerical data.

The converted JSON format should look like:

```json
{
  "layout": "layout_right",
  "extents": [3, 3],
  "value": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
}
```

### 3 - Complex Numbers

An additional COMPLEX HEADER byte is used.

- Complex numbers are stored as pairs of numerical types.

The first three bits denote whether this is a single complex number or a complex array.

```c++
0 -> complex number
1 -> complex array
```

For a single complex number the layout is: `HEADER | COMPLEX HEADER | DATA`

> A complex value is a pair of numbers.

For a complex array the layout is: `HEADER | COMPLEX HEADER | SIZE | DATA`

> Three bits are used to align the left bits with the layouts for numbers.

The next two bits denote the numerical type:

```c++
0 -> floating point      0b000'00'000
1 -> signed integer      0b000'01'000
2 -> unsigned integer    0b000'10'000
```

The next three bits are used to indicate the BYTE COUNT. This is the same specification for BEVE numbers.

The converted JSON format should look like:

```json
[1, 2] // for a complex number
[[1, 2], [2.0, 3]] // for a complex array
```