# BEVE-JS Test Suite

Comprehensive test suite using Bun test framework for performance analysis and bottleneck detection.

## 🚀 Quick Start

```bash
# Run all tests
bun test

# Watch mode
bun test --watch

# Coverage (if needed)
bun test --coverage
```

## 📁 Test Structure

```
tests/
├── encoder.test.ts      # Encoder unit tests
├── decoder.test.ts      # Decoder unit tests  
├── performance.test.ts  # Performance benchmarks
└── bottleneck.test.ts   # Bottleneck analysis
```

## 🧪 Test Categories

### 1. Encoder Tests (`encoder.test.ts`)
Tests the encoding functionality for all data types:

- **Basic Types**: null, boolean, integer, float, string, UTF-8
- **Arrays**: empty, integer, float, string, mixed, large arrays
- **Objects**: simple, nested, with arrays, complex structures
- **Binary Data**: Uint8Array of various sizes
- **Performance**: Large dataset encoding

**Total**: 22 tests

### 2. Decoder Tests (`decoder.test.ts`)
Tests the decoding functionality and round-trip integrity:

- **Basic Types**: All primitive types
- **Arrays**: All array types including nested
- **Objects**: Simple and complex object structures
- **Binary Data**: Uint8Array decoding
- **Round-trip**: Data integrity verification
- **Error Handling**: Invalid/truncated buffer handling

**Total**: 19 tests

### 3. Performance Tests (`performance.test.ts`)
Detailed performance benchmarks with console output:

#### Metrics Measured:
- Average time per operation
- Minimum time
- Maximum time
- Operations per second

#### Test Scenarios:
- **Small Data**: Simple objects (~10 elements)
- **Medium Data**: Complex structures (~50 elements)
- **Integer Arrays**: 1,000 integers
- **Float Arrays**: 1,000 floats
- **String Arrays**: 100 strings
- **Nested Structures**: 4-level deep nesting
- **Binary Data**: 1KB Uint8Array
- **Size Comparison**: BEVE vs JSON

**Total**: 16 tests

### 4. Bottleneck Analysis (`bottleneck.test.ts`)
Identifies performance bottlenecks and optimization opportunities:

#### Analysis Areas:
1. **Object vs Array Encoding**: Which is faster?
2. **String Length Impact**: How do string lengths affect performance?
3. **Nesting Depth**: Performance impact of deep nesting
4. **Type Mixing**: Homogeneous vs heterogeneous arrays
5. **Decoding Complexity**: Simple vs complex structure decoding
6. **Buffer Size Impact**: How size affects decode performance
7. **Memory Allocation**: Memory usage patterns
8. **Round-trip Breakdown**: Where time is spent in full cycle
9. **BEVE vs JSON**: Comprehensive comparison

**Total**: 9 tests

## 📊 Example Output

```bash
$ bun test

Performance - Small Data:
Small Object Encoding: 0.0022ms avg, 462302 ops/sec ✅
Small Object Decoding: 0.0020ms avg, 510924 ops/sec ✅

Bottleneck Analysis:
📊 Object vs Array Encoding:
   Object (1K keys): 0.3645ms
   Array (1K items): 0.0598ms
   Ratio: 6.10x

📊 BEVE vs JSON Performance:
   Encoding:
   BEVE: 0.0876ms
   JSON: 0.0578ms
   Winner: JSON (51.6% faster)

   Decoding:
   BEVE: 0.0741ms
   JSON: 1.7359ms
   Winner: BEVE (2243.2% faster) 🚀

72 pass, 4 fail
```

## 🎯 Performance Benchmarks

| Operation | Small | Medium | Large Array |
|-----------|-------|--------|-------------|
| **Encode** | 462K ops/s | 15K ops/s | 17K ops/s |
| **Decode** | 511K ops/s | 25K ops/s | 24K ops/s |

## 🔍 Bottleneck Findings

### Major Bottlenecks Found:
1. **Complex Structure Decoding**: 140x slower than simple
2. **Object Encoding**: 6.1x slower than arrays
3. **Type Mixing**: 1.89x overhead

### Recommendations:
- Use arrays instead of objects when possible
- Keep structures shallow (nesting overhead: 1.21x)
- Use homogeneous arrays for best performance
- **Optimize complex decoding path** (highest priority)

## 📦 Size Comparison

BEVE consistently smaller than JSON:
- **Typed arrays**: 33% smaller
- **Large objects**: 27% smaller
- **Mixed data**: 33% smaller

## 🐛 Known Issues

4 tests currently failing:
1. UTF-8 emoji decoding
2. Binary data decoding (2 tests)
3. String length variance expectation

See `TEST_RESULTS.md` for details.

## 🛠️ Writing New Tests

### Example: Basic Test
```typescript
import { describe, test, expect } from "bun:test";
import { writeBeve, readBeve } from "../src/index";

describe("My Feature", () => {
    test("should work correctly", () => {
        const data = { test: "value" };
        const encoded = writeBeve(data);
        const decoded = readBeve(encoded);
        expect(decoded).toEqual(data);
    });
});
```

### Example: Performance Test
```typescript
test("should be fast", () => {
    const data = generateLargeData();
    
    const start = performance.now();
    writeBeve(data);
    const end = performance.now();
    
    console.log(`Performance: ${end - start}ms`);
    expect(end - start).toBeLessThan(100); // Should be under 100ms
});
```

### Example: Bottleneck Test
```typescript
test("compare approaches", () => {
    // Approach A
    const startA = performance.now();
    // ... test approach A
    const timeA = performance.now() - startA;
    
    // Approach B  
    const startB = performance.now();
    // ... test approach B
    const timeB = performance.now() - startB;
    
    console.log(`Approach A: ${timeA}ms`);
    console.log(`Approach B: ${timeB}ms`);
    console.log(`Winner: ${timeA < timeB ? 'A' : 'B'}`);
});
```

## 📈 CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
```

## 🎨 Test Best Practices

1. **Keep tests focused**: One concept per test
2. **Use descriptive names**: Test name should explain what it tests
3. **Add console output**: For performance/bottleneck tests
4. **Set reasonable expectations**: Based on actual performance
5. **Test edge cases**: Empty arrays, null values, large data
6. **Verify round-trip**: Encode -> Decode -> Compare

## 📚 Resources

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [BEVE Specification](https://github.com/stephenberry/beve)
- [Test Results](../TEST_RESULTS.md)
- [Project Summary](../PROJECT_SUMMARY.md)

## 🤝 Contributing

To add new tests:
1. Create test file in `tests/` directory
2. Follow naming convention: `*.test.ts`
3. Run `bun test` to verify
4. Update this README with new test info

## 📊 Test Coverage Goals

- ✅ All data types covered
- ✅ Performance benchmarks added
- ✅ Bottleneck analysis complete
- ⏳ Edge case coverage (in progress)
- ⏳ Streaming tests (planned)
- ⏳ Concurrent operation tests (planned)
