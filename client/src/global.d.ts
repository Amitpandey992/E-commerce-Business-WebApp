export {};

declare global {
  interface Window {
    Razorpay: new (options: unknown) => { open: () => void };
  }
}


