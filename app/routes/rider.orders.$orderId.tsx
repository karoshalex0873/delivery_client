import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import { 
  Bike, 
  MapPin, 
  Navigation, 
  Store, 
  User, 
  Phone, 
  CreditCard,
  Clock,
  ArrowLeft,
  Trash2,
  XCircle,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { useRiderContext } from "./rider";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn, formatCurrency } from "~/lib/utils";

const formatCoords = (coords?: { latitude: number; longitude: number } | null) =>
  coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : "Location unavailable";

const getStatusConfig = (status: string) => {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <Clock className="h-3 w-3" />, label: "Pending" },
    accepted: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: <CheckCircle2 className="h-3 w-3" />, label: "Accepted" },
    preparing: { color: "bg-purple-100 text-purple-700 border-purple-200", icon: <Clock className="h-3 w-3" />, label: "Preparing" },
    ready_for_pickup: { color: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: <Store className="h-3 w-3" />, label: "Ready for Pickup" },
    out_for_delivery: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <Bike className="h-3 w-3" />, label: "Out for Delivery" },
    delivered: { color: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle2 className="h-3 w-3" />, label: "Delivered" },
    cancelled: { color: "bg-red-100 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3" />, label: "Cancelled" },
    rejected: { color: "bg-red-100 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3" />, label: "Rejected" },
  };
  return config[status] || { color: "bg-gray-100 text-gray-700 border-gray-200", icon: <Clock className="h-3 w-3" />, label: status.replace(/_/g, " ") };
};

export default function RiderOrderDetailsPage() {
  const { orderId } = useParams();
  const {
    assignedOrders,
    busyOrderId,
    handleRiderSignDeliveryStart,
    handleRiderSignDelivered,
    handleRiderCancelOrder,
    handleRiderDeleteOrder,
  } = useRiderContext();

  const order = assignedOrders.find((item) => item.id === orderId);

  if (!order) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
          <XCircle className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">Order Not Found</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          The order you're looking for doesn't exist or you don't have access to it.
        </p>
        <Link to="/rider/orders">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const canSignStart = ["ready_for_pickup", "delivery_sign_restaurant", "delivery_sign_rider"].includes(order.status);
  const canSignDelivered = order.status === "out_for_delivery";
  const canCancel = ["accepted", "preparing", "ready_for_pickup"].includes(order.status);
  const canDelete = ["cancelled", "delivered", "rejected"].includes(order.status);
  const isCompleted = order.status === "delivered";
  const dropAccentClass = isCompleted ? "text-emerald-600 bg-emerald-500/10" : "text-brand-red bg-brand-red/10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="pb-24"
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 -mt-2 -mx-4 px-4 py-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <Link to="/rider/orders" className="p-1 -ml-1">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Order Details</h1>
            <p className="text-xs text-muted-foreground font-mono">
              #{order.id.slice(0, 8)}
            </p>
          </div>
          <Badge className={cn("capitalize gap-1.5 px-2.5 py-1", statusConfig.color)}>
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Delivery Route Section - Clean connector */}
      <div className="space-y-4 mb-4">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          {/* Pickup */}
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 z-10 relative">
                <Store className="h-5 w-5 text-emerald-600" />
              </div>
              {/* Vertical line */}
              <div className="absolute left-1/2 top-10 -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-emerald-500/50 to-brand-red/50" />
            </div>
            <div className="flex-1 min-w-0 pb-8">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                Pickup Location
              </p>
              <p className="text-base font-semibold text-foreground">
                {order.restaurant?.name ?? "Restaurant"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {order.restaurant?.address ?? "Address unavailable"}
              </p>
            </div>
          </div>

          {/* Dropoff */}
          <div className="flex items-start gap-3">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", dropAccentClass)}>
              <MapPin className={cn("h-5 w-5", isCompleted ? "text-emerald-600" : "text-brand-red")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                Dropoff Location
              </p>
              <p className="text-base font-semibold text-foreground">
                {order.user ? `${order.user.firstName} ${order.user.lastName}` : "Customer"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 break-all">
                {formatCoords(order.customerLocation)}
              </p>
            </div>
          </div>

          {/* Distance info between locations */}
          {order.pickupToDropoffKm != null && (
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Navigation className="h-3 w-3" />
                <span>Delivery distance: {order.pickupToDropoffKm.toFixed(1)} km</span>
              </div>
            </div>
          )}
        </div>

        {/* Distance Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-surface p-3 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              To Pickup
            </p>
            <p className="text-sm font-bold text-foreground">
              {order.riderToPickupKm != null ? `${order.riderToPickupKm.toFixed(1)} km` : "N/A"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Delivery
            </p>
            <p className="text-sm font-bold text-foreground">
              {order.pickupToDropoffKm != null ? `${order.pickupToDropoffKm.toFixed(1)} km` : "N/A"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Remaining
            </p>
            <p className="text-sm font-bold text-foreground">
              {order.riderToDropoffKm != null ? `${order.riderToDropoffKm.toFixed(1)} km` : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          Order Summary
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Order Value</span>
            <span className="text-base font-bold text-foreground">{formatCurrency(order.totalPrice)}</span>
          </div>
          
          {order.user?.phoneNumber && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Customer Contact</span>
              </div>
              <a 
                href={`tel:${order.user.phoneNumber}`}
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                {order.user.phoneNumber}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Order Items (if available) */}
      {order.items && order.items.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Bike className="h-4 w-4 text-muted-foreground" />
            Order Items
          </h2>
          
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                <span className="text-xs font-semibold bg-muted/20 px-2 py-1 rounded-full text-muted-foreground">
                  x{item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons - Sticky bottom */}
      <div className="fixed md:relative bottom-20 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 shadow-lg z-20">
        <div className="flex flex-row gap-2 max-w-md mx-auto">
          {canSignStart && (
            <Button
              onClick={() => void handleRiderSignDeliveryStart(order.id)}
              disabled={busyOrderId === order.id}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              size="lg"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {busyOrderId === order.id ? "Signing..." : "Start Delivery"}
            </Button>
          )}
          
          {canSignDelivered && (
            <Button
              onClick={() => void handleRiderSignDelivered(order.id)}
              disabled={busyOrderId === order.id}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              size="lg"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {busyOrderId === order.id ? "Signing..." : "Mark as Delivered"}
            </Button>
          )}
          
          <div className="flex gap-2">
            {canCancel && (
              <Button
                variant="outline"
                onClick={() => void handleRiderCancelOrder(order.id)}
                disabled={busyOrderId === order.id}
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            
            {canDelete && (
              <Button
                variant="destructive"
                onClick={() => void handleRiderDeleteOrder(order.id)}
                disabled={busyOrderId === order.id}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            
            <Link to="/rider/orders" className="flex-1">
              <Button variant="outline" className="w-full">
                Back
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Spacer for sticky bottom buttons */}
      <div className="h-28" />
    </motion.div>
  );
}