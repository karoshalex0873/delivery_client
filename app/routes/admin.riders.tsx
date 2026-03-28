import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bike,
  ChevronDown,
  ChevronUp,
  Mail,
  Pencil,
  Phone,
  Trash2,
  User,
  X,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import {
  adminCreateUser,
  adminDeleteUser,
  adminUpdateUser,
  getUsers,
  type AdminCreateUserPayload,
  type UserRecord,
} from "~/services/users";

const isRiderUser = (user: UserRecord) => {
  const roleName = user.role?.name?.toLowerCase() ?? "";
  return user.roleId === 2 || roleName.includes("rider");
};

const formatRiderName = (rider: UserRecord) => `${rider.firstName} ${rider.lastName}`.trim();

const getRiderStatusColor = (hasPhone: boolean) => {
  return hasPhone
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : "bg-gray-100 text-gray-700 border-gray-200";
};

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
};

const AdminRiders = () => {
  const [riders, setRiders] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedRiderId, setExpandedRiderId] = useState<string | null>(null);
  const [confirmDeleteRider, setConfirmDeleteRider] = useState<UserRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRider, setEditingRider] = useState<UserRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let isMounted = true;

    const loadRiders = async () => {
      setLoading(true);
      try {
        let users = await getUsers({ role: "rider" });
        let riderUsers = users.filter(isRiderUser);
        if (riderUsers.length === 0) {
          users = await getUsers();
          riderUsers = users.filter(isRiderUser);
        }
        if (!isMounted) return;
        setRiders(riderUsers.sort((a, b) => formatRiderName(a).localeCompare(formatRiderName(b))));
        setError(null);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load riders");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadRiders();
    return () => {
      isMounted = false;
    };
  }, []);

  const openCreate = () => {
    setEditingRider(null);
    setForm(emptyForm);
    setActionError(null);
    setActionSuccess(null);
    setFormOpen(true);
  };

  const openEdit = (rider: UserRecord) => {
    setEditingRider(rider);
    setForm({
      firstName: rider.firstName ?? "",
      lastName: rider.lastName ?? "",
      email: rider.email ?? "",
      phoneNumber: rider.phoneNumber ?? "",
      password: "",
    });
    setActionError(null);
    setActionSuccess(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingRider(null);
    setForm(emptyForm);
  };

  const upsertRider = (rider: UserRecord) => {
    setRiders((current) => {
      const existingIndex = current.findIndex((item) => item.id === rider.id);
      if (existingIndex === -1) {
        return [...current, rider].sort((a, b) => formatRiderName(a).localeCompare(formatRiderName(b)));
      }
      const next = [...current];
      next[existingIndex] = rider;
      return next.sort((a, b) => formatRiderName(a).localeCompare(formatRiderName(b)));
    });
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setActionError("First name, last name and email are required.");
      return;
    }

    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (editingRider) {
        const updated = await adminUpdateUser(editingRider.id, {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim() || undefined,
          roleId: 2,
        });
        upsertRider(updated);
        setActionSuccess("Rider updated successfully.");
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        const payload: AdminCreateUserPayload = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim() || undefined,
          roleId: 2,
          password: form.password.trim() || undefined,
        };
        const created = await adminCreateUser(payload);
        upsertRider(created);
        setActionSuccess("Rider created successfully.");
        setTimeout(() => setActionSuccess(null), 3000);
      }
      closeForm();
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : "Failed to save rider");
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rider: UserRecord) => {
    setDeletingId(rider.id);
    setActionError(null);
    setActionSuccess(null);

    try {
      await adminDeleteUser(rider.id);
      setRiders((current) => current.filter((item) => item.id !== rider.id));
      setActionSuccess("Rider deleted successfully.");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : "Failed to delete rider");
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteRider) return;
    await handleDelete(confirmDeleteRider);
    setConfirmDeleteRider(null);
  };

  const ridersWithPhone = useMemo(
    () => riders.filter((rider) => Boolean(rider.phoneNumber?.trim())).length,
    [riders],
  );

  const ridersWithEmail = useMemo(
    () => riders.filter((rider) => Boolean(rider.email?.trim())).length,
    [riders],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-red/20 border-t-brand-red" />
          <p className="text-sm text-muted-foreground">Loading riders...</p>
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

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-4 -mt-2 mb-4 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bike className="h-5 w-5 text-brand-red" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Riders</h1>
              <p className="text-xs text-muted-foreground">Manage delivery workforce</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-brand-red px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-red-hover active:scale-[0.98]"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <Bike className="mx-auto mb-1 h-5 w-5 text-brand-red" />
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="mt-1 text-xl font-bold text-foreground">{riders.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <Phone className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Phone</p>
          <p className="mt-1 text-xl font-bold text-success">{ridersWithPhone}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <Mail className="mx-auto mb-1 h-5 w-5 text-brand-red" />
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Email</p>
          <p className="mt-1 text-xl font-bold text-foreground">{ridersWithEmail}</p>
        </div>
      </div>

      {/* Messages */}
      {actionError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-error/10 p-3 text-sm text-error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Empty State */}
      {riders.length === 0 && (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted/20">
            <Bike className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">No riders yet</h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Create your first rider profile to start managing delivery workforce.
          </p>
          <button
            onClick={openCreate}
            className="rounded-xl bg-brand-red px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-red-hover"
          >
            + Add Rider
          </button>
        </div>
      )}

      {/* Riders List */}
      {riders.length > 0 && (
        <div className="space-y-3">
          {riders.map((rider) => (
            <div
              key={rider.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:shadow-md"
            >
              <div className="p-4">
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-red/10 to-brand-red/5">
                    <Bike className="h-7 w-7 text-brand-red" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-foreground">
                          {formatRiderName(rider)}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {rider.phoneNumber && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-emerald-600" />
                              <span className="text-xs text-emerald-700">{rider.phoneNumber}</span>
                            </div>
                          )}
                          {rider.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {rider.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className={cn("text-[10px] shrink-0", getRiderStatusColor(Boolean(rider.phoneNumber?.trim())))}>
                        {rider.phoneNumber?.trim() ? "Active" : "Incomplete"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                  <button
                    type="button"
                    onClick={() => setExpandedRiderId((current) => (current === rider.id ? null : rider.id))}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {expandedRiderId === rider.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {expandedRiderId === rider.id ? "Less" : "More"}
                  </button>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(rider)}
                      className="rounded-lg p-1.5 text-brand-red transition-colors hover:bg-brand-red/10"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === rider.id}
                      onClick={() => setConfirmDeleteRider(rider)}
                      className="rounded-lg p-1.5 text-error transition-colors hover:bg-error/10 disabled:opacity-40"
                      title="Delete"
                    >
                      {deletingId === rider.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-error border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRiderId === rider.id && (
                <div className="space-y-3 border-t border-border/50 bg-background/30 px-4 pb-4">
                  <div className="mt-3 grid gap-3">
                    <div className="flex items-start gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-red/10">
                        <User className="h-3.5 w-3.5 text-brand-red" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Full Name
                        </p>
                        <p className="text-sm font-medium text-foreground">{formatRiderName(rider)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-red/10">
                        <Mail className="h-3.5 w-3.5 text-brand-red" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Email
                        </p>
                        <p className="text-sm text-foreground">{rider.email || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-red/10">
                        <Phone className="h-3.5 w-3.5 text-brand-red" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Phone
                        </p>
                        <p className="text-sm text-foreground">{rider.phoneNumber || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-red/10">
                        <Clock className="h-3.5 w-3.5 text-brand-red" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Joined
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={closeForm}>
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {editingRider ? "Edit Rider" : "Create Rider"}
                </h3>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid gap-3">
                <input
                  value={form.firstName}
                  onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                  placeholder="First name"
                />
                <input
                  value={form.lastName}
                  onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                  placeholder="Last name"
                />
                <input
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                  placeholder="Email"
                  type="email"
                />
                <input
                  value={form.phoneNumber}
                  onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                  placeholder="Phone number"
                />
                {!editingRider && (
                  <input
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                    placeholder="Password (optional)"
                    type="password"
                  />
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-red-hover disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingRider ? "Save" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteRider && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setConfirmDeleteRider(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-surface shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Delete Rider</h3>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteRider(null)}
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted-foreground">
                Delete <span className="font-semibold text-foreground">{formatRiderName(confirmDeleteRider)}</span>? 
                This action cannot be undone.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteRider(null)}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmDelete()}
                  className="flex-1 rounded-xl bg-error px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRiders;