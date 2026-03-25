import { useMemo, useState } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router";
import { type CustomerContextData } from "./customer";
import { Button } from "~/components/ui/button";
import { Heart, Clock3, Star, Plus, Minus, ArrowLeft, ShoppingBag } from "lucide-react";
import { formatCurrency } from "~/lib/utils";

type DetailTab = "menu" | "reviews";

const fallbackRestaurantImages = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
];

const fallbackFoodImages = [
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
];

const getMockRating = (seed: string) => 4.2 + ((seed.length % 8) / 10);
const getMockDeliveryTime = (seed: string) => 20 + (seed.length % 18);

export default function RestaurantDetail() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { restaurants, cart, setCart, favorites, toggleFavorite } = useOutletContext<CustomerContextData>();
  const [detailTab, setDetailTab] = useState<DetailTab>("menu");

  const restaurant = useMemo(() => restaurants.find((r) => r.id === restaurantId), [restaurants, restaurantId]);

  if (!restaurant) {
    return <div className="p-8 text-center text-muted-foreground">Restaurant not found.</div>;
  }

  const menuItems = restaurant.menuItems ?? [];

  const updateCart = (menuItemId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[menuItemId] || 0;
      const next = Math.max(0, current + delta);
      const nextCart = { ...prev, [menuItemId]: next };
      if (next === 0) delete nextCart[menuItemId];
      return nextCart;
    });
  };

  const getQuantity = (id: string) => cart[id] || 0;

  return (
    <div className="mx-auto w-full space-y-6 pb-24 animate-fade-in">
      <button 
        onClick={() => navigate(-1)} 
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm ring-1 ring-black/5">
        <div className="relative h-64 w-full sm:h-80">
          <img 
            src={fallbackRestaurantImages[0]} 
            alt={restaurant.name} 
            className="h-full w-full object-cover" 
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 text-white w-full">
             <h1 className="text-3xl font-black tracking-tight md:text-4xl">{restaurant.name}</h1>
             <p className="mt-2 text-white/90 font-medium">{restaurant.description || "Delicious dishes prepared fresh."}</p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
            <div className="flex items-center gap-4 text-sm font-medium text-foreground">
              <span className="flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-warning-dark">
                <Star className="h-4 w-4 fill-current" /> {getMockRating(restaurant.id).toFixed(1)}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-surface-hover px-3 py-1 text-muted-foreground">
                <Clock3 className="h-4 w-4" /> {getMockDeliveryTime(restaurant.id)} min
              </span>
            </div>

            <button 
              onClick={() => toggleFavorite(restaurant.id)} 
              className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all ${favorites.includes(restaurant.id) ? "bg-red-50 text-brand-red ring-1 ring-red-100" : "bg-surface-hover text-muted-foreground hover:bg-surface-active"}`}
            >
              <Heart className={`h-4 w-4 ${favorites.includes(restaurant.id) ? "fill-current" : ""}`} />
              <span className="text-sm font-semibold">{favorites.includes(restaurant.id) ? "Favorited" : "Add to favorites"}</span>
            </button>
          </div>

          <div className="mt-6 flex gap-2">
            <button 
              onClick={() => setDetailTab("menu")} 
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${detailTab === "menu" ? "bg-foreground text-background shadow-md" : "bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground"}`}
            >
              Menu
            </button>
            <button 
              onClick={() => setDetailTab("reviews")} 
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${detailTab === "reviews" ? "bg-foreground text-background shadow-md" : "bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground"}`}
            >
              Reviews
            </button>
          </div>

          <div className="mt-8">
            {detailTab === "menu" ? (
              <div className="grid gap-6 grid-cols-2 sm:grid-cols-3">
                {menuItems.length === 0 ? (
                    <p className="col-span-full py-8 text-center text-muted-foreground font-medium">No menu items available.</p>
                ) : (
                    menuItems.map((item, index) => (
                    <div key={item.id} className="group  overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:shadow-md hover:border-border/80">
                        <div className="relative h-40 md:h-60 overflow-hidden">
                            <img 
                                src={fallbackFoodImages[index % fallbackFoodImages.length]} 
                                alt={item.name} 
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            />
                            {getQuantity(item.id) > 0 && (
                                <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-white shadow-lg font-bold text-xs ring-2 ring-white">
                                    {getQuantity(item.id)}
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-foreground group-hover:text-brand-red transition-colors">{item.name}</h3>
                            <span className="text-sm font-bold text-brand-red">{formatCurrency(item.price)}</span>
                        </div>
                        <p className="line-clamp-2 text-xs text-muted-foreground mb-4">Freshly prepared with potential allergens. Contact support for details.</p>
                        
                        {getQuantity(item.id) > 0 ? (
                            <div className="flex items-center justify-between rounded-xl bg-surface-hover p-1">
                                <button onClick={() => updateCart(item.id, -1)} className="h-8 w-8 flex items-center justify-center rounded-lg bg-white shadow-sm hover:text-brand-red transition-colors"><Minus className="h-4 w-4" /></button>
                                <span className="text-sm font-bold w-6 text-center">{getQuantity(item.id)}</span>
                                <button onClick={() => updateCart(item.id, 1)} className="h-8 w-8 flex items-center justify-center rounded-lg bg-white shadow-sm hover:text-brand-red transition-colors"><Plus className="h-4 w-4" /></button>
                            </div>
                        ) : (
                            <Button className="w-full gap-2 rounded-xl" onClick={() => updateCart(item.id, 1)}>
                                <ShoppingBag className="h-4 w-4" /> Add to Cart
                            </Button>
                        )}
                        </div>
                    </div>
                    ))
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {["Great portions and super fast.", "Very tasty and fresh.", "Rider was quick and friendly."].map((review, idx) => (
                  <div key={idx} className="rounded-2xl border border-border bg-surface-hover p-4">
                    <div className="flex items-center gap-1 text-warning mb-2">
                        <Star className="h-3 w-3 fill-current" />
                        <Star className="h-3 w-3 fill-current" />
                        <Star className="h-3 w-3 fill-current" />
                        <Star className="h-3 w-3 fill-current" />
                        <Star className="h-3 w-3 fill-current" />
                    </div>
                    <p className="text-sm text-foreground font-medium">"{review}"</p>
                    <p className="mt-2 text-xs text-muted-foreground">Verified Customer • 2 days ago</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}