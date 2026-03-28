import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { 
  ChevronRight, 
  Shield, 
  Users, 
  User, 
  Mail, 
  Phone, 
  Key,
  X,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2
} from "lucide-react";
import {
  adminCreateUser,
  adminDeleteUser,
  adminUpdateUser,
  getUsers,
  type AdminCreateUserPayload,
  type UserRecord,
} from "../services/users";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

const roleIdOptions = [
  { id: 1, label: "Customer", color: "bg-emerald-100 text-emerald-700" },
  { id: 2, label: "Rider", color: "bg-blue-100 text-blue-700" },
  { id: 3, label: "Restaurant", color: "bg-purple-100 text-purple-700" },
  { id: 4, label: "Admin", color: "bg-brand-red/10 text-brand-red" },
];

const AdminSettingsPage = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [roleId, setRoleId] = useState(1);
  const [password, setPassword] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getUsers();
        if (!isMounted) return;
        setUsers(data);
        setError(null);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load users");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
    [users],
  );

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhoneNumber("");
    setRoleId(1);
    setPassword("");
    setEditingId(null);
    setError(null);
    setStatus(null);
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("First name, last name and email are required");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSaving(true);
    setError(null);
    setStatus(null);
    
    try {
      if (editingId) {
        const updated = await adminUpdateUser(editingId, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
          roleId,
        });
        setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setStatus("User updated successfully.");
        setTimeout(() => setStatus(null), 3000);
      } else {
        const payload: AdminCreateUserPayload = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
          roleId,
          password: password.trim() || undefined,
        };
        const created = await adminCreateUser(payload);
        setUsers((current) => [created, ...current]);
        setStatus("User created successfully.");
        setTimeout(() => setStatus(null), 3000);
      }
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save user");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: UserRecord) => {
    setEditingId(user.id);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email ?? "");
    setPhoneNumber(user.phoneNumber ?? "");
    setRoleId(user.roleId);
    setPassword("");
    setStatus(null);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this user? This action cannot be undone.");
    if (!confirmed) return;
    
    setDeletingId(id);
    setError(null);
    setStatus(null);
    
    try {
      await adminDeleteUser(id);
      setUsers((current) => current.filter((item) => item.id !== id));
      if (editingId === id) resetForm();
      setStatus("User deleted successfully.");
      setTimeout(() => setStatus(null), 3000);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete user");
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadge = (roleId: number) => {
    const role = roleIdOptions.find(r => r.id === roleId);
    if (!role) return null;
    return (
      <Badge className={cn("text-[10px]", role.color)}>
        {role.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-red/20 border-t-brand-red" />
          <p className="text-sm text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Navigation Cards */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Link
          to="/admin/profile"
          className="group rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/10">
                <Shield className="h-5 w-5 text-brand-red" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Profile</p>
                <p className="text-xs text-muted-foreground">Manage your admin profile</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-brand-red" />
          </div>
        </Link>
        
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/10">
                <Users className="h-5 w-5 text-brand-red" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">User Management</p>
                <p className="text-xs text-muted-foreground">Create and manage users</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit User Form */}
      <div className="mb-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-3">
          <h2 className="text-sm font-semibold text-foreground">
            {editingId ? "Edit User" : "Create New User"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
            placeholder="First name"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
            placeholder="Last name"
          />
          <div className="sm:col-span-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
              placeholder="Email address"
              type="email"
            />
          </div>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
            placeholder="Phone number (optional)"
          />
          <select
            value={roleId}
            onChange={(e) => setRoleId(Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
          >
            {roleIdOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          {!editingId && (
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
              placeholder="Password (optional)"
              type="password"
            />
          )}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving}
            className="rounded-xl bg-brand-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-red-hover disabled:opacity-60"
          >
            {saving ? "Saving..." : editingId ? "Update User" : "Create User"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
            >
              Cancel
            </button>
          )}
        </div>

        {status && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{status}</span>
          </div>
        )}
        
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-error/10 p-3 text-sm text-error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">All Users</h2>
          <Badge variant="outline" className="text-xs">
            {sortedUsers.length} total
          </Badge>
        </div>

        {sortedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedUsers.map((user) => (
              <div
                key={user.id}
                className="group rounded-xl border border-border bg-background p-3 transition-all hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      {getRoleBadge(user.roleId)}
                    </div>
                    
                    {user.email && (
                      <div className="mt-1 flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    )}
                    
                    {user.phoneNumber && (
                      <div className="mt-0.5 flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{user.phoneNumber}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(user)}
                      className="rounded-lg p-1.5 text-brand-red transition-colors hover:bg-brand-red/10"
                      title="Edit user"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(user.id)}
                      disabled={deletingId === user.id}
                      className="rounded-lg p-1.5 text-error transition-colors hover:bg-error/10 disabled:opacity-40"
                      title="Delete user"
                    >
                      {deletingId === user.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-error border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;