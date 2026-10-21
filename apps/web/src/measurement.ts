export type EventName =
  | "page_view"
  | "view_item_list"
  | "select_item"
  | "view_item"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "purchase";
export interface Item {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
}
export interface DemoEvent {
  event: EventName;
  source_id: "first_party_demo";
  debug_mode: true;
  campaign: Record<string, string>;
  page_path?: string;
  ecommerce?: {
    currency: "USD";
    value: number;
    items: Item[];
    transaction_id?: string;
  };
  qa_delivery?: string;
}
declare global {
  interface Window {
    dataLayer: unknown[];
    __gtmLoaded?: boolean;
    __consentDefaulted?: boolean;
  }
}
export const catalog: Item[] = [
  {
    item_id: "object-01",
    item_name: "Signal notebook",
    price: 24,
    quantity: 1,
  },
  { item_id: "object-02", item_name: "Everyday tote", price: 32, quantity: 1 },
  { item_id: "object-03", item_name: "Studio vessel", price: 40, quantity: 1 },
];
export function validateEvent(e: DemoEvent): string[] {
  const errors: string[] = [];
  if (e.source_id !== "first_party_demo" || e.debug_mode !== true)
    errors.push("Demo source and debug flag required");
  if (
    ![
      "page_view",
      "view_item_list",
      "select_item",
      "view_item",
      "add_to_cart",
      "remove_from_cart",
      "begin_checkout",
      "purchase",
    ].includes(e.event)
  )
    errors.push("Unknown event");
  if (e.event === "page_view") {
    if (!e.page_path?.startsWith("/")) errors.push("Page path required");
    return errors;
  }
  const ec = e.ecommerce;
  if (
    !ec ||
    ec.currency !== "USD" ||
    !Number.isFinite(ec.value) ||
    ec.value < 0 ||
    !ec.items.length
  )
    return [...errors, "Valid currency, value and items required"];
  for (const i of ec.items)
    if (
      !i.item_id ||
      !i.item_name ||
      i.price < 0 ||
      !Number.isFinite(i.price) ||
      !Number.isInteger(i.quantity) ||
      i.quantity <= 0
    )
      errors.push("Invalid item");
  if (
    Math.abs(
      ec.value - ec.items.reduce((n, i) => n + i.price * i.quantity, 0),
    ) > 0.001
  )
    errors.push("Value does not match items");
  if (e.event === "purchase" && !ec.transaction_id?.startsWith("demo-"))
    errors.push("Unique demo transaction required");
  return errors;
}
export function campaignTags(search: string): Record<string, string> {
  const params = new URLSearchParams(search),
    tags: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
    const v = params.get(key);
    if (v && /^[a-zA-Z0-9_-]{1,64}$/.test(v)) tags[key] = v;
  }
  return tags;
}
export function buildEvent(
  event: EventName,
  items: Item[] = [],
  transaction?: string,
): DemoEvent {
  let tags: Record<string, string> = {};
  try {
    const current = campaignTags(location.search);
    if (Object.keys(current).length)
      sessionStorage.setItem("demo-campaign", JSON.stringify(current));
    tags = JSON.parse(sessionStorage.getItem("demo-campaign") || "{}");
  } catch {
    /* storage disabled; no identity fallback */
  }
  const e: DemoEvent = {
    event,
    source_id: "first_party_demo",
    debug_mode: true,
    campaign: tags,
  };
  if (event === "page_view") e.page_path = "/measurement/demo-store";
  else
    e.ecommerce = {
      currency: "USD",
      value: items.reduce((n, i) => n + i.price * i.quantity, 0),
      items: items.map((i) => ({ ...i })),
      ...(transaction ? { transaction_id: transaction } : {}),
    };
  const errors = validateEvent(e);
  if (errors.length) throw new Error(errors.join("; "));
  return e;
}
export function deliver(e: DemoEvent, consent: boolean): DemoEvent {
  if (validateEvent(e).length)
    throw new Error("Invalid event cannot be delivered");
  if (consent) {
    window.dataLayer = window.dataLayer || [];
    if (e.ecommerce) window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push(e);
  }
  return {
    ...e,
    qa_delivery: consent
      ? "dataLayer (GTM only if configured)"
      : "Local QA only — not delivered",
  };
}
export function setAnalyticsConsent(allow: boolean): void {
  localStorage.setItem("analytics-consent", String(allow));
  window.dataLayer = window.dataLayer || [];
  // GTM consent commands require an Arguments object, per the Google tag contract.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const command = function (...args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  if (!window.__consentDefaulted) {
    command("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.__consentDefaulted = true;
  }
  command("consent", "update", {
    analytics_storage: allow ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  const id = import.meta.env.VITE_GTM_ID;
  if (allow && /^GTM-[A-Z0-9]+$/.test(id || "") && !window.__gtmLoaded) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
    script.async = true;
    document.head.append(script);
    window.__gtmLoaded = true;
  }
}
