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
let wasmExecLoadedPromise: Promise<void> | null = null;

function getImportMetaUrlSafe(): string | null {
  try {
    const meta = (0, eval)('import.meta.url');
    return typeof meta === 'string' ? meta : null;
  } catch {
    return null;
  }
}

/**
 * Get current file directory
 * Works differently in ESM vs CJS, use environment detection
 */
function getCurrentDir(): string {
  // Prefer CommonJS __dirname when available
  if (typeof __dirname !== 'undefined') {
    // @ts-ignore - __dirname exists in CJS builds
    return __dirname;
  }

  // In ESM builds, derive directory from import.meta.url
  const importMetaUrl = getImportMetaUrlSafe();
  if (importMetaUrl) {
    try {
      const metaUrl = new URL(importMetaUrl);
      if (metaUrl.protocol === 'file:') {
        const decoded = decodeURIComponent(metaUrl.pathname);
        const normalized = decoded.replace(/^\/+([A-Za-z]:)/, '$1');
        return path.dirname(normalized);
      }
      return path.dirname(metaUrl.pathname);
    } catch {
      /* noop */
    }
  }

  // Fallback to process.cwd() as a last resort
  return typeof process !== 'undefined' && typeof process.cwd === 'function'
    ? process.cwd()
    : '.';
}

function resolveExistingPath(candidates: string[]): string | null {
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // Ignore filesystem errors and continue to next candidate
    }
  }
  return null;
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
    const rootCandidates = Array.from(
      new Set(
        [
          dirname,
          path.resolve(dirname, '..'),
          typeof process !== 'undefined' && typeof process.cwd === 'function' ? process.cwd() : undefined,
        ].filter((root): root is string => typeof root === 'string')
      )
    );

    const wasmPathCandidates = rootCandidates.map((root) => path.join(root, 'wasm/beve.wasm'));
    const wasmPath = resolveExistingPath(wasmPathCandidates);

    if (!wasmPath) {
      throw new Error(
        `WASM file not found. Tried:\n${wasmPathCandidates.join('\n')}`
      );
    }

    const wasmDir = path.dirname(wasmPath);
    const wasmExecCandidates = [
      path.join(wasmDir, 'wasm_exec.js'),
      ...rootCandidates.map((root) => path.join(root, 'wasm/wasm_exec.js')),
    ];
    const wasmExecPath = resolveExistingPath(wasmExecCandidates);

    if (!wasmExecPath) {
      throw new Error(
        `wasm_exec.js not found. Tried:\n${wasmExecCandidates.join('\n')}`
      );
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
    const wasmExecUrl = resolveBrowserAssetUrl('wasm_exec.js');
    await ensureGoRuntime(wasmExecUrl);

    // @ts-ignore - Go provided by wasm_exec runtime
    const go = new Go();

    const wasmUrl = resolveBrowserAssetUrl('beve.wasm');
    const wasmResponse = await fetch(wasmUrl);
    if (!wasmResponse.ok) {
      throw new Error(`Failed to fetch WASM binary: ${wasmResponse.status} ${wasmResponse.statusText}`);
    }

    const wasmBuffer = await wasmResponse.arrayBuffer();
    const wasmInstance = await globalThis.WebAssembly.instantiate(wasmBuffer, go.importObject);

    // Run Go runtime (async, doesn't block)
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

function resolveBrowserAssetUrl(filename: string): string {
  if (isBrowser) {
    const doc = globalThis.document as { currentScript?: { src?: string } | null; getElementsByTagName?: (tag: string) => ArrayLike<{ src?: string }> } | undefined;

    const hintedBase = (globalThis as { __BEVE_BASE_URL__?: string }).__BEVE_BASE_URL__;
    if (hintedBase) {
      return normalizeBaseUrl(hintedBase) + filename;
    }

    const currentScript = doc?.currentScript;
    if (currentScript?.src) {
      return new URL(`./wasm/${filename}`, currentScript.src).toString();
    }

    const scripts = doc?.getElementsByTagName?.('script');
    if (scripts && scripts.length > 0) {
      for (let i = scripts.length - 1; i >= 0; i -= 1) {
        const scriptSrc = scripts[i]?.src;
        if (scriptSrc) {
          if (scriptSrc.includes('/beve')) {
            return new URL(`./wasm/${filename}`, scriptSrc).toString();
          }
          if (i === scripts.length - 1) {
            return new URL(`./wasm/${filename}`, scriptSrc).toString();
          }
        }
      }
    }
  }

  return `/wasm/${filename}`;
}

function normalizeBaseUrl(base: string): string {
  if (!base) {
    return '';
  }
  return base.endsWith('/') ? base : `${base}/`;
}

async function ensureGoRuntime(wasmExecUrl: string): Promise<void> {
  if (typeof globalThis.Go === 'function') {
    return;
  }

  if (!wasmExecLoadedPromise) {
    wasmExecLoadedPromise = (async () => {
      try {
        if (typeof fetch === 'function') {
          const response = await fetch(wasmExecUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch wasm_exec.js: ${response.status} ${response.statusText}`);
          }
          const source = await response.text();
          const loader = new Function('globalThis', `${source}\nreturn globalThis.Go;`);
          loader(globalThis);
        } else {
          await loadScript(wasmExecUrl);
        }

        if (typeof globalThis.Go !== 'function') {
          throw new Error('Go runtime did not initialize');
        }
      } catch (error) {
        wasmExecLoadedPromise = null;
        throw error;
      }
    })();
  }

  await wasmExecLoadedPromise;
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
