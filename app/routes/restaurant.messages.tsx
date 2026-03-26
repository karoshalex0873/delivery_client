import { Link } from "react-router";
import { Bell, Clock3 } from "lucide-react";
import { useRestaurantLayout } from "./restaurant";

const getTimeAgo = (value?: string) => {
  if (!value) return "just now";
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds || 1}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

export default function RestaurantMessages() {
  const { orders, menuItems } = useRestaurantLayout();

  const orderAlerts = [...orders]
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 20)
    .map((order) => ({
      id: `order-${order.id}`,
      type: "order" as const,
      title: `New order #${order.id.slice(0, 8)} received`,
      details: `Total KES ${order.totalPrice.toLocaleString()} - ${order.status.replace(/_/g, " ")}`,
      time: getTimeAgo(order.createdAt),
    }));

  const stockAlerts = menuItems
    .filter((item) => item.availableCount <= 0)
    .map((item) => ({
      id: `stock-${item.id}`,
      type: "stock" as const,
      title: `${item.name} is out of stock`,
      details: "This dish is hidden from customer menu until restocked.",
      time: "now",
    }));

  const alerts = [...orderAlerts, ...stockAlerts];

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-foreground">
          <Bell className="h-5 w-5 text-brand-red" />
          Messages
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Action center for new orders and stock alerts.</p>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <article key={alert.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <p className="text-sm font-semibold text-foreground">{alert.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{alert.details}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-brand-red">
                  <Clock3 className="h-3.5 w-3.5" />
                  {alert.time}
                </span>
                {alert.type === "order" ? (
                  <Link to="/restaurant/orders" className="rounded-lg bg-brand-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-red-hover">
                    Open orders
                  </Link>
                ) : (
                  <Link to="/restaurant/menu" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-hover">
                    Restock dish
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
