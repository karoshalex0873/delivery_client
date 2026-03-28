import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Ban, 
  Check, 
  CheckCheck, 
  ClipboardList, 
  MapPin, 
  Package, 
  Trash2, 
  Truck, 
  Clock,
  ArrowLeft,
  ChevronRight,
  XCircle,
  Users,
  Phone,
  DollarSign
} from "lucide-react";
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
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Link } from "react-router";

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
  if (status === "pending") return 0;
  if (["accepted", "preparing"].includes(status)) return 1;
  if (["ready_for_pickup"].includes(status)) return 2;
  if (["delivery_sign_restaurant", "delivery_sign_rider", "out_for_delivery", "delivery_signed_by_rider"].includes(status)) return 3;
  if (status === "delivered") return 4;
  return 0;
};

const getStatusColor = (status: string) => {
  const config: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    accepted: "bg-blue-100 text-blue-700 border-blue-200",
    preparing: "bg-purple-100 text-purple-700 border-purple-200",
    ready_for_pickup: "bg-indigo-100 text-indigo-700 border-indigo-200",
    out_for_delivery: "bg-emerald-100 text-emerald-700 border-emerald-200",
    delivered: "bg-green-100 text-green-700 border-green-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };
  return config[status] || "bg-gray-100 text-gray-700 border-gray-200";
};

