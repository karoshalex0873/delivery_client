// The following files were successfully edited:
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { Check, Clock, Utensils, Bike, MapPin, PackageCheck } from "lucide-react";

interface OrderTimelineProps {
  stage: number; // 1 to 5
  logs: string[];
  className?: string;
}

const steps = [
  { id: 1, label: "Placed", icon: Clock },
  { id: 2, label: "Preparing", icon: Utensils },
  { id: 3, label: "Ready", icon: PackageCheck },
  { id: 4, label: "On Way", icon: Bike },
  { id: 5, label: "Delivered", icon: MapPin },
];

export function OrderTimeline({ stage, logs, className }: OrderTimelineProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {/* Horizontal Progress Bar (Desktop) */}
      <div className="relative hidden md:flex justify-between items-center w-full px-4">
        {/* Background Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-border -z-10" />
        
        {/* Active Line */}
        <motion.div 
          className="absolute top-1/2 left-0 h-1 bg-brand-red -z-10"
          initial={{ width: 0 }}
          animate={{ width: `${((stage - 1) / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {steps.map((step) => {
          const isActive = step.id <= stage;
          const isCompleted = step.id < stage;
          const isCurrent = step.id === stage;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.2 : 1,
                  backgroundColor: isActive ? "var(--color-brand-red)" : "var(--color-surface)",
                  borderColor: isActive ? "var(--color-brand-red)" : "var(--color-border)",
                }}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  isActive ? "bg-brand-red border-brand-red text-white" : "bg-surface border-border text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
              </motion.div>
              <span className={cn(
                "text-xs font-medium",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Logs / Vertical View (Mobile Fallback often uses vertical) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Order History</h3>
        <div className="space-y-4 border-l-2 border-border ml-2 pl-6 relative">
          {logs.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-border" />
              <p className="text-sm text-muted-foreground">{log}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
