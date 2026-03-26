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
  updateRiderAvailability,
  updateRiderShippingRate,
  upsertRiderLocation,
} from "../services/rider";
import { riderSignDelivered, riderSignDeliveryStart } from "../services/orders";
import { AppLayout, type NavItem } from "~/components/app-layout";
import { LayoutDashboard, ShoppingBag, User } from "lucide-react";

const BaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export type RiderContextData = {
  rider: RiderProfile | null;
  offers: RiderOrderOffer[];
  sortedOffers: RiderOrderOffer[];
  assignedOrders: RiderAssignedOrder[];
  handleAvailability: (status: "online" | "offline") => Promise<void>;
  handleAccept: (orderId: string) => Promise<void>;
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
        const [me, offersData] = await Promise.all([getRiderMe(), getRiderOrderOffers()]);
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
    if (!authorized || !rider || rider.status !== "online") {
      return;
    }

    let isMounted = true;
    const intervalId = window.setInterval(async () => {
      try {
        const offersData = await getRiderOrderOffers();
        if (isMounted) {
          setOffers(offersData);
          const assigned = await getRiderAssignedOrders();
          if (isMounted) {
            setAssignedOrders(assigned);
          }
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

  const handleAvailability = async (nextStatus: "online" | "offline") => {
    setUpdatingStatus(true);
    setError(null);
    try {
      const updated = await updateRiderAvailability(nextStatus);
      setRider(updated);
      if (nextStatus === "offline") {
        setOffers([]);
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update rider availability");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAccept = async (orderId: string) => {
    setBusyOrderId(orderId);
    setError(null);
    try {
      await acceptRiderOrder(orderId);
      setOffers((current) => current.filter((offer) => offer.orderId !== orderId));
      const assigned = await getRiderAssignedOrders();
      setAssignedOrders(assigned);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Failed to accept order");
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
    { title: "Dashboard", href: "/rider", icon: LayoutDashboard },
    { title: "Orders", href: "/rider/orders", icon: ShoppingBag },
    { title: "Profile", href: "/rider/profile", icon: User },
  ];

  return (
    <AppLayout navItems={navItems} userRole="rider">
      <Outlet
        context={{
          rider,
          offers,
          sortedOffers,
          assignedOrders,
          handleAvailability,
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
