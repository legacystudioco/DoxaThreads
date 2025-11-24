"use client";

import { useState, useEffect } from "react";

interface Order {
  id: string;
  email: string;
  status: string;
  label_status: string | null;
  total_cents: number;
  shipping_address: any;
  created_at: string;
}

export default function ManualLabelsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/admin/manual-labels");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const purchaseLabel = async (orderId: string) => {
    if (!confirm("Purchase shipping label for this order?")) return;

    setProcessing(orderId);
    try {
      const res = await fetch("/api/admin/manual-labels/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });

      const data = await res.json();

      if (data.success) {
        alert("Label purchased successfully!");
        loadOrders();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Manual Label Purchase</h1>

      {orders.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-neutral-600">No orders require manual labels</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">
                      Order #{order.id.slice(0, 8)}
                    </h3>
                    <span className="px-2 py-1 bg-neutral-100 text-neutral-800 text-xs rounded">
                      {order.label_status || order.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-neutral-600 space-y-1">
                    <p>
                      <strong>Customer:</strong> {order.email}
                    </p>
                    <p>
                      <strong>Total:</strong> ${(order.total_cents / 100).toFixed(2)}
                    </p>
                    <p>
                      <strong>Shipping To:</strong>{" "}
                      {order.shipping_address?.city}, {order.shipping_address?.state}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => purchaseLabel(order.id)}
                  disabled={processing === order.id}
                  className="btn btn-sm"
                >
                  {processing === order.id ? (
                    "Purchasing..."
                  ) : (
                    "Purchase Label"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
