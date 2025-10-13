/**
 * Adaptive BEVE Implementation
 * 
 * Automatically uses WASM if available, falls back to TypeScript implementation.
 * Provides seamless API regardless of underlying implementation.
 * 
 * Usage:
 *   import { marshal, unmarshal } from 'beve';
 *   const bytes = await marshal({ id: 123, name: "test" });
 *   const data = await unmarshal(bytes);
 * 
 * Performance:
 *   - WASM: ~50K ops/sec (when available)
 *   - TypeScript: ~30K ops/sec (fallback)
 */

import {
  getWasmModule,
  getWasmDiagnostics,
  resetWasmModule,
  type BeveWasmModule,
} from './wasm-loader';
import { writeBeve } from './encoder';
import { readBeve } from './decoder';

let wasmInitialized = false;
let wasmInitPromise: Promise<boolean> | null = null;
let cachedWasmModule: BeveWasmModule | null = null;
let wasmDisabled = false;

/**
 * Initialize WASM (if available) - call once at startup for best performance
 * This is optional - marshal/unmarshal will auto-initialize on first use
 */
export async function initWasm(): Promise<boolean> {
  if (wasmDisabled) {
    return false;
  }

  if (cachedWasmModule) {
    wasmInitialized = true;
    return true;
  }

  if (wasmInitPromise) {
    return wasmInitPromise;
  }

  wasmInitPromise = (async () => {
    try {
      const wasm = await getWasmModule();
      cachedWasmModule = wasm;
      return wasm !== null;
    } catch (error) {
      const err = error as Error;
      console.warn('[BEVE] WASM init failed:', err.message);
      cachedWasmModule = null;
      return false;
    } finally {
      wasmInitialized = true;
      wasmInitPromise = null;
    }
  })();

  return wasmInitPromise;
}

/**
 * Marshal (encode) data to BEVE binary format
 * 
 * Uses WASM if available, falls back to TypeScript
 * 
 * @param data - Any JavaScript value (object, array, primitive)
 * @returns BEVE-encoded bytes
 * @throws Error if encoding fails
 */
export async function marshal(data: any): Promise<Uint8Array> {
  if (!wasmDisabled && (!wasmInitialized || !cachedWasmModule)) {
    await initWasm();
  }

  if (!wasmDisabled && cachedWasmModule) {
    try {
      const result = cachedWasmModule.marshal(data);

      if (result.error) {
        throw new Error(`WASM marshal failed: ${result.error}`);
      }

      if (!result.data) {
        throw new Error('WASM marshal returned no data');
      }

      return result.data;
    } catch (error) {
      const err = error as Error;
      console.warn('[BEVE] WASM marshal failed, falling back to TypeScript:', err.message);
    }
  }

  return writeBeve(data);
}

/**
 * Unmarshal (decode) BEVE binary format to JavaScript value
 * 
 * Uses WASM if available, falls back to TypeScript
 * 
 * @param bytes - BEVE-encoded binary data
 * @returns Decoded JavaScript value
 * @throws Error if decoding fails
 */
export async function unmarshal(bytes: Uint8Array): Promise<any> {
  if (!wasmDisabled && (!wasmInitialized || !cachedWasmModule)) {
    await initWasm();
  }

  if (!wasmDisabled && cachedWasmModule) {
    try {
      const result = cachedWasmModule.unmarshal(bytes);

      if (result.error) {
        throw new Error(`WASM unmarshal failed: ${result.error}`);
      }

      if (result.data === undefined) {
        throw new Error('WASM unmarshal returned no data');
      }

      return result.data;
    } catch (error) {
      const err = error as Error;
      console.warn('[BEVE] WASM unmarshal failed, falling back to TypeScript:', err.message);
    }
  }

  return readBeve(bytes);
}

/**
 * Synchronous marshal (TypeScript only)
 * Use this when you know WASM is not needed or in sync contexts
 */
export function marshalSync(data: any): Uint8Array {
  if (!wasmDisabled && !wasmInitialized) {
    void initWasm();
  }

  return writeBeve(data);
}

/**
 * Synchronous unmarshal (TypeScript only)
 * Use this when you know WASM is not needed or in sync contexts
 */
export function unmarshalSync(bytes: Uint8Array): any {
  if (!wasmDisabled && !wasmInitialized) {
    void initWasm();
  }

  return readBeve(bytes);
}

/**
 * Get implementation info
 * Useful for debugging and logging
 */
export function getImplementationInfo() {
  const diagnostics = getWasmDiagnostics();
  
  return {
    implementation: diagnostics.wasmLoaded ? 'WASM' : 'TypeScript',
    wasmSupported: diagnostics.hasWasmSupport,
    wasmLoaded: diagnostics.wasmLoaded,
    wasmInitialized,
    wasmDisabled,
    runtime: diagnostics.isNode ? 'Node.js' : 
             diagnostics.isBrowser ? 'Browser' : 
             diagnostics.isDeno ? 'Deno' : 'Unknown',
    error: diagnostics.error,
  };
}

/**
 * Force TypeScript implementation (disable WASM)
 * Useful for testing or when WASM causes issues
 */
export function disableWasm() {
  wasmDisabled = true;
  cachedWasmModule = null;
  wasmInitialized = false;
  resetWasmModule();
  console.warn('[BEVE] WASM disabled, using TypeScript implementation');
}

// Eagerly attempt to initialize WASM so it becomes the default when supported
void initWasm();

// Export TypeScript implementation directly (advanced usage)
export { writeBeve } from './encoder';
export { readBeve } from './decoder';
export { Writer } from './writer';
export * from './utils';
