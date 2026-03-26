import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import {
  getMyOrderUserLocations,
  getMyOrders,
  type RestaurantOrderRecord,
  type RestaurantOrderUserLocationRecord,
} from "../services/restaurant";
import {
  restaurantAcceptOrder,
  restaurantCancelOrder,
  restaurantDeleteOrder,
  restaurantMarkOrderReady,
  restaurantSignDeliveryStart,
} from "../services/orders";
import { useRestaurantLayout } from "./restaurant";

const BaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const RestaurantOrders = () => {
  const { restaurant, loading, error } = useRestaurantLayout();
  const [orders, setOrders] = useState<RestaurantOrderRecord[]>([]);
  const [orderUserLocations, setOrderUserLocations] = useState<Record<string, RestaurantOrderUserLocationRecord["location"]>>({});
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant) {
      setOrders([]);
      setOrderUserLocations({});
      setOrdersLoading(false);
      setOrdersError(null);
      return;
    }

    let isMounted = true;

    const loadOrders = async () => {
      setOrdersLoading(true);

      try {
        const [ordersData, locationsData] = await Promise.all([getMyOrders(), getMyOrderUserLocations()]);
        if (!isMounted) {
          return;
        }

        setOrders(ordersData);
        setOrderUserLocations(
          locationsData.reduce<Record<string, RestaurantOrderUserLocationRecord["location"]>>((acc, item) => {
            acc[item.orderId] = item.location;
            return acc;
          }, {}),
        );
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

  const runOrderAction = async (
    orderId: string,
    action: (id: string) => Promise<RestaurantOrderRecord>,
  ) => {
    setActionOrderId(orderId);
    setOrdersError(null);

    try {
      const updated = await action(orderId);
      setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
    } catch (actionError) {
      setOrdersError(actionError instanceof Error ? actionError.message : "Failed to update order");
    } finally {
      setActionOrderId(null);
    }
  };

  const runOrderDelete = async (orderId: string) => {
    setActionOrderId(orderId);
    setOrdersError(null);
    try {
      await restaurantDeleteOrder(orderId);
      setOrders((current) => current.filter((order) => order.id !== orderId));
    } catch (actionError) {
      setOrdersError(actionError instanceof Error ? actionError.message : "Failed to delete order");
    } finally {
      setActionOrderId(null);
    }
  };

  useEffect(() => {
    if (!restaurant) {
      return;
    }

    let isMounted = true;

    const poll = async () => {
      try {
        const locationsData = await getMyOrderUserLocations();
        if (!isMounted) {
          return;
        }
        setOrderUserLocations(
          locationsData.reduce<Record<string, RestaurantOrderUserLocationRecord["location"]>>((acc, item) => {
            acc[item.orderId] = item.location;
            return acc;
          }, {}),
        );
      } catch {
        // Keep current location state and retry on next interval.
      }
    };

    const intervalId = window.setInterval(() => {
      void poll();
    }, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [restaurant]);

  useEffect(() => {
    if (!restaurant) {
      return;
    }

    const socket: Socket = io(BaseURL, {
      path: "/socket.io",
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    socket.on("connect", () => {
      socket.emit("location:restaurant:subscribe", { restaurantId: restaurant.id });
    });

    socket.on("location:user:updated", (payload: { orderId?: string; location?: RestaurantOrderUserLocationRecord["location"] }) => {
      if (!payload?.orderId) {
        return;
      }

      setOrderUserLocations((current) => ({
        ...current,
        [payload.orderId as string]: payload.location ?? null,
      }));
    });

    return () => {
      socket.disconnect();
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
        <p className="text-sm text-slate-500">Restaurant actions: Accept order, mark ready, and sign delivery start.</p>
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
                <p className="text-sm text-slate-500">Location visibility is handled on the rider side.</p>
                <p className="text-sm text-slate-600">
                  Rider: {order.rider ? `${order.rider.name} (${order.rider.status})` : "Not assigned"}
                </p>
                <p className="text-sm text-slate-600">Total: KES {order.totalPrice.toLocaleString()}</p>
                <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Only lifecycle actions allowed by restaurant
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    disabled={actionOrderId === order.id || order.status !== "pending"}
                    onClick={() => void runOrderAction(order.id, restaurantAcceptOrder)}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Accept order
                  </button>
                  <button
                    type="button"
                    disabled={actionOrderId === order.id || !["accepted", "preparing"].includes(order.status)}
                    onClick={() => void runOrderAction(order.id, restaurantMarkOrderReady)}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Ready for pickup
                  </button>
                  <button
                    type="button"
                    disabled={actionOrderId === order.id || !["ready_for_pickup", "delivery_sign_rider"].includes(order.status)}
                    onClick={() => void runOrderAction(order.id, restaurantSignDeliveryStart)}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Sign delivery start
                  </button>
                  <button
                    type="button"
                    disabled={actionOrderId === order.id || ["out_for_delivery", "delivery_signed_by_rider", "delivered", "cancelled", "rejected"].includes(order.status)}
                    onClick={() => void runOrderAction(order.id, restaurantCancelOrder)}
                    className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-amber-700 transition hover:border-amber-500 hover:text-amber-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Cancel order
                  </button>
                  <button
                    type="button"
                    disabled={actionOrderId === order.id || !["cancelled", "delivered", "rejected"].includes(order.status)}
                    onClick={() => void runOrderDelete(order.id)}
                    className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-rose-700 transition hover:border-rose-500 hover:text-rose-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Delete order
                  </button>
                </div>
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
