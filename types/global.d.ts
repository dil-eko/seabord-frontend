// types/global.d.ts

// Extend the Window interface to include dataLayer
declare global {
  interface Window {
    dataLayer: any[];
  }
}

// This line makes sure the file is treated as a module
export {};