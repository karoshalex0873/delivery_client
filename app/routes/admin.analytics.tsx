import { useEffect, useState } from "react";
import { Activity, CreditCard, TrendingUp, Users } from "lucide-react";
import { getAdminDashboardStats, type AdminDashboardStatsRecord } from "~/services/users";
import { Badge } from "~/components/ui/badge";

const AdminAnalytics = () => {
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
        setError(loadError instanceof Error ? loadError.message : "Failed to load analytics");
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-red/20 border-t-brand-red" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-error/20 bg-error/10 p-4 text-sm text-error">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const trackedUsers = stats.customersCount + stats.ridersCount;
  const activeRidersRate = stats.ridersCount > 0 ? Math.round((stats.activeRidersCount / stats.ridersCount) * 100) : 0;

  return (
    <div className="pb-20 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">System Analytics</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Three categories for now: Finance, System Logs, and New User Rate.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-brand-red" />
            <h2 className="text-sm font-semibold text-foreground">Finance</h2>
          </div>
          <Badge className="bg-blue-100 text-blue-700">Pending Module</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Payment transactions will appear here after the payment analytics module is connected.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Transactions Today</p>
            <p className="mt-1 text-lg font-semibold text-foreground">--</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payments Volume</p>
            <p className="mt-1 text-lg font-semibold text-foreground">--</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-red" />
            <h2 className="text-sm font-semibold text-foreground">System Logs</h2>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700">Live Ready</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Log stream endpoint is not connected yet. This section is ready for API integration.
        </p>
        <div className="mt-3 rounded-xl border border-border bg-background p-3 text-sm text-foreground">
          No logs loaded.
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-red" />
            <h2 className="text-sm font-semibold text-foreground">Rate of New Users</h2>
          </div>
          <Badge className="bg-amber-100 text-amber-700">Baseline</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Historical sign-up timeline is not available yet. Showing current user baseline.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tracked Users</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{trackedUsers.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Riders Rate</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{activeRidersRate}%</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          New-user growth percentage will be shown here once timeline data is added.
        </div>
      </section>
    </div>
  );
};

export default AdminAnalytics;
