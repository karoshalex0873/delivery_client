import { useClerk } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router";
import { LogOut, ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { logout as logoutUser } from "~/services/auth";
import RiderProfilePage from "./rider.profile";

export default function RiderSettingsPage() {
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    try {
      await signOut();
    } catch {
      // Ignore if Clerk session does not exist.
    }
    navigate("/auth/signin", { replace: true });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 -mt-2 -mx-4 px-4 py-3 mb-4">
        <div className="flex items-center gap-3">
          <Link to="/rider" className="p-1 -ml-1">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
            <LogOut className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Sign Out</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sign out from your rider account on this device
            </p>
            <Button
              variant="destructive"
              onClick={() => void handleLogout()}
              className="mt-3 w-full sm:w-auto"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <RiderProfilePage />
    </div>
  );
}
