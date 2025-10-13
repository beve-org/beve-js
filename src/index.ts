// Reference: https://github.com/stephenberry/beve

/**
 * BEVE - Binary Efficient Versatile Encoding
 * 
 * High-performance binary serialization with automatic WASM acceleration.
 * 
 * Features:
 * - 🚀 Auto-detects and uses WASM when available (50K+ ops/sec)
 * - 📦 Falls back to TypeScript implementation (30K+ ops/sec)
 * - 🔄 Seamless API - no code changes needed
 * - 🌐 Works in Node.js, Browser, and edge runtimes
 * 
 * Usage:
 *   import { marshal, unmarshal } from 'beve';
 *   
 *   // Async API (uses WASM if available)
 *   const bytes = await marshal({ id: 123, name: "Alice" });
 *   const data = await unmarshal(bytes);
 *   
 *   // Sync API (TypeScript only)
 *   const bytes = marshalSync({ id: 123, name: "Alice" });
 *   const data = unmarshalSync(bytes);
 */

// Primary API - adaptive (WASM + TypeScript fallback)
import {
  marshal,
  unmarshal,
  marshalSync,
  unmarshalSync,
  initWasm,
  getImplementationInfo,
  disableWasm,
} from './adaptive';

export {
  marshal,
  unmarshal,
  marshalSync,
  unmarshalSync,
  initWasm,
  getImplementationInfo,
  disableWasm,
};

// Direct TypeScript API (for advanced usage)
export { readBeve } from './decoder';
export { writeBeve } from './encoder';
export { Writer } from './writer';
export * from './utils';

// Re-export types
export type { BeveWasmModule } from './wasm-loader';

type GlobalBeveApi = {
  encode(value: any): Uint8Array;
  decode(bytes: Uint8Array): any;
  encodeAsync(value: any): Promise<Uint8Array>;
  decodeAsync(bytes: Uint8Array): Promise<any>;
  init(): Promise<boolean>;
  info(): ReturnType<typeof getImplementationInfo>;
  disable(): void;
};

const beveGlobal: GlobalBeveApi = {
  encode: (value: any) => marshalSync(value),
  decode: (bytes: Uint8Array) => unmarshalSync(bytes),
  encodeAsync: (value: any) => marshal(value),
  decodeAsync: (bytes: Uint8Array) => unmarshal(bytes),
  init: () => initWasm(),
  info: () => getImplementationInfo(),
  disable: () => disableWasm(),
};

if (typeof globalThis !== 'undefined') {
  const target = globalThis as typeof globalThis & { beve?: Partial<GlobalBeveApi> };
  target.beve = {
    ...target.beve,
    ...beveGlobal,
  };
}