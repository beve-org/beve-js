import type { getImplementationInfo } from './adaptive';

declare global {
  interface BeveGlobal {
    encode(value: any): Uint8Array;
    decode(bytes: Uint8Array): any;
    encodeAsync(value: any): Promise<Uint8Array>;
    decodeAsync(bytes: Uint8Array): Promise<any>;
    init(): Promise<boolean>;
    info(): ReturnType<typeof getImplementationInfo>;
    disable(): void;
  }

  // eslint-disable-next-line vars-on-top, no-var
  var beve: BeveGlobal;
}

export {};
