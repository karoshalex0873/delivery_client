import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Link, NavLink, Outlet, useLocation, useOutletContext, useSearchParams } from "react-router";
import { io, type Socket } from "socket.io-client";
import { useClerk } from "@clerk/clerk-react";
import {
  Bell,
  CheckCircle2,
  Clock3,
  Heart,
  Home,
  LogOut,
  MapPin,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Truck,
  User,
  X,
} from "lucide-react";
import { useRoleGuard } from "../components/role-guard";
import {
  checkoutOrder,
  customerCancelOrder,
  customerConfirmDelivered,
  customerDeleteOrder,
  getMyCustomerOrders,
  getOrderCatalog,
  initiateDarajaPayment,
  type CatalogRestaurantRecord,
  type CustomerOrderRecord,
} from "../services/orders";
import { getCurrentUser, logout as logoutUser, type CurrentUserRecord } from "../services/auth";
import { formatDate } from "~/lib/utils";

const BaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export type LifecycleState = {
  stage: number;
  title: string;
  logs: string[];
  deliveryDetails?: {
    estimatedMinutes: number | null;
    distanceKm: number | null;
    rider?: {
      id: string;
      name: string;
      phoneNumber: string;
    } | null;
    deliveryLocation: {
      label: string;
      latitude: number | null;
      longitude: number | null;
      updatedAt: string | null;
    };
    riderLocation: {
      latitude: number | null;
      longitude: number | null;
      updatedAt: string | null;
    };
    milestones: {
      createdAt: string | null;
      riderSignedDeliveredAt: string | null;
      customerConfirmedDeliveredAt: string | null;
    };
  };
};

export type GeoPoint = {
  latitude: number;
  longitude: number;
  updatedAt?: string;
};

export type CustomerContextData = {
  restaurants: CatalogRestaurantRecord[];
  orders: CustomerOrderRecord[];
  cart: Record<string, number>;
  setCart: Dispatch<SetStateAction<Record<string, number>>>;
  handleCheckout: (restaurantId: string) => Promise<void>;
  checkoutLoading: boolean;
  checkoutSuccess: string | null;
  checkoutError: string | null;
  paymentPhoneNumber: string;
  setPaymentPhoneNumber: Dispatch<SetStateAction<string>>;
  lifecycleByOrder: Record<string, LifecycleState>;
  handleConfirmDelivery: (orderId: string) => Promise<void>;
  handleCancelOrder: (orderId: string) => Promise<void>;
  handleDeleteOrder: (orderId: string) => Promise<void>;
  favorites: string[];
  toggleFavorite: (restaurantId: string) => void;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  riderLocations: Record<string, GeoPoint>;
  customerLocation: GeoPoint | null;
};

export const useCustomerContext = () => useOutletContext<CustomerContextData>();

const buildLifecycle = (order: CustomerOrderRecord): LifecycleState => {
  if (order.status === "delivered") {
    return { stage: 5, title: "Delivered and Signed", logs: ["Order delivered successfully.", "Delivery signed by customer."] };
  }
  if (order.status === "out_for_delivery") {
    return { stage: 4, title: "On the Move", logs: ["Your order is on the move.", "Rider is heading to your location."] };
  }
  if (order.status === "delivery_signed_by_rider") {
    return {
      stage: 4,
      title: "Awaiting Your Confirmation",
      logs: ["Rider marked this order as delivered.", "Please confirm delivery to close this order."],
    };
  }
  if (["ready_for_pickup", "delivery_sign_restaurant", "delivery_sign_rider"].includes(order.status)) {
    return { stage: 3, title: "Ready for Pickup", logs: ["Meal is ready for pickup.", "Waiting for both signatures to start delivery."] };
  }
  if (order.status === "preparing") {
    return { stage: 2, title: "Preparing Meal", logs: ["Restaurant is preparing your meal."] };
  }

  return {
    stage: 1,
    title: "Creating Order",
    logs: [
      order.status === "accepted" ? "Restaurant has accepted your order ready to prepare." : "Waiting for restaurant acceptance.",
      order.riderId ? "A rider was found to deliver." : "Searching for nearby rider.",
    ],
  };
};

const maskEmail = (email?: string) => {
  if (!email) return "a***@gmail.com";
  const [local = "", domain = "gmail.com"] = email.split("@");
  const first = local.charAt(0) || "a";
  return `${first}***@${domain}`;
};

