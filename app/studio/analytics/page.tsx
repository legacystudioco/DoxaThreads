"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/db";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  pendingOrders: number;
  todayRevenue: number;
  todayOrders: number;
  revenueByStatus: { status: string; revenue: number; count: number }[];
  topProducts: { product_name: string; quantity: number; revenue: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
  productionStats: {
    pending: number;
    inProduction: number;
    shipped: number;
    delivered: number;
  };
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function StudioAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const supa = createClient();

      // Calculate date range
      const now = new Date();
      let startDate: Date | null = null;
      if (timeRange === "7d") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === "30d") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Fetch all orders
      let ordersQuery = supa
        .from("orders")
        .select("*, order_items(*)");
      
      if (startDate) {
        ordersQuery = ordersQuery.gte("created_at", startDate.toISOString());
      }

      const { data: orders, error: ordersError } = await ordersQuery;

      if (ordersError) throw ordersError;

      // Calculate basic metrics
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_cents || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Today's metrics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders?.filter(o => new Date(o.created_at) >= today) || [];
      const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total_cents || 0), 0);

      // Pending orders (PAID status)
      const pendingOrders = orders?.filter(o => o.status === "PAID").length || 0;

      // Revenue by status
      const revenueByStatus = orders?.reduce((acc, order) => {
        const status = order.status || "UNKNOWN";
        const existing = acc.find(s => s.status === status);
        if (existing) {
          existing.revenue += order.total_cents || 0;
          existing.count += 1;
        } else {
          acc.push({
            status,
            revenue: order.total_cents || 0,
            count: 1,
          });
        }
        return acc;
      }, [] as { status: string; revenue: number; count: number }[]) || [];

      // Top products
      const productMap = new Map<string, { quantity: number; revenue: number }>();
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const productName = item.product_name || "Unknown Product";
          const existing = productMap.get(productName);
          if (existing) {
            existing.quantity += item.quantity || 0;
            existing.revenue += (item.price_cents || 0) * (item.quantity || 0);
          } else {
            productMap.set(productName, {
              quantity: item.quantity || 0,
              revenue: (item.price_cents || 0) * (item.quantity || 0),
            });
          }
        });
      });

      const topProducts = Array.from(productMap.entries())
        .map(([product_name, data]) => ({ product_name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Revenue by day (last 30 days for chart)
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const dayMap = new Map<string, { revenue: number; orders: number }>();
      
      // Initialize all days with 0
      for (let i = 0; i < 30; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split("T")[0];
        dayMap.set(dateStr, { revenue: 0, orders: 0 });
      }

      // Fill in actual data
      orders?.forEach(order => {
        const orderDate = new Date(order.created_at);
        if (orderDate >= last30Days) {
          const dateStr = orderDate.toISOString().split("T")[0];
          const existing = dayMap.get(dateStr);
          if (existing) {
            existing.revenue += order.total_cents || 0;
            existing.orders += 1;
          }
        }
      });

      const revenueByDay = Array.from(dayMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Production stats
      const productionStats = {
        pending: orders?.filter(o => o.status === "PAID").length || 0,
        inProduction: orders?.filter(o => o.status === "RECEIVED_BY_PRINTER").length || 0,
        shipped: orders?.filter(o => o.status === "SHIPPED").length || 0,
        delivered: orders?.filter(o => o.status === "DELIVERED").length || 0,
      };

      setAnalytics({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        pendingOrders,
        todayRevenue,
        todayOrders: todayOrders.length,
        revenueByStatus,
        topProducts,
        revenueByDay,
        productionStats,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Failed to load analytics</div>
      </div>
    );
  }

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
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-neutral-600">
            Track sales, products, and fulfillment metrics
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange("7d")}
            className={`text-sm px-4 py-2 border-2 border-black ${
              timeRange === "7d"
                ? "bg-black text-white"
                : "bg-white hover:bg-neutral-100"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            className={`text-sm px-4 py-2 border-2 border-black ${
              timeRange === "30d"
                ? "bg-black text-white"
                : "bg-white hover:bg-neutral-100"
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setTimeRange("all")}
            className={`text-sm px-4 py-2 border-2 border-black ${
              timeRange === "all"
                ? "bg-black text-white"
                : "bg-white hover:bg-neutral-100"
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card border-2 border-black p-6">
          <div className="text-sm text-neutral-600 mb-1">Total Revenue</div>
          <div className="text-3xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
        </div>
        <div className="card border-2 border-black p-6">
          <div className="text-sm text-neutral-600 mb-1">Total Orders</div>
          <div className="text-3xl font-bold">{analytics.totalOrders}</div>
        </div>
        <div className="card border-2 border-black p-6">
          <div className="text-sm text-neutral-600 mb-1">Average Order Value</div>
          <div className="text-3xl font-bold">{formatCurrency(analytics.averageOrderValue)}</div>
        </div>
        <div className="card border-2 border-black p-6">
          <div className="text-sm text-neutral-600 mb-1">Pending Orders</div>
          <div className="text-3xl font-bold">{analytics.pendingOrders}</div>
        </div>
      </div>

      {/* Today's Performance */}
      <div className="card border-2 border-black p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Today's Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-neutral-600 mb-1">Revenue</div>
            <div className="text-2xl font-bold">{formatCurrency(analytics.todayRevenue)}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-600 mb-1">Orders</div>
            <div className="text-2xl font-bold">{analytics.todayOrders}</div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="card border-2 border-black p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Revenue Trend (Last 30 Days)</h2>
        <div className="space-y-2">
          {analytics.revenueByDay.slice(-14).reverse().map((day) => (
            <div key={day.date} className="flex items-center gap-4">
              <div className="w-24 text-sm text-neutral-600">
                {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
              <div className="flex-1 bg-neutral-100 h-8 relative">
                <div
                  className="bg-black h-full flex items-center justify-end pr-2"
                  style={{
                    width: `${Math.max(5, (day.revenue / Math.max(...analytics.revenueByDay.map(d => d.revenue))) * 100)}%`,
                  }}
                >
                  <span className="text-xs text-white font-medium">
                    {formatCurrency(day.revenue)}
                  </span>
                </div>
              </div>
              <div className="w-16 text-sm text-neutral-600 text-right">
                {day.orders} {day.orders === 1 ? "order" : "orders"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue by Status */}
        <div className="card border-2 border-black p-6">
          <h2 className="text-xl font-bold mb-4">Revenue by Status</h2>
          <div className="space-y-3">
            {analytics.revenueByStatus
              .sort((a, b) => b.revenue - a.revenue)
              .map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-sm font-medium min-w-[140px]">
                      {statusLabels[item.status] || item.status}
                    </div>
                    <div className="flex-1 bg-neutral-100 h-6 relative">
                      <div
                        className="bg-black h-full"
                        style={{
                          width: `${Math.max(2, (item.revenue / analytics.totalRevenue) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-bold ml-4 min-w-[100px] text-right">
                    {formatCurrency(item.revenue)}
                  </div>
                  <div className="text-xs text-neutral-600 ml-3 min-w-[60px] text-right">
                    ({item.count} {item.count === 1 ? "order" : "orders"})
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Production Pipeline */}
        <div className="card border-2 border-black p-6">
          <h2 className="text-xl font-bold mb-4">Production Pipeline</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 border-2 border-yellow-200">
              <div className="font-medium">Awaiting Production</div>
              <div className="text-2xl font-bold">{analytics.productionStats.pending}</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 border-2 border-purple-200">
              <div className="font-medium">In Production</div>
              <div className="text-2xl font-bold">{analytics.productionStats.inProduction}</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-200">
              <div className="font-medium">Shipped</div>
              <div className="text-2xl font-bold">{analytics.productionStats.shipped}</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200">
              <div className="font-medium">Delivered</div>
              <div className="text-2xl font-bold">{analytics.productionStats.delivered}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="card border-2 border-black p-6">
        <h2 className="text-xl font-bold mb-4">Top Products by Revenue</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left py-3 px-2 font-bold">Rank</th>
                <th className="text-left py-3 px-2 font-bold">Product</th>
                <th className="text-right py-3 px-2 font-bold">Units Sold</th>
                <th className="text-right py-3 px-2 font-bold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topProducts.map((product, index) => (
                <tr key={product.product_name} className="border-b border-neutral-200">
                  <td className="py-3 px-2 font-bold text-neutral-600">#{index + 1}</td>
                  <td className="py-3 px-2">{product.product_name}</td>
                  <td className="py-3 px-2 text-right">{product.quantity}</td>
                  <td className="py-3 px-2 text-right font-bold">
                    {formatCurrency(product.revenue)}
                  </td>
                </tr>
              ))}
              {analytics.topProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-neutral-500">
                    No product data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
