import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { getMyOrders, type RestaurantOrderRecord } from "../services/restaurant";
import { useRestaurantLayout } from "./restaurant";

const RestaurantOrders = () => {
  const { restaurant, loading, error } = useRestaurantLayout();
  const [orders, setOrders] = useState<RestaurantOrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant) {
      setOrders([]);
      setOrdersLoading(false);
      setOrdersError(null);
      return;
    }

    let isMounted = true;

    const loadOrders = async () => {
      setOrdersLoading(true);

      try {
        const data = await getMyOrders();
        if (!isMounted) {
          return;
        }

        setOrders(data);
        setOrdersError(null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setOrdersError(loadError instanceof Error ? loadError.message : "Failed to load orders");
      } finally {
        if (isMounted) {
          setOrdersLoading(false);
        }
      }
    };

    void loadOrders();

    return () => {
      isMounted = false;
    };
  }, [restaurant]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading orders workspace...</p>;
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
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <h2 className="text-base font-semibold text-slate-900">Create your restaurant first</h2>
        <p className="mt-2 text-sm text-slate-500">
          Orders will appear here after your restaurant profile is available.
        </p>
      </div>
    );
  }

  if (ordersLoading) {
    return <p className="text-sm text-slate-500">Loading restaurant orders...</p>;
  }

  if (ordersError) {
    return (
      <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {ordersError}
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-700">
          <ClipboardList size={24} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">No orders yet</h2>
        <p className="mt-2 text-sm text-slate-500">
          Incoming customer orders will appear here once people start placing them.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Orders</h2>
        <p className="text-sm text-slate-500">Track order status, customer details, and ordered items.</p>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">Order {order.id}</h3>
                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-slate-700">
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  Customer: {order.user ? `${order.user.firstName} ${order.user.lastName}` : order.userId}
                </p>
                <p className="text-sm text-slate-600">
                  Rider: {order.rider ? `${order.rider.name} (${order.rider.status})` : "Not assigned"}
                </p>
                <p className="text-sm text-slate-600">Total: KES {order.totalPrice.toLocaleString()}</p>
              </div>

              <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-medium text-slate-900">Items</p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  {order.orderItems?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <span>{item.menuItem?.name ?? item.menuItemId} x{item.quantity}</span>
                      <span>KES {item.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default RestaurantOrders;
