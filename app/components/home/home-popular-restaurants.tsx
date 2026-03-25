import { motion, type Variants } from "framer-motion";
import { MapPin, Star } from "lucide-react";

type Restaurant = {
  name: string;
  bestDish: string;
  rating: number;
  eta: string;
  image: string;
};

type HomePopularRestaurantsProps = {
  items: Restaurant[];
  variants: Variants;
};

export function HomePopularRestaurants({ items, variants }: HomePopularRestaurantsProps) {
  return (
    <section id="restaurants" className="section-container py-14">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={variants}>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-red">Popular restaurants</p>
        <h2 className="mt-2 h2">Top picks and their best dishes</h2>

        <div className="relative mt-8">
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:gap-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {items.map((restaurant) => (
              <motion.article
                key={restaurant.name}
                whileHover={{ y: -5 }}
                className="w-70 flex-none overflow-hidden rounded-2xl border border-border bg-surface shadow-sm sm:w-75"
              >
                <img src={restaurant.image} alt={restaurant.name} className="h-40 w-full object-cover sm:h-44 lg:h-48" />
                <div className="space-y-2 p-4">
                  <h3 className="text-lg font-bold">{restaurant.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">Best dish: {restaurant.bestDish}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                      <Star className="h-4 w-4 fill-warning text-warning" /> {restaurant.rating}
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {restaurant.eta}
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
          {/* Fade effect to indicate scrolling */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-linear-to-l from-background to-transparent lg:hidden" />
        </div>
      </motion.div>
    </section>
  );
}