const resolveLocationName = async (latitude: number, longitude: number) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      return "Unknown location";
    }

    const data = (await response.json()) as {
      address?: {
        suburb?: string;
        town?: string;
        city?: string;
        county?: string;
      };
    };

    const area = data.address?.suburb ?? data.address?.town ?? data.address?.city ?? "";
    const county = data.address?.county ?? "";
    return [area, county].filter(Boolean).join(", ") || "Unknown location";
  } catch {
    return "Unknown location";
  }
};

export default function CustomerLayout() {
  const { signOut } = useClerk();
  const authorized = useRoleGuard(1);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState<CatalogRestaurantRecord[]>([]);
  const [orders, setOrders] = useState<CustomerOrderRecord[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState("");
  const [lifecycleByOrder, setLifecycleByOrder] = useState<Record<string, LifecycleState>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUserRecord | null>(null);
  const [locationLabel, setLocationLabel] = useState("Locating...");
  const [riderLocations, setRiderLocations] = useState<Record<string, GeoPoint>>({});
  const [customerLocation, setCustomerLocation] = useState<GeoPoint | null>(null);
  const lastGeocodeAt = useRef(0);

  useEffect(() => {
    const stored = localStorage.getItem("customerFavorites");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[];
        setFavorites(parsed);
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("customerFavorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (!authorized) {
      return;
    }

    let isMounted = true;
    const loadCurrentUser = async () => {
      try {
        const me = await getCurrentUser();
        if (isMounted) {
          setCurrentUser(me);
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
        }
      }
    };

    void loadCurrentUser();
    return () => {
      isMounted = false;
    };
  }, [authorized]);

  const toggleFavorite = (restaurantId: string) => {
    setFavorites((current) =>
      current.includes(restaurantId) ? current.filter((id) => id !== restaurantId) : [...current, restaurantId],
    );
  };

  const notifications = useMemo(
    () =>
      orders
        .slice()
        .sort((a, b) => {
          const aTime = a.paidAt ? new Date(a.paidAt).getTime() : 0;
          const bTime = b.paidAt ? new Date(b.paidAt).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 8)
        .map((order) => {
          const normalized = order.status.replace(/_/g, " ");
          const status = order.status;
          let icon = Clock3;
          let tone = "text-muted-foreground bg-surface-hover";

          if (status === "preparing" || status === "accepted" || status === "ready_for_pickup") {
            icon = Package;
            tone = "text-warning bg-warning/10";
          } else if (status === "delivery_signed_by_rider") {
            icon = CheckCircle2;
            tone = "text-info bg-info/10";
          } else if (status === "out_for_delivery") {
            icon = Truck;
            tone = "text-blue-600 bg-blue-50";
          } else if (status === "delivered") {
            icon = CheckCircle2;
            tone = "text-success bg-success/10";
          }

          return {
            id: order.id,
            orderIdShort: order.id.slice(0, 8),
            restaurantName: order.restaurant?.name ?? "Restaurant",
            statusLabel: normalized,
            paidAt: order.paidAt,
            icon,
            tone,
          };
        }),
    [orders],
  );

  useEffect(() => {
    if (!authorized) {
      return;
    }

    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [catalogData, ordersData] = await Promise.all([getOrderCatalog(), getMyCustomerOrders()]);
        if (!isMounted) {
          return;
        }
        setRestaurants(catalogData);
        setOrders(ordersData);
        setLifecycleByOrder(
          ordersData.reduce<Record<string, LifecycleState>>((acc, order) => {
            acc[order.id] = buildLifecycle(order);
            return acc;
          }, {}),
        );
        setError(null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load customer workspace");
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
    if (!authorized) {
      return;
    }

    const socket: Socket = io(BaseURL, {
      path: "/socket.io",
      withCredentials: true,
      reconnection: true,
    });

    socket.on("connect", () => {
      for (const order of orders) {
        socket.emit("order:customer:subscribe", { orderId: order.id });
      }
    });

    socket.on("order:lifecycle:update", (payload: {
      orderId: string;
      status: string;
      logs: string[];
      stage: number;
      stageTitle: string;
      rider?: CustomerOrderRecord["rider"];
      deliveryDetails?: LifecycleState["deliveryDetails"];
    }) => {
      if (!payload?.orderId) {
        return;
      }

      setOrders((current) =>
        current.map((order) => (order.id === payload.orderId ? { ...order, status: payload.status, rider: payload.rider ?? order.rider } : order)),
      );
      setLifecycleByOrder((current) => ({
        ...current,
        [payload.orderId]: {
          stage: payload.stage,
          title: payload.stageTitle,
          logs: payload.logs ?? [],
          deliveryDetails: payload.deliveryDetails,
        },
      }));
    });

    socket.on("location:rider:updated", (payload: { riderId?: string; latitude?: number; longitude?: number; updatedAt?: string }) => {
      if (!payload?.riderId || !Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
        return;
      }

      setRiderLocations((current) => ({
        ...current,
        [payload.riderId as string]: {
          latitude: payload.latitude as number,
          longitude: payload.longitude as number,
          updatedAt: payload.updatedAt,
        },
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [authorized, orders]);

  useEffect(() => {
    if (!authorized || !currentUser?.id || typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    const socket: Socket = io(BaseURL, {
      path: "/socket.io",
      withCredentials: true,
      reconnection: true,
    });

    const pushLocation = (latitude: number, longitude: number) => {
      socket.emit(
        "location:update",
        { role: "user", id: currentUser.id, latitude, longitude },
        async (ack?: { data?: { latitude?: number; longitude?: number } }) => {
          const lat = ack?.data?.latitude ?? latitude;
          const lng = ack?.data?.longitude ?? longitude;
          setCustomerLocation({ latitude: lat, longitude: lng, updatedAt: new Date().toISOString() });
          const now = Date.now();
          if (now - lastGeocodeAt.current < 30000) {
            return;
          }
          lastGeocodeAt.current = now;
          const label = await resolveLocationName(lat, lng);
          setLocationLabel(label);
        },
      );
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCustomerLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          updatedAt: new Date().toISOString(),
        });
        pushLocation(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setLocationLabel("Location unavailable");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, [authorized, currentUser?.id]);

  const handleCheckout = async (restaurantId: string) => {
    if (!paymentPhoneNumber.trim()) {
      setCheckoutError("Enter your M-Pesa phone number first.");
      return;
    }

    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));

    if (items.length === 0) {
      setCheckoutError("Your cart is empty.");
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);
    setCheckoutSuccess(null);
    try {
      const createdOrder = await checkoutOrder({ restaurantId, items });
      setOrders((current) => [createdOrder, ...current]);
      setLifecycleByOrder((current) => ({ ...current, [createdOrder.id]: buildLifecycle(createdOrder) }));

      const payment = await initiateDarajaPayment({
        orderId: createdOrder.id,
        phoneNumber: paymentPhoneNumber.trim(),
      });

      setOrders((current) => current.map((order) => (order.id === createdOrder.id ? payment.order : order)));
      setLifecycleByOrder((current) => ({ ...current, [createdOrder.id]: buildLifecycle(payment.order) }));
      setCart({});
      setCheckoutSuccess(payment.customerMessage ?? "Order created successfully.");
    } catch (checkoutActionError) {
      setCheckoutError(checkoutActionError instanceof Error ? checkoutActionError.message : "Failed to place order");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    setCheckoutError(null);
    setCheckoutSuccess(null);
    try {
      const updated = await customerConfirmDelivered(orderId);
      setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
      setLifecycleByOrder((current) => ({ ...current, [orderId]: buildLifecycle(updated) }));
      setCheckoutSuccess("Delivery confirmed.");
    } catch (confirmError) {
      setCheckoutError(confirmError instanceof Error ? confirmError.message : "Failed to confirm delivery");
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCheckoutError(null);
    setCheckoutSuccess(null);
    try {
      const updated = await customerCancelOrder(orderId);
      setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
      setLifecycleByOrder((current) => ({ ...current, [orderId]: buildLifecycle(updated) }));
      setCheckoutSuccess("Order canceled.");
    } catch (cancelError) {
      setCheckoutError(cancelError instanceof Error ? cancelError.message : "Failed to cancel order");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setCheckoutError(null);
    setCheckoutSuccess(null);
    try {
      await customerDeleteOrder(orderId);
      setOrders((current) => current.filter((order) => order.id !== orderId));
      setLifecycleByOrder((current) => {
        const next = { ...current };
        delete next[orderId];
        return next;
      });
      setCheckoutSuccess("Order deleted.");
    } catch (deleteError) {
      setCheckoutError(deleteError instanceof Error ? deleteError.message : "Failed to delete order");
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    try {
      await signOut();
    } catch {
      // Ignore if Clerk session does not exist.
    }
    window.location.href = "/auth/signin";
  };

  if (!authorized) {
    return null;
  }

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading customer workspace...</p>;
  }

  if (error) {
    return <p className="p-6 text-sm text-red-500">{error}</p>;
  }

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const displayName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Customer User";
  const displayEmail = maskEmail(currentUser?.email);
  const activeView = searchParams.get("view");
  const isHomeActive = location.pathname === "/customer" && !activeView;
  const isCartActive = location.pathname === "/customer" && activeView === "cart";
  const isFavoritesActive = location.pathname === "/customer" && activeView === "favorites";
  const isOrdersActive = location.pathname.startsWith("/customer/orders");
  const isProfileActive = location.pathname.startsWith("/customer/profile");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      {/* Side Navigation - Large Devices */}
      <nav className="hidden md:flex md:h-screen md:w-64 md:flex-col md:border-r md:border-border md:bg-surface md:shadow-sm md:fixed md:left-0 md:top-0 md:z-50">
        <div className="flex h-20 items-center justify-center border-b border-border px-4">
          <Link to="/customer" className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-red text-2xl font-bold text-white shadow-lg shadow-brand-red/20 transition-transform hover:scale-105 active:scale-95">
            Q
          </Link>
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-6">
          <NavLink
            to="/customer"
            end
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isHomeActive ? "bg-brand-red/10 text-brand-red" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"}`}
          >
            <Home className="h-5 w-5" />
            Home
          </NavLink>
          <NavLink
            to="/customer/orders"
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isOrdersActive ? "bg-brand-red/10 text-brand-red" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"}`}
          >
            <Bell className="h-5 w-5" />
            Orders
          </NavLink>
          <NavLink
            to="/customer?view=cart"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors relative ${isCartActive ? "bg-brand-red/10 text-brand-red" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"}`}
          >
            <ShoppingCart className="h-5 w-5" />
            Cart
            {cartCount > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </NavLink>
          <NavLink
            to="/customer?view=favorites"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isFavoritesActive ? "bg-brand-red/10 text-brand-red" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"}`}
          >
            <Heart className="h-5 w-5" />
            Favorites
          </NavLink>
          <NavLink
            to="/customer/profile"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isProfileActive ? "bg-brand-red/10 text-brand-red" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"}`}
          >
            <User className="h-5 w-5" />
            Profile
          </NavLink>
        </div>

        <div className="border-t border-border px-4 py-4">
          <button
            onClick={() => setShowNotifications((current) => !current)}
            className="relative mb-3 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            Notifications
            {notifications.length > 0 && <span className="ml-auto h-2 w-2 rounded-full bg-brand-red" />}
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex w-full items-center justify-center rounded-lg bg-surface px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
            aria-label="Open settings"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </button>
        </div>
      </nav>

      {/* Top Header - All Devices */}
      <div className="md:flex md:flex-1 md:flex-col md:ml-64">
        <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-xl supports-backdrop-filter:bg-surface/60">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-2 sm:px-6">
            <div className="flex min-w-0 items-center gap-4 flex-1">
              <Link to="/customer" className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red text-xl font-bold text-white shadow-lg shadow-brand-red/20 transition-transform active:scale-95">
                Q
              </Link>

              <div className="hidden md:block w-full max-w-xs">
                <div className="relative group">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-brand-red transition-colors" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find restaurants or dishes..."
                    className="h-10 w-full rounded-2xl border border-border bg-background pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-brand-red focus:ring-4 focus:ring-brand-red/10"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <p className="truncate text-md text-muted-foreground">{displayName}</p>
              </div>
            </div>

            <div className="hidden lg:flex min-w-0 max-w-3xl items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-red/10 px-2 py-1 text-xs font-medium text-brand-red">
                <MapPin className="h-3.5 w-3.5" />
                <span className="max-w-40 truncate">{locationLabel}</span>
              </span>
              <span className="max-w-44 truncate rounded-full bg-surface px-2 py-1 text-xs text-muted-foreground">{displayEmail}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowNotifications((current) => !current)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors md:hidden"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-red ring-2 ring-surface" />}
              </button>

              <Link
                to="/customer?view=cart"
                className="relative hidden sm:flex md:hidden h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white ring-2 ring-surface">
                    {cartCount}
                  </span>
                )}
              </Link>

              <Link
                to="/customer/profile"
                className="hidden sm:flex md:hidden h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
                aria-label="Profile"
              >
                <User className="h-5 w-5" />
              </Link>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
                aria-label="Open settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="border-t border-border/70 px-4 py-2 lg:hidden sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-brand-red/10 px-2 py-1 text-xs font-medium text-brand-red">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{locationLabel}</span>
              </span>
              <span className="max-w-full truncate rounded-full bg-background px-2 py-1 text-xs text-muted-foreground">{displayEmail}</span>
            </div>
          </div>
        </header>

        {/* Notifications Modal */}
        {showNotifications && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity animate-in fade-in"
              onClick={() => setShowNotifications(false)}
            />
            <div className="fixed inset-x-3 bottom-3 z-50 flex max-h-[75vh] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-in slide-in-from-bottom duration-300 sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-20 sm:w-[420px] sm:max-h-[70vh] sm:slide-in-from-top-1">
              <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Notifications</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">Recent order updates</p>
                </div>
                {notifications.length > 0 && (
                  <span className="rounded-full bg-brand-red/10 px-2 py-1 text-[11px] font-bold text-brand-red">
                    {notifications.length} new
                  </span>
                )}
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-surface/50 p-3 sm:p-4">
                {notifications.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center space-y-3 pb-10 text-center">
                    <div className="h-16 w-16 rounded-full bg-surface shadow-sm border border-border flex items-center justify-center">
                      <Bell className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-base font-semibold text-foreground">You're all caught up!</p>
                    <p className="text-sm text-muted-foreground max-w-[200px]">No new notifications at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className="group relative overflow-hidden rounded-xl border border-border bg-surface p-3.5 shadow-sm transition-all hover:border-brand-red/25 hover:shadow-md"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-red/80" />
                        <div className="flex items-start gap-3 pl-1">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.tone}`}>
                            <item.icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-foreground">{item.restaurantName}</p>
                              <span className="rounded-md bg-surface-hover px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                                #{item.orderIdShort}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs font-medium capitalize text-muted-foreground">{item.statusLabel}</p>
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {item.paidAt ? formatDate(item.paidAt) : "Just now"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-3">
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="rounded-lg bg-brand-red px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-red-hover"
                  >
                    View Orders
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        <main className="flex-1 overflow-y-auto pb-24 pt-6 px-4 sm:px-6 md:pb-8">
          <Outlet
            context={{
              restaurants,
              orders,
              cart,
              setCart,
              handleCheckout,
              checkoutLoading,
              checkoutSuccess,
              checkoutError,
              paymentPhoneNumber,
              setPaymentPhoneNumber,
              lifecycleByOrder,
              handleConfirmDelivery,
              handleCancelOrder,
              handleDeleteOrder,
              favorites,
              toggleFavorite,
              searchQuery,
              setSearchQuery,
              riderLocations,
              customerLocation,
            }}
          />
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-safe md:hidden">
        <div className="grid grid-cols-5 h-20 sm:h-24">
          <NavLink to="/customer" end className={`flex flex-col items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium transition-colors ${isHomeActive ? "text-brand-red" : "text-muted-foreground hover:text-foreground"}`}>
            <Home className="h-6 w-6 sm:h-7 sm:w-7" />
            <span>Home</span>
          </NavLink>
          <NavLink to="/customer/orders" className={`flex flex-col items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium transition-colors ${isOrdersActive ? "text-brand-red" : "text-muted-foreground hover:text-foreground"}`}>
            <Bell className="h-6 w-6 sm:h-7 sm:w-7" />
            <span>Orders</span>
          </NavLink>
          <NavLink to="/customer?view=cart" className={`flex flex-col items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium transition-colors relative ${isCartActive ? "text-brand-red" : "text-muted-foreground hover:text-foreground"}`}>
            <div className="relative">
              <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[9px] font-bold text-white shadow-sm ring-1.5 ring-surface">
                  {cartCount}
                </span>
              )}
            </div>
            <span>Cart</span>
          </NavLink>
          <NavLink to="/customer?view=favorites" className={`flex flex-col items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium transition-colors ${isFavoritesActive ? "text-brand-red" : "text-muted-foreground hover:text-foreground"}`}>
            <Heart className="h-6 w-6 sm:h-7 sm:w-7" />
            <span>Favorites</span>
          </NavLink>
          <NavLink to="/customer/profile" className={`flex flex-col items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium transition-colors ${isProfileActive ? "text-brand-red" : "text-muted-foreground hover:text-foreground"}`}>
            <User className="h-6 w-6 sm:h-7 sm:w-7" />
            <span>Profile</span>
          </NavLink>
        </div>
      </nav>

      {showSettingsModal && (
        <div
          className="fixed inset-0 z-70 bg-black/20"
          role="dialog"
          aria-modal="true"
          aria-label="Customer settings"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="absolute right-4 top-20 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-surface p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3">
              <p className="text-sm font-semibold text-foreground">Account Settings</p>
              <p className="text-xs text-muted-foreground">{displayName}</p>
            </div>

            <div className="space-y-2">
              <Link
                to="/customer/profile"
                onClick={() => setShowSettingsModal(false)}
                className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-hover"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="mt-3 w-full rounded-lg bg-surface-hover px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
