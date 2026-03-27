import { Link, useOutletContext } from "react-router";
import { type RiderContextData } from "./rider";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { 
  ChevronRight, 
  Package, 
  Store, 
  User, 
  Clock, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { cn } from "~/lib/utils";

const ACTIVE_ORDER_STATUSES = new Set([
  "pending",
  "accepted",
  "preparing",
  "ready_for_pickup",
  "delivery_sign_restaurant",
  "delivery_sign_rider",
  "out_for_delivery",
  "delivery_signed_by_rider",
]);

const getStatusConfig = (status: string) => {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string; variant: "warning" | "success" | "secondary" | "destructive" }> = {
    pending: { 
      color: "bg-yellow-100 text-yellow-700 border-yellow-200", 
      icon: <Clock className="h-3 w-3" />, 
      label: "Pending",
      variant: "warning"
    },
    accepted: { 
      color: "bg-blue-100 text-blue-700 border-blue-200", 
      icon: <CheckCircle2 className="h-3 w-3" />, 
      label: "Accepted",
      variant: "warning"
    },
    preparing: { 
      color: "bg-purple-100 text-purple-700 border-purple-200", 
      icon: <Clock className="h-3 w-3" />, 
      label: "Preparing",
      variant: "warning"
    },
    ready_for_pickup: { 
      color: "bg-indigo-100 text-indigo-700 border-indigo-200", 
      icon: <Store className="h-3 w-3" />, 
      label: "Ready for Pickup",
      variant: "warning"
    },
    out_for_delivery: { 
      color: "bg-emerald-100 text-emerald-700 border-emerald-200", 
      icon: <Package className="h-3 w-3" />, 
      label: "Out for Delivery",
      variant: "warning"
    },
    delivered: { 
      color: "bg-green-100 text-green-700 border-green-200", 
      icon: <CheckCircle2 className="h-3 w-3" />, 
      label: "Delivered",
      variant: "success"
    },
    cancelled: { 
      color: "bg-red-100 text-red-700 border-red-200", 
      icon: <XCircle className="h-3 w-3" />, 
      label: "Cancelled",
      variant: "secondary"
    },
    rejected: { 
      color: "bg-red-100 text-red-700 border-red-200", 
      icon: <XCircle className="h-3 w-3" />, 
      label: "Rejected",
      variant: "secondary"
    },
  };
  return config[status] || { 
    color: "bg-gray-100 text-gray-700 border-gray-200", 
    icon: <AlertCircle className="h-3 w-3" />, 
    label: status.replace(/_/g, " "),
    variant: "secondary"
  };
};

export default function RiderOrderHistory() {
  const { assignedOrders } = useOutletContext<RiderContextData>();

  const ordered = [...assignedOrders].sort((a, b) => {
    const aActive = ACTIVE_ORDER_STATUSES.has(a.status) ? 0 : 1;
    const bActive = ACTIVE_ORDER_STATUSES.has(b.status) ? 0 : 1;
    if (aActive !== bActive) {
      return aActive - bActive;
    }
    return b.id.localeCompare(a.id);
  });

  const activeOrders = ordered.filter(order => ACTIVE_ORDER_STATUSES.has(order.status));
  const completedOrders = ordered.filter(order => order.status === "delivered");
  const otherOrders = ordered.filter(order => !ACTIVE_ORDER_STATUSES.has(order.status) && order.status !== "delivered");

  return (
    <div className="pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 -mt-2 -mx-4 px-4 py-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <Link to="/rider" className="p-1 -ml-1">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Orders</h1>
            <p className="text-xs text-muted-foreground">
              {ordered.length} total orders
            </p>
          </div>
          {activeOrders.length > 0 && (
            <Badge variant="warning" className="gap-1">
              <Package className="h-3 w-3" />
              {activeOrders.length} Active
            </Badge>
          )}
        </div>
      </div>

      {/* Active Orders Section */}
      {activeOrders.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Orders
            </h2>
            <Badge variant="outline" className="text-xs">
              {activeOrders.length}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {activeOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <Link
                  key={order.id}
                  to={`/rider/orders/${order.id}`}
                  className="group block rounded-2xl border border-border bg-surface p-4 transition-all active:scale-[0.98] hover:border-brand-red/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <Badge className={cn("capitalize gap-1 px-2 py-0.5 text-[10px]", statusConfig.color)}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{order.restaurant?.name ?? "Restaurant"}</span>
                        </div>
                        <ChevronRight className="h-3 w-3" />
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">{order.user?.firstName ?? "Customer"}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-brand-red shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Orders Section */}
      {completedOrders.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Completed
            </h2>
            <Badge variant="outline" className="text-xs">
              {completedOrders.length}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {completedOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <Link
                  key={order.id}
                  to={`/rider/orders/${order.id}`}
                  className="group block rounded-2xl border border-border bg-surface/60 p-4 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <Badge className={cn("capitalize gap-1 px-2 py-0.5 text-[10px]", statusConfig.color)}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{order.restaurant?.name ?? "Restaurant"}</span>
                        </div>
                        <ChevronRight className="h-3 w-3" />
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">{order.user?.firstName ?? "Customer"}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-brand-red shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Orders (Cancelled/Rejected) */}
      {otherOrders.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Other
            </h2>
            <Badge variant="outline" className="text-xs">
              {otherOrders.length}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {otherOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <Link
                  key={order.id}
                  to={`/rider/orders/${order.id}`}
                  className="group block rounded-2xl border border-border bg-surface/40 p-4 transition-all active:scale-[0.98] opacity-75 hover:opacity-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <Badge className={cn("capitalize gap-1 px-2 py-0.5 text-[10px]", statusConfig.color)}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{order.restaurant?.name ?? "Restaurant"}</span>
                        </div>
                        <ChevronRight className="h-3 w-3" />
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">{order.user?.firstName ?? "Customer"}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-brand-red shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {ordered.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No Orders Yet</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Your order history will appear here once you start accepting deliveries.
          </p>
          <Link to="/rider">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      )}

      {/* Go to Active Order Button */}
      {activeOrders.length === 0 && ordered.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 shadow-lg z-20">
          <div className="max-w-md mx-auto">
            <Link to="/rider/active-orders">
              <Button className="w-full gap-2" size="lg">
                <Package className="h-4 w-4" />
                View Active Order
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Spacer for sticky button */}
      {activeOrders.length === 0 && ordered.length > 0 && <div className="h-20" />}
    </div>
  );
}