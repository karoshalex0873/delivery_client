import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  createMyRestaurant,
  createRestaurantForUser,
  updateMyRestaurant,
  updateRestaurantById,
  type RestaurantPayload,
  type RestaurantRecord,
} from "~/services/restaurant";
import { getUsers, type UserRecord } from "~/services/users";

type RestaurantFormMode = "create" | "update";
type RestaurantFormAudience = "admin" | "restaurant";

type CreateModelProps = {
  audience: RestaurantFormAudience;
  mode: RestaurantFormMode;
  restaurant?: RestaurantRecord | null;
  onSaved?: (restaurant: RestaurantRecord) => void;
  triggerLabel?: string;
};

type RestaurantFormState = {
  userId: string;
  name: string;
  address: string;
  description: string;
  phoneNumber: string;
};

const emptyForm: RestaurantFormState = {
  userId: "",
  name: "",
  address: "",
  description: "",
  phoneNumber: "",
};

const buildFormState = (restaurant?: RestaurantRecord | null): RestaurantFormState => ({
  userId: restaurant?.userId ?? "",
  name: restaurant?.name ?? "",
  address: restaurant?.address ?? "",
  description: restaurant?.description ?? "",
  phoneNumber: restaurant?.phoneNumber ?? "",
});

const formatUserLabel = (user: UserRecord) => {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  return `${fullName} - ${user.phoneNumber}`;
};

const CreateModel = ({ audience, mode, restaurant, onSaved, triggerLabel }: CreateModelProps) => {
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
    if (audience !== "admin" || mode !== "create") {
      setOwners([]);
      setIsLoadingOwners(false);
      return;
    }

    let isMounted = true;

    const loadOwners = async () => {
      setIsLoadingOwners(true);

      try {
        const users = await getUsers({ role: "restaurant", available: true });
        if (!isMounted) {
          return;
        }

        setOwners(users);
        setForm((current) => ({
          ...current,
          userId: current.userId || users[0]?.id || "",
        }));
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load restaurant owners");
      } finally {
        if (isMounted) {
          setIsLoadingOwners(false);
        }
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
        setForm({
          ...emptyForm,
          userId: "",
        });
      } else if (audience === "admin" && mode === "update") {
        if (!restaurant?.id) {
          throw new Error("Restaurant id is required to update this restaurant");
        }
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
      onSaved?.(savedRestaurant);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : `Failed to ${mode} restaurant.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const showOwnerSelect = audience === "admin" && mode === "create";
  const title = mode === "create" ? "Create restaurant" : "Update restaurant";
  const buttonLabel = triggerLabel ?? (mode === "create" ? "Open restaurant form" : "Edit restaurant details");
  const description =
    audience === "admin"
      ? mode === "create"
        ? "Select an available restaurant user and assign their restaurant details."
        : "Edit the selected restaurant profile."
      : mode === "create"
        ? "Set up your restaurant details so you can manage your storefront."
        : "Keep your restaurant profile up to date.";

  return (
    <>
      {status && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {status}
        </p>
      )}

      <button
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        type="button"
        onClick={() => {
          setError(null);
          setStatus(null);
          setIsOpen(true);
        }}
      >
        {buttonLabel}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                <p className="text-sm text-slate-500">{description}</p>
              </div>
              <button
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                type="button"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>

            {error && (
              <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}

            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              {showOwnerSelect ? (
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
                  Restaurant owner
                  <select
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                    name="userId"
                    value={form.userId}
                    onChange={handleChange}
                    disabled={isLoadingOwners || owners.length === 0}
                    required
                  >
                    <option value="">
                      {isLoadingOwners ? "Loading available restaurant users..." : "Select a restaurant owner"}
                    </option>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {formatUserLabel(owner)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Name
                <input
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                  type="text"
                  name="name"
                  placeholder="Restaurant name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Address
                <input
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                  type="text"
                  name="address"
                  placeholder="Restaurant address"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Phone number
                <input
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                  type="tel"
                  name="phoneNumber"
                  placeholder="+254700000000"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
                Description
                <textarea
                  className="min-h-28 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                  name="description"
                  placeholder="Short restaurant description"
                  value={form.description}
                  onChange={handleChange}
                />
              </label>

              <div className="md:col-span-2 flex gap-3">
                <button
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  type="submit"
                  disabled={isSubmitting || (showOwnerSelect && (isLoadingOwners || owners.length === 0 || !form.userId))}
                >
                  {isSubmitting ? (mode === "create" ? "Creating..." : "Saving...") : mode === "create" ? "Create restaurant" : "Save changes"}
                </button>
                <button
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  type="button"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default CreateModel;
