import { motion, type Variants } from "framer-motion";
import { Star } from "lucide-react";

type Testimonial = {
  name: string;
  role: string;
  text: string;
};

type HomeSocialProofProps = {
  testimonials: Testimonial[];
  partners: string[];
  variants: Variants;
};

export function HomeSocialProof({ testimonials, partners, variants }: HomeSocialProofProps) {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={variants}>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#E53935]">Testimonials</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">What customers are saying</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="rounded-2xl border border-[#F1DFCF] bg-white p-6 shadow-sm">
                <div className="mb-4 flex text-[#FFA726]">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
                <p className="text-sm leading-6 text-[#665A52]">"{testimonial.text}"</p>
                <p className="mt-4 font-bold">{testimonial.name}</p>
                <p className="text-sm text-[#8A7E75]">{testimonial.role}</p>
              </article>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={variants}>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#E53935]">Partners</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Trusted by leading food brands</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {partners.map((partner) => (
              <div
                key={partner}
                className="flex h-16 items-center justify-center rounded-xl border border-[#F1DFCF] bg-white px-3 text-sm font-semibold text-[#5B4F47] shadow-sm"
              >
                {partner}
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </>
  );
}
