"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminTable } from "@/components/AdminTable";
import { createClient } from "@/lib/db";

type OrderStatus =
  | "ALL"
  | "PENDING"
  | "PAID"
  | "LABEL_PURCHASED"
  | "RECEIVED_BY_PRINTER"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

interface Order {
  id: string;
  email: string;
  total_cents: number;
  status: string;
  printer_payable_status: string;
  created_at: string;
}

const STATUS_FILTERS: { key: OrderStatus; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "PAID", label: "Paid" },
  { key: "LABEL_PURCHASED", label: "Label Purchased" },
  { key: "RECEIVED_BY_PRINTER", label: "In Production" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
];

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function StudioOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<OrderStatus>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders(activeFilter, orders);
  }, [activeFilter, orders]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const supa = createClient();
      const { data, error } = await supa
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }

  function filterOrders(filter: OrderStatus, source: Order[]) {
    if (filter === "ALL") {
      setFilteredOrders(source);
      return;
    }
    setFilteredOrders(source.filter((order) => order.status === filter));
  }

  function getStatusCount(status: OrderStatus): number {
    if (status === "ALL") return orders.length;
    return orders.filter((order) => order.status === status).length;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-neutral-600">
            View, filter, and manage all orders.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="text-sm border-2 border-black px-4 py-2 hover:bg-neutral-100"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b-2 border-black pb-4">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status.key}
            onClick={() => setActiveFilter(status.key)}
            className={`text-xs py-2 px-4 transition-colors ${
              activeFilter === status.key
                ? "bg-black text-white"
                : "bg-white text-black border-2 border-black hover:bg-neutral-100"
            }`}
          >
            {status.label} ({getStatusCount(status.key)})
          </button>
        ))}
      </div>

      <AdminTable
        emptyMessage="No orders found."
        data={filteredOrders}
        columns={[
          {
            key: "email",
            label: "Customer",
          },
          {
            key: "created_at",
            label: "Created",
            render: (val) =>
              val ? new Date(val as string).toLocaleString() : "—",
          },
          {
            key: "total_cents",
            label: "Total",
            render: (val) => formatCurrency(Number(val) || 0),
          },
          {
            key: "status",
            label: "Status",
            render: (val) => {
              const status = val as string;
              const statusStyles: Record<string, string> = {
                PENDING: "bg-gray-100 text-gray-800 border-gray-300",
                PAID: "bg-green-100 text-green-800 border-green-300",
                LABEL_PURCHASED: "bg-blue-100 text-blue-800 border-blue-300",
                RECEIVED_BY_PRINTER: "bg-purple-100 text-purple-800 border-purple-300",
                SHIPPED: "bg-cyan-100 text-cyan-800 border-cyan-300",
                DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-300",
                CANCELLED: "bg-red-100 text-red-800 border-red-300",
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

              return (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${
                    statusStyles[status] ||
                    "bg-gray-100 text-gray-800 border-gray-300"
                  }`}
                >
                  {statusLabels[status] || status}
                </span>
              );
            },
          },
          {
            key: "printer_payable_status",
            label: "Printer Status",
            render: (val) => {
              const status = val as string;
              if (status === "SETTLED") {
                return (
                  <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 border border-green-300">
                    Settled
                  </span>
                );
              }
              if (status === "BATCHED") {
                return (
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 border border-blue-300">
                    Batched
                  </span>
                );
              }
              return (
                <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800 border border-gray-300">
                  Unbatched
                </span>
              );
            },
          },
          {
            key: "id",
            label: "Actions",
            render: (val) => (
              <Link
                href={`/studio/orders/${val}`}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                View Details
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
