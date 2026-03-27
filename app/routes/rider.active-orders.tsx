import { useMemo } from "react";
import { Link, useOutletContext } from "react-router";
import { type RiderContextData } from "./rider";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { MapPin, Navigation, PackageCheck, Store, User, Clock, ArrowLeft } from "lucide-react";
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

const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    accepted: "bg-blue-100 text-blue-700 border-blue-200",
    preparing: "bg-purple-100 text-purple-700 border-purple-200",
    ready_for_pickup: "bg-indigo-100 text-indigo-700 border-indigo-200",
    out_for_delivery: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  return statusMap[status] || "bg-gray-100 text-gray-700 border-gray-200";
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "out_for_delivery":
      return <Navigation className="h-3 w-3" />;
    case "ready_for_pickup":
      return <PackageCheck className="h-3 w-3" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
};

const buildMapEmbedUrl = (coords: { latitude: number; longitude: number }) =>
  `https://www.openstreetmap.org/export/embed.html?bbox=${coords.longitude - 0.01}%2C${coords.latitude - 0.01}%2C${coords.longitude + 0.01}%2C${coords.latitude + 0.01}&layer=mapnik&marker=${coords.latitude}%2C${coords.longitude}`;

const FALLBACK_COORDS = { latitude: -1.286389, longitude: 36.817223 };

export default function RiderActiveOrdersPage() {
  const { assignedOrders, busyOrderId, handleRiderSignDelivered } = useOutletContext<RiderContextData>();

  const activeOrder = useMemo(
    () => assignedOrders.find((order) => ACTIVE_ORDER_STATUSES.has(order.status)) ?? null,
    [assignedOrders],
  );

  if (!activeOrder) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
          <PackageCheck className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">No Active Order</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          You don't have any active deliveries right now.
        </p>
        <Link to="/rider">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const statusColor = getStatusColor(activeOrder.status);
  const statusLabel = activeOrder.status.replace(/_/g, " ");
  const mapCoords = activeOrder.customerLocation ?? activeOrder.restaurantLocation ?? FALLBACK_COORDS;

  return (
    <div className="space-y-4 pb-20">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 -mt-2 -mx-4 px-4 py-3 mb-2">
        <div className="flex items-center justify-between gap-3">
          <Link to="/rider" className="p-1 -ml-1">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Active Delivery</h1>
            <p className="text-xs text-muted-foreground font-mono">
              Order #{activeOrder.id.slice(0, 8)}
            </p>
          </div>
          <Badge className={cn("capitalize gap-1.5 px-2.5 py-1", statusColor)}>
            {getStatusIcon(activeOrder.status)}
            {statusLabel}
          </Badge>
        </div>
      </div>

      {/* Map Section - Prominent on mobile */}
      <div className="rounded-2xl overflow-hidden border border-border bg-surface shadow-sm">
        <div className="p-4 pb-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Navigation className="h-4 w-4 text-emerald-500" />
            Live Tracking
          </h2>
        </div>
        <div className="px-4 pb-4">
          <div className="overflow-hidden rounded-xl border border-border bg-muted/10">
            <iframe
              title="Active delivery map"
              src={buildMapEmbedUrl(mapCoords)}
              className="h-64 w-full"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Location Cards - Vertical stack for mobile */}
      <div className="space-y-3">
        {/* Pickup Location */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Store className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                Pickup From
              </p>
              <p className="text-base font-semibold text-foreground truncate">
                {activeOrder.restaurant?.name ?? "Restaurant"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {activeOrder.restaurant?.address ?? "Address unavailable"}
              </p>
            </div>
          </div>
        </div>

        {/* Dropoff Location */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                Deliver To
              </p>
              <p className="text-base font-semibold text-foreground truncate">
                {activeOrder.user ? `${activeOrder.user.firstName} ${activeOrder.user.lastName}` : "Customer"}
              </p>
              {activeOrder.riderToDropoffKm != null && (
                <div className="flex items-center gap-1 mt-1">
                  <Navigation className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">
                    {activeOrder.riderToDropoffKm.toFixed(1)} km remaining
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
          <PackageCheck className="h-4 w-4 text-muted-foreground" />
          Order Items
        </h2>
        
        {activeOrder.items && activeOrder.items.length > 0 ? (
          <div className="space-y-2">
            {activeOrder.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                <span className="text-xs font-semibold bg-muted/20 px-2 py-1 rounded-full text-muted-foreground">
                  x{item.quantity}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-background p-4 text-center text-sm text-muted-foreground">
            Item details not available
          </div>
        )}
      </div>

      {/* Action Buttons - Sticky bottom on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 shadow-lg z-20">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button
            onClick={() => void handleRiderSignDelivered(activeOrder.id)}
            disabled={busyOrderId === activeOrder.id}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            size="lg"
          >
            <PackageCheck className="h-4 w-4 mr-2" />
            {busyOrderId === activeOrder.id ? "Signing..." : "Mark as Delivered"}
          </Button>
          <Link to={`/rider/orders/${activeOrder.id}`} className="flex-1">
            <Button variant="outline" className="w-full" size="lg">
              <MapPin className="h-4 w-4 mr-2" />
              Details
            </Button>
          </Link>
        </div>
      </div>

      {/* Spacer for sticky bottom buttons */}
      <div className="h-20" />
    </div>
  );
}
