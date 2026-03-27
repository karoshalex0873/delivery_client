import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useOutletContext } from "react-router";
import { type RiderContextData } from "./rider";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Bike, CheckCircle2, Clock3, MapPin, Navigation, Package } from "lucide-react";
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

export default function RiderDashboard() {
  const {
    rider,
    sortedOffers,
    assignedOrders,
    loading,
    error,
    busyOrderId,
    handleAccept,
    handlePass,
    handleRiderSignDeliveryStart,
  } = useOutletContext<RiderContextData>();

  const [now, setNow] = useState(() => new Date());
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [acceptedRideId, setAcceptedRideId] = useState<string | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const isOnline = rider?.status === "online";
  const isActive = rider?.availabilityStatus === "active";
  const isReady = isOnline && isActive;

  const activeDeliveries = useMemo(
    () => assignedOrders.filter((order) => ACTIVE_ORDER_STATUSES.has(order.status)),
    [assignedOrders],
  );

  const currentActiveRide = activeDeliveries[0] ?? null;
  const modalRide = (acceptedRideId ? activeDeliveries.find((order) => order.id === acceptedRideId) : null) ?? currentActiveRide;
  const completedRidesToday = assignedOrders.filter((order) => order.status === "delivered").length;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading rider workspace...</div>;
  }

  return (
    <div className="space-y-4 pb-20">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {/* Compact Status Header */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Badge 
            variant={isReady ? "success" : "secondary"} 
            className="px-3 py-1.5 font-semibold"
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${isReady ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {isReady ? "Active" : "Offline"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {completedRidesToday} rides today
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-foreground">
            {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Active Ride Card - Compact but prominent */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-brand-red/5 blur-3xl pointer-events-none" />
        
        <div className="p-4">
          {currentActiveRide ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Active Delivery
                    </span>
                  </div>
                  
                  {/* Pickup */}
                  <div className="flex gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Pickup</p>
                      <p className="text-sm font-semibold text-foreground truncate">
                        {currentActiveRide.restaurant?.name ?? "Restaurant"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Dropoff */}
                  <div className="flex gap-2">
                    <Navigation className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Dropoff</p>
                      <p className="text-sm font-semibold text-foreground truncate">
                        {currentActiveRide.user?.firstName ?? "Customer"}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="px-2 py-1 rounded-full bg-brand-red/10 text-brand-red text-[10px] font-semibold">
                    In Progress
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                    #{currentActiveRide.id.slice(0, 6)}
                  </p>
                </div>
              </div>

              <Link to="/rider/active-orders" className="block">
                <Button size="default" className="w-full rounded-xl font-semibold">
                  Open Active Ride
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-2">
                <Bike className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No active ride</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isReady ? "Available for new deliveries" : "Go online to receive rides"}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Rides Near You - Compact cards */}
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-foreground flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          Rides Near You
        </h2>
        
        <div className="space-y-2">
          {!isReady ? (
            <div className="rounded-xl border border-dashed border-border bg-background p-3 text-center text-xs text-muted-foreground">
              Go online and set to Active to receive nearby rides
            </div>
          ) : sortedOffers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background p-3 text-center text-xs text-muted-foreground">
              No nearby rides at the moment
            </div>
          ) : (
            sortedOffers.map((offer) => {
              const offerItems = Array.isArray(offer.items) ? offer.items : [];
              const etaMinutes = Math.max(3, Math.round(offer.riderToRestaurantKm * 4));
              const firstItem = offerItems[0];
              const extraItemsCount = Math.max(0, offerItems.length - 1);

              return (
                <article key={offer.orderId} className="rounded-xl border border-border bg-background p-3 transition-all active:scale-[0.98]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {offer.restaurant.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        #{offer.orderId.slice(0, 8)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-surface px-2 py-0.5">
                      <Clock3 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {etaMinutes}m
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                    {firstItem ? `${firstItem.name} x${firstItem.quantity}` : "Order items"}
                    {extraItemsCount > 0 ? ` +${extraItemsCount}` : ""}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 h-9 text-sm bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={async () => {
                        const accepted = await handleAccept(offer.orderId);
                        if (accepted) {
                          setAcceptedRideId(offer.orderId);
                          setShowActiveModal(true);
                        }
                      }}
                      disabled={busyOrderId === offer.orderId}
                    >
                      <Bike className="h-3.5 w-3.5 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-9 text-sm"
                      onClick={() => void handlePass(offer.orderId)}
                      disabled={busyOrderId === offer.orderId}
                    >
                      Pass
                    </Button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* Modal - Keep as is but with better mobile spacing */}
      {showActiveModal && modalRide ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-4 shadow-xl animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm font-semibold">Order accepted!</p>
            </div>
            <p className="mt-2 text-sm text-foreground">
              #{modalRide.id.slice(0, 8)} from {modalRide.restaurant?.name ?? "Restaurant"}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                className="w-full"
                onClick={() => void handleRiderSignDeliveryStart(modalRide.id)}
                disabled={busyOrderId === modalRide.id}
              >
                {busyOrderId === modalRide.id ? "Starting..." : "I picked this order"}
              </Button>
              <Link to="/rider/active-orders" className="w-full">
                <Button variant="outline" className="w-full">Track active order</Button>
              </Link>
              <Button variant="ghost" onClick={() => {
                setShowActiveModal(false);
                setAcceptedRideId(null);
              }}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
