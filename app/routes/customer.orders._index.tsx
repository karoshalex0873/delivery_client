import { Link, useOutletContext } from "react-router";
import { type CustomerContextData } from "./customer";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { formatCurrency, formatDate } from "~/lib/utils";
import { ChevronRight, Clock, Package } from "lucide-react";

export default function CustomerOrdersHistory() {
  const { orders } = useOutletContext<CustomerContextData>();

  if (orders.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface/50">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">No orders yet</h2>
        <p className="text-muted-foreground">Go to the dashboard to start exploring restaurants.</p>
        <Link to="/customer">
          <Button>Browse Restaurants</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Your Orders</h2>
        <Link to="/customer">
          <Button variant="outline">New Order</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Link key={order.id} to={`/customer/orders/${order.id}`}>
            <Card className="group transition-colors hover:border-brand-red/50">
              <CardContent className="p-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{order.restaurant?.name ?? "Restaurant"}</h3>
                      <Badge variant={order.status === "delivered" ? "success" : "secondary"} className="capitalize">
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {order.paidAt ? formatDate(order.paidAt) : "Pending payment"} • {order.orderItems?.length ?? 0} items
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.totalPrice)}</p>
                      <p className="text-xs capitalize text-muted-foreground">{order.paymentStatus}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-brand-red" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

