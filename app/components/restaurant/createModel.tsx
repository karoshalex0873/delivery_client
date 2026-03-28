import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  createMyRestaurant,
  createRestaurantForUser,
  updateMyRestaurant,
  updateRestaurantById,
  type RestaurantPayload,
  type RestaurantRecord,
} from "~/services/restaurant";
import { getUsers, type UserRecord } from "~/services/users";
import { cn } from "~/lib/utils";
import { X, Building2, MapPin, Phone, FileText, Image, User, AlertCircle, CheckCircle2 } from "lucide-react";

type RestaurantFormMode = "create" | "update";
type RestaurantFormAudience = "admin" | "restaurant";

type CreateModelProps = {
  audience: RestaurantFormAudience;
  mode: RestaurantFormMode;
  restaurant?: RestaurantRecord | null;
  onSaved?: (restaurant: RestaurantRecord) => void;
  triggerLabel?: string;
  triggerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

type RestaurantFormState = {
  userId: string;
  name: string;
  address: string;
  description: string;
  imageUrl: string;
  phoneNumber: string;
};

const emptyForm: RestaurantFormState = {
  userId: "",
  name: "",
  address: "",
  description: "",
  imageUrl: "",
  phoneNumber: "",
};

const buildFormState = (restaurant?: RestaurantRecord | null): RestaurantFormState => ({
  userId: restaurant?.userId ?? "",
  name: restaurant?.name ?? "",
  address: restaurant?.address ?? "",
  description: restaurant?.description ?? "",
  imageUrl: restaurant?.imageUrl ?? "",
  phoneNumber: restaurant?.phoneNumber ?? "",
});

const formatUserLabel = (user: UserRecord) => {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  return `${fullName} - ${user.phoneNumber}`;
};

const isRestaurantOwner = (user: UserRecord) => {
  const roleName = user.role?.name?.toLowerCase() ?? "";
  return user.roleId === 3 || roleName.includes("restaurant");
};

const CreateModel = ({
  audience,
  mode,
  restaurant,
  onSaved,
  triggerLabel,
  triggerClassName,
  open,
  onOpenChange,
  hideTrigger = false,
}: CreateModelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<RestaurantFormState>(() => buildFormState(restaurant));
  const [owners, setOwners] = useState<UserRecord[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(audience === "admin" && mode === "create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm((current) => ({
      ...buildFormState(restaurant),
      userId: audience === "admin" && mode === "create" ? current.userId : restaurant?.userId ?? "",
    }));
  }, [audience, mode, restaurant]);

  useEffect(() => {
    if (typeof open === "boolean") {
      setIsOpen(open);
    }
  }, [open]);

  useEffect(() => {
    if (audience !== "admin" || mode !== "create") {
      setOwners([]);
      setIsLoadingOwners(false);
      return;
    }

    let isMounted = true;

    const loadOwners = async () => {
      setIsLoadingOwners(true);

      try {
        let users = await getUsers({ role: "restaurant", available: true });
        let restaurantOwners = users.filter(isRestaurantOwner);

        if (restaurantOwners.length === 0) {
          users = await getUsers({ available: true });
          restaurantOwners = users.filter(isRestaurantOwner);
        }

        if (restaurantOwners.length === 0) {
          users = await getUsers();
          restaurantOwners = users.filter(isRestaurantOwner);
        }

        if (!isMounted) return;
        setOwners(restaurantOwners);
        setForm((current) => ({
          ...current,
          userId: current.userId || restaurantOwners[0]?.id || "",
        }));
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load restaurant owners");
      } finally {
        if (isMounted) setIsLoadingOwners(false);
      }
    };

    void loadOwners();
    return () => {
      isMounted = false;
    };
  }, [audience, mode]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const payload: RestaurantPayload = {
    name: form.name.trim(),
    address: form.address.trim(),
    description: form.description.trim() || undefined,
    imageUrl: form.imageUrl.trim() || undefined,
    phoneNumber: form.phoneNumber.trim(),
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    setError(null);

    try {
      let savedRestaurant: RestaurantRecord;

      if (audience === "admin" && mode === "create") {
        savedRestaurant = await createRestaurantForUser({
          userId: form.userId,
          ...payload,
        });
        setOwners((current) => current.filter((owner) => owner.id !== form.userId));
        setForm({ ...emptyForm, userId: "" });
      } else if (audience === "admin" && mode === "update") {
        if (!restaurant?.id) throw new Error("Restaurant id is required to update this restaurant");
        savedRestaurant = await updateRestaurantById(restaurant.id, payload);
        setForm(buildFormState(savedRestaurant));
      } else if (audience === "restaurant" && mode === "create") {
        savedRestaurant = await createMyRestaurant(payload);
        setForm(buildFormState(savedRestaurant));
      } else {
        savedRestaurant = await updateMyRestaurant(payload);
        setForm(buildFormState(savedRestaurant));
      }

      setStatus(mode === "create" ? "Restaurant created successfully." : "Restaurant updated successfully.");
      setIsOpen(false);
      onOpenChange?.(false);
      onSaved?.(savedRestaurant);
      
      setTimeout(() => setStatus(null), 3000);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : `Failed to ${mode} restaurant.`,
      );
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showOwnerSelect = audience === "admin" && mode === "create";
  const title = mode === "create" ? "Create Restaurant" : "Update Restaurant";
  const buttonLabel = triggerLabel ?? (mode === "create" ? "Open restaurant form" : "Edit restaurant details");
  const description =
    audience === "admin"
      ? mode === "create"
        ? "Select a restaurant owner and fill in the details."
        : "Edit the selected restaurant profile."
      : mode === "create"
        ? "Set up your restaurant to start managing orders."
        : "Keep your restaurant profile up to date.";
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  return (
    <>
      {!hideTrigger && (
        <button
          className={cn(
            "inline-flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-red-hover active:scale-[0.98]",
            triggerClassName
          )}
          type="button"
          onClick={() => {
            setError(null);
            setStatus(null);
            setIsOpen(true);
            onOpenChange?.(true);
          }}
        >
          <Building2 className="h-4 w-4" />
          {buttonLabel}
        </button>
      )}

      {isOpen && portalTarget
        ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface shadow-xl">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-surface border-b border-border px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
                <button
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenChange?.(false);
                  }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5">
              {/* Status Message */}
              {status && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{status}</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-error/10 p-3 text-sm text-error">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Owner Select - Admin Only */}
                {showOwnerSelect && (
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                      <User className="h-4 w-4 text-brand-red" />
                      Restaurant Owner
                    </label>
                    <select
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                      name="userId"
                      value={form.userId}
                      onChange={handleChange}
                      disabled={isLoadingOwners || owners.length === 0}
                      required
                    >
                      <option value="">
                        {isLoadingOwners ? "Loading available users..." : "Select a restaurant owner"}
                      </option>
                      {owners.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {formatUserLabel(owner)}
                        </option>
                      ))}
                    </select>
                    {owners.length === 0 && !isLoadingOwners && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        No available restaurant owners found. Create a user with restaurant role first.
                      </p>
                    )}
                  </div>
                )}

                {/* Restaurant Name */}
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                    <Building2 className="h-4 w-4 text-brand-red" />
                    Restaurant Name
                  </label>
                  <input
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                    type="text"
                    name="name"
                    placeholder="e.g., Pizza Palace"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Address & Phone Row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                      <MapPin className="h-4 w-4 text-brand-red" />
                      Address
                    </label>
                    <input
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                      type="text"
                      name="address"
                      placeholder="Restaurant address"
                      value={form.address}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                      <Phone className="h-4 w-4 text-brand-red" />
                      Phone Number
                    </label>
                    <input
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                      type="tel"
                      name="phoneNumber"
                      placeholder="+254700000000"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                    <FileText className="h-4 w-4 text-brand-red" />
                    Description
                  </label>
                  <textarea
                    className="min-h-28 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 resize-none"
                    name="description"
                    placeholder="Tell customers about your restaurant..."
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                    <Image className="h-4 w-4 text-brand-red" />
                    Image URL
                  </label>
                  <input
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                    type="url"
                    name="imageUrl"
                    placeholder="https://example.com/restaurant-image.jpg"
                    value={form.imageUrl}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Optional. Add a photo to make your restaurant stand out.
                  </p>
                </div>

                {/* Preview Image */}
                {form.imageUrl && (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <img
                      src={form.imageUrl}
                      alt="Restaurant preview"
                      className="h-32 w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    className="flex-1 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-50"
                    type="submit"
                    disabled={isSubmitting || (showOwnerSelect && (isLoadingOwners || owners.length === 0 || !form.userId))}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>{mode === "create" ? "Creating..." : "Saving..."}</span>
                      </div>
                    ) : (
                      <span>{mode === "create" ? "Add" : "Save Changes"}</span>
                    )}
                  </button>
                  <button
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-surface-hover"
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenChange?.(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
          ,
          portalTarget,
        )
        : null}
    </>
  );
};

export default CreateModel;
