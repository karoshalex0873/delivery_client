import { useEffect, useMemo, useState } from "react";
import { Save, User, Mail, Phone, Shield, AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import {
  getCurrentUser,
  updateCurrentUser,
  type CurrentUserRecord,
} from "~/services/auth";

type ProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

function UserAvatar({ fallback }: { fallback: string }) {
  return (
    <div className="relative">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-red to-brand-red/70 text-2xl font-bold text-white shadow-lg">
        {fallback}
      </div>
      <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1">
        <div className="h-2 w-2 rounded-full bg-white" />
      </div>
    </div>
  );
}

const buildAvatarFallback = (user: ProfileForm) => {
  const first = user.firstName?.charAt(0) ?? "";
  const last = user.lastName?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase() || "RD";
};

export default function RiderProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserRecord | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const me = await getCurrentUser();
        if (!mounted) return;
        setCurrentUser(me);
        setForm({
          firstName: me.firstName ?? "",
          lastName: me.lastName ?? "",
          email: me.email ?? "",
          phoneNumber: me.phoneNumber ?? "",
        });
        setError(null);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const avatarFallback = useMemo(() => buildAvatarFallback(form), [form]);

  const updateField = (key: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
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
      setSuccess("Profile updated successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update profile");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-brand-red/20 border-t-brand-red animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">     {/* Profile Header */}
      <div className="rounded-2xl border border-border bg-linear-to-br from-surface to-surface/80 p-6 shadow-sm mb-4">
        <div className="flex flex-col items-center text-center">
          <UserAvatar fallback={avatarFallback} />
          <h2 className="mt-3 text-xl font-bold text-foreground">
            {form.firstName || form.lastName ? `${form.firstName} ${form.lastName}` : "Rider"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{form.email}</p>
          <Badge 
            variant="outline" 
            className={cn(
              "mt-2 gap-1",
              currentUser?.authProvider === "google" 
                ? "border-blue-200 bg-blue-50 text-blue-700" 
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            )}
          >
            <Shield className="h-3 w-3" />
            {currentUser?.authProvider === "google" ? "Google Account" : "Email Account"}
          </Badge>
        </div>
      </div>

      {/* Account Information Form */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
          <User className="h-5 w-5 text-brand-red" />
          <h2 className="text-base font-semibold text-foreground">Account Information</h2>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                First Name
              </label>
              <input
                value={form.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red/20 transition-all"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Last Name
              </label>
              <input
                value={form.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red/20 transition-all"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red/20 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Phone Number
            </label>
            <input
              value={form.phoneNumber}
              onChange={(event) => updateField("phoneNumber", event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red/20 transition-all"
              placeholder="+2547XXXXXXXX"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Used for delivery coordination and customer contact
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
            <Save className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="mt-5">
          <Button 
            onClick={() => void handleSave()} 
            disabled={saving}
            className="w-full sm:w-auto bg-brand-red hover:bg-brand-red/90 text-white"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}