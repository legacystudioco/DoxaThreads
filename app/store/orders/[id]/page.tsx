

import { createClient } from "@/lib/db";

export default async function OrderStatus({ params }: { params: { id: string } }) {
  const supa = createClient();
  const { data: order } = await supa.from("orders").select("*").eq("id", params.id).single();
  if (!order) return <div className="card">Order not found.</div>;

  const { data: items } = await supa
    .from("order_items")
    .select("*")
    .eq("order_id", params.id);

  const timeline = [
    { k: "PAID", label: "Paid" },
    { k: "LABEL_PURCHASED", label: "Label purchased" },
    { k: "RECEIVED_BY_PRINTER", label: "Received by printer" },
    { k: "SHIPPED", label: "Shipped" }
  ];

  return (
    <main className="grid gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Order Status</h1>
        <span className="badge-outline font-mono">{order.id.slice(0, 8)}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <h2 className="font-bold uppercase tracking-wider mb-4">Progress</h2>
          <div className="space-y-3">
            {timeline.map((t) => {
              const reached = order.status === t.k || (order.status as string) > t.k;
              return (
                <div key={t.k} className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      reached ? "bg-black" : "bg-neutral-300"
                    }`}
                  />
                  <span className="font-medium">{t.label}</span>
                </div>
              );
            })}
          </div>

          {order.tracking_number && (
            <div className="mt-6">
              <h3 className="font-bold mb-2">Tracking</h3>
              <a
                className="btn w-max"
                href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.tracking_number}`}
                target="_blank"
              >
                Track shipment
              </a>
              <p className="text-sm text-neutral-600 mt-2">
                {order.carrier ? `${order.carrier} • ${order.service || ""}` : ""}
              </p>
            </div>
          )}

          {order.label_status === "MANUAL_REQUIRED" && (
            <div className="alert-warning mt-4">
              <p className="text-sm font-medium">
                Shipping label requires manual creation. We&apos;ll email tracking as soon as it&apos;s ready.
              </p>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-bold uppercase tracking-wider mb-4">Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Status</span>
              <span className="font-medium">{order.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Subtotal</span>
              <span>${(order.subtotal_cents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Shipping</span>
              <span>${(order.shipping_cents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Tax</span>
              <span>${(order.tax_cents / 100).toFixed(2)}</span>
            </div>
            <div className="border-t border-neutral-200 pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>${(order.total_cents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {items && items.length > 0 && (
        <div className="card">
          <h2 className="font-bold uppercase tracking-wider mb-4">Items</h2>
          <div className="space-y-3">
            {items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <div className="font-medium">{item.product_title}</div>
                  {item.size && <div className="text-neutral-600">Size {item.size}</div>}
                </div>
                <div className="text-right">
                  <div className="text-neutral-600">Qty: {item.qty}</div>
                  <div className="font-medium">${((item.unit_price_cents * item.qty) / 100).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
