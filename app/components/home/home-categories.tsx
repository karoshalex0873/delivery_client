import { motion, type Variants } from "framer-motion";

type Category = {
  name: string;
  description: string;
  image: string;
};

type HomeCategoriesProps = {
  items: Category[];
  variants: Variants;
};

export function HomeCategories({ items, variants }: HomeCategoriesProps) {
  return (
    <section id="categories" className="section-container py-14">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={variants}>
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-red">Categories</p>
          <h2 className="mt-2 h2">Popular categories in Kenyan restaurants</h2>
        </div>

        <div className="relative">
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:gap-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {items.map((category) => (
              <motion.article
                key={category.name}
                whileHover={{ y: -4 }}
                className="group w-70 flex-none overflow-hidden rounded-2xl border border-border bg-surface shadow-sm sm:w-75"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-40 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-36 lg:h-44" 
                />
                <div className="space-y-1 p-4 sm:p-5">
                  <h3 className="text-base font-bold sm:text-lg">{category.name}</h3>
                  <p className="text-xs text-muted-foreground sm:text-sm line-clamp-2">{category.description}</p>
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
