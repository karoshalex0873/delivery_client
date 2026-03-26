import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Link, NavLink, Outlet, useLocation, useOutletContext } from "react-router";
import { useClerk } from "@clerk/clerk-react";
import {
  ClipboardList,
  Home,
  LogOut,
  MapPin,
  MessageSquare,
  Settings,
  UserCircle2,
  Utensils,
} from "lucide-react";
import { useRoleGuard } from "../components/role-guard";
import { getCurrentUser, logout as logoutUser, type CurrentUserRecord } from "../services/auth";
import {
  getMyMenuItems,
  getMyOrders,
  getMyRestaurant,
  type MenuItemRecord,
  type RestaurantOrderRecord,
  type RestaurantRecord,
} from "../services/restaurant";

export type RestaurantLayoutContext = {
  restaurant: RestaurantRecord | null;
  menuItems: MenuItemRecord[];
  orders: RestaurantOrderRecord[];
  unreadOrdersCount: number;
  setRestaurant: Dispatch<SetStateAction<RestaurantRecord | null>>;
  setMenuItems: Dispatch<SetStateAction<MenuItemRecord[]>>;
  setOrders: Dispatch<SetStateAction<RestaurantOrderRecord[]>>;
  loading: boolean;
  error: string | null;
  menuError: string | null;
  setMenuError: Dispatch<SetStateAction<string | null>>;
};

export const useRestaurantLayout = () => useOutletContext<RestaurantLayoutContext>();

const SEEN_ORDERS_STORAGE_KEY = "restaurantSeenOrderIds";

