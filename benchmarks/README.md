# BEVE Benchmarks

Comprehensive benchmarking suite for BEVE TypeScript implementation.

## 🚀 Quick Start

```bash
# Run core BEVE benchmarks
bun run bench:core

# Run BEVE vs JSON comparison
bun run bench:compare

# Run all benchmarks
bun run bench:all
```

## 📊 Available Benchmarks

### 1. Core Benchmarks (`core.bench.ts`)

Tests pure BEVE encoding/decoding performance across various data types:

**Encoding Benchmarks:**
- Primitive types (null, boolean, numbers, strings)
- Objects (small, medium, large)
- Arrays (integers, floats, strings, mixed types)
- Binary data (Uint8Array)
- Nested structures

**Decoding Benchmarks:**
- All encoded data types
- Round-trip tests (encode + decode)

**Size Analysis:**
- Binary output sizes for all test cases

### 2. Comparison Benchmarks (`comparison.bench.ts`)

Direct head-to-head comparison with JSON:

**Test Cases:**
- Primitives
- Small objects (5 fields)
- Number arrays (100, 1000 items)
- User datasets (10, 100 users)
- Binary data (1KB Uint8Array)
- Mixed arrays
- Deep nested objects

**Metrics:**
- Encoding speed (ops/sec)
- Decoding speed (ops/sec)
- Size efficiency (% savings)
- Winner analysis

## 📈 Sample Results

### Core Performance (Bun on Apple M-series)

```
📤 ENCODING BENCHMARKS
encode: null                                 0.000141ms |    7,116,741 ops/sec
encode: boolean (true)                       0.000080ms |   12,574,464 ops/sec
encode: integer (42)                         0.000272ms |    3,670,606 ops/sec
encode: small object (5 fields)              0.001797ms |      556,353 ops/sec
encode: medium object (100 users)            0.163369ms |        6,121 ops/sec
encode: binary data (1KB Uint8Array)         0.001034ms |      967,414 ops/sec

📥 DECODING BENCHMARKS
decode: small object (5 fields)              0.000793ms |    1,260,405 ops/sec
decode: medium object (100 users)            0.099186ms |       10,082 ops/sec
decode: binary data (1KB Uint8Array)         0.000092ms |   10,927,970 ops/sec
```

### BEVE vs JSON Highlights

| Test Case | BEVE Advantage | Notes |
|-----------|----------------|-------|
| **Binary Data (1KB)** | 76× faster encode<br>475× faster decode<br>89.9% smaller | 🏆 **BEVE dominates** |
| **100 Users** | 24.4% smaller size | JSON 9× faster encode/decode |
| **Small Objects** | 12-20% smaller | JSON faster for speed |

**Summary:**
- **Speed**: JSON wins 8/9 cases for general data
- **Size**: BEVE wins 6/9 cases (smaller output)
- **Binary Data**: BEVE wins decisively (100-400× faster)

## 🎯 Key Insights

### BEVE Strengths
✅ **Binary Data**: Exceptional performance (no base64 overhead)  
✅ **Size Efficiency**: Typically 10-25% smaller than JSON  
✅ **Typed Arrays**: Optimized for homogeneous data  
✅ **Network Transfer**: Smaller payloads = faster downloads

### JSON Strengths
✅ **General Speed**: Highly optimized in JS engines (8-20× faster)  
✅ **Text Data**: Native string handling  
✅ **Compatibility**: Universal support  
✅ **Debugging**: Human-readable format

## 🔬 Methodology

**Benchmark Process:**
1. **Warmup**: 100 iterations to stabilize JIT
2. **Measurement**: 1,000-100,000 iterations depending on complexity
3. **Metrics**: 
   - Average time per operation
   - Operations per second
   - Size comparison (bytes)

**Environment:**
- Runtime: Bun 1.3.0
- Platform: macOS ARM64 (M-series)
- JavaScript: ESNext

## 📝 Adding Custom Benchmarks

Create a new file in `benchmarks/`:

```typescript
import { writeBeve } from "../src/encoder";
import { readBeve } from "../src/decoder";

// Your benchmark code
const data = { /* test data */ };

const start = performance.now();
for (let i = 0; i < 10000; i++) {
  writeBeve(data);
}
const end = performance.now();

console.log(`Time: ${end - start}ms`);
```

## 🛠️ Troubleshooting

**Inconsistent Results?**
- Ensure no background processes are running
- Run benchmarks multiple times
- Consider system thermal throttling

**Out of Memory?**
- Reduce iteration counts for large datasets
- Use smaller test data

## 📚 Related Documentation

- [BEVE Specification](../SPECIFICATION.md)
- [Performance Optimization Guide](../SLOW_OPERATIONS_OPTIMIZATION.md)
- [Test Suite](../tests/)

## 🤝 Contributing

To add new benchmarks:
1. Create file in `benchmarks/` directory
2. Follow existing patterns (warmup + measurement)
3. Add npm script to `package.json`
4. Update this README

---

**Last Updated**: 2025-10-17  
**Benchmark Version**: 1.0.0
