// The following files were successfully edited:
import { Link, useOutletContext } from "react-router";

// c:\Projects\derivery app\client\app\routes\rider._index.tsx
import { type RiderContextData } from "./rider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Bike, Navigation, MapPin, Clock } from "lucide-react";

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
    handleAvailability,
    updatingStatus,
  } = useOutletContext<RiderContextData>();

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading workspace...</div>;
  }

  const isOnline = rider?.status === "online";

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-500/10 p-4 text-red-500 border border-red-500/20">
          {error}
        </div>
      )}

      {/* Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">
            Welcome, {rider?.name || "Rider"}
          </CardTitle>
          <Badge variant={isOnline ? "success" : "secondary"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {rider?.address || "Location unavailable"}
            </div>
            <div className="flex gap-2">
              <Button
                variant={isOnline ? "destructive" : "default"}
                size="sm"
                onClick={() => handleAvailability(isOnline ? "offline" : "online")}
                disabled={updatingStatus}
              >
                {isOnline ? "Go Offline" : "Go Online"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Incoming Offers */}
        <Card>
          <CardHeader>
            <CardTitle>Incoming Offers</CardTitle>
            <CardDescription>
              {isOnline ? "Nearby delivery requests" : "Go online to receive offers"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isOnline ? (
              <div className="text-center py-8 text-muted-foreground">You are offline</div>
            ) : sortedOffers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No offers nearby</div>
            ) : (
              sortedOffers.map((offer) => (
                <div
                  key={offer.orderId}
                  className="rounded-lg border border-border bg-surface p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{offer.restaurant.name}</h4>
                      <p className="text-sm text-muted-foreground">Order #{offer.orderId.slice(0, 8)}</p>
                    </div>
                    <Badge variant="outline" className="flex gap-1 items-center">
                      <Navigation className="h-3 w-3" />
                      {offer.riderToRestaurantKm.toFixed(1)} km to pickup
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>To: {offer.customer.firstName} {offer.customer.lastName} ({offer.restaurantToCustomerKm.toFixed(1)} km)</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="sm"
                      onClick={() => handleAccept(offer.orderId)}
                      disabled={busyOrderId === offer.orderId}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      size="sm"
                      onClick={() => handlePass(offer.orderId)}
                      disabled={busyOrderId === offer.orderId}
                    >
                      Pass
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Assigned Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Active Deliveries</CardTitle>
            <CardDescription>Orders you have accepted</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No active deliveries</div>
            ) : (
              assignedOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-3"
                >
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-semibold">Order #{order.id.slice(0, 8)}</h4>
                      <Badge variant="warning" className="mt-1 lowercase">{order.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <Link to={`/rider/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
