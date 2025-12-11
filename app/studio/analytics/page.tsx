"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";

function cleanLocation(value?: string | null) {
  if (!value) return null;
  let cleaned = value.replace(/\+/g, " ").trim();
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {
    // ignore decode errors and keep original cleaned string
  }
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  pendingOrders: number;
  todayRevenue: number;
  todayOrders: number;
  totalVisitors: number;
  visitorsByDay: { date: string; count: number }[];
  peakHours: { hour: number; count: number }[];
  topCities: { city: string; region?: string; country?: string; count: number }[];
  topPages: { page_path: string; count: number }[];
  revenueByStatus: { status: string; revenue: number; count: number }[];
  topProducts: { product_name: string; quantity: number; revenue: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
  productionStats: {
    pending: number;
    inProduction: number;
    shipped: number;
    delivered: number;
  };
  activeVisitors?: number; // New: visitors in last 5 minutes
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatHour(hour: number) {
  if (hour === 0) return "12:00 AM";
  if (hour === 12) return "12:00 PM";
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

export default function StudioAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "all">("24h");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchAnalytics();
    
    // Auto-refresh every 30 seconds for live data
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, [timeRange]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const supa = createClient();

      // Calculate date range
      const now = new Date();
      let startDate: Date | null = null;
      if (timeRange === "24h") {
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (timeRange === "7d") {
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

      // Visitor metrics
      let visitors: {
        created_at: string;
        city?: string | null;
        region?: string | null;
        country?: string | null;
        session_id?: string | null;
        page_path?: string | null;
        ip_address?: string | null;
        user_agent?: string | null;
      }[] = [];

      try {
        // Fetch visitor data in batches to overcome 1000 row Supabase limit
        let allVisitorData: any[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          let visitorQuery = supa
            .from("visitor_events")
            .select("created_at, city, region, country, session_id, page_path, ip_address, user_agent")
            .order("created_at", { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (startDate) {
            visitorQuery = visitorQuery.gte("created_at", startDate.toISOString());
          }

          const { data: pageData, error: pageError } = await visitorQuery;

          if (pageError) {
            console.error("Error fetching visitor page:", pageError);
            break;
          }

          if (pageData && pageData.length > 0) {
            allVisitorData = allVisitorData.concat(pageData);
            hasMore = pageData.length === pageSize; // Continue if we got a full page
            page++;
          } else {
            hasMore = false;
          }
        }

        const visitorData = allVisitorData;
        const visitorError = null;

        if (!visitorError && visitorData) {
          // Filter out admin traffic and asset requests before aggregating, then clean location strings
          visitors = visitorData
            .filter((visit) => {
              const path = visit.page_path || "";
              const isAdmin = path.startsWith("/studio") || path.startsWith("/admin");
              const isAsset = path.startsWith("/assets/") ||
                path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|css|js)$/i);
              const isWpProbe = path.includes("/wp-admin/") || path.includes("/wordpress/wp-admin/");
              return !isAdmin && !isAsset && !isWpProbe;
            })
            .map((visit) => ({
              ...visit,
              city: cleanLocation(visit.city),
              region: cleanLocation(visit.region),
              country: cleanLocation(visit.country),
            }));
        } else if (visitorError?.code !== "42P01") {
          console.warn("Visitor analytics error:", visitorError);
        }
      } catch (visitorFetchError) {
        console.warn("Visitor analytics fetch failed:", visitorFetchError);
      }

      // Build a consistent session key so middleware/client inserts dedupe by session or IP/UA
      const getSessionKey = (visit: typeof visitors[number]) => {
        const ip = visit.ip_address?.trim();
        const ua = visit.user_agent?.trim();
        if (ip || ua) {
          return `${ip || "no-ip"}|${ua || "no-ua"}`;
        }
        const sessionId = visit.session_id?.trim();
        if (sessionId) return sessionId;
        return `anon-${visit.page_path || "unknown"}-${visit.created_at}`;
      };

      const uniqueVisitors = new Set(visitors.map(getSessionKey));

      // Calculate active visitors (last 5 minutes) - unique sessions only
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const recentVisitors = visitors.filter(v => new Date(v.created_at) >= fiveMinutesAgo);
      const uniqueActiveSessions = new Set(recentVisitors.map(getSessionKey));
      const activeVisitors = uniqueActiveSessions.size;

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

      // Revenue by day - adjust based on time range
      let daysToShow = 30;
      if (timeRange === "24h") daysToShow = 1;
      else if (timeRange === "7d") daysToShow = 7;
      else if (timeRange === "30d") daysToShow = 30;

      const dayMap = new Map<string, { revenue: number; orders: number }>();
      
      // Initialize days
      for (let i = 0; i < daysToShow; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split("T")[0];
        dayMap.set(dateStr, { revenue: 0, orders: 0 });
      }

      // Fill in actual data
      const rangeStart = new Date(now.getTime() - daysToShow * 24 * 60 * 60 * 1000);
      orders?.forEach(order => {
        const orderDate = new Date(order.created_at);
        if (orderDate >= rangeStart) {
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

      // Visitor metrics aggregation
      const visitorDayMap = new Map<string, Set<string>>();
      visitors.forEach((visit) => {
        const visitDate = new Date(visit.created_at);
        const dateStr = visitDate.toISOString().split("T")[0];
        const sessionKey = getSessionKey(visit);
        if (!visitorDayMap.has(dateStr)) {
          visitorDayMap.set(dateStr, new Set());
        }
        visitorDayMap.get(dateStr)!.add(sessionKey);
      });

      const visitorsByDay = Array.from(visitorDayMap.entries())
        .map(([date, sessions]) => ({ date, count: sessions.size }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const hourlyCounts = Array.from({ length: 24 }, () => new Set<string>());
      visitors.forEach((visit) => {
        const hour = new Date(visit.created_at).getHours();
        hourlyCounts[hour].add(getSessionKey(visit));
      });
      const peakHours = hourlyCounts
        .map((sessions, hour) => ({ hour, count: sessions.size }))
        .sort((a, b) => b.count - a.count || a.hour - b.hour)
        .slice(0, 5);

      const cityMap = new Map<string, { city: string; region?: string; country?: string; count: number }>();
      const citySessionMap = new Map<string, Set<string>>();
      visitors.forEach((visit) => {
        const keyParts = [
          visit.city || "Unknown City",
          visit.region || "",
          visit.country || "",
        ];
        const key = keyParts.join("|");
        const sessionKey = getSessionKey(visit);
        if (!citySessionMap.has(key)) {
          citySessionMap.set(key, new Set());
        }
        const sessionSet = citySessionMap.get(key)!;
        const existing = cityMap.get(key);
        if (existing) {
          if (!sessionSet.has(sessionKey)) {
            existing.count += 1;
            sessionSet.add(sessionKey);
          }
        } else {
          cityMap.set(key, {
            city: visit.city || "Unknown City",
            region: visit.region || undefined,
            country: visit.country || undefined,
            count: 1,
          });
          sessionSet.add(sessionKey);
        }
      });
      const topCities = Array.from(cityMap.values()).sort((a, b) => b.count - a.count);

      // Top pages calculation (filter out assets like images, fonts, etc.) using unique sessions per page
      const pageMap = new Map<string, Set<string>>();
      visitors.forEach((visit) => {
        const page = visit.page_path || "/";

        // Filter out asset files (images, fonts, favicons, etc.)
        const isAsset = page.startsWith('/assets/') ||
                       page.startsWith('/_next/') ||
                       page.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|css|js)$/i);

        if (!isAsset) {
          const sessionKey = getSessionKey(visit);
          if (!pageMap.has(page)) {
            pageMap.set(page, new Set());
          }
          pageMap.get(page)!.add(sessionKey);
        }
      });
      const topPages = Array.from(pageMap.entries())
        .map(([page_path, sessions]) => ({ page_path, count: sessions.size }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

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
        totalVisitors: uniqueVisitors.size,
        activeVisitors,
        visitorsByDay,
        peakHours,
        topCities,
        topPages,
        revenueByStatus,
        topProducts,
        revenueByDay,
        productionStats,
      });
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !analytics) {
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
          <h1 className="text-3xl font-bold">Live Analytics</h1>
          <p className="text-neutral-600">
            Real-time tracking of sales, visitors, and fulfillment
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/studio/analytics/google-analytics" className="text-sm px-4 py-2 border-2 border-black bg-white hover:bg-neutral-100">
            Google Analytics
          </Link>
          <button
            onClick={() => setTimeRange("24h")}
            className={`text-sm px-4 py-2 border-2 border-black ${
              timeRange === "24h"
                ? "bg-black text-white"
                : "bg-white hover:bg-neutral-100"
            }`}
          >
            Last 24 Hours
          </button>
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
        <h2 className="text-xl font-bold mb-4">
          Revenue Trend {timeRange === "24h" ? "(Today)" : `(Last ${timeRange === "7d" ? "7" : "30"} Days)`}
        </h2>
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
                    width: `${Math.max(5, (day.revenue / Math.max(...analytics.revenueByDay.map(d => d.revenue), 1)) * 100)}%`,
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

      {/* Live Visitor Snapshot */}
      <div className="card border-2 border-black p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Live Visitor Snapshot
              <span className="inline-flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </h2>
            <p className="text-neutral-600 text-sm">Real-time traffic in the selected range</p>
          </div>
          <div className="text-sm text-neutral-500">
            Auto-refreshes every 30 seconds
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 border-2 border-green-500 bg-green-50">
            <div className="text-sm text-neutral-700 mb-1">Active Now</div>
            <div className="text-3xl font-bold text-green-800">{analytics.activeVisitors || 0}</div>
            <div className="text-xs text-neutral-700 mt-1">Last 5 minutes</div>
          </div>
          <div className="p-4 border-2 border-black bg-neutral-50">
            <div className="text-sm text-neutral-700 mb-1">Total Visitors</div>
            <div className="text-3xl font-bold text-neutral-800">{analytics.totalVisitors}</div>
            <div className="text-xs text-neutral-700 mt-1">In selected range</div>
          </div>
          <div className="p-4 border-2 border-black bg-neutral-50">
            <div className="text-sm text-neutral-700 mb-1">Peak Hour</div>
            <div className="text-2xl font-bold text-neutral-800 leading-tight">
              {analytics.peakHours[0]
                ? formatHour(analytics.peakHours[0].hour)
                : "—"}
            </div>
            <div className="text-xs text-neutral-700 mt-1">
              {analytics.peakHours[0]?.count || 0} visits
            </div>
          </div>
          <div className="p-4 border-2 border-black bg-neutral-50">
            <div className="text-sm text-neutral-700 mb-1">Top City</div>
            <div className="text-2xl font-bold text-neutral-800 leading-tight">
              {analytics.topCities[0]
                ? analytics.topCities[0].city
                : "No data"}
            </div>
            <div className="text-xs text-neutral-700 mt-1">
              {analytics.topCities[0]
                ? [analytics.topCities[0].region, analytics.topCities[0].country].filter(Boolean).join(", ")
                : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Visitor Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card border-2 border-black p-6">
          <h2 className="text-xl font-bold mb-4">Visitors by Day</h2>
          <div className="space-y-2">
            {analytics.visitorsByDay.length === 0 && (
              <div className="text-neutral-500 text-sm">No visitor data available.</div>
            )}
            {analytics.visitorsByDay.slice(-14).reverse().map((day) => (
              <div key={day.date} className="flex items-center gap-4">
                <div className="w-24 text-sm text-neutral-600">
                  {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
                <div className="flex-1 bg-neutral-100 h-6 relative">
                  <div
                    className="bg-black h-full flex items-center justify-end pr-2 text-white text-xs font-medium"
                    style={{
                      width: `${Math.max(
                        5,
                        (day.count / Math.max(...analytics.visitorsByDay.map(d => d.count || 1), 1)) * 100
                      )}%`,
                    }}
                  >
                    {day.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card border-2 border-black p-6">
          <h2 className="text-xl font-bold mb-4">Peak Hours</h2>
          {analytics.peakHours.length === 0 ? (
            <div className="text-neutral-500 text-sm">No visitor data available.</div>
          ) : (
            <div className="space-y-3">
              {analytics.peakHours.map((slot) => (
                <div key={slot.hour} className="flex items-center justify-between">
                  <div className="font-medium w-24">{formatHour(slot.hour)}</div>
                  <div className="flex-1 mx-4 bg-neutral-100 h-4">
                    <div
                      className="bg-black h-full"
                      style={{
                        width: `${Math.max(
                          5,
                          (slot.count / Math.max(...analytics.peakHours.map(h => h.count || 1), 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="text-sm text-neutral-700 min-w-[48px] text-right">{slot.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Cities */}
      <div className="card border-2 border-black p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Top Visitor Cities</h2>
        {analytics.topCities.length === 0 ? (
          <div className="text-neutral-500 text-sm">No visitor data available.</div>
        ) : (
          <div className="space-y-3">
            {analytics.topCities.map((city) => (
              <div key={`${city.city}-${city.region}-${city.country}`} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{city.city}</div>
                  <div className="text-xs text-neutral-500">
                    {[city.region, city.country].filter(Boolean).join(", ") || "Location unknown"}
                  </div>
                </div>
                <div className="text-sm font-bold">{city.count} visit{city.count === 1 ? "" : "s"}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Pages */}
      <div className="card border-2 border-black p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Top 10 Most Visited Pages</h2>
        {analytics.topPages.length === 0 ? (
          <div className="text-neutral-500 text-sm">No page visit data available.</div>
        ) : (
          <div className="space-y-2">
            {analytics.topPages.map((page, index) => (
              <div key={page.page_path} className="flex items-center gap-4">
                <div className="w-8 text-sm font-bold text-[#8B7355]">#{index + 1}</div>
                <div className="flex-1 font-mono text-sm text-[#8B7355] truncate">
                  {page.page_path}
                </div>
                <div className="flex-1 bg-neutral-100 h-6 relative">
                  <div
                    className="bg-black h-full flex items-center justify-end pr-2 text-white text-xs font-medium"
                    style={{
                      width: `${Math.max(
                        5,
                        (page.count / Math.max(...analytics.topPages.map(p => p.count || 1), 1)) * 100
                      )}%`,
                    }}
                  >
                    {page.count}
                  </div>
                </div>
                <div className="w-24 text-sm text-[#8B7355] text-right">
                  {page.count} visit{page.count === 1 ? "" : "s"}
                </div>
              </div>
            ))}
          </div>
        )}
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
                          width: `${Math.max(2, (item.revenue / Math.max(analytics.totalRevenue, 1)) * 100)}%`,
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
              <div className="font-medium text-neutral-800">Awaiting Production</div>
              <div className="text-2xl font-bold text-neutral-800">{analytics.productionStats.pending}</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 border-2 border-purple-200">
              <div className="font-medium text-neutral-800">In Production</div>
              <div className="text-2xl font-bold text-neutral-800">{analytics.productionStats.inProduction}</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-200">
              <div className="font-medium text-neutral-800">Shipped</div>
              <div className="text-2xl font-bold text-neutral-800">{analytics.productionStats.shipped}</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200">
              <div className="font-medium text-neutral-800">Delivered</div>
              <div className="text-2xl font-bold text-neutral-800">{analytics.productionStats.delivered}</div>
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
