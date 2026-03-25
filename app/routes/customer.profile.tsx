import { useEffect, useMemo, useState } from "react";
import { useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router";
import { Save, User } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  getCurrentUser,
  logout as logoutUser,
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
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-red/10 text-xl font-bold text-brand-red">
      {fallback}
    </div>
  );
}

const buildAvatarFallback = (user: ProfileForm) => {
  const first = user.firstName?.charAt(0) ?? "";
  const last = user.lastName?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase() || "CU";
};

export default function CustomerProfile() {
  const { signOut } = useClerk();
  const navigate = useNavigate();
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
        if (!mounted) {
          return;
        }
        setCurrentUser(me);
        setForm({
          firstName: me.firstName ?? "",
          lastName: me.lastName ?? "",
          email: me.email ?? "",
          phoneNumber: me.phoneNumber ?? "",
        });
        setError(null);
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load profile");
      } finally {
        if (mounted) {
          setLoading(false);
        }
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
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    try {
      await signOut();
    } catch {
      // Ignore if Clerk session does not exist.
    }
    navigate("/auth/signin", { replace: true });
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading profile...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <UserAvatar fallback={avatarFallback} />
          <div>
            <h1 className="text-xl font-bold text-foreground">My Profile</h1>
            <p className="text-sm text-muted-foreground">
              {currentUser?.authProvider === "google" ? "Google account linked" : "Email and password account"}
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
          <User className="h-4 w-4 text-brand-red" />
          Account Information
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-foreground">First Name</label>
            <input
              value={form.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              className="input-field"
              placeholder="First name"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Last Name</label>
            <input
              value={form.lastName}
              onChange={(event) => updateField("lastName", event.target.value)}
              className="input-field"
              placeholder="Last name"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Phone Number</label>
            <input
              value={form.phoneNumber}
              onChange={(event) => updateField("phoneNumber", event.target.value)}
              className="input-field"
              placeholder="+2547XXXXXXXX"
            />
            <p className="mt-1 text-xs text-muted-foreground">Use format: +254XXXXXXXXX</p>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {success ? <p className="mt-4 text-sm text-green-600">{success}</p> : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => void handleSave()} disabled={saving} className="sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="destructive" onClick={() => void handleLogout()} className="sm:w-auto">
            Sign Out
          </Button>
        </div>
      </section>
    </div>
  );
}

