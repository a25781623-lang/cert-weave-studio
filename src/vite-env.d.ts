/// <reference types="vite/client" />
interface Window {
  ethereum?: any
}
interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS: string;
  // you can add other VITE_ variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
declare module 'crypto-browserify';
