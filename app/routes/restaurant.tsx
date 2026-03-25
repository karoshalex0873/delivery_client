import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Link, Outlet, useLocation, useOutletContext } from "react-router";
import {
  LayoutDashboard,
  Utensils,
  ClipboardList
} from "lucide-react";
import { AppLayout, type NavItem } from "~/components/app-layout";
import { useRoleGuard } from "../components/role-guard";
import {
  getMyMenuItems,
  getMyRestaurant,
  upsertMyRestaurantLocation,
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

  useEffect(() => {
    if (!authorized || !restaurant || typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        void upsertMyRestaurantLocation(position.coords.latitude, position.coords.longitude);
      },
      () => {
        // Restaurant user denied location permission.
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [authorized, restaurant]);

  const navItems: NavItem[] = [
    { title: "Dashboard", href: "/restaurant", icon: LayoutDashboard },
    { title: "Menu", href: "/restaurant/menu", icon: Utensils },
    { title: "Orders", href: "/restaurant/orders", icon: ClipboardList },
  ];

  if (!authorized) {
    return null;
  }

  return (
    <AppLayout navItems={navItems} userRole="restaurant">
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
    </AppLayout>
  );
};

export default RestaurantLayout;
