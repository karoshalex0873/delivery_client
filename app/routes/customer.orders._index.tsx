import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useOutletContext } from "react-router";
import { type CustomerContextData } from "./customer";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { formatCurrency, formatDate } from "~/lib/utils";

const restaurantImages = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=1200&q=80",
];

const foodThumbs = [
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80",
];

const stageEntries = [
  { id: 1, label: "Order Placed", icon: ShoppingBag },
  { id: 2, label: "Preparing", icon: Package },
  { id: 3, label: "Out for Delivery", icon: Truck },
  { id: 4, label: "Delivered", icon: CheckCircle2 },
] as const;

type StatusMeta = {
  icon: typeof Clock3;
  label: string;
  timelineTone: string;
  badgeVariant: "success" | "secondary";
};

const statusMetaMap: Record<string, StatusMeta> = {
  pending: { icon: Clock3, label: "Pending", timelineTone: "text-muted-foreground", badgeVariant: "secondary" },
  awaiting_payment: {
    icon: Clock3,
    label: "Awaiting Payment",
    timelineTone: "text-muted-foreground",
    badgeVariant: "secondary",
  },
  accepted: { icon: Package, label: "Preparing", timelineTone: "text-warning", badgeVariant: "secondary" },
  preparing: { icon: Package, label: "Preparing", timelineTone: "text-warning", badgeVariant: "secondary" },
  ready_for_pickup: { icon: Package, label: "Ready for Pickup", timelineTone: "text-warning", badgeVariant: "secondary" },
  out_for_delivery: { icon: Truck, label: "On Delivery", timelineTone: "text-blue-600", badgeVariant: "secondary" },
  delivery_signed_by_rider: { icon: PackageCheck, label: "Awaiting Your Signature", timelineTone: "text-info", badgeVariant: "secondary" },
  delivered: { icon: CheckCircle2, label: "Delivered", timelineTone: "text-success", badgeVariant: "success" },
  payment_failed: { icon: Clock3, label: "Payment Failed", timelineTone: "text-muted-foreground", badgeVariant: "secondary" },
};

const getStatusMeta = (status: string | undefined) => {
  if (!status) {
    return statusMetaMap.pending;
  }
  return statusMetaMap[status] ?? statusMetaMap.pending;
};

const getItemSummary = (order: CustomerContextData["orders"][number]) => {
  const items = order.orderItems ?? [];
  if (items.length === 0) {
    return "No items";
  }
  const first = items[0]?.menuItem?.name ?? "Item";
  if (items.length === 1) {
    return first;
  }
  return `${first} + ${items.length - 1} item${items.length - 1 > 1 ? "s" : ""}`;
};

const buildMapEmbedUrl = (
  rider: { latitude: number; longitude: number },
  customer?: { latitude: number; longitude: number } | null,
) => {
  const points = customer ? [rider, customer] : [rider];
  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const padding = 0.01;
  const bbox = `${minLng - padding},${minLat - padding},${maxLng + padding},${maxLat + padding}`;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox,
  )}&layer=mapnik&marker=${rider.latitude},${rider.longitude}`;
};

const formatDeliveryDuration = (startIso: string | null | undefined, endIso: string | null | undefined) => {
  if (!startIso || !endIso) {
    return null;
  }

  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null;
  }

  const totalMinutes = Math.max(1, Math.round((end - start) / 60000));
  if (totalMinutes < 60) {
    return `Time: ${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `Time: ${hours} hr`;
  }
  return `Time: ${hours} hr ${minutes} min`;
};

