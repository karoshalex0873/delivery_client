import { useEffect, useState } from "react";
import { 
  AlertCircle, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Shield, 
  User,
  ArrowLeft,
  Calendar,
  Building2,
  Save
} from "lucide-react";
import { Link } from "react-router";
import { getCurrentUser, updateCurrentUser, type CurrentUserRecord } from "~/services/auth";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

const AdminProfilePage = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const me = await getCurrentUser();
        if (!isMounted) return;
        setCurrentUser(me);
        setForm({
          firstName: me.firstName ?? "",
          lastName: me.lastName ?? "",
          email: me.email ?? "",
          phoneNumber: me.phoneNumber ?? "",
        });
        setError(null);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load profile");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("First name, last name and email are required.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const updated = await updateCurrentUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim() || undefined,
      });
      setCurrentUser(updated);
      setForm({
        firstName: updated.firstName ?? "",
        lastName: updated.lastName ?? "",
        email: updated.email ?? "",
        phoneNumber: updated.phoneNumber ?? "",
      });
      setStatus("Profile updated successfully.");
      setTimeout(() => setStatus(null), 3000);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update profile");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = () => {
    const first = form.firstName?.charAt(0) ?? "";
    const last = form.lastName?.charAt(0) ?? "";
    return `${first}${last}`.toUpperCase() || "AD";
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-red/20 border-t-brand-red" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !currentUser) {
    return (
      <div className="rounded-xl border border-error/20 bg-error/10 p-4 text-sm text-error">
        {error}
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 -mx-4 -mt-2 mb-4 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-1 -ml-1">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Profile</h1>
            <p className="text-xs text-muted-foreground">Manage your administrator account</p>
          </div>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="mb-4 rounded-2xl border border-border bg-gradient-to-br from-surface to-surface/80 p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-red to-brand-red/70 text-3xl font-bold text-white shadow-lg">
              {getInitials()}
            </div>
            <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1">
              <div className="h-3 w-3 rounded-full bg-white" />
            </div>
          </div>
          <h2 className="mt-3 text-xl font-bold text-foreground">
            {form.firstName || form.lastName ? `${form.firstName} ${form.lastName}` : "Administrator"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{form.email}</p>
          <Badge className="mt-2 gap-1 bg-brand-red/10 text-brand-red border-brand-red/20">
            <Shield className="h-3 w-3" />
            Administrator
          </Badge>
        </div>
      </div>

      {/* Status Messages */}
      {status && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{status}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-error/10 p-3 text-sm text-error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Account Information Form */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
          <User className="h-5 w-5 text-brand-red" />
          <h2 className="text-base font-semibold text-foreground">Account Information</h2>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="h-4 w-4 text-brand-red" />
                First Name
              </label>
              <input
                value={form.firstName}
                onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                placeholder="First name"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="h-4 w-4 text-brand-red" />
                Last Name
              </label>
              <input
                value={form.lastName}
                onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
              <Mail className="h-4 w-4 text-brand-red" />
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
              placeholder="admin@example.com"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              This email is used for login and notifications
            </p>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
              <Phone className="h-4 w-4 text-brand-red" />
              Phone Number
            </label>
            <input
              value={form.phoneNumber}
              onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
              placeholder="+254700000000"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Optional. Used for contact purposes
            </p>
          </div>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-red-hover disabled:opacity-60 active:scale-[0.98]"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Account Details Card */}
      <div className="mt-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
          <Shield className="h-5 w-5 text-brand-red" />
          <h2 className="text-base font-semibold text-foreground">Account Details</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red/10">
              <Building2 className="h-4 w-4 text-brand-red" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Role
              </p>
              <p className="text-sm text-foreground mt-0.5">Administrator</p>
              <p className="text-xs text-muted-foreground mt-0.5">Full access to platform management</p>
            </div>
          </div>

          {currentUser && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red/10">
                <Calendar className="h-4 w-4 text-brand-red" />
              </div>
            </div>
          )}

          {currentUser?.authProvider && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red/10">
                <Shield className="h-4 w-4 text-brand-red" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Authentication
                </p>
                <Badge className="mt-1 text-[10px] bg-brand-red/10 text-brand-red border-brand-red/20">
                  {currentUser.authProvider === "google" ? "Google Account" : "Email & Password"}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;