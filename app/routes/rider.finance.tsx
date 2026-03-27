import { useMemo } from "react";
import { useOutletContext } from "react-router";
import { type RiderContextData } from "./rider";
import { Badge } from "~/components/ui/badge";
import { Wallet, CheckCircle2, Clock3 } from "lucide-react";
import { formatCurrency } from "~/lib/utils";

export default function RiderFinancePage() {
  const { assignedOrders } = useOutletContext<RiderContextData>();

  const deliveredOrders = useMemo(
    () => assignedOrders.filter((order) => order.status === "delivered"),
    [assignedOrders],
  );
  const inProgressOrders = useMemo(
    () => assignedOrders.filter((order) => order.status !== "delivered" && order.status !== "cancelled"),
    [assignedOrders],
  );

  const grossHandled = useMemo(
    () => deliveredOrders.reduce((sum, order) => sum + order.totalPrice, 0),
    [deliveredOrders],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Finance & Payments</h1>
        <p className="text-sm text-muted-foreground">Overview of completed deliveries and handled value.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Delivered Orders</p>
          <p className="mt-2 text-2xl font-black text-foreground">{deliveredOrders.length}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Completed deliveries
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">In Progress</p>
          <p className="mt-2 text-2xl font-black text-foreground">{inProgressOrders.length}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
            <Clock3 className="h-3.5 w-3.5" /> Active workflow
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Gross Handled</p>
          <p className="mt-2 text-2xl font-black text-foreground">{formatCurrency(grossHandled)}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-red">
            <Wallet className="h-3.5 w-3.5" /> Order value total
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Completed Deliveries</h2>
          <Badge variant="outline">{deliveredOrders.length}</Badge>
        </div>
        <div className="space-y-3">
          {deliveredOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
              No completed deliveries yet.
            </div>
          ) : (
            deliveredOrders.map((order) => (
              <div key={order.id} className="rounded-xl border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{order.restaurant?.name ?? "Restaurant"} → {order.user?.firstName ?? "Customer"}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {formatCurrency(order.totalPrice)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