export default function CustomerOrdersHistory() {
  const { orders, lifecycleByOrder, handleConfirmDelivery, handleCancelOrder, handleDeleteOrder, riderLocations, customerLocation } =
    useOutletContext<CustomerContextData>();
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const aTime = a.paidAt ? new Date(a.paidAt).getTime() : 0;
      const bTime = b.paidAt ? new Date(b.paidAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [orders]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(sortedOrders[0]?.id ?? null);

  useEffect(() => {
    if (sortedOrders.length === 0) {
      setSelectedOrderId(null);
      return;
    }
    if (!selectedOrderId || !sortedOrders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(sortedOrders[0].id);
    }
  }, [sortedOrders, selectedOrderId]);

  const selectedOrder = useMemo(
    () => sortedOrders.find((order) => order.id === selectedOrderId) ?? sortedOrders[0],
    [sortedOrders, selectedOrderId],
  );

  if (sortedOrders.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 rounded-3xl border border-border bg-surface p-8 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-hover">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">No orders yet</h2>
        <p className="text-muted-foreground">Place your first order to start tracking your delivery story.</p>
      </div>
    );
  }

  const lifecycle = selectedOrder ? lifecycleByOrder[selectedOrder.id] : null;
  const selectedRiderLocation =
    selectedOrder?.rider?.id ? riderLocations[selectedOrder.rider.id] ?? null : null;
  const lifecycleRiderLocation = lifecycle?.deliveryDetails?.riderLocation;
  const fallbackRiderLocation =
    lifecycleRiderLocation?.latitude != null && lifecycleRiderLocation?.longitude != null
      ? { latitude: lifecycleRiderLocation.latitude, longitude: lifecycleRiderLocation.longitude }
      : null;
  const effectiveRiderLocation = selectedRiderLocation ?? fallbackRiderLocation;
  const deliveryDetails = lifecycle?.deliveryDetails;
  const createdAt = deliveryDetails?.milestones?.createdAt ?? null;
  const riderSignedAt = deliveryDetails?.milestones?.riderSignedDeliveredAt ?? null;
  const customerDeliveredAt = deliveryDetails?.milestones?.customerConfirmedDeliveredAt ?? null;
  const deliveryTimeLabel = formatDeliveryDuration(createdAt, customerDeliveredAt);
  const deliveryInProgressLabel = !customerDeliveredAt
    ? formatDeliveryDuration(createdAt, new Date().toISOString())
    : null;
  const canCustomerConfirm = selectedOrder.status === "delivery_signed_by_rider";
  const isDelivered = selectedOrder.status === "delivered";
  const isActiveNotDelivered = !isDelivered;
  const processCompleted =
    selectedOrder.status === "delivered" && Boolean(riderSignedAt) && Boolean(customerDeliveredAt);
  const processLogs =
    (lifecycle?.logs ?? []).length > 0
      ? lifecycle?.logs ?? []
      : ["Food is being prepared.", "Rider is assigned and moving to delivery."];
  const canCancel =
    !["out_for_delivery", "delivery_signed_by_rider", "delivered", "cancelled", "rejected"].includes(
      selectedOrder.status,
    );
  const canDelete = ["cancelled", "delivered", "rejected"].includes(selectedOrder.status);
  const foodSubtotal =
    selectedOrder.foodSubtotal ??
    Number((selectedOrder.orderItems?.reduce((sum, item) => sum + item.price, 0) ?? 0).toFixed(2));
  const shippingCost =
    selectedOrder.shippingCost ?? Number(Math.max(0, selectedOrder.totalPrice - foodSubtotal).toFixed(2));
  const mapEmbedUrl = selectedRiderLocation
    ? buildMapEmbedUrl(selectedRiderLocation, customerLocation)
    : effectiveRiderLocation
      ? buildMapEmbedUrl(effectiveRiderLocation, customerLocation)
    : null;
  const stage = Math.min(4, Math.max(1, lifecycle?.stage ?? 1));
  const progress = ((stage - 1) / (stageEntries.length - 1)) * 100;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* Order History Sidebar */}
      <aside className="hidden self-start rounded-2xl border border-border bg-surface p-2 shadow-sm lg:sticky lg:top-24 lg:block lg:h-[calc(100vh-8rem)] lg:overflow-y-auto hidden-scrollbar">
        <div className="mb-6 px-1">
          <h2 className="text-xl font-black text-foreground">Order History</h2>
          <p className="text-sm text-muted-foreground mt-1">Your recent deliveries and activity.</p>
        </div>

        <div className="relative pl-4">
          <div className="absolute bottom-0 left-5.75 top-2 w-0.5 bg-border/50" />
          <div className="space-y-4">
            {sortedOrders.map((order) => {
              const meta = getStatusMeta(order.status);
              const Icon = meta.icon;
              const isActive = order.id === selectedOrder?.id;
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`relative w-full rounded-xl px-3 p-3 text-left transition-all hover:bg-surface-hover/50 ${
                    isActive ? "bg-surface-hover ring-1 ring-border/50 shadow-sm mx-1" : "bg-transparent"
                  }`}
                >
                  <span
                    className={`absolute -left-3.5 top-6 z-10 inline-flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-surface ${
                      isActive ? "bg-brand-red" : "bg-muted-foreground/30"
                    }`}
                  />

                  <div className="flex items-start gap-4">
                    <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background border border-border/50 shadow-sm ${isActive ? "text-brand-red" : meta.timelineTone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`truncate text-sm font-bold ${isActive ? "text-foreground" : "text-foreground/80"}`}>
                          {order.restaurant?.name ?? "Restaurant"}
                        </p>
                        <span className="text-[10px] font-medium text-muted-foreground shrink-0 mt-0.5">
                          {order.paidAt ? formatDate(order.paidAt).split(',')[0] : "Pending"}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground mt-0.5">{getItemSummary(order)}</p>
                      <div className="mt-2">
                        <Badge variant={meta.badgeVariant} className="capitalize text-[10px] font-medium px-2 py-0 h-5">
                          {meta.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {selectedOrder ? (
        <motion.section
          key={selectedOrder.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="space-y-6 overflow-x-hidden"
        >
          {/* 1. Restaurant Identity Section */}
          <Card className="rounded-2xl border-border shadow-sm bg-surface overflow-hidden">
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={restaurantImages[sortedOrders.findIndex((order) => order.id === selectedOrder.id) % restaurantImages.length]}
                  alt={selectedOrder.restaurant?.name ?? "Restaurant"}
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover border border-border bg-surface-hover"
                />
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">
                    {selectedOrder.restaurant?.name ?? "Restaurant"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 flex-row text-[11px] sm:text-xs text-muted-foreground mt-1 font-medium">
                    <span className="bg-surface-hover px-2 py-0.5 rounded-md">ID: {selectedOrder.id.slice(0, 8)}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{selectedOrder.paidAt ? formatDate(selectedOrder.paidAt) : "Pending payment"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Timeline Navigation */}
          <Card className="rounded-2xl border-border bg-surface shadow-sm lg:hidden">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-foreground">Order History</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {sortedOrders.map((order) => {
                  const meta = getStatusMeta(order.status);
                  const Icon = meta.icon;
                  const isActive = order.id === selectedOrder.id;
                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`snap-start min-w-[220px] rounded-xl border p-3 text-left transition-all ${
                        isActive
                          ? "border-brand-red/35 bg-brand-red/10 shadow-sm"
                          : "border-border bg-surface hover:border-brand-red/20"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className={`mt-0.5 h-4 w-4 ${isActive ? "text-brand-red" : meta.timelineTone}`} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">
                            {order.restaurant?.name ?? "Restaurant"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{getItemSummary(order)}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {order.paidAt ? formatDate(order.paidAt) : "Pending payment"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 2. Status + Progress */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-4 pt-5 px-5 sm:px-6">
              <CardTitle className="text-sm font-bold text-foreground inline-flex items-center gap-2">
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 sm:px-8 pb-6">
              <div className="relative">
                <div className="absolute top-5 left-4 right-4 h-1.5 -translate-y-1/2 rounded-full bg-surface-hover overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-brand-red rounded-full"
                  />
                </div>
                <div className="relative flex justify-between z-10">
                  {stageEntries.map((entry) => {
                    const active = entry.id <= Math.max(1, stage);
                    const isCurrent = entry.id === Math.max(1, stage);
                    const Icon = entry.icon;
                    return (
                      <div key={entry.id} className="flex flex-col items-center gap-2">
                        <motion.div
                          layout
                          transition={{ duration: 0.2 }}
                          className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full ring-4 ring-surface transition-colors ${
                            active
                              ? "bg-brand-red text-white shadow-sm"
                              : "bg-surface-hover text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </motion.div>
                        <span
                          className={`max-w-[70px] text-center text-[10px] sm:max-w-none sm:text-xs font-semibold ${
                            isCurrent ? "text-brand-red" : active ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {entry.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Delivery Details */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="rounded-2xl border-border shadow-sm flex flex-col">
              <CardHeader className="pb-3 pt-5 px-5 sm:px-6 border-b border-border/40">
                <CardTitle className="text-sm font-bold text-foreground">Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-5 flex-1 bg-surface/50">
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button
                      onClick={() => void handleCancelOrder(selectedOrder.id)}
                      disabled={!canCancel}
                      variant="outline"
                      className="h-10 rounded-xl"
                    >
                      Cancel Order
                    </Button>
                    <Button
                      onClick={() => void handleDeleteOrder(selectedOrder.id)}
                      disabled={!canDelete}
                      variant="destructive"
                      className="h-10 rounded-xl"
                    >
                      Delete Order
                    </Button>
                  </div>
                  <Button
                    onClick={() => void handleConfirmDelivery(selectedOrder.id)}
                    disabled={!canCustomerConfirm}
                    className="w-full h-11 rounded-xl font-bold shadow-sm"
                  >
                    <PackageCheck className="mr-2 h-4 w-4" />
                    {canCustomerConfirm
                      ? "Confirm Delivery Received"
                      : isDelivered
                        ? "Delivered"
                        : isActiveNotDelivered
                          ? "Waiting for rider"
                          : "Delivered"}
                  </Button>
                  {processCompleted ? (
                    <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs font-semibold text-success">
                      Delivery process completed: rider and customer both signed.
                    </p>
                  ) : null}
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-background border border-border/50 shadow-sm p-2 rounded-lg text-muted-foreground shrink-0">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Estimated Arrival</p>
                    <p className="text-sm font-bold text-foreground">
                      {deliveryDetails?.estimatedMinutes != null
                        ? `${deliveryDetails.estimatedMinutes}-${deliveryDetails.estimatedMinutes + 8} minutes`
                        : "Calculating..."}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-background border border-border/50 shadow-sm p-2 rounded-lg text-muted-foreground shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Delivery Address</p>
                    <p className="text-sm font-bold text-foreground">
                      {deliveryDetails?.deliveryLocation?.label ?? "Current Location"}
                    </p>
                    {deliveryDetails?.distanceKm != null ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Distance to rider: {deliveryDetails.distanceKm} km
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-background border border-border/50 shadow-sm p-2 rounded-lg text-muted-foreground shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Rider</p>
                    <p className="text-sm font-bold text-foreground">
                      {deliveryDetails?.rider?.name
                        ? `${deliveryDetails.rider.name} (${deliveryDetails.rider.phoneNumber})`
                        : "Waiting for rider assignment"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-background border border-border/50 shadow-sm p-2 rounded-lg text-muted-foreground shrink-0">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Delivery Time Used</p>
                    <p className="text-sm font-bold text-foreground">
                      {deliveryTimeLabel ?? (deliveryInProgressLabel ? `${deliveryInProgressLabel} (in progress)` : "Time: N/A")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Start: {createdAt ? formatDate(createdAt) : "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      End: {customerDeliveredAt ? formatDate(customerDeliveredAt) : "Pending"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-success/20 bg-success/10 p-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-success">Process Logs</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {processLogs.map((log, index) => (
                      <div
                        key={`${selectedOrder.id}-process-log-${index}`}
                        className="rounded-lg border border-success/30 bg-white/70 px-2.5 py-2 text-xs font-medium text-success"
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 5. Items Section + 6. Total Section */}
          <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-3 pt-5 px-5 sm:px-6 border-b border-border/40 bg-surface">
              <CardTitle className="text-sm font-bold text-foreground inline-flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" /> Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {selectedOrder.orderItems?.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex flex-col items-start justify-between gap-3 bg-surface/30 p-4 transition-colors hover:bg-surface-hover/30 sm:flex-row sm:items-center sm:px-6"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <img
                        src={foodThumbs[index % foodThumbs.length]}
                        alt={item.menuItem?.name ?? "Food item"}
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover border border-border shadow-sm shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate max-w-[160px] sm:max-w-xs">{item.menuItem?.name ?? "Menu item"}</p>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">{formatCurrency(item.price)} each</p>
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:gap-5">
                      <span className="text-[11px] font-bold text-muted-foreground bg-surface-hover/50 px-2 py-1 rounded-md">Qty: {item.quantity}</span>
                      <span className="text-sm font-bold text-foreground min-w-[50px] text-right">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 sm:p-5 bg-surface border-t border-border mt-auto">
                <div className="mb-3 space-y-1 rounded-xl border border-border bg-surface-hover/30 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Food subtotal</span>
                    <span className="font-semibold text-foreground">{formatCurrency(foodSubtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Shipping cost</span>
                    <span className="font-semibold text-foreground">{formatCurrency(shippingCost)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Shipping rate: KES 40 per km</p>
                </div>
                <div className="flex items-center justify-between rounded-xl px-4 py-3 sm:px-5 sm:py-4 bg-brand-red/5 border border-brand-red/20 shadow-sm">
                  <span className="text-sm font-bold text-foreground">Total Summary</span>
                  <span className="text-xl font-black text-brand-red tracking-tight">{formatCurrency(selectedOrder.totalPrice)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Map Section */}
          <Card className="rounded-2xl border-border shadow-sm flex flex-col overflow-hidden">
            <CardHeader className="pb-3 pt-5 px-5 sm:px-6 border-b border-border/40 bg-surface z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground">Live Map Preview</CardTitle>
                <span className="text-[10px] text-brand-red font-bold uppercase tracking-widest flex items-center gap-1.5 bg-brand-red/10 px-2 py-0.5 rounded-full">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red/80"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-red"></span>
                  </span>
                  Live Updates
                </span>
              </div>
            </CardHeader>
            <div className="h-64 bg-surface-hover/50 relative p-4 flex-1">
              {mapEmbedUrl ? (
                <div className="h-full overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm">
                  <iframe
                    title="Rider live location map"
                    src={mapEmbedUrl}
                    className="h-full w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : (
                <div className="w-full h-full rounded-xl border border-dashed border-border/60 bg-background/40 flex flex-col items-center justify-center text-muted-foreground">
                  <MapPin className="h-6 w-6 mb-2 opacity-30" />
                  <p className="text-xs font-medium">Waiting for rider live location...</p>
                </div>
              )}
            </div>
            <div className="border-t border-border/50 bg-surface px-4 py-2 text-xs text-muted-foreground">
              {effectiveRiderLocation ? (
                <p>
                  Rider: {effectiveRiderLocation.latitude.toFixed(5)},{" "}
                  {effectiveRiderLocation.longitude.toFixed(5)}
                </p>
              ) : (
                <p>Rider location is not available yet.</p>
              )}
            </div>
          </Card>

        </motion.section>
      ) : null}
    </div>
  );
}
