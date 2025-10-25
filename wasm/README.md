# beve-wasm

**WebAssembly bindings for BEVE** - Binary Efficient Versatile Encoding

High-performance WASM implementations of the BEVE binary format in Go and Rust.

## 📦 Installation

```bash
npm install beve-wasm
# or
yarn add beve-wasm
# or
bun add beve-wasm
```

## 🚀 Usage

### Auto-detection (Recommended)

Automatically uses the best available implementation:

```javascript
import { encode, decode } from 'beve-wasm';

const data = { id: 123, name: "Alice", scores: [95, 87, 92] };
const bytes = await encode(data);
const decoded = await decode(bytes);
```

### Go WASM

```javascript
import { encode, decode, init } from 'beve-wasm/go';

// Initialize Go WASM runtime
await init();

const data = { message: "Hello, BEVE!" };
const bytes = await encode(data);
const decoded = await decode(bytes);
```

### Rust WASM

```javascript
import init, { marshal, unmarshal } from 'beve-wasm/rust';

// Initialize Rust WASM module
await init();

const data = { count: 42, items: ["a", "b", "c"] };
const bytes = marshal(JSON.stringify(data));
const decoded = JSON.parse(unmarshal(bytes));
```

## 🎯 Performance

| Implementation | Size | Encode (ops/sec) | Decode (ops/sec) |
|---------------|------|------------------|------------------|
| **Rust WASM** | 91 KB | ~140K | ~180K |
| **Go WASM** | 279 KB | ~50K | ~80K |

*Benchmarks run on Node.js v20, Apple M1*

## 📊 Implementation Details

### Rust WASM (`rust/`)
- **Size**: 91 KB (wasm-pack optimized)
- **Build**: `wasm-pack build --target web`
- **Best for**: Browser environments, edge runtimes
- **Features**: Zero-copy, SIMD optimizations

### Go WASM (`go/`)
- **Size**: 279 KB (TinyGo compiled)
- **Build**: `tinygo build -o beve.wasm -target wasm`
- **Best for**: Node.js, server-side
- **Features**: Full Go runtime, mature implementation

## 🔧 Advanced Usage

### Direct WASM File Access

```javascript
// For custom WASM loaders or bundlers
import wasmUrl from 'beve-wasm/rust/beve_bg.wasm?url';
import { initSync } from 'beve-wasm/rust';

const response = await fetch(wasmUrl);
const buffer = await response.arrayBuffer();
initSync(buffer);
```

### Browser Usage

```html
<script type="module">
  import init, { marshal, unmarshal } from 'https://unpkg.com/beve-wasm/rust/beve.js';
  
  await init();
  const data = { test: 123 };
  const binary = marshal(JSON.stringify(data));
  console.log('Encoded:', binary);
</script>
```

## 📁 Package Structure

```
beve-wasm/
├── index.js          # Auto-detection entry point
├── index.d.ts        # TypeScript definitions
├── go/               # Go WASM implementation
│   ├── beve.wasm     # Go WASM binary (279 KB)
│   ├── wasm_exec.js  # Go WASM runtime (16 KB)
│   └── index.js      # Go wrapper
└── rust/             # Rust WASM implementation
    ├── beve_bg.wasm  # Rust WASM binary (91 KB)
    ├── beve.js       # Rust JS glue (7 KB)
    └── beve.d.ts     # TypeScript types
```

## 🌐 Platform Support

- ✅ Node.js 16+
- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Deno
- ✅ Bun
- ✅ Edge runtimes (Cloudflare Workers, Vercel Edge)

## 🔗 Related Packages

- **[beve](https://www.npmjs.com/package/beve)** - Pure TypeScript implementation (no WASM)
- **[beve-go](https://github.com/beve-org/beve-go)** - Go implementation
- **[beve-rs](https://github.com/beve-org/beve-rs)** - Rust implementation

## 📖 Documentation

- [BEVE Specification](https://github.com/beve-org/beve-go/blob/main/SPECIFICATION.md)
- [API Documentation](https://beve.dev)
- [Examples](https://github.com/beve-org/beve-js/tree/main/examples)

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](https://github.com/beve-org/beve-js/blob/main/CONTRIBUTING.md).

## 📄 License

MIT © [Burak Şentürk](https://github.com/meftunca)

---

**Built with** ❤️ **by the BEVE community**
