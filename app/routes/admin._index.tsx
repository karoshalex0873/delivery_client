import { useEffect, useState } from "react";
import { Link } from "react-router";
import { 
  CalendarDays, 
  Loader2, 
  Star, 
  Users, 
  Utensils, 
  Bike,
  TrendingUp,
  Activity,
  ChevronRight,
  Award,
  Clock,
  Eye,
  ThumbsUp
} from "lucide-react";
import { getAdminDashboardStats, type AdminDashboardStatsRecord } from "../services/users";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const formatTodayLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  return {
    date: date.toLocaleDateString(undefined, { 
      weekday: "short", 
      month: "short", 
      day: "numeric" 
    }),
    time: date.toLocaleTimeString(undefined, { 
      hour: "2-digit", 
      minute: "2-digit" 
    })
  };
};

const StatCard = ({
  icon,
  label,
  value,
  subtitle,
  trend,
  color = "brand-red",
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  color?: string;
  onClick?: () => void;
}) => (
  <div 
    onClick={onClick}
    className={cn(
      "rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all",
      onClick && "active:scale-[0.98] cursor-pointer",
      "hover:shadow-md"
    )}
  >
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className={cn(
        "rounded-xl p-2",
        color === "brand-red" && "bg-brand-red/10 text-brand-red",
        color === "emerald" && "bg-emerald-500/10 text-emerald-600",
        color === "blue" && "bg-blue-500/10 text-blue-600",
        color === "purple" && "bg-purple-500/10 text-purple-600",
        color === "amber" && "bg-amber-500/10 text-amber-600"
      )}>
        {icon}
      </div>
      {trend !== undefined && (
        <div className={cn(
          "flex items-center gap-0.5 text-[10px] font-medium",
          trend >= 0 ? "text-emerald-600" : "text-red-600"
        )}>
          <TrendingUp className={cn("h-3 w-3", trend >= 0 ? "" : "rotate-180")} />
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
    
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      {subtitle && (
        <p className="mt-1 text-[10px] text-muted-foreground">{subtitle}</p>
      )}
    </div>
  </div>
);

const AdminIndex = () => {
  const [stats, setStats] = useState<AdminDashboardStatsRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await getAdminDashboardStats();
        if (!isMounted) return;
        setStats(data);
        setError(null);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard stats");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-brand-red/20 border-t-brand-red animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const { date, time } = formatTodayLabel(stats.dateToday);

  return (
    <div className="pb-20">
      {/* Welcome Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
        <div className="flex items-center gap-2 mt-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {date} • {time}
          </p>
        </div>
      </div>

      {/* Main Stats Grid - Optimized for mobile */}
      <div className="space-y-3 mb-5">
        {/* Row 1: Date & Rating */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<CalendarDays className="h-5 w-5" />}
            label="Today"
            value={date}
            subtitle={time}
            color="blue"
          />
          <StatCard
            icon={<Star className="h-5 w-5" />}
            label="Rating"
            value={stats.starsAverage.toFixed(1)}
            subtitle="Restaurant average"
            color="amber"
            trend={2.5}
          />
        </div>

        {/* Row 2: Restaurants & Customers */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/admin/restaurants" className="block">
            <StatCard
              icon={<Utensils className="h-5 w-5" />}
              label="Restaurants"
              value={stats.restaurantsCount.toLocaleString()}
              subtitle="Active partners"
              color="brand-red"
              trend={5}
            />
          </Link>
          <Link to="/admin/customers" className="block">
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Customers"
              value={stats.customersCount.toLocaleString()}
              subtitle="Active users"
              color="emerald"
              trend={8}
            />
          </Link>
        </div>

        {/* Row 3: Riders */}
        <div className="grid grid-cols-1 gap-3">
          <Link to="/admin/riders" className="block">
            <StatCard
              icon={<Bike className="h-5 w-5" />}
              label="Riders"
              value={stats.ridersCount.toLocaleString()}
              subtitle={`${stats.activeRidersCount} active now`}
              color="purple"
              trend={3}
            />
          </Link>
        </div>
      </div>

      {/* Platform Activity - Full width card */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-red" />
            <h2 className="text-sm font-semibold text-foreground">Platform Activity</h2>
          </div>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Active Riders</span>
            </div>
            <span className="text-xl font-bold text-foreground">{stats.activeRidersCount}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Platform Status</span>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Operational</Badge>
          </div>
        </div>
      </div>

      {/* Quick Actions - Full width buttons */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="space-y-2">
          <Link to="/admin/restaurants">
            <Button variant="outline" className="w-full justify-between py-5">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                <span>Manage Restaurants</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/admin/riders">
            <Button variant="outline" className="w-full justify-between py-5">
              <div className="flex items-center gap-2">
                <Bike className="h-4 w-4" />
                <span>Manage Riders</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/admin/customers">
            <Button variant="outline" className="w-full justify-between py-5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>View Customers</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/admin/analytics">
            <Button variant="outline" className="w-full justify-between py-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>View Analytics</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="text-center p-2">
          <p className="text-xs font-medium text-muted-foreground">Total Users</p>
          <p className="text-sm font-bold text-foreground">
            {(stats.customersCount + stats.ridersCount).toLocaleString()}
          </p>
        </div>
        <div className="text-center p-2 border-x border-border">
          <p className="text-xs font-medium text-muted-foreground">Active Now</p>
          <p className="text-sm font-bold text-foreground">{stats.activeRidersCount}</p>
        </div>
        <div className="text-center p-2">
          <p className="text-xs font-medium text-muted-foreground">Avg Rating</p>
          <p className="text-sm font-bold text-foreground">{stats.starsAverage.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminIndex;