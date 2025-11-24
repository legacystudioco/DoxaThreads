import { createClient } from "@/lib/db";
import { AdminTable } from "@/components/AdminTable";
import { StatsCards } from "@/components/StatsCards";

export default async function StudioSettlementsPage() {
  const supa = createClient();
  
  // Get unbatched orders
  const { data: unbatchedOrders } = await supa
    .from("orders")
    .select("*, order_items(*)")
    .eq("printer_payable_status", "UNBATCHED")
    .eq("status", "LABEL_PURCHASED");

  // Get settlements
  const { data: settlements } = await supa
    .from("settlements")
    .select("*")
    .order("created_at", { ascending: false });

  // Calculate total owed
  const totalOwed = unbatchedOrders?.reduce((sum, order) => {
    const itemsCost = order.order_items.reduce((itemSum: number, item: any) => {
      return itemSum + ((item.blank_cost_cents_snapshot + item.print_cost_cents_snapshot) * item.qty);
    }, 0);
    return sum + (order.base_printer_fee_cents || 500) + itemsCost;
  }, 0) || 0;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settlements</h1>
        <p className="text-neutral-600">Batch orders and manage printer payments</p>
      </div>

      {/* Stats */}
      <StatsCards
        stats={[
          {
            label: "Unbatched Orders",
            value: unbatchedOrders?.length || 0,
          },
          {
            label: "Total Owed",
            value: `$${(totalOwed / 100).toFixed(2)}`,
          },
          {
            label: "Pending Settlements",
            value: settlements?.filter((s) => s.status !== "PAID").length || 0,
          },
        ]}
      />

      {/* Unbatched Orders */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Unbatched Orders</h2>
          {unbatchedOrders && unbatchedOrders.length > 0 && (
            <button className="btn">
              Create Settlement
            </button>
          )}
        </div>

        <AdminTable
          columns={[
            {
              key: "id",
              label: "Order ID",
              render: (val) => `#${(val as string).slice(0, 8)}`,
            },
            {
              key: "created_at",
              label: "Date",
              render: (val) => new Date(val as string).toLocaleDateString(),
            },
            {
              key: "base_printer_fee_cents",
              label: "Base Fee",
              render: (val) => `$${((val as number) / 100).toFixed(2)}`,
            },
            {
              key: "order_items",
              label: "Items Cost",
              render: (val) => {
                const items = val as any[];
                const cost = items.reduce((sum, item) => {
                  return sum + ((item.blank_cost_cents_snapshot + item.print_cost_cents_snapshot) * item.qty);
                }, 0);
                return `$${(cost / 100).toFixed(2)}`;
              },
            },
            {
              key: "id",
              label: "Total Owed",
              render: (val, row: any) => {
                const itemsCost = row.order_items.reduce((sum: number, item: any) => {
                  return sum + ((item.blank_cost_cents_snapshot + item.print_cost_cents_snapshot) * item.qty);
                }, 0);
                const total = (row.base_printer_fee_cents || 500) + itemsCost;
                return <span className="font-bold">${(total / 100).toFixed(2)}</span>;
              },
            },
          ]}
          data={unbatchedOrders || []}
          emptyMessage="No unbatched orders. All orders are settled or in a settlement."
        />
      </div>

      {/* Past Settlements */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Settlement History</h2>

        <AdminTable
          columns={[
            {
              key: "id",
              label: "Settlement ID",
              render: (val) => `#${(val as string).slice(0, 8)}`,
            },
            {
              key: "created_at",
              label: "Created",
              render: (val) => new Date(val as string).toLocaleDateString(),
            },
            {
              key: "total_cents",
              label: "Amount",
              render: (val) => `$${((val as number) / 100).toFixed(2)}`,
            },
            {
              key: "status",
              label: "Status",
              render: (val) => {
                const status = val as string;
                if (status === "PAID") return <span className="status-paid">Paid</span>;
                if (status === "AGREED") return <span className="badge">Agreed</span>;
                if (status === "SENT") return <span className="status-pending">Sent</span>;
                return <span className="badge-outline">Draft</span>;
              },
            },
            {
              key: "id",
              label: "Actions",
              render: (val) => (
                <a
                  href={`/studio/settlements/${val}`}
                  className="text-sm hover:underline"
                >
                  View Details
                </a>
              ),
            },
          ]}
          data={settlements || []}
          emptyMessage="No settlements yet. Create your first settlement from unbatched orders above."
        />
      </div>
    </div>
  );
}