const buildActivityLogs = (status: string) => {
  const logs: string[] = [];
  if (status === "pending") logs.push("Waiting for restaurant acceptance");
  if (isAcceptedFlow(status)) logs.push("Restaurant accepted order");
  if (["preparing", "ready_for_pickup", "delivery_sign_restaurant", "delivery_sign_rider", "out_for_delivery", "delivery_signed_by_rider", "delivered"].includes(status)) {
    logs.push("Meal preparation in progress");
  }
  if (["ready_for_pickup", "delivery_sign_restaurant", "delivery_sign_rider", "out_for_delivery", "delivery_signed_by_rider", "delivered"].includes(status)) {
    logs.push("Ready for pickup");
    logs.push("Waiting for nearest active rider assignment");
  }
  if (["delivery_sign_restaurant", "delivery_sign_rider", "out_for_delivery", "delivery_signed_by_rider", "delivered"].includes(status)) {
    logs.push("Rider assignment confirmed");
  }
  if (["out_for_delivery", "delivery_signed_by_rider", "delivered"].includes(status)) {
    logs.push("Pickup signatures completed");
    logs.push("Out for delivery");
  }
  if (["delivery_signed_by_rider", "delivered"].includes(status)) {
    logs.push("Rider marked delivered");
  }
  if (status === "delivered") {
    logs.push("Customer confirmed delivery");
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
  const [mobileView, setMobileView] = useState<"list" | "details">("list");

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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-brand-red/20 border-t-brand-red animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
          <ClipboardList className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Create Your Restaurant</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Orders will appear here after your restaurant profile is available.
        </p>
        <Link to="/restaurant/settings">
          <Button>Setup Restaurant</Button>
        </Link>
      </div>
    );
  }

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-brand-red/20 border-t-brand-red animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {ordersError}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
          <ClipboardList className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">No Orders Yet</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Incoming customer orders will appear here once people start placing them.
        </p>
      </div>
    );
  }

  const pendingOrders = sortedOrders.filter(o => o.status === "pending");
  const activeOrders = sortedOrders.filter(o => isAcceptedFlow(o.status) && o.status !== "delivered");
  const completedOrders = sortedOrders.filter(o => o.status === "delivered");

  const stageIcons = [
    { key: "accepted", label: "Accepted", icon: Check },
    { key: "ready", label: "Ready", icon: CheckCheck },
    { key: "pickup", label: "Pickup", icon: Truck },
    { key: "done", label: "Done", icon: CheckCheck },
  ];

  // Mobile view: show list or details
  if (mobileView === "details" && selectedOrder) {
    return (
      <div className="pb-20">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 -mt-2 -mx-4 px-4 py-3 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileView("list")}
              className="p-1 -ml-1"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-foreground">Order Details</h1>
              <p className="text-xs text-muted-foreground font-mono">
                #{selectedOrder.id.slice(0, 8)}
              </p>
            </div>
            <Badge className={cn("capitalize", getStatusColor(selectedOrder.status))}>
              {selectedOrder.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>

        {/* Order Details Content */}
        <div className="space-y-4">
          {/* Customer Info */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-red/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-brand-red" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                  Customer
                </p>
                <p className="text-base font-semibold text-foreground">
                  {selectedOrder.user ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}` : "Customer"}
                </p>
                {selectedOrder.user?.phoneNumber && (
                  <div className="flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <a href={`tel:${selectedOrder.user.phoneNumber}`} className="text-xs text-emerald-600">
                      {selectedOrder.user.phoneNumber}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {orderUserLocations[selectedOrder.id]
                      ? `${orderUserLocations[selectedOrder.id]?.latitude.toFixed(4)}, ${orderUserLocations[selectedOrder.id]?.longitude.toFixed(4)}`
                      : "Location pending"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rider Info */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                  Rider
                </p>
                {selectedOrder.rider ? (
                  <>
                    <p className="text-base font-semibold text-foreground">
                      {selectedOrder.rider.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedOrder.rider.phoneNumber}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Not assigned yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Order Items</h2>
            <div className="space-y-2">
              {selectedOrder.orderItems?.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">
                      {item.menuItem?.name ?? item.menuItemId}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">x{item.quantity}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    KES {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-border flex justify-between">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-base font-bold text-foreground">
                KES {selectedOrder.totalPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Status Controls */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Order Progress</h2>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Flow: Restaurant accepts - Auto rider assignment - Pickup signatures - Delivery done
            </p>
            
            {/* Stage Indicators */}
            <div className="flex items-center justify-between mb-4">
              {stageIcons.map((stage, idx) => {
                const Icon = stage.icon;
                const currentStage = stageFromStatus(selectedOrder.status);
                const active = idx + 1 <= currentStage;
                return (
                  <div key={stage.key} className="flex flex-col items-center gap-1 flex-1">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      active ? "bg-emerald-500 text-white" : "bg-muted/20 text-muted-foreground"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {!isAcceptedFlow(selectedOrder.status) && selectedOrder.status === "pending" && (
                <Button
                  onClick={() => void runOrderAction(selectedOrder.id, restaurantAcceptOrder)}
                  disabled={actionOrderId === selectedOrder.id}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept Order
                </Button>
              )}
              
              {isAcceptedFlow(selectedOrder.status) && selectedOrder.status !== "delivered" && (
                <>
                  <Button
                    onClick={() => void runOrderAction(selectedOrder.id, restaurantMarkOrderReady)}
                    disabled={actionOrderId === selectedOrder.id || !["accepted", "preparing"].includes(selectedOrder.status)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark as Ready
                  </Button>
                  
                  <Button
                    onClick={() => void runOrderAction(selectedOrder.id, restaurantSignDeliveryStart)}
                    disabled={actionOrderId === selectedOrder.id || !["ready_for_pickup", "delivery_sign_rider"].includes(selectedOrder.status)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Sign Pickup
                  </Button>
                </>
              )}

              <p className="text-[11px] text-muted-foreground">
                Rider: {selectedOrder.rider ? "Assigned automatically" : "Waiting for nearest active rider"}
              </p>
              
              {!["delivered", "cancelled", "rejected"].includes(selectedOrder.status) && (
                <Button
                  variant="outline"
                  onClick={() => void runOrderAction(selectedOrder.id, restaurantCancelOrder)}
                  disabled={actionOrderId === selectedOrder.id}
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              )}
              
              {["cancelled", "delivered", "rejected"].includes(selectedOrder.status) && (
                <Button
                  variant="destructive"
                  onClick={() => void runOrderDelete(selectedOrder.id)}
                  disabled={actionOrderId === selectedOrder.id}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Order
                </Button>
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Activity Log
            </h2>
            <div className="space-y-2">
              {buildActivityLogs(selectedOrder.status).map((entry, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                  <p className="text-xs text-muted-foreground">{entry}</p>
                </div>
              ))}
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5" />
                <p className="text-xs text-muted-foreground">
                  Order placed {getTimeAgo(selectedOrder.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile list view or desktop view
  return (
    <section className="space-y-4 pb-20">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Order Workflow</h2>
        <p className="text-sm text-muted-foreground">
          Scan fast, take action quickly, and track progress with clear stages.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        {/* Orders List */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Orders
              </span>
              <Badge variant="outline" className="text-xs">
                {sortedOrders.length} total
              </Badge>
            </div>
            {pendingOrders.length > 0 && (
              <div className="flex gap-2 mt-2">
                <Badge variant="warning" className="text-xs">
                  {pendingOrders.length} pending
                </Badge>
              </div>
            )}
          </div>
          
          <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
            {sortedOrders.map((order, index) => {
              const location = orderUserLocations[order.id];
              const itemPreview = order.orderItems?.[0]?.menuItem?.name ?? "Item";
              const isSelected = selectedOrderId === order.id;
              const canDelete = ["cancelled", "delivered", "rejected"].includes(order.status);
              const canCancel = !["out_for_delivery", "delivery_signed_by_rider", "delivered", "cancelled", "rejected"].includes(order.status);
              const statusColor = getStatusColor(order.status);

              return (
                <div
                  key={order.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 cursor-pointer transition-all active:scale-[0.98]",
                    isSelected && "bg-brand-red/5 border-l-4 border-l-brand-red",
                    !isSelected && "hover:bg-surface-hover/60"
                  )}
                  onClick={() => {
                    setSelectedOrderId(order.id);
                    if (window.innerWidth < 1024) {
                      setMobileView("details");
                    }
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {order.user ? `${order.user.firstName} ${order.user.lastName}` : "Customer"}
                      </p>
                      <Badge className={cn("capitalize text-[10px] px-2 py-0", statusColor)}>
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate max-w-[120px]">{itemPreview}</span>
                      <span>•</span>
                      <span>{getTimeAgo(order.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">
                        {location ? `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}` : "Location pending"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {order.status === "pending" && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void runOrderAction(order.id, restaurantAcceptOrder);
                        }}
                        disabled={actionOrderId === order.id}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition disabled:opacity-40"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    {canCancel && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void runOrderAction(order.id, restaurantCancelOrder);
                        }}
                        disabled={actionOrderId === order.id}
                        className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition disabled:opacity-40"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void runOrderDelete(order.id);
                        }}
                        disabled={actionOrderId === order.id}
                        className="p-2 rounded-lg bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 transition disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-1 lg:hidden" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details - Desktop only */}
        <div className="hidden lg:block rounded-2xl border border-border bg-surface p-5">
          <AnimatePresence mode="wait">
            {!selectedOrder ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-sm text-muted-foreground text-center py-12"
              >
                Select an order to view details
              </motion.p>
            ) : !isAcceptedFlow(selectedOrder.status) ? (
              <motion.div
                key={`pending-${selectedOrder.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4 text-center py-12"
              >
                <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Order #{selectedOrder.id.slice(0, 8)} is awaiting action
                </p>
                <p className="text-sm text-muted-foreground">
                  Accept the order to unlock full details and workflow controls
                </p>
                <Button
                  onClick={() => void runOrderAction(selectedOrder.id, restaurantAcceptOrder)}
                  disabled={actionOrderId === selectedOrder.id}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept Order
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key={`details-${selectedOrder.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                {/* Customer & Rider Info */}
                <div className="grid gap-3">
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Customer
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedOrder.user ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}` : "Customer"}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {orderUserLocations[selectedOrder.id]
                          ? `${orderUserLocations[selectedOrder.id]?.latitude.toFixed(4)}, ${orderUserLocations[selectedOrder.id]?.longitude.toFixed(4)}`
                          : "Location pending"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Rider
                    </p>
                    {selectedOrder.rider ? (
                      <>
                        <p className="text-sm font-semibold text-foreground">
                          {selectedOrder.rider.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedOrder.rider.phoneNumber}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not assigned yet</p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Order items
                  </p>
                  <div className="space-y-2">
                    {selectedOrder.orderItems?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate text-foreground">
                          {item.menuItem?.name ?? item.menuItemId} x{item.quantity}
                        </span>
                        <span className="font-semibold text-foreground">
                          KES {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-border flex justify-between text-sm font-bold text-foreground">
                    <span>Total</span>
                    <span>KES {selectedOrder.totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Status Controls */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status control
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Flow: Restaurant accepts - Auto rider assignment - Pickup signatures - Delivery done
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => void runOrderAction(selectedOrder.id, restaurantAcceptOrder)}
                      disabled={actionOrderId === selectedOrder.id || selectedOrder.status !== "pending"}
                      variant="outline"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void runOrderAction(selectedOrder.id, restaurantMarkOrderReady)}
                      disabled={actionOrderId === selectedOrder.id || !["accepted", "preparing"].includes(selectedOrder.status)}
                      variant="outline"
                    >
                      <CheckCheck className="h-4 w-4 mr-1" />
                      Mark Ready
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void runOrderAction(selectedOrder.id, restaurantSignDeliveryStart)}
                      disabled={actionOrderId === selectedOrder.id || !["ready_for_pickup", "delivery_sign_rider"].includes(selectedOrder.status)}
                      variant="outline"
                    >
                      <Truck className="h-4 w-4 mr-1" />
                      Sign Pickup
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Rider: {selectedOrder.rider ? "Assigned automatically" : "Waiting for nearest active rider"}
                  </p>
                </div>

                {/* Stage Indicators */}
                <div className="flex items-center justify-between">
                  {stageIcons.map((stage, idx) => {
                    const Icon = stage.icon;
                    const currentStage = stageFromStatus(selectedOrder.status);
                    const active = idx + 1 <= currentStage;
                    return (
                      <div key={stage.key} className="flex items-center gap-2">
                        <div className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs ${active ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {idx < stageIcons.length - 1 && (
                          <div className={`h-0 w-8 border-t-2 border-dotted ${active ? "border-emerald-500" : "border-border"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Activity Log */}
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Activity log
                  </p>
                  <div className="space-y-1.5">
                    {buildActivityLogs(selectedOrder.status).map((entry) => (
                      <p key={entry} className="text-xs text-muted-foreground">
                        • {entry}
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
