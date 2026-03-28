import { Link } from "react-router";
import { Bell, Clock3, Package, ShoppingBag, AlertTriangle } from "lucide-react";
import { useRestaurantLayout } from "./restaurant";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useEffect, useState } from "react";

const getTimeAgo = (value: string | undefined, nowMs: number) => {
  if (!value) return "just now";
  const diff = Math.max(0, nowMs - new Date(value).getTime());
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds || 1} second${seconds === 1 ? "" : "s"} ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

export default function RestaurantMessages() {
  const { orders, menuItems } = useRestaurantLayout();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update time every minute to refresh "time ago" values
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const orderAlerts = [...orders]
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 20)
    .map((order) => ({
      id: `order-${order.id}`,
      type: "order" as const,
      title: `New Order #${order.id.slice(0, 8)}`,
      details: `${order.orderItems?.length || 0} items • KES ${order.totalPrice.toLocaleString()}`,
      status: order.status,
      time: getTimeAgo(order.createdAt, currentTime),
      createdAt: order.createdAt,
    }));

  const stockAlerts = menuItems
    .filter((item) => item.availableCount <= 0)
    .map((item) => ({
      id: `stock-${item.id}`,
      type: "stock" as const,
      title: `${item.name} is out of stock`,
      details: "This dish is hidden from customer menu until restocked.",
      time: "now",
      status: undefined,
      createdAt: undefined,
    }));

  const lowStockAlerts = menuItems
    .filter((item) => item.availableCount > 0 && item.availableCount <= 5)
    .map((item) => ({
      id: `low-stock-${item.id}`,
      type: "low-stock" as const,
      title: `${item.name} is running low`,
      details: `Only ${item.availableCount} left in stock.`,
      time: "now",
      status: undefined,
      createdAt: undefined,
    }));

  const alerts = [...orderAlerts, ...stockAlerts, ...lowStockAlerts].sort((a, b) => {
    if (a.type === "order" && b.type !== "order") return -1;
    if (a.type !== "order" && b.type === "order") return 1;
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  const getAlertIcon = (type: string, status?: string) => {
    if (type === "order") {
      if (status === "pending") return <Clock3 className="h-4 w-4 text-yellow-600" />;
      if (status === "accepted") return <Package className="h-4 w-4 text-blue-600" />;
      return <ShoppingBag className="h-4 w-4 text-emerald-600" />;
    }
    if (type === "stock") return <AlertTriangle className="h-4 w-4 text-red-600" />;
    return <AlertTriangle className="h-4 w-4 text-orange-600" />;
  };

  const getAlertColor = (type: string, status?: string) => {
    if (type === "order") {
      if (status === "pending") return "border-l-yellow-500 bg-yellow-50/30";
      if (status === "accepted") return "border-l-blue-500 bg-blue-50/30";
      return "border-l-emerald-500 bg-emerald-50/30";
    }
    if (type === "stock") return "border-l-red-500 bg-red-50/30";
    return "border-l-orange-500 bg-orange-50/30";
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const statusConfig: Record<string, { label: string; color: string }> = {
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
      accepted: { label: "Accepted", color: "bg-blue-100 text-blue-700" },
      preparing: { label: "Preparing", color: "bg-purple-100 text-purple-700" },
      ready_for_pickup: { label: "Ready", color: "bg-indigo-100 text-indigo-700" },
      out_for_delivery: { label: "Out for Delivery", color: "bg-emerald-100 text-emerald-700" },
      delivered: { label: "Delivered", color: "bg-green-100 text-green-700" },
    };
    const config = statusConfig[status] || { label: status.replace(/_/g, " "), color: "bg-gray-100 text-gray-700" };
    return (
      <Badge className={cn("text-[10px] px-2 py-0.5 capitalize", config.color)}>
        {config.label}
      </Badge>
    );
  };

  if (alerts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="h-5 w-5 text-brand-red" />
            <h2 className="text-lg font-semibold text-foreground">Messages</h2>
          </div>
          <p className="text-sm text-muted-foreground">Action center for new orders and stock alerts.</p>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
          <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
            <Bell className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No messages yet</h3>
          <p className="text-sm text-muted-foreground text-center">
            New order notifications and stock alerts will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 -mt-2 -mx-4 px-4 py-3 mb-2">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-brand-red" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Messages</h1>
            <p className="text-xs text-muted-foreground">
              {alerts.length} {alerts.length === 1 ? "message" : "messages"}
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Clock3 className="h-3 w-3" />
            Live
          </Badge>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <article
            key={alert.id}
            className={cn(
              "rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all active:scale-[0.98]",
              "border-l-4",
              getAlertColor(alert.type, alert.status)
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                alert.type === "order" ? "bg-brand-red/10" : "bg-red-500/10"
              )}>
                {getAlertIcon(alert.type, alert.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground flex-1">
                    {alert.title}
                  </h3>
                  {alert.type === "order" && getStatusBadge(alert.status)}
                </div>
                
                <p className="text-xs text-muted-foreground mb-2">
                  {alert.details}
                </p>
                
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <Clock3 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {alert.time}
                    </span>
                  </div>
                  
                  {alert.type === "order" ? (
                    <Link to="/restaurant/orders">
                      <Button size="sm" className="h-8 text-xs bg-brand-red hover:bg-brand-red-hover">
                        View Order
                      </Button>
                    </Link>
                  ) : alert.type === "stock" ? (
                    <Link to="/restaurant/menu">
                      <Button size="sm" variant="outline" className="h-8 text-xs">
                        Restock Item
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/restaurant/menu">
                      <Button size="sm" variant="outline" className="h-8 text-xs">
                        Check Stock
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-2xl border border-border bg-surface p-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {orderAlerts.length}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Active Orders
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {stockAlerts.length + lowStockAlerts.length}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Stock Alerts
          </p>
        </div>
      </div>
    </div>
  );
}


