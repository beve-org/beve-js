# 🎉 BEVE v1.0.0 Successfully Published to npm!

## 📦 Package Information

**Package Name:** `beve`  
**Version:** 1.0.0  
**Registry:** https://registry.npmjs.org/  
**Published By:** senturk (Burak Karahan)  
**Published Date:** October 13, 2025

## 📊 Package Stats

- **Package Size:** 151.3 kB (compressed tarball)
- **Unpacked Size:** 511.0 kB
- **Total Files:** 81
- **License:** MIT

## 📦 What's Included

### Core Files
- ✅ **dist/** - Compiled JavaScript + TypeScript definitions
  - ESM and CommonJS builds
  - Source maps included
  - Full type definitions

### WebAssembly Files
- ✅ **wasm/beve.wasm** (160.5 kB) - Go WASM module
- ✅ **wasm/beve.wasm.gz** (53.0 kB) - Compressed WASM
- ✅ **wasm/wasm_exec.js** (16.5 kB) - Go runtime
- ✅ **wasm/README.md** (6.3 kB) - WASM documentation
- ✅ **wasm/index.html** (17.8 kB) - Interactive demo

### Documentation
- ✅ **README.md** (15.2 kB) - Main documentation
- ✅ **LICENSE** (1.1 kB) - MIT License

## 🚀 Installation

```bash
npm install beve
# or
yarn add beve
# or
bun add beve
```

## 💻 Quick Start

```typescript
import { marshal, unmarshal } from 'beve';

// Automatically uses WASM if available!
const data = { id: 123, name: "Alice", active: true };
const bytes = await marshal(data);
const decoded = await unmarshal(bytes);
```

## 🔗 Links

- **npm:** https://www.npmjs.com/package/beve
- **GitHub:** https://github.com/meftunca/beve-js
- **Author:** Burak Karahan (meftunca@gmail.com)

## ✨ Key Features

### 🚀 WebAssembly Acceleration
- **1.5x faster** encoding with WASM
- **1.4x faster** decoding with WASM
- Automatic fallback to TypeScript

### 🔄 Zero Configuration
- Auto-detects WASM support
- Seamless API (no code changes needed)
- Works everywhere (Node.js, Browser, Edge)

### 📦 Production Ready
- Full TypeScript support
- Comprehensive test suite
- Complete documentation
- MIT licensed

## 📊 Performance

| Operation | WASM | TypeScript | Speedup |
|-----------|------|------------|---------|
| Small Encode | ~0.02 ms | ~0.03 ms | **1.5x** |
| Small Decode | ~0.025 ms | ~0.035 ms | **1.4x** |
| Large Encode | ~2.5 ms | ~3.8 ms | **1.5x** |

## 🎯 Use Cases

- **High-performance APIs** - Binary payloads instead of JSON
- **Real-time applications** - WebSocket data serialization
- **Edge computing** - Cloudflare Workers, Deno Deploy
- **Scientific computing** - Typed arrays, SIMD-ready
- **File storage** - Compact binary format

## 🏗️ Implementation Details

### Automatic WASM Detection
```typescript
import { getImplementationInfo } from 'beve';

const info = getImplementationInfo();
console.log(info.implementation); // "WASM" or "TypeScript"
console.log(info.runtime);        // "Node.js", "Browser", etc.
```

### Sync API (TypeScript only)
```typescript
import { marshalSync, unmarshalSync } from 'beve';

const bytes = marshalSync(data);
const decoded = unmarshalSync(bytes);
```

## 📚 Documentation

The package includes comprehensive documentation:
- Usage examples
- API reference
- Performance benchmarks
- WASM integration guide
- Browser and Node.js examples

## 🙏 Credits

Built on top of the [BEVE specification](https://github.com/stephenberry/beve) by Stephen Berry.

Inspired by:
- [beve-go](https://github.com/meftunca/beve-go) - Go implementation
- [Glaze](https://github.com/stephenberry/glaze) - C++ implementation

## 📝 Next Steps

### For Users
1. Install: `npm install beve`
2. Import: `import { marshal, unmarshal } from 'beve'`
3. Use it! No configuration needed

### For Contributors
- Star the repo: https://github.com/meftunca/beve-js
- Report issues: https://github.com/meftunca/beve-js/issues
- Submit PRs: Contributions welcome!

## 🎉 Celebrate!

**BEVE is now available to the JavaScript/TypeScript community!**

Share with your team:
```bash
# Try it now!
npm install beve

# Test the benchmark
npx beve-benchmark
```

---

**Built with ❤️ by Burak Karahan**  
**Powered by WebAssembly**  
**Licensed under MIT**

🚀 Happy coding with BEVE!