const RestaurantLayout = () => {
  const authorized = useRoleGuard(3);
  const location = useLocation();
  const { signOut } = useClerk();
  const [restaurant, setRestaurant] = useState<RestaurantRecord | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemRecord[]>([]);
  const [orders, setOrders] = useState<RestaurantOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUserRecord | null>(null);
  const [seenOrderIds, setSeenOrderIds] = useState<string[]>([]);
  const [toastAlerts, setToastAlerts] = useState<Array<{ id: string; message: string }>>([]);
  const initializedOrderIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const stored = localStorage.getItem(SEEN_ORDERS_STORAGE_KEY);
      setSeenOrderIds(stored ? (JSON.parse(stored) as string[]) : []);
    } catch {
      setSeenOrderIds([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SEEN_ORDERS_STORAGE_KEY, JSON.stringify(seenOrderIds));
    }
  }, [seenOrderIds]);

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

  useEffect(() => {
    if (!authorized || !restaurant) {
      return;
    }

    let isMounted = true;
    const pollOrders = async () => {
      try {
        const latest = await getMyOrders();
        if (!isMounted) {
          return;
        }

        const previousIds = initializedOrderIds.current;
        const nextIds = new Set(latest.map((order) => order.id));

        if (previousIds.size > 0) {
          const newlyArrived = latest.filter((order) => !previousIds.has(order.id));
          if (newlyArrived.length > 0) {
            setToastAlerts((current) => [
              ...current,
              ...newlyArrived.map((order) => ({
                id: `order-${order.id}-${Date.now()}`,
                message: `A new message has arrived - #${order.id.slice(0, 8)}`,
              })),
            ]);
          }
        }

        initializedOrderIds.current = nextIds;
        setOrders(latest);
      } catch {
        // Keep existing order list on polling failure.
      }
    };

    if (initializedOrderIds.current.size === 0 && orders.length > 0) {
      initializedOrderIds.current = new Set(orders.map((order) => order.id));
    }

    const intervalId = window.setInterval(() => {
      void pollOrders();
    }, 7000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [authorized, restaurant, orders, setOrders]);

  useEffect(() => {
    if (toastAlerts.length === 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setToastAlerts((current) => current.slice(1));
    }, 2800);
    return () => {
      window.clearTimeout(timer);
    };
  }, [toastAlerts]);

  useEffect(() => {
    if (!authorized) {
      return;
    }

    let isMounted = true;

    const loadWorkspace = async () => {
      setLoading(true);

      try {
        const restaurantData = await getMyRestaurant();
        if (!isMounted) {
          return;
        }

        setRestaurant(restaurantData);
        setError(null);

        const [menuData, ordersData] = await Promise.all([getMyMenuItems(), getMyOrders()]);
        if (!isMounted) {
          return;
        }

        setMenuItems(menuData);
        setOrders(ordersData);
        setMenuError(null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : "Failed to load restaurant";

        if (message.toLowerCase().includes("not found")) {
          setRestaurant(null);
          setMenuItems([]);
          setOrders([]);
          setError(null);
          setMenuError(null);
        } else {
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadWorkspace();

    return () => {
      isMounted = false;
    };
  }, [authorized]);

  const handleLogout = async () => {
    await logoutUser();
    try {
      await signOut();
    } catch {
      // Ignore if Clerk session does not exist.
    }
    window.location.href = "/auth/signin";
  };

  const isDashboardActive = location.pathname === "/restaurant";
  const isMenuActive = location.pathname.startsWith("/restaurant/menu");
  const isOrdersActive = location.pathname.startsWith("/restaurant/orders");
  const isMessagesActive = location.pathname.startsWith("/restaurant/messages");
  const pendingOrActiveCount = orders.filter((order) =>
    ["pending", "accepted", "preparing", "ready_for_pickup", "delivery_sign_restaurant", "delivery_sign_rider", "out_for_delivery"].includes(order.status),
  ).length;
  const unreadOrdersCount = Math.max(0, orders.filter((order) => !seenOrderIds.includes(order.id)).length);

  const markAllAsSeen = () => {
    setSeenOrderIds((current) => {
      const set = new Set(current);
      for (const order of orders) {
        set.add(order.id);
      }
      return Array.from(set);
    });
  };

  useEffect(() => {
    if (isMessagesActive && unreadOrdersCount > 0) {
      markAllAsSeen();
    }
  }, [isMessagesActive, unreadOrdersCount]);

  if (!authorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      <nav className="hidden md:flex md:h-screen md:w-64 md:flex-col md:border-r md:border-border md:bg-surface md:shadow-sm md:fixed md:left-0 md:top-0 md:z-50">
        <div className="flex h-20 items-center justify-center border-b border-border px-4">
          <Link to="/restaurant" className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-red text-2xl font-bold text-white shadow-lg shadow-brand-red/20 transition-transform hover:scale-105 active:scale-95">
            R
          </Link>
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-6">
          <NavLink to="/restaurant" end className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isDashboardActive ? "bg-brand-red/10 text-brand-red" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"}`}>
            <Home className="h-5 w-5" />
            Dashboard
          </NavLink>
          <NavLink to="/restaurant/menu" className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isMenuActive ? "bg-brand-red/10 text-brand-red" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"}`}>
            <Utensils className="h-5 w-5" />
            Menu
          </NavLink>
          <NavLink to="/restaurant/orders" className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isOrdersActive ? "bg-brand-red/10 text-brand-red" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"}`}>
            <ClipboardList className="h-5 w-5" />
            Orders
            {pendingOrActiveCount > 0 ? (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1.5 text-[10px] font-bold text-white">
                {pendingOrActiveCount}
              </span>
            ) : null}
          </NavLink>
          <NavLink to="/restaurant/messages" className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isMessagesActive ? "bg-brand-red/10 text-brand-red" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"}`}>
            <MessageSquare className="h-5 w-5" />
            Messages
            {unreadOrdersCount > 0 ? (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1.5 text-[10px] font-bold text-white">
                {unreadOrdersCount}
              </span>
            ) : null}
          </NavLink>
        </div>

        <div className="border-t border-border px-4 py-4">
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

      <div className="md:flex md:flex-1 md:flex-col md:ml-64">
        <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-xl supports-backdrop-filter:bg-surface/60">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-2 sm:px-6">
            <div className="flex min-w-0 items-center gap-4 flex-1">
              <Link to="/restaurant" className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red text-xl font-bold text-white shadow-lg shadow-brand-red/20 transition-transform active:scale-95">
                Q
              </Link>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{restaurant?.name ?? "Restaurant Dashboard"}</p>
                <p className="truncate text-xs text-muted-foreground">
                   {restaurant?.user ? `${restaurant.user.firstName} ${restaurant.user.lastName}` : currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Restaurant owner"}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-red/10 px-2 py-1 text-xs font-medium text-brand-red">
                <MapPin className="h-3.5 w-3.5" />
                <span className="max-w-40 truncate">{restaurant?.address ?? "Location unavailable"}</span>
              </span>
            </div>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
              aria-label="Open settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 pt-6 px-4 sm:px-6 md:pb-8">
          <Outlet
            context={{
              restaurant,
              menuItems,
              orders,
              unreadOrdersCount,
              setRestaurant,
              setMenuItems,
              setOrders,
              loading,
              error,
              menuError,
              setMenuError,
            }}
          />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-safe md:hidden">
        <div className="grid grid-cols-5 h-20 sm:h-24">
          <NavLink to="/restaurant" end className={`flex flex-col items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium transition-colors ${isDashboardActive ? "text-brand-red" : "text-muted-foreground hover:text-foreground"}`}>
            <Home className="h-6 w-6 sm:h-7 sm:w-7" />
            <span>Home</span>
          </NavLink>
          <NavLink to="/restaurant/menu" className={`flex flex-col items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium transition-colors ${isMenuActive ? "text-brand-red" : "text-muted-foreground hover:text-foreground"}`}>
            <Utensils className="h-6 w-6 sm:h-7 sm:w-7" />
            <span>Menu</span>
          </NavLink>
          <NavLink to="/restaurant/orders" className={`relative flex flex-col items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium transition-colors ${isOrdersActive ? "text-brand-red" : "text-muted-foreground hover:text-foreground"}`}>
            <ClipboardList className="h-6 w-6 sm:h-7 sm:w-7" />
            {unreadOrdersCount > 0 ? <span className="absolute right-5 top-4 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[9px] font-bold text-white">{unreadOrdersCount}</span> : null}
            <span>Orders</span>
          </NavLink>
          <NavLink to="/restaurant/messages" className={`relative flex flex-col items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium transition-colors ${isMessagesActive ? "text-brand-red" : "text-muted-foreground hover:text-foreground"}`}>
            <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7" />
            {unreadOrdersCount > 0 ? <span className="absolute right-4 top-4 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[9px] font-bold text-white">{unreadOrdersCount}</span> : null}
            <span>Messages</span>
          </NavLink>
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="flex flex-col items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings className="h-6 w-6 sm:h-7 sm:w-7" />
            <span>Settings</span>
          </button>
        </div>
      </nav>

      {showSettingsModal ? (
        <div
          className="fixed inset-0 z-70 bg-black/20"
          role="dialog"
          aria-modal="true"
          aria-label="Restaurant settings"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="absolute right-4 top-20 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-surface p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3">
              <p className="text-sm font-semibold text-foreground">Restaurant Settings</p>
              <p className="text-xs text-muted-foreground">{restaurant?.name ?? "Restaurant"}</p>
            </div>
            <div className="space-y-2">
              <Link
                to="/restaurant/manage"
                onClick={() => setShowSettingsModal(false)}
                className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-hover"
              >
                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                Manage restaurant
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
      ) : null}

      <div className="pointer-events-none fixed right-4 top-[25vh] z-[80] space-y-2">
        {toastAlerts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto animate-in slide-in-from-bottom-8 fade-in rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-lg"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantLayout;
