import { motion, type Variants } from "framer-motion";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { Link } from "react-router";

type HomeHeroProps = {
  variants: Variants;
};

export function HomeHero({ variants }: HomeHeroProps) {
  return (
    <section className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-6 overflow-hidden px-4 pb-8 pt-2 sm:min-h-[70vh] sm:px-6 md:gap-10 md:pt-24 lg:grid lg:min-h-[85vh] lg:grid-cols-2 lg:items-center lg:gap-14 lg:px-8 lg:pb-12 lg:pt-0">

      {/* Text Content - Order 1 on mobile to ensure it's seen first */}
      <motion.div
        variants={variants}
        initial="hidden"
        animate="visible"
        className="order-1 flex w-full flex-col justify-center space-y-4 text-center sm:space-y-5 lg:order-1 lg:text-left"
      >
        <div className="flex justify-center lg:justify-start">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-red backdrop-blur-sm sm:px-4 sm:py-1.5 sm:text-xs">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Food Delivery App
          </span>
        </div>

        <h1 className="h1">
          Delicious food, <br className="hidden sm:block" />
          <span className="text-brand-red">delivered fast.</span>
        </h1>

        <p className="mx-auto max-w-md text-subtle leading-relaxed md:max-w-xl lg:mx-0">
          Order from your favorite restaurants in minutes. Track your food in real-time and enjoy reliable delivery to your doorstep.
        </p>

        {/* Search Bar - refined for mobile */}
        <div className="relative mx-auto w-full max-w-md pt-2 lg:mx-0">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute right-4 h-4 w-4 text-muted-foreground/70 sm:h-5 sm:w-5" />
            <input
              type="text"
              placeholder="Search dishes or restaurants..."
              className="input-field pl-10 border-brand-red/10 focus:border-brand-red focus:ring-brand-red/10 sm:pl-12"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center lg:justify-start">
          <Link
            to="/auth/signin"
            className="btn-primary w-full sm:w-auto sm:text-base py-1.5 px-2 sm:px-4"
          >
            Get Started
          </Link>
          <a
            href="#dishes"
            className="btn-outline w-full sm:w-auto sm:text-base py-1.5 px-2 sm:px-4 group flex items-center justify-center"
          >
            Explore Menu <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </motion.div>

      {/* Image Content - Order 2 on mobile, smaller size */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="order-2 mx-auto flex w-full max-w-56 items-center justify-center sm:max-w-60 lg:order-2 lg:max-w-70"
      >
        <div className="relative aspect-10/19 w-full">
          {/* Decorative blurry background */}
          <div className="absolute left-1/2 top-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-tr from-brand-red/20 to-warning/20 blur-3xl" />

          {/* Phone Mockup Container */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative aspect-10/19 w-full overflow-hidden rounded-4xl bg-[#1F1F1F] shadow-2xl ring-4 ring-[#2D2D2D] sm:rounded-[2.5rem] sm:ring-8"
          >
            {/* Notch */}
            <div className="absolute left-1/2 top-0 z-20 h-4 w-24 -translate-x-1/2 rounded-b-xl bg-[#2D2D2D] sm:h-6 sm:w-32 sm:rounded-b-2xl" />

            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
              alt="App Screen"
              className="h-full w-full object-cover opacity-90"
            />
            {/* Gloss reflection */}
            <div className="absolute right-0 top-0 h-full w-1/2 bg-linear-to-l from-white/5 to-transparent pointer-events-none" />
          </motion.div>

          {/* Floating Badge 1 - Rating */}
          <motion.div
            animate={{ x: [0, 5, 0], y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -right-2 bottom-12 rounded-xl bg-surface/95 p-2 shadow-xl backdrop-blur-sm sm:-right-12 sm:bottom-32 sm:rounded-2xl sm:p-4"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success sm:h-10 sm:w-10">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider sm:text-[10px]">Rating</p>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-foreground sm:text-lg">4.9</span>
                  <div className="flex text-warning text-[10px] sm:text-xs">★★★★★</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating Badge 2 - Live Tracking */}
          <motion.div
            animate={{ x: [0, -5, 0], y: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -left-2 top-8 rounded-xl bg-surface/95 p-2 shadow-xl backdrop-blur-sm sm:-left-12 sm:top-24 sm:rounded-2xl sm:p-4"
          >
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-red sm:h-3 sm:w-3"></span>
              </span>
              <span className="text-[10px] font-bold text-foreground sm:text-xs">Live Tracking</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
