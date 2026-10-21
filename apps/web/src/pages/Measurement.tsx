import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  ShieldCheck,
  X,
  Plus,
  Minus,
  ShoppingBag,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Tag, SectionHead } from "../components/UI";
import { useDialog } from "../hooks";
import {
  buildEvent,
  catalog,
  deliver,
  setAnalyticsConsent,
  validateEvent,
} from "../measurement";
import type { DemoEvent, Item, EventName } from "../measurement";
import { download } from "../export";
export default function Measurement() {
  const [consent, setConsent] = useState(
    () => localStorage.getItem("analytics-consent") === "true",
  );
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [cart, setCart] = useState<Item[]>([]);
  const [product, setProduct] = useState<Item | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [transaction, setTransaction] = useState("");
  const [selected, setSelected] = useState<DemoEvent | null>(null);
  const [tab, setTab] = useState("Storefront");
  useDialog(Boolean(product || checkout), () => {
    setProduct(null);
    setCheckout(false);
  });
  const emit = (name: EventName, items: Item[] = [], txn?: string) => {
    const e = deliver(buildEvent(name, items, txn), consent);
    setEvents((old) => [e, ...old].slice(0, 100));
    return e;
  };
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      emit("page_view");
      emit("view_item_list", catalog);
    }
  }, []); // Explicit one-time sandbox entry; consent-gated delivery.
  function accept(allow: boolean) {
    setConsent(allow);
    setAnalyticsConsent(allow);
  }
  function add(item: Item) {
    emit("add_to_cart", [item]);
    setCart((c) =>
      c.some((x) => x.item_id === item.item_id)
        ? c.map((x) =>
            x.item_id === item.item_id ? { ...x, quantity: x.quantity + 1 } : x,
          )
        : [...c, item],
    );
    setTransaction("");
  }
  function remove(item: Item) {
    emit("remove_from_cart", [{ ...item, quantity: 1 }]);
    setCart((c) =>
      c
        .map((x) =>
          x.item_id === item.item_id ? { ...x, quantity: x.quantity - 1 } : x,
        )
        .filter((x) => x.quantity > 0),
    );
  }
  const total = cart.reduce((n, i) => n + i.price * i.quantity, 0);
  return (
    <>
      <SectionHead
        number="02"
        title="Measure what matters."
        detail="A real ecommerce event contract. A deliberately imaginary store."
      />
      <div className="notice">
        <ShieldCheck size={18} />
        <span>
          FIRST-PARTY DEMO EVENTS · Local QA is visible without consent.
          Analytics delivery is {consent ? "enabled to dataLayer" : "blocked"}.
          GTM{" "}
          {import.meta.env.VITE_GTM_ID
            ? "configured; verify in Tag Assistant"
            : "not configured"}
          .
        </span>
        <button className="button small" onClick={() => accept(!consent)}>
          {consent ? "Revoke analytics consent" : "Allow analytics"}
        </button>
      </div>
      <div className="tabs" role="tablist">
        {["Storefront", "Event taxonomy"].map((t) => (
          <button
            role="tab"
            aria-selected={tab === t}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Event taxonomy" ? (
        <div className="white-panel">
          <h3>One contract. Eight events.</h3>
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Required contract</th>
              </tr>
            </thead>
            <tbody>
              {[
                "page_view",
                "view_item_list",
                "select_item",
                "view_item",
                "add_to_cart",
                "remove_from_cart",
                "begin_checkout",
                "purchase",
              ].map((n) => (
                <tr key={n}>
                  <td>
                    <code>{n}</code>
                  </td>
                  <td>
                    {n === "page_view"
                      ? "page_path"
                      : n === "purchase"
                        ? "currency, value, items, unique transaction_id"
                        : "currency, value, items"}{" "}
                    · debug_mode · demo source
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">
            All money is illustrative USD. Checkout takes no personal data or
            payment. Ecommerce state is cleared before each dataLayer event; GTM
            is the only Google delivery path.
          </p>
        </div>
      ) : (
        <div className="measurement-grid">
          <section className="store">
            <div className="store-header">
              <div>
                <span className="eyebrow">THE DEMO STORE</span>
                <h3>Objects with intention.</h3>
              </div>
              <ShoppingBag size={22} />
            </div>
            <div className="products">
              {catalog.map((item, i) => (
                <article className="product" key={item.item_id}>
                  <button
                    className={`product-art object-${i}`}
                    aria-label={`View ${item.item_name}`}
                    onClick={() => {
                      emit("select_item", [item]);
                      emit("view_item", [item]);
                      setProduct(item);
                    }}
                  >
                    <span className="product-shape">
                      <span>!</span>
                    </span>
                    <ArrowUpRight size={18} />
                  </button>
                  <div className="product-info">
                    <h4>{item.item_name}</h4>
                    <span>${item.price}</span>
                  </div>
                  <button className="button small" onClick={() => add(item)}>
                    Add to cart <Plus size={14} />
                  </button>
                </article>
              ))}
            </div>
            <div className="cart">
              <h4>
                Your demo cart{" "}
                <span>{cart.reduce((n, i) => n + i.quantity, 0)} items</span>
              </h4>
              {!cart.length ? (
                <p className="muted">
                  Add an object to explore the event journey.
                </p>
              ) : (
                <>
                  {cart.map((i) => (
                    <div className="cart-row" key={i.item_id}>
                      <span>
                        {i.item_name} × {i.quantity}
                      </span>
                      <span>${i.price * i.quantity}</span>
                      <button
                        className="icon-button"
                        aria-label={`Remove one ${i.item_name}`}
                        onClick={() => remove(i)}
                      >
                        <Minus size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    className="button black"
                    onClick={() => {
                      emit("begin_checkout", cart);
                      setCheckout(true);
                    }}
                  >
                    Demo checkout · ${total} <ArrowRight size={16} />
                  </button>
                </>
              )}
              {transaction && (
                <div className="success" role="status">
                  <CheckCircle2 size={18} />
                  Demo purchase recorded. {transaction}
                </div>
              )}
            </div>
          </section>
          <section className="event-console">
            <div className="chart-title">
              <div>
                <span className="eyebrow">MEASUREMENT QA</span>
                <h3>The event trail.</h3>
              </div>
              <Tag tone="dark">LOCAL QA</Tag>
            </div>
            <div className="console-actions">
              <span>
                {events.length} events ·{" "}
                {events.filter((e) => !validateEvent(e).length).length} valid
              </span>
              <button
                className="icon-button"
                onClick={() =>
                  download(
                    "demo-events.json",
                    JSON.stringify(events, null, 2),
                    "application/json",
                  )
                }
                aria-label="Download event trail"
              >
                <Download size={17} />
              </button>
              <button
                className="icon-button"
                onClick={() => {
                  setEvents([]);
                  setSelected(null);
                }}
                aria-label="Clear event trail"
              >
                <RefreshCw size={17} />
              </button>
            </div>
            <div className="event-list">
              {events.map((e, i) => (
                <button
                  key={i}
                  className={`event-row ${selected === e ? "selected" : ""}`}
                  onClick={() => setSelected(e)}
                >
                  <Check size={14} />
                  <code>{e.event}</code>
                  <span>{e.ecommerce ? `$${e.ecommerce.value}` : "/"}</span>
                  <ChevronDown size={14} />
                </button>
              ))}
              {!events.length && (
                <p>Interact with the store to record an event.</p>
              )}
            </div>
            <pre aria-label="Selected event payload">
              {selected
                ? JSON.stringify(selected, null, 2)
                : "// Select an event to inspect its schema.\n// No analytics request before consent.\n// No actual GA4 validation claimed."}
            </pre>
          </section>
        </div>
      )}
      {product && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-title"
            className="modal"
          >
            <button
              className="icon-button close"
              aria-label="Close product"
              onClick={() => setProduct(null)}
            >
              <X />
            </button>
            <span className="eyebrow">DEMO CATALOG / {product.item_id}</span>
            <h2 id="product-title">{product.item_name}</h2>
            <p>
              A synthetic product for testing the measurement journey. No order
              will be placed.
            </p>
            <strong>${product.price} USD</strong>
            <button
              className="button black"
              onClick={() => {
                add(product);
                setProduct(null);
              }}
            >
              Add to cart <Plus size={16} />
            </button>
          </section>
        </div>
      )}
      {checkout && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
            className="modal"
          >
            <button
              className="icon-button close"
              aria-label="Close checkout"
              onClick={() => setCheckout(false)}
            >
              <X />
            </button>
            <span className="eyebrow">DEMO CHECKOUT / NO PAYMENT</span>
            <h2 id="checkout-title">Make it measurable.</h2>
            <p>
              No payment details. No personal information. A unique synthetic
              transaction only.
            </p>
            <strong>${total} USD</strong>
            <button
              className="button red"
              onClick={() => {
                const id = "demo-" + crypto.randomUUID();
                emit("purchase", cart, id);
                setTransaction(id);
                setCart([]);
                setCheckout(false);
              }}
            >
              Complete demo purchase <Check size={16} />
            </button>
          </section>
        </div>
      )}
    </>
  );
}
