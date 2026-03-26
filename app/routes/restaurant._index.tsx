import { Link } from "react-router";
import { Bell, ChevronRight, Clock3, MapPin, UtensilsCrossed } from "lucide-react";
import CreateModel from "../components/restaurant/createModel";
import { useRestaurantLayout } from "./restaurant";

const getTimeAgo = (value?: string) => {
  if (!value) {
    return "now";
  }
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) {
    return `${seconds || 1}s ago`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

const RestaurantDashboard = () => {
  const { restaurant, menuItems, orders, unreadOrdersCount, setRestaurant, loading, error } = useRestaurantLayout();

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading restaurant workspace...</p>;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {error}
      </p>
    );
  }

  if (!restaurant) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Set up your restaurant</h2>
          <p className="text-sm text-muted-foreground">
            Create your restaurant profile before you begin managing the menu.
          </p>
        </div>
        <CreateModel
          audience="restaurant"
          mode="create"
          triggerLabel="Create restaurant profile"
          onSaved={setRestaurant}
        />
      </div>
    );
  }

  const recentOrders = orders
    .slice()
    .sort((a, b) => {
      const aTime = new Date((a as { createdAt?: string }).createdAt ?? 0).getTime();
      const bTime = new Date((b as { createdAt?: string }).createdAt ?? 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 8);

  const activeOrdersCount = orders.filter((order) =>
    ["pending", "accepted", "preparing", "ready_for_pickup", "delivery_sign_restaurant", "delivery_sign_rider", "out_for_delivery"].includes(
      order.status,
    ),
  ).length;

  const activeDishesCount = menuItems.filter((item) => (item.availableCount ?? 0) > 0).length;

  const formatOrderItemsPreview = (order: (typeof recentOrders)[number]) => {
    if (!order.orderItems || order.orderItems.length === 0) {
      return "No items";
    }
    const firstTwo = order.orderItems.slice(0, 2).map((item) => `${item.menuItem?.name ?? "Item"} x${item.quantity}`);
    const extra = order.orderItems.length - firstTwo.length;
    return extra > 0 ? `${firstTwo.join(", ")} +${extra} more` : firstTwo.join(", ");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">{restaurant.name}</h2>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-brand-red" />
              {restaurant.address}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex min-w-max items-stretch gap-3 px-1">
          <Link
            to="/restaurant/orders"
            className="group w-50 shrink-0 rounded-2xl border border-border bg-background p-4 transition hover:border-brand-red/40 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                <Clock3 className="h-4 w-4" />
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active orders</p>
            <p className="text-2xl font-black text-foreground">{activeOrdersCount}</p>
          </Link>

          <Link
            to="/restaurant/menu"
            className="group w-50 shrink-0 rounded-2xl border border-border bg-background p-4 transition hover:border-brand-red/40 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                <UtensilsCrossed className="h-4 w-4" />
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active dishes</p>
            <p className="text-2xl font-black text-foreground">{activeDishesCount}</p>
          </Link>

          <Link
            to="/restaurant/messages"
            className="group w-50 shrink-0 rounded-2xl border border-border bg-background p-4 transition hover:border-brand-red/40 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                <Bell className="h-4 w-4" />
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">New messages</p>
            <p className="text-2xl font-black text-foreground">{unreadOrdersCount}</p>
          </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground">Incoming Orders</h3>
          <Link to="/restaurant/orders" className="text-sm font-semibold text-brand-red hover:underline">
            View more
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders received yet.</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/restaurant/orders?focus=${order.id}`}
                className="group block rounded-2xl border border-border bg-background px-4 py-3 transition hover:border-brand-red/40 hover:shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">Order #{order.id.slice(0, 8)}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {getTimeAgo((order as { createdAt?: string }).createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {order.user ? `${order.user.firstName} ${order.user.lastName}` : "Customer"} - {formatOrderItemsPreview(order)}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs capitalize text-muted-foreground">{order.status.replace(/_/g, " ")}</p>
                  <p className="text-xs font-semibold text-brand-red">KES {order.totalPrice.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default RestaurantDashboard;
