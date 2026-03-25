import { Link, useOutletContext } from "react-router";
import { type RiderContextData } from "./rider";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { formatDate } from "~/lib/utils";
import { Store, User } from "lucide-react";

export default function RiderOrderHistory() {
  const { assignedOrders } = useOutletContext<RiderContextData>();

  // Note: assignedOrders in context currently only has Active orders usually.
  // Ideally we need a separate API for 'completed' orders history.
  // For this MVP, we will display assigned orders as the list.

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Order History</h2>
        <p className="text-muted-foreground">View your active and past deliveries.</p>
      </div>

      <div className="grid gap-4">
        {assignedOrders.length === 0 ? (
          <p className="text-muted-foreground py-8">No order history found.</p>
        ) : (
          assignedOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">Order #{order.id.slice(0, 8)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(new Date())} {/* Timestamp not in RiderAssignedOrder type, using now placeholder */}
                    </p>
                  </div>
                  <Badge variant={order.status === "delivered" ? "success" : "secondary"}>
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Restaurant ({order.restaurant?.name ?? "N/A"})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Customer ({order.user?.firstName ?? "N/A"})</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link to={`/rider/orders/${order.id}`} className="w-full">
                    <Button variant="outline" className="w-full">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
