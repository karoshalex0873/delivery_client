import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Ban, Check, CheckCheck, ClipboardList, MapPin, Package, Trash2, Truck, UserCheck } from "lucide-react";
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

const getTimeAgo = (value?: string) => {
  if (!value) return "now";
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds || 1}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

const isAcceptedFlow = (status: string) =>
  ["accepted", "preparing", "ready_for_pickup", "delivery_sign_restaurant", "delivery_sign_rider", "out_for_delivery", "delivery_signed_by_rider", "delivered"].includes(
    status,
  );

const stageFromStatus = (status: string) => {
  if (["ready_for_pickup", "delivery_sign_restaurant", "delivery_sign_rider"].includes(status)) return 2;
  if (["out_for_delivery", "delivery_signed_by_rider", "delivered"].includes(status)) return 3;
  if (["accepted", "preparing"].includes(status)) return 1;
  return 0;
};

const buildActivityLogs = (status: string) => {
  const logs: string[] = [];
  if (isAcceptedFlow(status)) logs.push("Order accepted");
  if (["preparing", "ready_for_pickup", "delivery_sign_restaurant", "delivery_sign_rider", "out_for_delivery", "delivery_signed_by_rider", "delivered"].includes(status)) {
    logs.push("Preparing started");
  }
  if (["ready_for_pickup", "delivery_sign_restaurant", "delivery_sign_rider", "out_for_delivery", "delivery_signed_by_rider", "delivered"].includes(status)) {
    logs.push("Ready for pickup");
  }
  if (["out_for_delivery", "delivery_signed_by_rider", "delivered"].includes(status)) {
    logs.push("Out for delivery");
  }
  return logs;
};

