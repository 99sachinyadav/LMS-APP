const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "";
const CURRENCY = process.env.EXPO_PUBLIC_CURRENCY || "$";
const CHECKOUT_ORIGIN =
  process.env.EXPO_PUBLIC_CHECKOUT_ORIGIN || "https://example.com";

export const env = {
  backendUrl: BACKEND_URL,
  currency: CURRENCY,
  checkoutOrigin: CHECKOUT_ORIGIN,
};
