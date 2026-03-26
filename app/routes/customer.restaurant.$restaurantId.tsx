import { useMemo } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router";
import { ArrowLeft, Clock3, Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { Button } from "~/components/ui/button";
import { formatCurrency } from "~/lib/utils";
import { type CatalogMenuItemRecord } from "~/services/orders";
import { type CustomerContextData } from "./customer";

const fallbackRestaurantImages = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
];

const fallbackFoodImages = [
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1601050690117-8b38f0f8f1f8?auto=format&fit=crop&w=900&q=80",
];

const getMockRating = (seed: string) => 4.2 + ((seed.length % 8) / 10);
const getMockDeliveryTime = (seed: string) => 20 + (seed.length % 18);

const CATEGORY_CONFIG = [
  { id: "beverages", name: "Beverages" },
  { id: "fast-food", name: "Fast Food" },
  { id: "vegetarian", name: "Vegetarian" },
  { id: "desserts", name: "Desserts" },
  { id: "local", name: "Local Favourites" },
  { id: "more", name: "More" },
] as const;

type CategoryId = (typeof CATEGORY_CONFIG)[number]["id"];

const inferCategory = (item: CatalogMenuItemRecord): CategoryId => {
  const fromApi = (item.category ?? "").toLowerCase();
  if (fromApi.includes("beverage")) return "beverages";
  if (fromApi.includes("fast")) return "fast-food";
  if (fromApi.includes("veget")) return "vegetarian";
  if (fromApi.includes("dessert")) return "desserts";
  if (fromApi.includes("local")) return "local";

  const name = item.name.toLowerCase();
  if (/(juice|soda|drink|water|tea|coffee|smoothie|milkshake)/.test(name)) return "beverages";
  if (/(burger|pizza|fries|shawarma|hot dog|chicken|wrap)/.test(name)) return "fast-food";
  if (/(veggie|vegetable|salad|plant|mushroom|lentil|bean)/.test(name)) return "vegetarian";
  if (/(cake|ice cream|dessert|cookie|donut|chocolate|pie)/.test(name)) return "desserts";
  if (/(ugali|nyama|pilau|chapati|biryani|samaki|matoke|rice|stew)/.test(name)) return "local";
  return "more";
};

const buildCategoryRows = (items: CatalogMenuItemRecord[]) => {
  const grouped: Record<CategoryId, CatalogMenuItemRecord[]> = {
    beverages: [],
    "fast-food": [],
    vegetarian: [],
    desserts: [],
    local: [],
    more: [],
  };

  for (const item of items) {
    const category = inferCategory(item);
    grouped[category].push(item);
  }

  return CATEGORY_CONFIG.map((config) => ({
    ...config,
    items: grouped[config.id],
  })).filter((row) => row.items.length > 0);
};

export default function RestaurantDetail() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { restaurants, cart, setCart, favorites, toggleFavorite } = useOutletContext<CustomerContextData>();

  const restaurant = useMemo(() => restaurants.find((r) => r.id === restaurantId), [restaurants, restaurantId]);

  if (!restaurant) {
    return <div className="p-8 text-center text-muted-foreground">Restaurant not found.</div>;
  }

  const menuItems = (restaurant.menuItems ?? []).filter((item) => (item.availableCount ?? 1) > 0);
  const categoryRows = buildCategoryRows(menuItems);

  const updateCart = (menuItemId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[menuItemId] || 0;
      const next = Math.max(0, current + delta);
      const nextCart = { ...prev, [menuItemId]: next };
      if (next === 0) {
        delete nextCart[menuItemId];
      }
      return nextCart;
    });
  };

  const getQuantity = (id: string) => cart[id] || 0;

  return (
    <div className="mx-auto w-full space-y-6 pb-24 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm ring-1 ring-black/5">
        <div className="relative h-64 w-full sm:h-80">
          <img src={fallbackRestaurantImages[0]} alt={restaurant.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-6 text-white">
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">{restaurant.name}</h1>
            <p className="mt-2 font-medium text-white/90">
              {restaurant.description || "Delicious dishes prepared fresh."}
            </p>
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
              className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all ${
                favorites.includes(restaurant.id)
                  ? "bg-red-50 text-brand-red ring-1 ring-red-100"
                  : "bg-surface-hover text-muted-foreground hover:bg-surface-active"
              }`}
            >
              <Heart className={`h-4 w-4 ${favorites.includes(restaurant.id) ? "fill-current" : ""}`} />
              <span className="text-sm font-semibold">
                {favorites.includes(restaurant.id) ? "Favorited" : "Add to favorites"}
              </span>
            </button>
          </div>

          <div className="mt-8">
            <h2 className="mb-6 text-2xl font-black text-foreground">Menu Categories</h2>

            {categoryRows.length === 0 ? (
              <p className="rounded-2xl border border-border bg-surface-hover p-4 text-sm text-muted-foreground">
                This restaurant has no menu items yet.
              </p>
            ) : (
              <div className="space-y-8">
                {categoryRows.map((category, categoryIndex) => (
                  <section key={category.id}>
                    <h3 className="mb-3 text-lg font-bold text-foreground">{category.name}</h3>
                    <div className="overflow-x-auto pb-2">
                      <div className="flex min-w-max gap-4">
                        {category.items.map((item, itemIndex) => (
                          <article
                            key={item.id}
                            className="group w-52 flex-shrink-0 overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:shadow-md"
                          >
                            <div className="relative h-40 overflow-hidden">
                              <img
                                src={item.imageUrl ?? fallbackFoodImages[(categoryIndex + itemIndex) % fallbackFoodImages.length]}
                                alt={item.name}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                              {getQuantity(item.id) > 0 && (
                                <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white">
                                  {getQuantity(item.id)}
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <div className="mb-2 flex items-start justify-between gap-2">
                                <h4 className="line-clamp-2 text-sm font-bold text-foreground">{item.name}</h4>
                                <span className="text-sm font-bold text-brand-red">{formatCurrency(item.price)}</span>
                              </div>

                              {getQuantity(item.id) > 0 ? (
                                <div className="flex items-center justify-between rounded-lg bg-surface-hover p-1">
                                  <button
                                    onClick={() => updateCart(item.id, -1)}
                                    className="flex h-7 w-7 items-center justify-center rounded-md bg-white shadow-sm transition-colors hover:text-brand-red"
                                    aria-label={`Decrease ${item.name}`}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="w-6 text-center text-sm font-bold">{getQuantity(item.id)}</span>
                                  <button
                                    onClick={() => updateCart(item.id, 1)}
                                    className="flex h-7 w-7 items-center justify-center rounded-md bg-white shadow-sm transition-colors hover:text-brand-red"
                                    aria-label={`Increase ${item.name}`}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <Button className="w-full gap-2 rounded-lg text-xs" onClick={() => updateCart(item.id, 1)}>
                                  <ShoppingBag className="h-3 w-3" /> Add
                                </Button>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-black text-foreground">Reviews</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Food was fresh and arrived quickly. I loved the portions.",
                "Great taste and the order was packed very well.",
                "Reliable service and friendly rider. Will order again.",
              ].map((review, idx) => (
                <article
                  key={idx}
                  className="rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-hover p-4 transition-all hover:shadow-md"
                >
                  <div className="mb-3 flex items-center gap-1 text-warning">
                    {[...Array(5)].map((_, starIndex) => (
                      <Star key={starIndex} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mb-2 text-sm font-medium text-foreground">{review}</p>
                  <p className="text-xs text-muted-foreground">Verified Customer</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
