import { motion, type Variants } from "framer-motion";
import { Clock3 } from "lucide-react";

type TopDish = {
  name: string;
  restaurant: string;
  price: string;
  eta: string;
  image: string;
};

type HomeTopDishesProps = {
  items: TopDish[];
  variants: Variants;
};

export function HomeTopDishes({ items, variants }: HomeTopDishesProps) {
  return (
    <section id="dishes" className="section-container py-14">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={variants}>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-red">Top dishes</p>
        <h2 className="mt-2 h2">Most ordered meals this week</h2>

        <div className="relative mt-8">
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:gap-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {items.map((dish) => (
              <motion.article
                key={dish.name}
                whileHover={{ y: -5 }}
                className="w-70 flex-none overflow-hidden rounded-2xl border border-border bg-surface shadow-sm sm:w-75"
              >
                <img src={dish.image} alt={dish.name} className="h-40 w-full object-cover sm:h-36 lg:h-40" />
                <div className="space-y-2 p-4">
                  <h3 className="font-bold truncate">{dish.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{dish.restaurant}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-brand-red">{dish.price}</span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Clock3 className="h-4 w-4" /> {dish.eta}
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
