/** Logos are the same files the dashboard's Setting → Payment shows. Cash on Delivery has none, so it gets an icon. */
export const payments: { name: string; logo?: string; w: number; big?: boolean }[] = [
  { name: "Cash on Delivery", w: 0 },
  { name: "eSewa", logo: "/pay/esewa.webp", w: 320 },
  { name: "Khalti", logo: "/pay/khalti.webp", w: 249 },
  { name: "Fonepay", logo: "/pay/fonepay.webp", w: 333 },
  { name: "Fonepay QR", logo: "/pay/fonepay_dynamic.webp", w: 97, big: true },
  { name: "Checkout by Fonepay", logo: "/pay/checkout-fonepay.webp", w: 309 },
  { name: "NPX", logo: "/pay/npx.webp", w: 218 },
  { name: "Nabil card", logo: "/pay/ncard.webp", w: 174 },
];

/** Couriers Blanxer is already connected to (the dashboard's logistics plugins, same logo files). */
export const couriers: { name: string; logo: string; w: number; h?: number }[] = [
  { name: "Pathao Parcel", logo: "/ship/pathao.webp", w: 274 },
  { name: "Nepal Can Move", logo: "/ship/ncm.webp", w: 237 },
  { name: "Dash Logistics", logo: "/ship/dash.webp", w: 260 },
  { name: "Upaya Logistics", logo: "/ship/upaya.svg", w: 136, h: 36 },
  { name: "Hello Service", logo: "/ship/hello_service.webp", w: 158 },
  { name: "Pick and Drop", logo: "/ship/pickndrop.webp", w: 147 },
  { name: "Fab Bud", logo: "/ship/fabbud.webp", w: 127 },
  { name: "Daraz Express", logo: "/ship/daraz_express.webp", w: 164 },
  { name: "Expo Express", logo: "/ship/expo_express.webp", w: 516 },
];

