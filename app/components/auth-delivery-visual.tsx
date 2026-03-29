import { motion } from "framer-motion";

type AuthDeliveryVisualProps = {
  title: string;
  subtitle: string;
};

export function AuthDeliveryVisual({ title, subtitle }: AuthDeliveryVisualProps) {
  return (
    <div className="relative hidden items-center justify-center overflow-hidden bg-background p-12 lg:flex">
      <div className="absolute right-0 top-0 h-125 w-125 -translate-y-1/3 translate-x-1/3 rounded-full bg-brand-red/10 blur-[100px]" />
      <div className="absolute bottom-0 left-0 h-125 w-125 -translate-x-1/3 translate-y-1/3 rounded-full bg-warning/15 blur-[100px]" />

      <div className="relative z-10 w-full max-w-xl rounded-[2rem] border border-border/70 bg-surface/90 p-8 shadow-2xl shadow-brand-red/10 backdrop-blur">
        <div className="space-y-3 text-center">
          <h2 className="h2">{title}</h2>
          <p className="text-subtle">{subtitle}</p>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-background/60 p-6">
          <div className="relative h-56">
            <motion.div
              className="absolute inset-0"
              animate={{ x: [0, 16, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg viewBox="0 0 460 220" className="h-full w-full" role="img" aria-label="Animated delivery bicycle">
                <path d="M12 180 H448" stroke="#d8c3b2" strokeWidth="6" strokeLinecap="round" />

                <motion.g
                  animate={{ x: [0, 80, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.g
                    style={{ transformOrigin: "150px 160px" }}
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <circle cx="150" cy="160" r="33" fill="none" stroke="#2e2e2e" strokeWidth="6" />
                    <circle cx="150" cy="160" r="5" fill="#2e2e2e" />
                  </motion.g>

                  <motion.g
                    style={{ transformOrigin: "260px 160px" }}
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <circle cx="260" cy="160" r="33" fill="none" stroke="#2e2e2e" strokeWidth="6" />
                    <circle cx="260" cy="160" r="5" fill="#2e2e2e" />
                  </motion.g>

                  <path d="M150 160 L200 125 L230 160 L180 160 Z" fill="none" stroke="#e53935" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M200 125 L250 125 L260 160" fill="none" stroke="#e53935" strokeWidth="6" strokeLinecap="round" />
                  <path d="M230 160 L242 112" fill="none" stroke="#e53935" strokeWidth="6" strokeLinecap="round" />
                  <path d="M192 116 L230 102" fill="none" stroke="#2e2e2e" strokeWidth="6" strokeLinecap="round" />

                  <circle cx="216" cy="82" r="13" fill="#ffcc99" />
                  <path d="M205 98 L228 98 L242 125 L216 132 Z" fill="#43a047" />
                  <path d="M226 92 L242 76 L252 90 L236 104 Z" fill="#2e2e2e" />

                  <rect x="254" y="86" width="52" height="36" rx="8" fill="#fb8c00" stroke="#c56b00" strokeWidth="3" />
                  <path d="M264 98 H296 M264 109 H286" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
                </motion.g>

                <motion.g
                  animate={{ x: [0, 460] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                >
                  <rect x="-40" y="174" width="24" height="4" rx="2" fill="#c7aea1" />
                </motion.g>
                <motion.g
                  animate={{ x: [0, 460] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "linear", delay: 0.6 }}
                >
                  <rect x="-40" y="174" width="24" height="4" rx="2" fill="#c7aea1" />
                </motion.g>
                <motion.g
                  animate={{ x: [0, 460] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "linear", delay: 1.2 }}
                >
                  <rect x="-40" y="174" width="24" height="4" rx="2" fill="#c7aea1" />
                </motion.g>
              </svg>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
