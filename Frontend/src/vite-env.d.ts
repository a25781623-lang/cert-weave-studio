/// <reference types="vite/client" />
/// <reference types="vite/client" />

interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    // We use 'unknown' instead of 'any' to satisfy strict linting
    request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
    on: (eventName: string, handler: (...args: unknown[]) => void) => void;
    removeListener: (eventName: string, handler: (...args: unknown[]) => void) => void;
  };
}
interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS: string;
  // you can add other VITE_ variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

