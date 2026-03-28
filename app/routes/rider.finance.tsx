import { useMemo, useState } from "react";
import { useOutletContext, Link } from "react-router";
import { type RiderContextData } from "./rider";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Wallet,
  CheckCircle2,
  Clock3,
  TrendingUp,
  Calendar,
  ArrowLeft,
  ChevronRight,
  DollarSign,
  Package,
  Bike,
} from "lucide-react";
import { formatCurrency, cn } from "~/lib/utils";

export default function RiderFinancePage() {
  const { assignedOrders } = useOutletContext<RiderContextData>();
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("all");

  const deliveredOrders = useMemo(
    () => assignedOrders.filter((order) => order.status === "delivered"),
    [assignedOrders],
  );

  const inProgressOrders = useMemo(
    () => assignedOrders.filter((order) => order.status !== "delivered" && order.status !== "cancelled"),
    [assignedOrders],
  );

  // Backend payload currently has no deliveredAt/createdAt timestamps for rider assigned orders.
  // Keep the same deliveries list for each tab label until timestamp fields are provided.
  const filteredDeliveries = useMemo(() => deliveredOrders, [deliveredOrders]);

  const grossHandled = useMemo(
    () => filteredDeliveries.reduce((sum, order) => sum + order.totalPrice, 0),
    [filteredDeliveries],
  );

  const averageOrderValue = useMemo(
    () => (filteredDeliveries.length > 0 ? grossHandled / filteredDeliveries.length : 0),
    [grossHandled, filteredDeliveries.length],
  );

  const periodLabels = {
    week: "This Week",
    month: "This Month",
    all: "All Time",
  };

  return (
    <div className="pb-20">
      <div className="sticky top-0 z-10 mb-4 -mx-4 -mt-2 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link to="/rider" className="-ml-1 p-1">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Finance</h1>
            <p className="text-xs text-muted-foreground">Track your earnings and deliveries</p>
          </div>
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Active
          </Badge>
        </div>
      </div>

      <div className="mb-4 flex gap-2 px-1">
        {(["week", "month", "all"] as const).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={cn(
              "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all",
              selectedPeriod === period
                ? "bg-brand-red text-white shadow-sm"
                : "border border-border bg-surface text-muted-foreground hover:bg-surface-hover",
            )}
          >
            {periodLabels[period]}
          </button>
        ))}
      </div>

      <div className="mb-4 grid gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-brand-red to-brand-red/90 p-5 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-white/80">Total Earnings</p>
            <Wallet className="h-5 w-5 text-white/80" />
          </div>
          <p className="text-3xl font-black text-white">{formatCurrency(grossHandled)}</p>
          <p className="mt-1 text-xs text-white/70">
            from {filteredDeliveries.length} completed {filteredDeliveries.length === 1 ? "delivery" : "deliveries"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Deliveries</p>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{filteredDeliveries.length}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{periodLabels[selectedPeriod].toLowerCase()}</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg. Order</p>
              <DollarSign className="h-4 w-4 text-brand-red" />
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(averageOrderValue)}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">per delivery</p>
          </div>
        </div>
      </div>

      {inProgressOrders.length > 0 && (
        <div className="mb-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
                <Clock3 className="h-4 w-4 text-amber-600" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">In Progress</h2>
            </div>
            <Badge variant="outline" className="text-xs">
              {inProgressOrders.length}
            </Badge>
          </div>

          <div className="space-y-2">
            {inProgressOrders.slice(0, 3).map((order) => (
              <Link
                key={order.id}
                to={`/rider/orders/${order.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-background p-3 transition-all active:scale-[0.98]"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">Order #{order.id.slice(0, 8)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {order.restaurant?.name ?? "Restaurant"} → {order.user?.firstName ?? "Customer"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}

            {inProgressOrders.length > 3 && (
              <Link to="/rider/active-orders">
                <Button variant="outline" className="mt-2 w-full text-sm">
                  View all ({inProgressOrders.length}) active orders
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
              <Package className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Recent Deliveries</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            {filteredDeliveries.length}
          </Badge>
        </div>

        <div className="space-y-2">
          {filteredDeliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No completed deliveries</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedPeriod === "week"
                  ? "No deliveries this week yet"
                  : selectedPeriod === "month"
                    ? "No deliveries this month yet"
                    : "Start accepting orders to see your earnings"}
              </p>
              <Link to="/rider" className="mt-4">
                <Button size="sm" variant="outline">
                  View Available Rides
                </Button>
              </Link>
            </div>
          ) : (
            filteredDeliveries.slice(0, 10).map((order, index) => (
              <div
                key={order.id}
                className="group rounded-xl border border-border bg-background p-3 transition-all hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-muted-foreground">#{index + 1}</span>
                      <p className="truncate text-sm font-semibold text-foreground">Order #{order.id.slice(0, 8)}</p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {order.restaurant?.name ?? "Restaurant"} → {order.user?.firstName ?? "Customer"}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">Delivery completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {formatCurrency(order.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredDeliveries.length > 10 && (
          <div className="mt-3 pt-2 text-center">
            <p className="text-[10px] text-muted-foreground">Showing 10 of {filteredDeliveries.length} deliveries</p>
          </div>
        )}
      </div>

      {filteredDeliveries.length > 0 && (
        <div className="mt-4 rounded-2xl bg-surface/40 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Total earnings for {periodLabels[selectedPeriod].toLowerCase()}: <span className="font-semibold text-foreground">{formatCurrency(grossHandled)}</span>
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Date-based filtering will apply once delivery timestamps are available.
          </p>
        </div>
      )}
    </div>
  );
}
