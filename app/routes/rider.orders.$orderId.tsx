import { Link, useParams } from "react-router";
import { Bike, MapPin, Store, User } from "lucide-react";
import { useRiderContext } from "./rider";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { formatCurrency } from "~/lib/utils";

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
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Order not found</h2>
        <Link to="/rider/orders">
          <Button variant="outline">Back to orders</Button>
        </Link>
      </div>
    );
  }

  const canSignStart = [
    "ready_for_pickup",
    "delivery_sign_restaurant",
    "delivery_sign_rider",
  ].includes(order.status);
  const canSignDelivered = order.status === "out_for_delivery";
  const canCancel = ["accepted", "preparing", "ready_for_pickup"].includes(order.status);
  const canDelete = ["cancelled", "delivered", "rejected"].includes(order.status);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-foreground">Order #{order.id.slice(0, 8)}</h2>
          <p className="text-sm text-muted-foreground">Rider delivery workflow</p>
        </div>
        <Badge variant={order.status === "delivered" ? "success" : "secondary"} className="capitalize">
          {order.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2 rounded-xl border border-border bg-surface p-3">
              <Store className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Restaurant</p>
                <p className="text-sm font-semibold">{order.restaurant?.name ?? "N/A"}</p>
                <p className="text-xs text-muted-foreground">{order.restaurant?.phoneNumber ?? "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-border bg-surface p-3">
              <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="text-sm font-semibold">
                  {order.user ? `${order.user.firstName} ${order.user.lastName}` : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">{order.user?.phoneNumber ?? "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-border bg-surface p-3">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Restaurant Address</p>
                <p className="text-sm font-semibold">{order.restaurant?.address ?? "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-border bg-surface p-3">
              <Bike className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Order Value</p>
                <p className="text-sm font-semibold">{formatCurrency(order.totalPrice)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {canSignStart ? (
              <Button
                onClick={() => void handleRiderSignDeliveryStart(order.id)}
                disabled={busyOrderId === order.id}
              >
                {busyOrderId === order.id ? "Signing..." : "Sign Delivery Start"}
              </Button>
            ) : null}

            {canSignDelivered ? (
              <Button
                onClick={() => void handleRiderSignDelivered(order.id)}
                disabled={busyOrderId === order.id}
              >
                {busyOrderId === order.id ? "Signing..." : "Sign Delivered"}
              </Button>
            ) : null}

            <Button
              onClick={() => void handleRiderCancelOrder(order.id)}
              disabled={!canCancel || busyOrderId === order.id}
              variant="outline"
            >
              {busyOrderId === order.id ? "Working..." : "Cancel Order"}
            </Button>

            <Button
              onClick={() => void handleRiderDeleteOrder(order.id)}
              disabled={!canDelete || busyOrderId === order.id}
              variant="destructive"
            >
              {busyOrderId === order.id ? "Working..." : "Delete Order"}
            </Button>

            <Link to="/rider/orders">
              <Button variant="outline">Back</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
