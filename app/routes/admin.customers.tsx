import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Pencil,
  Phone,
  Trash2,
  User,
  Users,
  X,
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

const isCustomerUser = (user: UserRecord) => {
  const roleName = user.role?.name?.toLowerCase() ?? "";
  return user.roleId === 1 || roleName.includes("customer");
};

const formatCustomerName = (customer: UserRecord) => `${customer.firstName} ${customer.lastName}`.trim();

const getCustomerStatusColor = (hasPhone: boolean) => {
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

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [confirmDeleteCustomer, setConfirmDeleteCustomer] = useState<UserRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<UserRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let isMounted = true;

    const loadCustomers = async () => {
      setLoading(true);
      try {
        let users = await getUsers({ role: "customer" });
        let customerUsers = users.filter(isCustomerUser);
        if (customerUsers.length === 0) {
          users = await getUsers();
          customerUsers = users.filter(isCustomerUser);
        }
        if (!isMounted) return;
        setCustomers(customerUsers.sort((a, b) => formatCustomerName(a).localeCompare(formatCustomerName(b))));
        setError(null);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load customers");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadCustomers();
    return () => {
      isMounted = false;
    };
  }, []);

  const openCreate = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setActionError(null);
    setActionSuccess(null);
    setFormOpen(true);
  };

  const openEdit = (customer: UserRecord) => {
    setEditingCustomer(customer);
    setForm({
      firstName: customer.firstName ?? "",
      lastName: customer.lastName ?? "",
      email: customer.email ?? "",
      phoneNumber: customer.phoneNumber ?? "",
      password: "",
    });
    setActionError(null);
    setActionSuccess(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingCustomer(null);
    setForm(emptyForm);
  };

  const upsertCustomer = (customer: UserRecord) => {
    setCustomers((current) => {
      const existingIndex = current.findIndex((item) => item.id === customer.id);
      if (existingIndex === -1) {
        return [...current, customer].sort((a, b) => formatCustomerName(a).localeCompare(formatCustomerName(b)));
      }
      const next = [...current];
      next[existingIndex] = customer;
      return next.sort((a, b) => formatCustomerName(a).localeCompare(formatCustomerName(b)));
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
      if (editingCustomer) {
        const updated = await adminUpdateUser(editingCustomer.id, {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim() || undefined,
          roleId: 1,
        });
        upsertCustomer(updated);
        setActionSuccess("Customer updated successfully.");
      } else {
        const payload: AdminCreateUserPayload = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim() || undefined,
          roleId: 1,
          password: form.password.trim() || undefined,
        };
        const created = await adminCreateUser(payload);
        upsertCustomer(created);
        setActionSuccess("Customer created successfully.");
      }
      closeForm();
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer: UserRecord) => {
    setDeletingId(customer.id);
    setActionError(null);
    setActionSuccess(null);

    try {
      await adminDeleteUser(customer.id);
      setCustomers((current) => current.filter((item) => item.id !== customer.id));
      setActionSuccess("Customer deleted successfully.");
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : "Failed to delete customer");
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteCustomer) return;
    await handleDelete(confirmDeleteCustomer);
    setConfirmDeleteCustomer(null);
  };

  const customersWithPhone = useMemo(
    () => customers.filter((customer) => Boolean(customer.phoneNumber?.trim())).length,
    [customers],
  );

  const customersWithEmail = useMemo(
    () => customers.filter((customer) => Boolean(customer.email?.trim())).length,
    [customers],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-red/20 border-t-brand-red" />
          <p className="text-sm text-muted-foreground">Loading customers...</p>
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
      <div className="sticky top-0 z-10 -mx-4 -mt-2 mb-4 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-red" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Customers</h1>
              <p className="text-xs text-muted-foreground">Manage all customer profiles</p>
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

      <div className="mb-5 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <Users className="mx-auto mb-1 h-5 w-5 text-brand-red" />
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="mt-1 text-xl font-bold text-foreground">{customers.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <Phone className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">With Phone</p>
          <p className="mt-1 text-xl font-bold text-success">{customersWithPhone}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <Mail className="mx-auto mb-1 h-5 w-5 text-brand-red" />
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">With Email</p>
          <p className="mt-1 text-xl font-bold text-foreground">{customersWithEmail}</p>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-error/10 p-3 text-sm text-error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="mb-4 rounded-xl bg-success/10 p-3 text-sm text-success">{actionSuccess}</div>
      )}

      {customers.length === 0 && (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted/20">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">No customers yet</h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Create your first customer profile to start managing users.
          </p>
        </div>
      )}

      {customers.length > 0 && (
        <div className="space-y-3">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:shadow-md"
            >
              <div className="p-4">
                <div className="flex gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                    <Users className="h-7 w-7 text-brand-red" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-foreground">{formatCustomerName(customer)}</h2>
                        <div className="mt-1 flex items-center gap-2">
                          <Phone className="h-3 w-3 text-emerald-600" />
                          <span className="truncate text-xs text-emerald-700">{customer.phoneNumber || "No number"}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate text-xs text-muted-foreground">{customer.email || "No email"}</span>
                        </div>
                      </div>
                      <Badge className={cn("text-[10px]", getCustomerStatusColor(Boolean(customer.phoneNumber?.trim())))}>
                        {customer.phoneNumber?.trim() ? "Ready" : "Incomplete"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                  <button
                    type="button"
                    onClick={() => setExpandedCustomerId((current) => (current === customer.id ? null : customer.id))}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {expandedCustomerId === customer.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {expandedCustomerId === customer.id ? "Less" : "More"}
                  </button>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(customer)}
                      className="rounded-lg p-1.5 text-brand-red transition-colors hover:bg-brand-red/10"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === customer.id}
                      onClick={() => setConfirmDeleteCustomer(customer)}
                      className="rounded-lg p-1.5 text-error transition-colors hover:bg-error/10 disabled:opacity-40"
                      title="Delete"
                    >
                      {deletingId === customer.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-error border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {expandedCustomerId === customer.id && (
                <div className="space-y-3 border-t border-border/50 px-4 pb-4 pt-0">
                  <div className="mt-4 flex items-start gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red/10">
                      <User className="h-4 w-4 text-brand-red" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Customer Name</p>
                      <p className="text-sm font-semibold text-foreground">{formatCustomerName(customer)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red/10">
                      <Mail className="h-4 w-4 text-brand-red" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm text-foreground">{customer.email || "No email provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red/10">
                      <Phone className="h-4 w-4 text-brand-red" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm text-foreground">{customer.phoneNumber || "No phone provided"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={closeForm}>
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">
                {editingCustomer ? "Edit Customer" : "Create Customer"}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={form.firstName}
                onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                placeholder="First name"
              />
              <input
                value={form.lastName}
                onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                placeholder="Last name"
              />
              <input
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                placeholder="Email"
                type="email"
              />
              <input
                value={form.phoneNumber}
                onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                placeholder="Phone number"
              />
              {!editingCustomer && (
                <input
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                  placeholder="Password (optional)"
                  type="password"
                />
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex-1 rounded-xl bg-brand-red px-3 py-2 text-sm font-medium text-white hover:bg-brand-red-hover disabled:opacity-60"
              >
                {saving ? "Saving..." : editingCustomer ? "Save Changes" : "Create Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setConfirmDeleteCustomer(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Delete Customer</h3>
              <button
                type="button"
                onClick={() => setConfirmDeleteCustomer(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Delete <span className="font-semibold text-foreground">{formatCustomerName(confirmDeleteCustomer)}</span>? This cannot be undone.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteCustomer(null)}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                className="flex-1 rounded-xl bg-error px-3 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