const RestaurantOrders = () => {
  const { restaurant, loading, error, orders, setOrders } = useRestaurantLayout();
  const [orderUserLocations, setOrderUserLocations] = useState<Record<string, RestaurantOrderUserLocationRecord["location"]>>({});
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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
      if (action === restaurantAcceptOrder || !selectedOrderId) {
        setSelectedOrderId(orderId);
      }
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
      setOrders((current) => {
        const next = current.filter((order) => order.id !== orderId);
        if (selectedOrderId === orderId) {
          setSelectedOrderId(next[0]?.id ?? null);
        }
        return next;
      });
    } catch (actionError) {
      setOrdersError(actionError instanceof Error ? actionError.message : "Failed to delete order");
    } finally {
      setActionOrderId(null);
    }
  };

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
      ),
    [orders],
  );

  useEffect(() => {
    if (sortedOrders.length === 0) {
      setSelectedOrderId(null);
      return;
    }
    if (!selectedOrderId || !sortedOrders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(sortedOrders[0].id);
    }
  }, [sortedOrders, selectedOrderId]);

  const selectedOrder =
    sortedOrders.find((order) => order.id === selectedOrderId) ?? sortedOrders[0] ?? null;

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

  const stageIcons = [
    { key: "preparing", label: "Preparing", icon: Package },
    { key: "ready", label: "Ready", icon: CheckCheck },
    { key: "delivery", label: "Delivery", icon: Truck },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Order Workflow</h2>
        <p className="text-sm text-muted-foreground">
          Scan fast, take action quickly, and track progress with clear stages.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Incoming orders ({sortedOrders.length})
          </div>
          <div className="divide-y divide-border">
            {sortedOrders.map((order, index) => {
              const location = orderUserLocations[order.id];
              const itemPreview = order.orderItems?.[0]?.menuItem?.name ?? "Item";
              const isSelected = selectedOrderId === order.id;
              const canDelete = ["cancelled", "delivered", "rejected"].includes(order.status);
              const canCancel = !["out_for_delivery", "delivery_signed_by_rider", "delivered", "cancelled", "rejected"].includes(order.status);

              return (
                <div
                  key={order.id}
                  className={`flex items-center gap-3 px-3 py-2.5 transition ${isSelected ? "bg-brand-red/5" : "hover:bg-surface-hover/60"}`}
                  onClick={() => setSelectedOrderId(order.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedOrderId(order.id);
                    }
                  }}
                >
                  <p className="w-6 shrink-0 text-sm font-black text-foreground">{index + 1}</p>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {order.user ? `${order.user.firstName} ${order.user.lastName}` : "Customer"}
                      </p>
                      <span className="truncate text-[11px] text-muted-foreground">{itemPreview}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {location ? `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}` : "Location pending"}
                      </span>
                      <span>{getTimeAgo(order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      title="Accept order"
                      aria-label="Accept order"
                      disabled={actionOrderId === order.id || order.status !== "pending"}
                      onClick={(event) => {
                        event.stopPropagation();
                        void runOrderAction(order.id, restaurantAcceptOrder);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Reject order"
                      aria-label="Reject order"
                      disabled={actionOrderId === order.id || !canCancel}
                      onClick={(event) => {
                        event.stopPropagation();
                        void runOrderAction(order.id, restaurantCancelOrder);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-amber-600 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Delete order"
                      aria-label="Delete order"
                      disabled={actionOrderId === order.id || !canDelete}
                      onClick={(event) => {
                        event.stopPropagation();
                        void runOrderDelete(order.id);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <AnimatePresence mode="wait">
            {!selectedOrder ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-sm text-muted-foreground"
              >
                Select an order to view details.
              </motion.p>
            ) : !isAcceptedFlow(selectedOrder.status) ? (
              <motion.div
                key={`pending-${selectedOrder.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-2"
              >
                <p className="text-sm font-semibold text-foreground">
                  Order #{selectedOrder.id.slice(0, 8)} is awaiting action.
                </p>
                <p className="text-sm text-muted-foreground">
                  Accept the order from the list to unlock full details and workflow controls.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={`details-${selectedOrder.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {selectedOrder.user
                      ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}`
                      : "Customer"}
                  </p>
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {orderUserLocations[selectedOrder.id]
                      ? `${orderUserLocations[selectedOrder.id]?.latitude.toFixed(4)}, ${orderUserLocations[selectedOrder.id]?.longitude.toFixed(4)}`
                      : "Customer location pending"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Rider: {selectedOrder.rider ? `${selectedOrder.rider.name} (${selectedOrder.rider.phoneNumber})` : "Not assigned yet"}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Order items
                  </p>
                  <div className="mt-2 space-y-1.5 text-sm">
                    {selectedOrder.orderItems?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2">
                        <span className="truncate text-foreground">
                          {item.menuItem?.name ?? item.menuItemId} x{item.quantity}
                        </span>
                        <span className="font-semibold text-foreground">
                          KES {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-border pt-2 text-sm font-bold text-foreground">
                    Total (excluding shipping): KES {selectedOrder.totalPrice.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status control
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Flow: Accept order - Preparing - Ready for pickup - Assign rider - Out for delivery
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      title="Preparing"
                      disabled
                      className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-700"
                    >
                      <Package className="h-4 w-4" />
                      <span>Preparing</span>
                    </button>
                    <button
                      type="button"
                      title="Ready for pickup"
                      disabled={actionOrderId === selectedOrder.id || !["accepted", "preparing"].includes(selectedOrder.status)}
                      onClick={() => void runOrderAction(selectedOrder.id, restaurantMarkOrderReady)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <CheckCheck className="h-4 w-4" />
                      <span>Ready</span>
                    </button>
                    <button
                      type="button"
                      title={selectedOrder.rider ? "Rider assigned" : "Assign rider (disabled until rider is picked)"}
                      disabled={!selectedOrder.rider}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-2 text-xs font-semibold text-foreground transition disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Assign rider</span>
                    </button>
                    <button
                      type="button"
                      title="Out for delivery"
                      disabled={actionOrderId === selectedOrder.id || !["ready_for_pickup", "delivery_sign_rider"].includes(selectedOrder.status)}
                      onClick={() => void runOrderAction(selectedOrder.id, restaurantSignDeliveryStart)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Truck className="h-4 w-4" />
                      <span>Delivery</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {stageIcons.map((stage, idx) => {
                      const Icon = stage.icon;
                      const currentStage = stageFromStatus(selectedOrder.status);
                      const active = idx + 1 <= currentStage;
                      return (
                        <div key={stage.key} className="flex items-center gap-2">
                          <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs ${active ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground"}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          {idx < stageIcons.length - 1 ? (
                            <div className={`h-0 w-8 border-t-2 border-dotted ${active ? "border-emerald-500" : "border-border"}`} />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Activity log
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {buildActivityLogs(selectedOrder.status).map((entry) => (
                      <p key={entry} className="text-xs text-muted-foreground">
                        - {entry}
                      </p>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default RestaurantOrders;
