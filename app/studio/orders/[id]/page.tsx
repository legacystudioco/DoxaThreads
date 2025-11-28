"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OrderItem {
  id: string;
  product_title: string;
  size: string;
  qty: number;
  unit_price_cents: number;
  blank_cost_cents_snapshot: number;
  print_cost_cents_snapshot: number;
}

interface Order {
  id: string;
  email: string;
  shipping_address: any;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  status: string;
  printer_payable_status: string;
  tracking_number: string | null;
  carrier: string | null;
  service: string | null;
  label_url: string | null;
  shippo_transaction_id: string | null;
  created_at: string;
  updated_at?: string;
}

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("USPS");

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  async function fetchOrder() {
    try {
      console.log('Fetching order:', params.id);
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to fetch order:', res.status, errorText);
        throw new Error("Failed to fetch order");
      }
      
      const data = await res.json();
      console.log('Order data received:', data);
      
      setOrder(data.order);
      setItems(data.items);
      setTrackingNumber(data.order.tracking_number || "");
      setCarrier(data.order.carrier || "USPS");
    } catch (error) {
      console.error("Error fetching order:", error);
      alert("Failed to load order");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    const confirmMessages: Record<string, string> = {
      PAID: "Mark this order as PAID?",
      LABEL_PURCHASED: "Mark as LABEL PURCHASED?",
      RECEIVED_BY_PRINTER: "Mark as RECEIVED BY PRINTER?",
      SHIPPED: "Mark this order as SHIPPED? This will send a shipping notification to the customer.",
      DELIVERED: "Mark this order as DELIVERED?",
      CANCELLED: "⚠️ CANCEL this order? This action will notify the customer.",
    };

    if (!confirm(confirmMessages[newStatus] || `Change status to ${newStatus}?`)) {
      return;
    }

    setUpdating(true);
    try {
      console.log('Updating status to:', newStatus);
      const res = await fetch("/api/admin/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: params.id, status: newStatus }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to update status:', res.status, errorText);
        throw new Error("Failed to update status");
      }

      const result = await res.json();
      console.log('Status update result:', result);

      // Refetch the order to get the updated data
      await fetchOrder();
      
      alert("✅ Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("❌ Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  async function updateTracking() {
    if (!trackingNumber.trim()) {
      alert("Please enter a tracking number");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch("/api/admin/orders/update-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: params.id,
          trackingNumber: trackingNumber.trim(),
          carrier: carrier,
        }),
      });

      if (!res.ok) throw new Error("Failed to update tracking");

      await fetchOrder();
      setShowTrackingForm(false);
      alert("✅ Tracking information updated!");
    } catch (error) {
      console.error("Error updating tracking:", error);
      alert("❌ Failed to update tracking information");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-xl mb-4">Order not found</p>
          <Link href="/studio/orders" className="btn">
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-800",
    PAID: "bg-green-100 text-green-800",
    LABEL_PURCHASED: "bg-blue-100 text-blue-800",
    RECEIVED_BY_PRINTER: "bg-purple-100 text-purple-800",
    SHIPPED: "bg-cyan-100 text-cyan-800",
    DELIVERED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const statusLabels: Record<string, string> = {
    PENDING: "Pending",
    PAID: "Paid",
    LABEL_PURCHASED: "Label Purchased",
    RECEIVED_BY_PRINTER: "In Production",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };

  const totalPrinterCost =
    items.reduce(
      (sum, item) =>
        sum +
        (item.blank_cost_cents_snapshot + item.print_cost_cents_snapshot) *
          item.qty,
      0
    ) / 100 + 5;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/studio/orders"
          className="text-sm hover:underline mb-4 inline-block"
        >
          ← Back to Orders
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Order #{order.id.slice(0, 8)}
            </h1>
            <p className="text-neutral-600">
              Placed on {new Date(order.created_at).toLocaleDateString()} at{" "}
              {new Date(order.created_at).toLocaleTimeString()}
            </p>
          </div>
          <div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                statusColors[order.status] || "bg-gray-100 text-gray-800"
              }`}
            >
              {statusLabels[order.status] || order.status}
            </span>
          </div>
        </div>
      </div>

      {/* Status Management */}
      <div className="mb-8 p-6 bg-white border-2 border-black shadow-lg">
        <h2 className="text-xl font-bold mb-4">📋 Order Management</h2>
        
      <div className="mb-4 p-4 bg-neutral-100 border border-brand-accent rounded">
          <p className="text-sm text-blue-800">
            <strong>Current Status:</strong> {statusLabels[order.status] || order.status}
          </p>
        </div>

        <h3 className="font-semibold mb-2 text-sm text-neutral-600">Update Order Status:</h3>
        {updating && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
            ⏳ Updating order status...
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
          <button
            onClick={() => updateStatus("PAID")}
            disabled={updating || order.status === "CANCELLED"}
            className={`text-white text-xs py-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              order.status === "PAID" 
                ? "bg-green-800 ring-2 ring-green-400" 
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {order.status === "PAID" ? "✓ Currently Paid" : "✓ Mark as Paid"}
          </button>
          <button
            onClick={() => updateStatus("LABEL_PURCHASED")}
            disabled={updating || order.status === "CANCELLED"}
            className={`text-white text-xs py-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              order.status === "LABEL_PURCHASED" 
                ? "bg-blue-800 ring-2 ring-blue-400" 
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {order.status === "LABEL_PURCHASED" ? "✓ Label Purchased" : "🏷️ Label Purchased"}
          </button>
          <button
            onClick={() => updateStatus("RECEIVED_BY_PRINTER")}
            disabled={updating || order.status === "CANCELLED"}
            className={`text-white text-xs py-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              order.status === "RECEIVED_BY_PRINTER" 
                ? "bg-purple-800 ring-2 ring-purple-400" 
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {order.status === "RECEIVED_BY_PRINTER" ? "✓ In Production" : "📦 Received by Printer"}
          </button>
          <button
            onClick={() => updateStatus("SHIPPED")}
            disabled={updating || order.status === "CANCELLED"}
            className={`text-white text-xs py-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              order.status === "SHIPPED" 
                ? "bg-cyan-800 ring-2 ring-cyan-400" 
                : "bg-cyan-600 hover:bg-cyan-700"
            }`}
          >
            {order.status === "SHIPPED" ? "✓ Shipped" : "🚚 Mark as Shipped"}
          </button>
          <button
            onClick={() => updateStatus("DELIVERED")}
            disabled={updating || order.status === "CANCELLED"}
            className={`text-white text-xs py-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              order.status === "DELIVERED" 
                ? "bg-emerald-800 ring-2 ring-emerald-400" 
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {order.status === "DELIVERED" ? "✓ Delivered" : "✅ Mark as Delivered"}
          </button>
        </div>

        {/* Tracking Information Management */}
        <div className="border-t pt-4 mt-4">
          <h3 className="font-semibold mb-2 text-sm text-neutral-600">Tracking Information:</h3>
          {!showTrackingForm ? (
            <button
              onClick={() => setShowTrackingForm(true)}
              disabled={updating || order.status === "CANCELLED"}
              className="bg-neutral-700 hover:bg-neutral-800 text-white text-xs py-2 px-4 disabled:opacity-50 transition-colors"
            >
              {order.tracking_number ? "📝 Update Tracking" : "➕ Add Tracking"}
            </button>
          ) : (
            <div className="bg-neutral-50 p-4 border border-neutral-200 rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm"
                    placeholder="Enter tracking number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Carrier
                  </label>
                  <select
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm"
                  >
                    <option value="USPS">USPS</option>
                    <option value="UPS">UPS</option>
                    <option value="FedEx">FedEx</option>
                    <option value="DHL">DHL</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={updateTracking}
                  disabled={updating}
                  className="bg-black text-white text-xs py-2 px-4 disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Tracking Info"}
                </button>
                <button
                  onClick={() => setShowTrackingForm(false)}
                  disabled={updating}
                  className="bg-white border-2 border-black text-xs py-2 px-4 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cancel Order */}
        <div className="border-t pt-4 mt-4">
          <h3 className="font-semibold mb-2 text-sm text-neutral-600">Danger Zone:</h3>
          <button
            onClick={() => updateStatus("CANCELLED")}
            disabled={updating || order.status === "CANCELLED"}
            className="bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ❌ Cancel Order
          </button>
          {order.status === "CANCELLED" && (
            <p className="text-red-600 text-sm mt-2">This order has been cancelled.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="p-6 bg-white border-2 border-black">
            <h2 className="text-xl font-bold mb-4">👤 Customer Information</h2>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Email:</span>{" "}
                <a
                  href={`mailto:${order.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {order.email}
                </a>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="p-6 bg-white border-2 border-black">
            <h2 className="text-xl font-bold mb-4">📍 Shipping Address</h2>
            <div className="space-y-1 bg-neutral-50 p-4 rounded border border-neutral-200">
              <div className="font-semibold">{order.shipping_address?.name}</div>
              <div>{order.shipping_address?.line1}</div>
              {order.shipping_address?.line2 && (
                <div>{order.shipping_address.line2}</div>
              )}
              <div>
                {order.shipping_address?.city}, {order.shipping_address?.state}{" "}
                {order.shipping_address?.zip}
              </div>
              <div className="font-semibold">{order.shipping_address?.country}</div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="p-6 bg-white border-2 border-black">
            <h2 className="text-xl font-bold mb-4">🚚 Shipping Information</h2>
            {order.tracking_number ? (
              <div className="space-y-3">
                <div className="bg-neutral-50 border border-brand-accent p-3 rounded">
                  <div className="font-semibold text-green-800 mb-1">
                    Tracking Number:
                  </div>
                  <div className="text-lg font-mono">{order.tracking_number}</div>
                </div>
                {order.carrier && (
                  <div>
                    <span className="font-semibold">Carrier:</span> {order.carrier}
                  </div>
                )}
                {order.service && (
                  <div>
                    <span className="font-semibold">Service:</span> {order.service}
                  </div>
                )}
                {order.label_url && (
                  <div className="mt-4">
                    <a
                      href={order.label_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-black text-white px-4 py-2 text-sm hover:bg-neutral-800 transition-colors"
                    >
                      📄 View Shipping Label
                    </a>
                  </div>
                )}
                {order.carrier === "USPS" && order.tracking_number && (
                  <div className="mt-4">
                    <a
                      href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.tracking_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 transition-colors"
                    >
                      🔍 Track Package on USPS
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-neutral-100 border border-brand-accent p-4 rounded">
                <p className="text-yellow-800 text-sm">
                  No tracking information available yet. Add tracking above when the order ships.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Order Items */}
          <div className="p-6 bg-white border-2 border-black">
            <h2 className="text-xl font-bold mb-4">🛍️ Order Items</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="pb-4 border-b border-neutral-200 last:border-0"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold">{item.product_title}</div>
                      <div className="text-sm text-neutral-600">
                        Size: <span className="font-medium">{item.size}</span> •
                        Qty: <span className="font-medium">{item.qty}</span>
                      </div>
                      <div className="text-xs text-neutral-500 mt-1 bg-neutral-50 p-2 rounded">
                        <div>Blank Cost: ${(item.blank_cost_cents_snapshot / 100).toFixed(2)}</div>
                        <div>Print Cost: ${(item.print_cost_cents_snapshot / 100).toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-lg">
                        ${((item.unit_price_cents * item.qty) / 100).toFixed(2)}
                      </div>
                      <div className="text-xs text-neutral-600">
                        ${(item.unit_price_cents / 100).toFixed(2)} each
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-6 bg-white border-2 border-black">
            <h2 className="text-xl font-bold mb-4">💰 Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${(order.subtotal_cents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>${(order.shipping_cents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${(order.tax_cents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t-2 border-black font-bold text-lg">
                <span>Total:</span>
                <span>${(order.total_cents / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Printer Costs */}
          <div className="p-6 bg-neutral-100 border-2 border-black">
            <h2 className="text-xl font-bold mb-4">🖨️ Printer Cost Breakdown</h2>
            <div className="space-y-2 text-sm">
              {items.map((item) => {
                const itemCost =
                  (item.blank_cost_cents_snapshot +
                    item.print_cost_cents_snapshot) *
                  item.qty;
                return (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.product_title} ({item.size}) × {item.qty}
                    </span>
                    <span className="font-medium">${(itemCost / 100).toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="flex justify-between pt-2 border-t border-neutral-300">
                <span>Base Fee:</span>
                <span className="font-medium">$5.00</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-black font-bold text-base">
                <span>Total Printer Cost:</span>
                <span>${totalPrinterCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Profit Calculation */}
          <div className="p-6 bg-white border border-brand-accent">
            <h2 className="text-xl font-bold mb-4 text-green-900">
              💵 Profit Analysis
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Customer Total:</span>
                <span className="font-medium">
                  ${(order.total_cents / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-red-700">
                <span>Printer Cost:</span>
                <span className="font-medium">-${totalPrinterCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-green-600 font-bold text-base text-green-900">
                <span>Net Profit:</span>
                <span>
                  ${(order.total_cents / 100 - totalPrinterCost).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
