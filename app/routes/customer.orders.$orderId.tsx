import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import { useCustomerContext } from "./customer";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Clock3, MapPin, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import { formatCurrency, formatDate } from "~/lib/utils";

const stageLabels = ["Order Placed", "Preparing", "Out for Delivery", "Delivered"];

export default function CustomerOrderDetails() {
  const { orderId } = useParams();
  const { orders, lifecycleByOrder, handleConfirmDelivery } = useCustomerContext();

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
  const progress = (stage / 4) * 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h2>
          <p className="text-sm text-muted-foreground">{order.paidAt ? formatDate(order.paidAt) : "Pending payment"}</p>
        </div>
        <Badge variant={order.status === "delivered" ? "success" : "secondary"} className="capitalize">
          {order.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real-time Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full bg-brand-red"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-4">
            {stageLabels.map((label, index) => {
              const current = index + 1;
              const active = current <= stage;
              return (
                <div key={label} className={`rounded-xl border p-3 text-xs ${active ? "border-brand-red/30 bg-red-50 text-brand-red" : "border-border bg-surface text-muted-foreground"}`}>
                  <p className="font-semibold">{label}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm font-semibold">Estimated delivery time</p>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4" /> About 25-35 minutes
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-border bg-surface p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <MapPin className="h-4 w-4" /> Rider map preview
            </p>
            <div className="mt-3 h-40 rounded-xl bg-surface-hover" />
          </div>

          <div className="space-y-2">
            {(lifecycle?.logs ?? []).map((log, idx) => (
              <p key={`${order.id}-log-${idx}`} className="text-sm text-muted-foreground">
                - {log}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.orderItems?.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-sm">
              <span>{item.menuItem?.name ?? "Menu item"} x{item.quantity}</span>
              <span>{formatCurrency(item.price)}</span>
            </div>
          ))}
          <div className="mt-2 border-t border-border pt-3 font-semibold">Total: {formatCurrency(order.totalPrice)}</div>
        </CardContent>
      </Card>

      {order.status === "out_for_delivery" ? (
        <Button onClick={() => void handleConfirmDelivery(order.id)} className="w-full sm:w-auto">
          <PackageCheck className="mr-2 h-4 w-4" /> Sign and confirm delivered
        </Button>
      ) : null}

      <Link to="/customer/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red hover:underline">
        <Truck className="h-4 w-4" /> Back to all orders
      </Link>
    </div>
  );
}
