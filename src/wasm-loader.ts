/**
 * WASM Loader - Dynamically loads BEVE WASM module with fallback support
 * 
 * Features:
 * - Auto-detects WASM support (Node.js, Browser, Deno)
 * - Graceful fallback to TypeScript implementation
 * - Lazy loading (only loads WASM when first used)
 * - Error handling and diagnostics
 */

import * as fs from 'fs';
import * as path from 'path';

// Type augmentation for globalThis
declare global {
  var window: any;
  var document: any;
  var Deno: any;
  var WebAssembly: any;
  var Go: any;
  var beveWasm: BeveWasmModule;
}

// WASM module interface (matches Go exported functions)
export interface BeveWasmModule {
  marshal(data: any): { data?: Uint8Array; error?: string };
  unmarshal(bytes: Uint8Array): { data?: any; error?: string };
}

// Runtime environment detection
const isNode = typeof process !== 'undefined' && process.versions?.node;
const isBrowser = typeof globalThis.window !== 'undefined' && typeof globalThis.window.document !== 'undefined';
const isDeno = typeof (globalThis as any).Deno !== 'undefined';

// Check WebAssembly support
const hasWasmSupport = typeof globalThis.WebAssembly !== 'undefined' && 
                       typeof globalThis.WebAssembly.instantiate === 'function';

let wasmModule: BeveWasmModule | null = null;
let wasmLoadAttempted = false;
let wasmLoadError: Error | null = null;

/**
 * Get current file directory
 * Works differently in ESM vs CJS, use environment detection
 */
function getCurrentDir(): string {
  // In Node.js CJS, __dirname is available
  try {
    // @ts-ignore
    if (typeof __dirname !== 'undefined') {
      // @ts-ignore
      return __dirname;
    }
  } catch {}
  
  // In Node.js ESM, we need import.meta.url
  // This will be handled at bundle time by the module system
  // For CommonJS builds, we return a safe fallback
  return __dirname || process.cwd();
}

/**
 * Load WASM module - Node.js environment
 */
async function loadWasmNode(): Promise<BeveWasmModule> {
  if (!isNode) {
    throw new Error('Not running in Node.js environment');
  }

  try {
    // Resolve WASM file path
    const dirname = getCurrentDir();
    const wasmPath = path.join(dirname, '../wasm/beve.wasm');

    // Check if file exists
    if (!fs.existsSync(wasmPath)) {
      throw new Error(`WASM file not found: ${wasmPath}`);
    }

    // Load wasm_exec.js (Go glue code)
    const wasmExecPath = path.join(dirname, '../wasm/wasm_exec.js');
    if (!fs.existsSync(wasmExecPath)) {
      throw new Error(`wasm_exec.js not found: ${wasmExecPath}`);
    }

    // Dynamic import wasm_exec.js (it sets up global Go class)
    await import(wasmExecPath);

    // Load WASM binary
    const wasmBuffer = fs.readFileSync(wasmPath);
    
    // @ts-ignore - Go class is defined globally by wasm_exec.js
    const go = new Go();
    
    const wasmInstance = await globalThis.WebAssembly.instantiate(wasmBuffer, go.importObject);
    
    // Run Go runtime (async, doesn't block)
    go.run(wasmInstance.instance);

    // Wait for beveWasm global to be available
    await waitForGlobal('beveWasm', 5000);

    // @ts-ignore - beveWasm is set by Go WASM module
    return globalThis.beveWasm;
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to load WASM in Node.js: ${err.message}`);
  }
}

/**
 * Load WASM module - Browser environment
 */
async function loadWasmBrowser(): Promise<BeveWasmModule> {
  if (!isBrowser) {
    throw new Error('Not running in Browser environment');
  }

  try {
    // Load wasm_exec.js dynamically
    await loadScript('/wasm/wasm_exec.js');

    // @ts-ignore
    const go = new Go();

    // Use fetch + instantiateStreaming for better performance
    const wasmResponse = await fetch('/wasm/beve.wasm');
    const wasmInstance = await globalThis.WebAssembly.instantiateStreaming(wasmResponse, go.importObject);

    // Run Go runtime
    go.run(wasmInstance.instance);

    // Wait for beveWasm global
    await waitForGlobal('beveWasm', 5000);

    // @ts-ignore
    return globalThis.beveWasm;
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to load WASM in Browser: ${err.message}`);
  }
}

/**
 * Helper: Load script tag in browser
 */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.document === 'undefined') {
      reject(new Error('document not available'));
      return;
    }
    const script = globalThis.document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    globalThis.document.head.appendChild(script);
  });
}

/**
 * Helper: Wait for global variable to be defined
 */
function waitForGlobal(varName: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkInterval = setInterval(() => {
      // @ts-ignore
      if (globalThis[varName]) {
        clearInterval(checkInterval);
        resolve();
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(checkInterval);
        reject(new Error(`Timeout waiting for ${varName} (${timeoutMs}ms)`));
      }
    }, 50);
  });
}

/**
 * Get WASM module - lazy loads on first call
 * Returns null if WASM not supported or failed to load
 */
export async function getWasmModule(): Promise<BeveWasmModule | null> {
  // Already loaded
  if (wasmModule) {
    return wasmModule;
  }

  // Already tried and failed
  if (wasmLoadAttempted) {
    return null;
  }

  // No WASM support
  if (!hasWasmSupport) {
    wasmLoadAttempted = true;
    wasmLoadError = new Error('WebAssembly not supported in this environment');
    return null;
  }

  wasmLoadAttempted = true;

  try {
    if (isNode) {
      wasmModule = await loadWasmNode();
    } else if (isBrowser) {
      wasmModule = await loadWasmBrowser();
    } else if (isDeno) {
      // TODO: Add Deno support if needed
      throw new Error('Deno WASM loading not yet implemented');
    } else {
      throw new Error('Unknown runtime environment');
    }

    return wasmModule;
  } catch (error) {
    const err = error as Error;
    wasmLoadError = err;
    console.warn('[BEVE] WASM load failed, falling back to TypeScript:', err.message);
    return null;
  }
}

/**
 * Check if WASM is available (synchronous check after load attempt)
 */
export function isWasmAvailable(): boolean {
  return wasmModule !== null;
}

/**
 * Get WASM load error (if any)
 */
export function getWasmLoadError(): Error | null {
  return wasmLoadError;
}

/**
 * Get diagnostic info about WASM support
 */
export function getWasmDiagnostics() {
  return {
    hasWasmSupport,
    isNode,
    isBrowser,
    isDeno,
    wasmLoadAttempted,
    wasmLoaded: wasmModule !== null,
    error: wasmLoadError?.message || null,
  };
}

/**
 * Reset cached WASM state (used when forcing TypeScript fallback)
 */
export function resetWasmModule() {
  wasmModule = null;
  wasmLoadAttempted = false;
  wasmLoadError = null;
}
