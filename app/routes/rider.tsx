import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useOutletContext } from "react-router";
import { io, type Socket } from "socket.io-client";
import { useRoleGuard } from "../components/role-guard";
import {
  acceptRiderOrder,
  getRiderAssignedOrders,
  getRiderMe,
  getRiderOrderOffers,
  riderCancelOrder,
  riderDeleteOrder,
  passRiderOrder,
  type RiderAssignedOrder,
  type RiderOrderOffer,
  type RiderProfile,
  updateRiderActivity,
  updateRiderAvailability,
  updateRiderShippingRate,
  upsertRiderLocation,
} from "../services/rider";
import { riderSignDelivered, riderSignDeliveryStart } from "../services/orders";
import { AppLayout, type NavItem } from "~/components/app-layout";
import { CheckCircle2, Home, ListChecks, Settings, ShoppingBag, Wallet, XCircle } from "lucide-react";
import { cn } from "~/lib/utils";

const BaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export type RiderContextData = {
  rider: RiderProfile | null;
  offers: RiderOrderOffer[];
  sortedOffers: RiderOrderOffer[];
  assignedOrders: RiderAssignedOrder[];
  handleActivity: (availabilityStatus: "active" | "inactive") => Promise<void>;
  handleAccept: (orderId: string) => Promise<boolean>;
  handlePass: (orderId: string) => Promise<void>;
  handleRiderSignDeliveryStart: (orderId: string) => Promise<void>;
  handleRiderSignDelivered: (orderId: string) => Promise<void>;
  handleUpdateShippingRate: (costPerKm: number) => Promise<void>;
  handleRiderCancelOrder: (orderId: string) => Promise<void>;
  handleRiderDeleteOrder: (orderId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  busyOrderId: string | null;
  updatingStatus: boolean;
};

export const useRiderContext = () => useOutletContext<RiderContextData>();

const RiderLayout = () => {
  const authorized = useRoleGuard(2);
  const location = useLocation();
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [offers, setOffers] = useState<RiderOrderOffer[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<RiderAssignedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const sortedOffers = useMemo(
    () => [...offers].sort((a, b) => a.riderToRestaurantKm - b.riderToRestaurantKm),
    [offers],
  );

  useEffect(() => {
    if (!authorized) {
      return;
    }

    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const me = await getRiderMe();
        const shouldLoadOffers = me.status === "online" && me.availabilityStatus === "active";
        const offersData = shouldLoadOffers ? await getRiderOrderOffers() : [];
        if (!isMounted) {
          return;
        }
        setRider(me);
        setOffers(offersData);
        const assigned = await getRiderAssignedOrders();
        if (!isMounted) {
          return;
        }
        setAssignedOrders(assigned);
        setError(null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load rider workspace");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [authorized]);

  useEffect(() => {
    if (!authorized || !rider) {
      return;
    }
    if (location.pathname !== "/rider") {
      return;
    }
    if (rider.status === "online") {
      return;
    }

    void updateRiderAvailability("online")
      .then((updated) => {
        setRider(updated);
      })
      .catch(() => {
        // Keep manual toggle as fallback if auto-online fails.
      });
  }, [authorized, rider, location.pathname]);

  useEffect(() => {
    if (!authorized || !rider) {
      return;
    }

    const socket: Socket = io(BaseURL, {
      path: "/socket.io",
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    socket.on("connect", () => {
      socket.emit("location:rider:subscribe", { riderId: rider.id });
    });

    socket.on("rider:order-offer", (offer: RiderOrderOffer) => {
      setOffers((current) => {
        const exists = current.some((item) => item.orderId === offer.orderId);
        if (exists) {
          return current.map((item) => (item.orderId === offer.orderId ? offer : item));
        }
        return [offer, ...current];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [authorized, rider]);

  useEffect(() => {
    if (!authorized || !rider || rider.status !== "online" || typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    const pushLocation = (latitude: number, longitude: number) => {
      void upsertRiderLocation(latitude, longitude);
    };

    // Send a quick coarse location immediately so customer map can render fast.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        pushLocation(position.coords.latitude, position.coords.longitude);
      },
      () => {
        // Ignore; watchPosition will continue trying.
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000,
      },
    );

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        pushLocation(position.coords.latitude, position.coords.longitude);
      },
      () => {
        // Rider denied location permission.
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [authorized, rider]);

  useEffect(() => {
    if (!authorized || !rider) {
      return;
    }

    let isMounted = true;
    const intervalId = window.setInterval(async () => {
      try {
        const assigned = await getRiderAssignedOrders();
        if (isMounted) {
          setAssignedOrders(assigned);
        }

        const shouldLoadOffers = rider.status === "online" && rider.availabilityStatus === "active";
        if (shouldLoadOffers) {
          const offersData = await getRiderOrderOffers();
          if (isMounted) {
            setOffers(offersData);
          }
        } else if (isMounted) {
          setOffers([]);
        }
      } catch {
        // Retry on next interval.
      }
    }, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [authorized, rider]);

  const handleActivity = async (nextStatus: "active" | "inactive") => {
    setUpdatingStatus(true);
    setError(null);
    try {
      const updated = await updateRiderActivity(nextStatus);
      setRider(updated);
      if (nextStatus === "inactive") {
        setOffers([]);
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update rider activity");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAccept = async (orderId: string): Promise<boolean> => {
    setBusyOrderId(orderId);
    setError(null);
    try {
      await acceptRiderOrder(orderId);
      setOffers((current) => current.filter((offer) => offer.orderId !== orderId));
      const assigned = await getRiderAssignedOrders();
      setAssignedOrders(assigned);
      return true;
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Failed to accept order");
      return false;
    } finally {
      setBusyOrderId(null);
    }
  };

  const handlePass = async (orderId: string) => {
    setBusyOrderId(orderId);
    setError(null);
    try {
      await passRiderOrder(orderId);
      setOffers((current) => current.filter((offer) => offer.orderId !== orderId));
    } catch (passError) {
      setError(passError instanceof Error ? passError.message : "Failed to pass order");
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleRiderSignDeliveryStart = async (orderId: string) => {
    setBusyOrderId(orderId);
    setError(null);
    try {
      await riderSignDeliveryStart(orderId);
      const assigned = await getRiderAssignedOrders();
      setAssignedOrders(assigned);
    } catch (signError) {
      setError(signError instanceof Error ? signError.message : "Failed to sign delivery start");
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleRiderSignDelivered = async (orderId: string) => {
    setBusyOrderId(orderId);
    setError(null);
    try {
      await riderSignDelivered(orderId);
      const assigned = await getRiderAssignedOrders();
      setAssignedOrders(assigned);
    } catch (signError) {
      setError(signError instanceof Error ? signError.message : "Failed to sign delivery completion");
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleUpdateShippingRate = async (costPerKm: number) => {
    setError(null);
    try {
      const updated = await updateRiderShippingRate(costPerKm);
      setRider(updated);
    } catch (rateError) {
      setError(rateError instanceof Error ? rateError.message : "Failed to update shipping rate");
    }
  };

  const handleRiderCancelOrder = async (orderId: string) => {
    setBusyOrderId(orderId);
    setError(null);
    try {
      await riderCancelOrder(orderId);
      const assigned = await getRiderAssignedOrders();
      setAssignedOrders(assigned);
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Failed to cancel order");
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleRiderDeleteOrder = async (orderId: string) => {
    setBusyOrderId(orderId);
    setError(null);
    try {
      await riderDeleteOrder(orderId);
      setAssignedOrders((current) => current.filter((order) => order.id !== orderId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete order");
    } finally {
      setBusyOrderId(null);
    }
  };

  if (!authorized) return null;

  const navItems: NavItem[] = [
    { title: "Home", href: "/rider", icon: Home },
    { title: "Active", href: "/rider/active-orders", icon: ListChecks },
    { title: "Orders", href: "/rider/orders", icon: ShoppingBag },
    { title: "Finance", href: "/rider/finance", icon: Wallet },
    { title: "Settings", href: "/rider/settings", icon: Settings },
  ];

 const isActive = rider?.availabilityStatus === "active";
const headerToggle = (
  <button
    type="button"
    onClick={() => void handleActivity(isActive ? "inactive" : "active")}
    disabled={updatingStatus}
    className={cn(
      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
      "disabled:cursor-not-allowed disabled:opacity-50",
      isActive 
        ? "border-emerald-200 bg-emerald-50 text-emerald-700" 
        : "border-red-200 bg-red-50 text-red-700"
    )}
    aria-pressed={isActive}
    aria-label={isActive ? "Set rider inactive" : "Set rider active"}
  >
    {updatingStatus ? (
      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
    ) : (
      <>
        {isActive ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <XCircle className="h-3.5 w-3.5" />
        )}
        <span>{isActive ? "Active" : "Inactive"}</span>
      </>
    )}
  </button>
);

  return (
    <AppLayout
      navItems={navItems}
      userRole="rider"
      showBottomNav
      headerTitle={rider?.name || "Rider"}
      headerRight={headerToggle}
      showHeaderBorder={false}
      showMobileMenuButton={false}
    >
      <Outlet
        context={{
          rider,
          offers,
          sortedOffers,
          assignedOrders,
          handleActivity,
          handleAccept,
          handlePass,
          handleRiderSignDeliveryStart,
          handleRiderSignDelivered,
          handleUpdateShippingRate,
          handleRiderCancelOrder,
          handleRiderDeleteOrder,
          loading,
          error,
          busyOrderId,
          updatingStatus,
        }}
      />
    </AppLayout>
  );
};

export default RiderLayout;
