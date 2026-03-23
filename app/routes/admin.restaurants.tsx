import { useEffect, useState } from "react";
import CreateModel from "~/components/restaurant/createModel";
import {
  deleteRestaurantById,
  getAllRestaurants,
  type RestaurantRecord,
} from "~/services/restaurant";

const formatOwnerName = (restaurant: RestaurantRecord) => {
  if (!restaurant.user) {
    return "Owner not available";
  }

  return `${restaurant.user.firstName} ${restaurant.user.lastName}`.trim();
};

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState<RestaurantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadRestaurants = async () => {
      setLoading(true);

      try {
        const data = await getAllRestaurants();
        if (!isMounted) {
          return;
        }

        setRestaurants(data);
        setError(null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load restaurants");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadRestaurants();

    return () => {
      isMounted = false;
    };
  }, []);

  const upsertRestaurant = (restaurant: RestaurantRecord) => {
    setRestaurants((current) => {
      const existingIndex = current.findIndex((item) => item.id === restaurant.id);

      if (existingIndex === -1) {
        return [...current, restaurant].sort((a, b) => a.name.localeCompare(b.name));
      }

      const next = [...current];
      next[existingIndex] = restaurant;
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const handleDelete = async (restaurant: RestaurantRecord) => {
    const confirmed = window.confirm(`Delete ${restaurant.name}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeletingId(restaurant.id);
    setActionError(null);

    try {
      await deleteRestaurantById(restaurant.id);
      setRestaurants((current) => current.filter((item) => item.id !== restaurant.id));
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : "Failed to delete restaurant");
    } finally {
      setDeletingId(null);
    }
  };

  const totalMenuItems = restaurants.reduce(
    (count, restaurant) => count + (restaurant.menuItems?.length ?? 0),
    0,
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Restaurant Management</h1>
          <p className="text-sm text-slate-500">
            View all restaurant profiles, assign owners, and keep storefront details up to date.
          </p>
        </div>
        <CreateModel
          audience="admin"
          mode="create"
          triggerLabel="Add restaurant"
          onSaved={upsertRestaurant}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total restaurants</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{restaurants.length}</h2>
          <p className="mt-2 text-sm text-slate-500">Active storefronts currently managed from the admin panel.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Available menus</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{totalMenuItems}</h2>
          <p className="mt-2 text-sm text-slate-500">Combined menu items listed across all restaurants.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Coverage</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {restaurants.filter((restaurant) => restaurant.description).length}
          </h2>
          <p className="mt-2 text-sm text-slate-500">Restaurants that already have a customer-facing description.</p>
        </article>
      </div>

      {actionError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {actionError}
        </p>
      ) : null}

      {loading ? <p className="text-sm text-slate-500">Loading restaurants...</p> : null}
      {!loading && error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {!loading && !error && restaurants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <h2 className="text-base font-semibold text-slate-900">No restaurants yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Create the first restaurant profile to start assigning owners and managing storefronts.
          </p>
        </div>
      ) : null}

      {!loading && !error && restaurants.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {restaurants.map((restaurant) => (
            <article
              key={restaurant.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">{restaurant.name}</h2>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {restaurant.menuItems?.length ?? 0} menu items
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Owner</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{formatOwnerName(restaurant)}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {restaurant.user?.phoneNumber || restaurant.phoneNumber}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Location</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{restaurant.address}</p>
                      <p className="mt-1 text-sm text-slate-500">{restaurant.phoneNumber}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Description</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {restaurant.description || "No description added yet."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-white px-3 py-1 border border-slate-200">
                      Owner assigned
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 border border-slate-200">
                      {restaurant.menuItems?.length ?? 0} listed items
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-3">
                  <CreateModel
                    audience="admin"
                    mode="update"
                    restaurant={restaurant}
                    triggerLabel="Manage details"
                    onSaved={upsertRestaurant}
                  />
                  <button
                    className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    disabled={deletingId === restaurant.id}
                    onClick={() => void handleDelete(restaurant)}
                  >
                    {deletingId === restaurant.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default AdminRestaurants;
