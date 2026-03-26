import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Package,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useCustomerContext } from "./customer";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { formatCurrency, formatDate } from "~/lib/utils";

const itemImages = [
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80",
];

const stages = [
  { id: 1, label: "Order Placed", icon: ShoppingBag },
  { id: 2, label: "Preparing", icon: Package },
  { id: 3, label: "Out for Delivery", icon: Truck },
  { id: 4, label: "Delivered", icon: CheckCircle2 },
] as const;

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

export default function CustomerOrderDetails() {
  const { orderId } = useParams();
  const { orders, lifecycleByOrder, handleConfirmDelivery, handleCancelOrder, handleDeleteOrder, riderLocations, customerLocation } =
    useCustomerContext();

  const order = orders.find((o) => o.id === orderId);
  const lifecycle = orderId ? lifecycleByOrder[orderId] : null;

  if (!order) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Order not found</h2>
        <Link to="/customer/orders">
          <Button variant="outline">Back to orders</Button>
        </Link>
      </div>
    );
  }

  const stage = Math.min(4, Math.max(1, lifecycle?.stage ?? 1));
  const progress = ((stage - 1) / (stages.length - 1)) * 100;
  const foodSubtotal =
    order.foodSubtotal ??
    Number((order.orderItems?.reduce((sum, item) => sum + item.price, 0) ?? 0).toFixed(2));
  const shippingCost = order.shippingCost ?? Number(Math.max(0, order.totalPrice - foodSubtotal).toFixed(2));
  const canCancel =
    !["out_for_delivery", "delivery_signed_by_rider", "delivered", "cancelled", "rejected"].includes(
      order.status,
    );
  const canDelete = ["cancelled", "delivered", "rejected"].includes(order.status);
  const riderLocation = order?.rider?.id ? riderLocations[order.rider.id] ?? null : null;
  const lifecycleRiderLocation = lifecycle?.deliveryDetails?.riderLocation;
  const fallbackRiderLocation =
    lifecycleRiderLocation?.latitude != null && lifecycleRiderLocation?.longitude != null
      ? { latitude: lifecycleRiderLocation.latitude, longitude: lifecycleRiderLocation.longitude }
      : null;
  const effectiveRiderLocation = riderLocation ?? fallbackRiderLocation;
  const mapEmbedUrl = effectiveRiderLocation
    ? buildMapEmbedUrl(effectiveRiderLocation, customerLocation)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-foreground">Order #{order.id.slice(0, 8)}</h2>
          <p className="text-sm text-muted-foreground">
            {order.paidAt ? formatDate(order.paidAt) : "Pending payment"}
          </p>
        </div>
        <Badge variant={order.status === "delivered" ? "success" : "secondary"} className="capitalize">
          {order.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <Card className="rounded-3xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Real-time Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-hover">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="h-full rounded-full bg-brand-red"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stages.map((entry) => {
              const active = entry.id <= stage;
              const Icon = entry.icon;
              return (
                <motion.div
                  key={entry.id}
                  layout
                  transition={{ duration: 0.25 }}
                  className={`rounded-2xl border p-3 ${
                    active
                      ? "border-brand-red/30 bg-brand-red/10 text-brand-red"
                      : "border-border bg-surface text-muted-foreground"
                  }`}
                >
                  <p className="inline-flex items-center gap-2 text-xs font-semibold">
                    <Icon className="h-4 w-4" />
                    {entry.label}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm font-semibold text-foreground">Estimated delivery time</p>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4" />{" "}
              {lifecycle?.deliveryDetails?.estimatedMinutes != null
                ? `${lifecycle.deliveryDetails.estimatedMinutes}-${lifecycle.deliveryDetails.estimatedMinutes + 8} minutes`
                : "Calculating..."}
            </p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>
                Created:{" "}
                {lifecycle?.deliveryDetails?.milestones?.createdAt
                  ? formatDate(lifecycle.deliveryDetails.milestones.createdAt)
                  : "N/A"}
              </p>
              <p>
                Rider signed:{" "}
                {lifecycle?.deliveryDetails?.milestones?.riderSignedDeliveredAt
                  ? formatDate(lifecycle.deliveryDetails.milestones.riderSignedDeliveredAt)
                  : "Pending"}
              </p>
              <p>
                Delivered:{" "}
                {lifecycle?.deliveryDetails?.milestones?.customerConfirmedDeliveredAt
                  ? formatDate(lifecycle.deliveryDetails.milestones.customerConfirmedDeliveredAt)
                  : "Pending"}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-brand-red" /> Rider map preview
              </p>
              <span className="text-xs text-muted-foreground">Live updates</span>
            </div>
            <div className="h-44 bg-surface-hover/80 p-4">
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
                <div className="h-full rounded-xl border border-dashed border-border bg-background/80" />
              )}
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm font-semibold text-foreground">Order Activity</p>
            {(lifecycle?.logs ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Waiting for status updates.</p>
            ) : (
              (lifecycle?.logs ?? []).map((log, idx) => (
                <p key={`${order.id}-log-${idx}`} className="text-sm text-muted-foreground">
                  - {log}
                </p>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-xl font-bold">
            <ShoppingBag className="h-5 w-5 text-brand-red" />
            Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.orderItems?.map((item, index) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={itemImages[index % itemImages.length]}
                  alt={item.menuItem?.name ?? "Food item"}
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {item.menuItem?.name ?? "Menu item"}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover"
                  >
                    -
                  </button>
                  <span className="w-5 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            </div>
          ))}

          <div className="mt-2 flex items-center justify-between rounded-2xl border border-brand-red/20 bg-brand-red/10 px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="text-lg font-black text-brand-red">{formatCurrency(order.totalPrice)}</span>
          </div>
          <div className="rounded-xl border border-border bg-surface-hover/30 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Food subtotal</span>
              <span className="font-semibold text-foreground">{formatCurrency(foodSubtotal)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">Shipping cost</span>
              <span className="font-semibold text-foreground">{formatCurrency(shippingCost)}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Shipping rate: KES 40 per km</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => void handleCancelOrder(order.id)}
          disabled={!canCancel}
          variant="outline"
          className="w-full sm:w-auto"
        >
          Cancel Order
        </Button>
        <Button
          onClick={() => void handleDeleteOrder(order.id)}
          disabled={!canDelete}
          variant="destructive"
          className="w-full sm:w-auto"
        >
          Delete Order
        </Button>
        <Button
          onClick={() => void handleConfirmDelivery(order.id)}
          disabled={order.status !== "delivery_signed_by_rider"}
          className="w-full transition-transform active:scale-[0.98] sm:w-auto"
        >
          <PackageCheck className="mr-2 h-4 w-4" />
          {order.status === "delivery_signed_by_rider"
            ? "Sign and confirm delivered"
            : order.status === "delivered"
              ? "Delivered"
              : "Waiting for rider"}
        </Button>
      </div>

      <Link
        to="/customer/orders"
        className="group inline-flex items-center gap-2 text-sm font-semibold text-brand-red"
      >
        <Truck className="h-4 w-4" />
        Back to all orders
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
