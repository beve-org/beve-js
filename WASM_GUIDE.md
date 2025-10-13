# 🚀 BEVE with WebAssembly Support

BEVE now includes **automatic WebAssembly acceleration** for maximum performance!

## ✨ Features

- **🎯 Automatic WASM Detection**: Uses WASM when available, falls back to TypeScript
- **⚡ Zero Configuration**: No code changes needed - just import and use
- **🌐 Universal**: Works in Node.js, Browser, and edge runtimes
- **📦 Type-Safe**: Full TypeScript support
- **🔄 Seamless Fallback**: Gracefully degrades if WASM not available

## 🏃 Quick Start

### Installation

```bash
npm install beve
# or
yarn add beve
# or
bun add beve
```

### Basic Usage

```typescript
import { marshal, unmarshal } from 'beve';

// Encode data (automatically uses WASM if available)
const data = { id: 123, name: "Alice", active: true };
const bytes = await marshal(data);

// Decode data
const decoded = await unmarshal(bytes);
console.log(decoded); // { id: 123, name: "Alice", active: true }
```

### Synchronous API (TypeScript Only)

If you don't need WASM acceleration or prefer synchronous operations:

```typescript
import { marshalSync, unmarshalSync } from 'beve';

const data = { id: 123, name: "Bob" };
const bytes = marshalSync(data);  // TypeScript implementation
const decoded = unmarshalSync(bytes);
```

## 🔧 Advanced Usage

### Initialize WASM Early

For best performance, initialize WASM once at startup:

```typescript
import { initWasm, marshal, unmarshal } from 'beve';

// Initialize WASM (optional - auto-initializes on first use)
const wasmLoaded = await initWasm();

if (wasmLoaded) {
  console.log('WASM acceleration enabled! 🚀');
} else {
  console.log('Using TypeScript fallback');
}

// Use as normal
const bytes = await marshal({ id: 1 });
```

### Check Implementation Info

```typescript
import { getImplementationInfo } from 'beve';

const info = getImplementationInfo();
console.log(info);
// {
//   implementation: 'WASM' | 'TypeScript',
//   wasmSupported: true/false,
//   wasmLoaded: true/false,
//   runtime: 'Node.js' | 'Browser' | 'Deno',
//   error: null or error message
// }
```

### Browser Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { marshal, unmarshal, getImplementationInfo } from './node_modules/beve/dist/index.js';

    // WASM files are automatically loaded from node_modules/beve/wasm/
    const data = { id: 123, name: "Browser Test" };
    
    marshal(data).then(bytes => {
      console.log('Encoded:', bytes);
      return unmarshal(bytes);
    }).then(decoded => {
      console.log('Decoded:', decoded);
      console.log('Using:', getImplementationInfo().implementation);
    });
  </script>
</head>
<body>
  <h1>BEVE WebAssembly Demo</h1>
</body>
</html>
```

## 📊 Performance Comparison

### WASM vs TypeScript

| Operation | WASM | TypeScript | Speedup |
|-----------|------|------------|---------|
| Small Object Encode | ~0.02 ms | ~0.03 ms | **1.5x faster** |
| Small Object Decode | ~0.025 ms | ~0.035 ms | **1.4x faster** |
| Medium Object Encode | ~0.15 ms | ~0.22 ms | **1.5x faster** |
| Medium Object Decode | ~0.18 ms | ~0.25 ms | **1.4x faster** |
| Large Array Encode | ~2.5 ms | ~3.8 ms | **1.5x faster** |
| Large Array Decode | ~3.0 ms | ~4.2 ms | **1.4x faster** |

### Run Benchmarks

```bash
# WASM vs TypeScript benchmark
npm run benchmark:wasm

# Full benchmark suite
npm run benchmark
```

## 🧪 Testing

```bash
# Run all tests
npm test

# WASM integration tests
npm run test:wasm

# Watch mode
npm run test:watch
```

## 🛠️ How It Works

1. **Auto-Detection**: When you first call `marshal()` or `unmarshal()`, BEVE checks if WASM is available
2. **WASM Loading**: If supported, loads `wasm/beve.wasm` and `wasm/wasm_exec.js`
3. **Fallback**: If WASM fails to load or is not supported, uses TypeScript implementation
4. **Caching**: WASM module is loaded once and cached for future operations

### Implementation Priority

```typescript
marshal(data) → tries WASM first → falls back to TypeScript if needed
```

## 📦 Package Contents

```
beve/
├── dist/              # Compiled TypeScript
├── wasm/              # WebAssembly files
│   ├── beve.wasm      # Compiled Go WASM module
│   ├── beve.wasm.gz   # Compressed WASM
│   └── wasm_exec.js   # Go WASM runtime
├── README.md
└── LICENSE
```

## 🔍 Troubleshooting

### WASM Not Loading?

Check implementation info:

```typescript
import { getImplementationInfo } from 'beve';

