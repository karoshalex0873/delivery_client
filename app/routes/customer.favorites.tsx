import { useMemo } from "react";
import { useOutletContext, Link } from "react-router";
import { type CustomerContextData } from "./customer";
import { Heart, Star, Clock3, MapPin, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const fallbackRestaurantImages = [
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
];

const getMockRating = (seed: string) => 4.2 + ((seed.length % 8) / 10);
const getMockDeliveryTime = (seed: string) => 20 + (seed.length % 18);

export default function Favorites() {
  const { restaurants, favorites, toggleFavorite } = useOutletContext<CustomerContextData>();

  const favoriteList = useMemo(
    () => restaurants.filter((r) => favorites.includes(r.id)),
    [restaurants, favorites]
  );

  if (favoriteList.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-red/5 p-4 text-brand-red">
            <Heart className="h-10 w-10 fill-current opacity-20" />
        </div>
        <h2 className="text-xl font-bold text-foreground">No favorites yet</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          Start exploring restaurants and save your top choices here for quick access.
        </p>
        <Link to="/customer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-red px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95">
          Browse Restaurants <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">Your Favorites</h1>
        <span className="rounded-full bg-surface-hover px-3 py-1 text-xs font-bold text-muted-foreground">{favoriteList.length} Saved</span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {favoriteList.map((restaurant, index) => (
          <motion.div
            key={restaurant.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
          >
            <Link to={`/customer/restaurant/${restaurant.id}`} className="block h-48 w-full overflow-hidden">
                <img 
                    src={restaurant.imageUrl ?? fallbackRestaurantImages[index % fallbackRestaurantImages.length]} 
                    alt={restaurant.name} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            </Link>
            
            <button
                onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(restaurant.id);
                }}
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-brand-red shadow-sm backdrop-blur-sm transition-transform hover:scale-110 active:scale-90"
            >
                <Heart className="h-5 w-5 fill-current" />
            </button>

            <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-surface/95 backdrop-blur-md p-4 shadow-lg border border-white/20">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-bold text-foreground line-clamp-1">{restaurant.name}</h3>
                        <div className="mt-1 flex items-center gap-3 text-xs font-medium text-muted-foreground">
                            <span className="flex items-center gap-1 text-warning-dark">
                                <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {getMockRating(restaurant.id).toFixed(1)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock3 className="h-3.5 w-3.5" /> {getMockDeliveryTime(restaurant.id)} min
                            </span>
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
