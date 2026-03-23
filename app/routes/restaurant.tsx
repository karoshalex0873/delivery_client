import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Link, Outlet, useLocation, useOutletContext } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Home,
  LayoutDashboard,
  Utensils,
} from "lucide-react";
import { useRoleGuard } from "../components/role-guard";
import {
  getMyMenuItems,
  getMyRestaurant,
  type MenuItemRecord,
  type RestaurantRecord,
} from "../services/restaurant";

export type RestaurantLayoutContext = {
  restaurant: RestaurantRecord | null;
  menuItems: MenuItemRecord[];
  setRestaurant: Dispatch<SetStateAction<RestaurantRecord | null>>;
  setMenuItems: Dispatch<SetStateAction<MenuItemRecord[]>>;
  loading: boolean;
  error: string | null;
  menuError: string | null;
  setMenuError: Dispatch<SetStateAction<string | null>>;
};

export const useRestaurantLayout = () => useOutletContext<RestaurantLayoutContext>();

const RestaurantLayout = () => {
  const authorized = useRoleGuard(3);
  const location = useLocation();
  const [restaurant, setRestaurant] = useState<RestaurantRecord | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

        try {
          const menuData = await getMyMenuItems();
          if (!isMounted) {
            return;
          }

          setMenuItems(menuData);
          setMenuError(null);
        } catch (menuLoadError) {
          if (!isMounted) {
            return;
          }

          setMenuError(menuLoadError instanceof Error ? menuLoadError.message : "Failed to load menu items");
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : "Failed to load restaurant";

        if (message.toLowerCase().includes("not found")) {
          setRestaurant(null);
          setMenuItems([]);
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

  const urls = {
    dashboard: "/restaurant",
    menu: "/restaurant/menu",
    orders: "/restaurant/orders",
  };

  const navItemClass = (href: string) => {
    const isActive = location.pathname === href;
    return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-slate-900 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;
  };

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-6 py-3 backdrop-blur-md">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold">
              D
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none">Restaurant Studio</h1>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                Kitchen Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium">{restaurant?.name ?? "Restaurant User"}</p>
              <p className="text-xs text-slate-500">{restaurant?.phoneNumber ?? "Owner access"}</p>
            </div>
            <div className="h-10 w-10 rounded-full border-2 border-white bg-slate-200 shadow-sm" />
          </div>
        </div>
      </header>

      <div className="flex w-full gap-6 p-6">
        <aside className={`flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? "w-16" : "w-64"}`}>
          <div className="sticky top-24 space-y-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="mb-4 flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
            >
              {isCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <ChevronLeft size={16} />
                  Collapse Menu
                </div>
              )}
            </button>

            <nav className="space-y-1">
              <Link className={navItemClass(urls.dashboard)} to={urls.dashboard}>
                <LayoutDashboard size={18} />
                {!isCollapsed && <span>Dashboard</span>}
              </Link>
              <Link className={navItemClass(urls.menu)} to={urls.menu}>
                <Utensils size={18} />
                {!isCollapsed && <span>Menu</span>}
              </Link>
              <Link className={navItemClass(urls.orders)} to={urls.orders}>
                <ClipboardList size={18} />
                {!isCollapsed && <span>Orders</span>}
              </Link>
              <div className="my-4 border-t border-slate-200 pt-4" />

              <Link
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
                to="/"
              >
                <Home size={18} />
                {!isCollapsed && <span>Back to Home</span>}
              </Link>
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm ring-1 ring-slate-900/5">
            <Outlet
              context={{
                restaurant,
                menuItems,
                setRestaurant,
                setMenuItems,
                loading,
                error,
                menuError,
                setMenuError,
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RestaurantLayout;