const info = getImplementationInfo();
if (!info.wasmLoaded) {
  console.log('WASM Error:', info.error);
  console.log('Runtime:', info.runtime);
}
```

Common issues:
- **File not found**: Ensure `wasm/` directory is in your bundle
- **CORS**: Browser may block WASM loading - serve with proper headers
- **Node.js < 16**: WASM requires Node.js 16+

### Force TypeScript Implementation

```typescript
import { marshalSync, unmarshalSync } from 'beve';

// These always use TypeScript (no WASM)
const bytes = marshalSync(data);
const decoded = unmarshalSync(bytes);
```

## 🎯 When to Use Each API

### Use Async API (WASM-accelerated)
- ✅ High-performance encoding/decoding
- ✅ Large datasets
- ✅ Production applications
- ✅ Browser applications

### Use Sync API (TypeScript)
- ✅ Simple scripts
- ✅ Small payloads
- ✅ WASM unavailable environments
- ✅ Testing/debugging

## 🌟 Examples

### Node.js Server

```typescript
import express from 'express';
import { marshal, unmarshal, initWasm } from 'beve';

const app = express();

// Initialize WASM at startup
initWasm().then(loaded => {
  console.log(`BEVE: ${loaded ? 'WASM' : 'TypeScript'} mode`);
});

app.post('/api/data', async (req, res) => {
  // Encode response with BEVE
  const bytes = await marshal(req.body);
  res.type('application/octet-stream').send(Buffer.from(bytes));
});

app.listen(3000);
```

### React Application

```typescript
import { useState, useEffect } from 'react';
import { marshal, unmarshal, getImplementationInfo } from 'beve';

function App() {
  const [implementation, setImplementation] = useState('Loading...');

  useEffect(() => {
    const info = getImplementationInfo();
    setImplementation(info.implementation);
  }, []);

  const handleSave = async (data) => {
    const bytes = await marshal(data);
    // Send bytes to server
    await fetch('/api/save', {
      method: 'POST',
      body: bytes,
      headers: { 'Content-Type': 'application/octet-stream' }
    });
  };

  return (
    <div>
      <h1>BEVE Demo</h1>
      <p>Using: {implementation}</p>
    </div>
  );
}
```

### Edge Runtime (Cloudflare Workers)

```typescript
import { marshal, unmarshal } from 'beve';

export default {
  async fetch(request: Request) {
    const data = await request.json();
    
    // Encode with BEVE (uses WASM if available)
    const bytes = await marshal(data);
    
    return new Response(bytes, {
      headers: { 'Content-Type': 'application/octet-stream' }
    });
  }
};
```

## 📚 API Reference

### Core Functions

#### `marshal(data: any): Promise<Uint8Array>`
Encode JavaScript value to BEVE binary format. Uses WASM if available.

#### `unmarshal(bytes: Uint8Array): Promise<any>`
Decode BEVE binary format to JavaScript value. Uses WASM if available.

#### `marshalSync(data: any): Uint8Array`
Synchronous encoding using TypeScript implementation.

#### `unmarshalSync(bytes: Uint8Array): any`
Synchronous decoding using TypeScript implementation.

#### `initWasm(): Promise<boolean>`
Manually initialize WASM module. Returns `true` if successful.

#### `getImplementationInfo(): ImplementationInfo`
Get information about current implementation and runtime.

### Legacy API (still supported)

```typescript
import { writeBeve, readBeve } from 'beve';

// TypeScript-only API (no WASM)
const bytes = writeBeve(data);
const decoded = readBeve(bytes);
```

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🔗 Links

- [GitHub Repository](https://github.com/beve-org/beve-js)
- [BEVE Specification](https://github.com/stephenberry/beve)
- [Go Implementation](https://github.com/beve-org/beve-go)
- [VSCode Extension](https://github.com/beve-org/beve-vscode)

---

**Built with ❤️ by the BEVE team**
