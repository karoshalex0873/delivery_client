import { useMemo, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { type CustomerContextData } from "./customer";
import { Button } from "~/components/ui/button";
import { Heart, Clock3, MapPin, Star, Filter, Plus, Minus, Trash2 } from "lucide-react";
import { formatCurrency } from "~/lib/utils";

const filterOptions = ["All", "Fast Delivery", "Top Rated", "Nearby"] as const;

const fallbackRestaurantImages = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=1200&q=80",
];

const getMockRating = (seed: string) => 4.2 + ((seed.length % 8) / 10);
const getMockDeliveryTime = (seed: string) => 20 + (seed.length % 18);
const getMockDistance = (seed: string) => 0.8 + ((seed.length % 7) / 2);

export default function CustomerDashboard() {
  const {
    restaurants,
    favorites,
    toggleFavorite,
    searchQuery,
    cart,
    setCart,
    handleCheckout,
    checkoutLoading,
    checkoutSuccess,
    checkoutError,
    paymentPhoneNumber,
    setPaymentPhoneNumber,
  } = useOutletContext<CustomerContextData>();

  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") ?? "home";
  const [activeFilter, setActiveFilter] = useState<(typeof filterOptions)[number]>("All");

  const feedRestaurants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const rating = getMockRating(restaurant.id);
      const delivery = getMockDeliveryTime(restaurant.id);
      const distance = getMockDistance(restaurant.id);
      const matchesQuery =
        !query ||
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.description?.toLowerCase().includes(query) ||
        (restaurant.menuItems ?? []).some((item) => item.name.toLowerCase().includes(query));

      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Fast Delivery" && delivery <= 30) ||
        (activeFilter === "Top Rated" && rating >= 4.7) ||
        (activeFilter === "Nearby" && distance <= 2.5);

      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, restaurants, searchQuery]);

  const favoriteRestaurants = useMemo(
    () => restaurants.filter((restaurant) => favorites.includes(restaurant.id)),
    [favorites, restaurants],
  );

  const cartItems = useMemo(() => {
    const items: Array<{ menuItemId: string; quantity: number; price: number; name: string; restaurantId: string }> = [];

    for (const [menuItemId, quantity] of Object.entries(cart)) {
      for (const restaurant of restaurants) {
        const menuItem = (restaurant.menuItems ?? []).find((item) => item.id === menuItemId);
        if (menuItem) {
          items.push({
            menuItemId,
            quantity,
            price: menuItem.price,
            name: menuItem.name,
            restaurantId: restaurant.id,
          });
          break;
        }
      }
    }

    return items;
  }, [cart, restaurants]);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartRestaurantId = cartItems[0]?.restaurantId ?? null;

  const updateCart = (menuItemId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[menuItemId] || 0;
      const next = Math.max(0, current + delta);
      const nextCart = { ...prev, [menuItemId]: next };
      if (next === 0) delete nextCart[menuItemId];
      return nextCart;
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[menuItemId];
      return next;
    });
  };

  const renderRestaurantCard = (restaurant: (typeof restaurants)[number], index: number) => {
    const rating = getMockRating(restaurant.id).toFixed(1);
    const delivery = getMockDeliveryTime(restaurant.id);
    const distance = getMockDistance(restaurant.id).toFixed(1);
    const image = fallbackRestaurantImages[index % fallbackRestaurantImages.length];
    const isFavorite = favorites.includes(restaurant.id);

    return (
      <motion.article
        key={restaurant.id}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        whileHover={{ y: -5 }}
        className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition-all hover:shadow-lg"
      >
        <Link to={`/customer/restaurant/${restaurant.id}`} className="relative h-48 w-full overflow-hidden">
          <img src={image} alt={restaurant.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60 transition-opacity group-hover:opacity-40" />
          <div className="absolute bottom-3 left-3">
            <span className="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-bold text-foreground backdrop-blur-md shadow-sm">
              {delivery} min
            </span>
          </div>
        </Link>

        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(restaurant.id);
          }}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-all hover:scale-110 active:scale-95 ${isFavorite ? "bg-white text-brand-red" : "bg-black/30 text-white hover:bg-white hover:text-brand-red"}`}
          aria-label="Toggle favorite"
        >
          <Heart className={`h-4.5 w-4.5 ${isFavorite ? "fill-current" : ""}`} />
        </button>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/customer/restaurant/${restaurant.id}`} className="block">
              <h3 className="text-lg font-bold text-foreground group-hover:text-brand-red transition-colors">{restaurant.name}</h3>
            </Link>
            <span className="flex items-center gap-1 rounded-lg bg-warning/10 px-2 py-0.5 text-xs font-bold text-[#b45b00]">
              <Star className="h-3 w-3 fill-current" /> {rating}
            </span>
          </div>

          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{restaurant.description || "Great meals and fast delivery."}</p>

          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {distance} km away</span>
            <span className="flex items-center gap-1.5 text-brand-red"><Clock3 className="h-3.5 w-3.5" /> Fast</span>
          </div>
        </div>
      </motion.article>
    );
  };

  if (view === "favorites") {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Favorites</h2>
        {favoriteRestaurants.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted-foreground">No favorite restaurants yet. Tap the heart icon on restaurant cards.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteRestaurants.map((restaurant, index) => renderRestaurantCard(restaurant, index))}
          </div>
        )}
      </div>
    );
  }

  if (view === "cart") {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Cart</h2>
        {cartItems.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted-foreground">Your cart is empty. Add items from restaurants.</p>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.menuItemId} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(item.price)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateCart(item.menuItemId, -1)}>
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateCart(item.menuItemId, 1)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <button onClick={() => removeFromCart(item.menuItemId)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label="Remove item">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-border bg-surface p-4">
              <label className="text-sm font-semibold">Payment Phone Number</label>
              <input
                value={paymentPhoneNumber}
                onChange={(e) => setPaymentPhoneNumber(e.target.value)}
                placeholder="2547XXXXXXXX"
                className="input-field mt-2"
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-brand-red">{formatCurrency(cartTotal)}</p>
              </div>
              {checkoutError ? <p className="mt-2 text-sm text-red-600">{checkoutError}</p> : null}
              {checkoutSuccess ? <p className="mt-2 text-sm text-green-600">{checkoutSuccess}</p> : null}
              <Button
                className="mt-4 w-full"
                disabled={!cartRestaurantId || checkoutLoading}
                onClick={() => (cartRestaurantId ? void handleCheckout(cartRestaurantId) : undefined)}
              >
                {checkoutLoading ? "Processing..." : "Checkout"}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      <div className="sticky top-16 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur-sm sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface border border-border">
            <Filter className="h-5 w-5 text-muted-foreground" />
          </div>
          {filterOptions.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${activeFilter === filter
                ? "bg-foreground text-background shadow-md"
                : "bg-surface text-muted-foreground border border-border hover:bg-surface-hover hover:text-foreground"
                }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Restaurants near you</h2>
          <span className="text-sm font-semibold text-muted-foreground">{feedRestaurants.length} results</span>
        </div>

        {feedRestaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-semibold text-muted-foreground">No restaurants found.</p>
            <button onClick={() => setActiveFilter("All")} className="mt-2 text-sm text-brand-red hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {feedRestaurants.map((restaurant, index) => renderRestaurantCard(restaurant, index))}
          </div>
        )}
      </div>
    </div>
  );
}
