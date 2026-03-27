import { motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bike,
  Search,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import { Link } from "react-router";
import { getPublicHomeFeed, type HomeCategoryRecord, type HomePopularRestaurantRecord, type HomeTopDishRecord } from "~/services/restaurant";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaXTwitter,
} from "react-icons/fa6";
import { HomeNav } from "./home-nav";
import { HomeHero } from "./home-hero";
import { HomeCategories } from "./home-categories";
import { HomeTopDishes } from "./home-top-dishes";
import { HomePopularRestaurants } from "./home-popular-restaurants";
import { HomeSocialProof } from "./home-social-proof";

const fallbackCategories: HomeCategoryRecord[] = [
  {
    name: "Nyama Choma",
    description: "Grilled favourites from top local grills",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Pilau and Swahili",
    description: "Coastal rice bowls, biriani and rich stews",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Burgers and Fries",
    description: "Fast comfort meals made for quick delivery",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Healthy Bowls",
    description: "Fresh greens, proteins and balanced meals",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Chapati and Stew",
    description: "Everyday Kenyan classics for family meals",
    image:
      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Pizza and Pasta",
    description: "Stone-baked pizzas and creamy pasta plates",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
  },
];

const testimonials = [
  {
    name: "Wanjiku M.",
    role: "Nairobi",
    text: "I can order after work and get dinner before I settle in. Tracking is clear and delivery is always quick.",
  },
  {
    name: "Brian O.",
    role: "Westlands",
    text: "The rider updates are real-time and very accurate. I now use it almost every lunch break.",
  },
  {
    name: "Aisha K.",
    role: "Mombasa",
    text: "Best mix of healthy meals and local favourites. Smooth checkout and reliable delivery.",
  },
];

const partners = [
  "Java House",
  "KFC Kenya",
  "Artcaffe",
  "CJ's",
  "Big Square",
  "Mama Oliech",
  "Chicken Inn",
  "Pizza Inn",
];

const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Home() {
  const [topDishes, setTopDishes] = useState<HomeTopDishRecord[]>([]);
  const [restaurants, setRestaurants] = useState<HomePopularRestaurantRecord[]>([]);

  useEffect(() => {
    let isMounted = true;

    void getPublicHomeFeed()
      .then((feed) => {
        if (!isMounted) {
          return;
        }
        setTopDishes(feed.topDishes);
        setRestaurants(feed.popularRestaurants);
      })
      .catch(() => {
        // Keep sections empty if backend feed is unavailable.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HomeNav />
      <HomeHero variants={sectionReveal} />
      <HomeCategories items={fallbackCategories} variants={sectionReveal} />
      <HomeTopDishes items={topDishes} variants={sectionReveal} />

      <section className="section-container py-14">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionReveal}
          className="overflow-hidden rounded-3xl bg-brand-red p-8 text-white shadow-xl shadow-brand-red/25 lg:flex lg:items-center lg:justify-between"
        >
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex rounded-full bg-warning px-3 py-1 text-xs font-bold text-foreground">Special Offer</span>
            <h2 className="text-3xl font-bold sm:text-4xl">First order deal: free delivery plus 15% off</h2>
            <p className="text-white/90">
              Use code <span className="rounded bg-white/20 px-2 py-1 font-mono font-bold">FIRSTBITE</span> to unlock your welcome offer.
              Valid on selected restaurants in Nairobi, Mombasa, Kisumu and Nakuru.
            </p>
          </div>
          <Link to="/auth/signup" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-red transition hover:bg-surface-hover lg:mt-0">
            Claim Offer <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      <HomePopularRestaurants items={restaurants} variants={sectionReveal} />

      <section id="how-it-works" className="section-container py-14">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={sectionReveal}>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-red">How it works</p>
          <h2 className="mt-2 h2">From craving to doorstep in 4 clear steps</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            {[
              { title: "Choose your meal", text: "Browse dishes by category, restaurant, or delivery speed.", icon: Search },
              { title: "Confirm your order", text: "Secure checkout and instant order confirmation.", icon: Utensils },
              { title: "Rider picks up", text: "Closest available rider gets assigned and starts delivery.", icon: Bike },
              { title: "Track to your door", text: "Follow live updates and receive your food on time.", icon: ShieldCheck },
            ].map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
                  <step.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-red">Step {index + 1}</p>
                <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-subtle">{step.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <HomeSocialProof testimonials={testimonials} partners={partners} variants={sectionReveal} />

      <section className="section-container py-14">
        <div className="rounded-3xl border border-border bg-surface p-10 text-center shadow-sm">
          <h2 className="text-4xl font-extrabold sm:text-5xl">Hungry? Let us fix that fast.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-subtle sm:text-lg">
            Order now and get reliable delivery updates from checkout to doorstep.
          </p>
          <Link
            to="/auth/signup"
            className="mt-8 btn-primary"
          >
            Start Ordering <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div className="space-y-3">
            <p className="text-xl font-bold text-brand-red">QuickBite</p>
            <p className="text-subtle">Fast food delivery platform connecting customers, restaurants, and riders across Kenya.</p>
          </div>
          <div>
            <p className="mb-3 font-bold">Company</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-brand-red">About</a></li>
              <li><a href="#" className="hover:text-brand-red">Careers</a></li>
              <li><a href="#" className="hover:text-brand-red">Contact</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-bold">Support</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-brand-red">Help Center</a></li>
              <li><a href="#" className="hover:text-brand-red">Terms</a></li>
              <li><a href="#" className="hover:text-brand-red">Privacy</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-bold">Follow us</p>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="Facebook" className="rounded-full border border-border bg-background p-2.5 text-muted-foreground transition hover:bg-brand-red hover:text-white"><FaFacebookF size={16} /></a>
              <a href="#" aria-label="Instagram" className="rounded-full border border-border bg-background p-2.5 text-muted-foreground transition hover:bg-brand-red hover:text-white"><FaInstagram size={16} /></a>
              <a href="#" aria-label="X" className="rounded-full border border-border bg-background p-2.5 text-muted-foreground transition hover:bg-brand-red hover:text-white"><FaXTwitter size={16} /></a>
              <a href="#" aria-label="TikTok" className="rounded-full border border-border bg-background p-2.5 text-muted-foreground transition hover:bg-brand-red hover:text-white"><FaTiktok size={16} /></a>
              <a href="#" aria-label="LinkedIn" className="rounded-full border border-border bg-background p-2.5 text-muted-foreground transition hover:bg-brand-red hover:text-white"><FaLinkedinIn size={16} /></a>
            </div>
          </div>
        </div>
        <div className="border-t border-border px-4 py-5 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} QuickBite Technologies Ltd. All rights reserved.
        </div>
      </footer>
    </div>
  );
}


