import CreateModel from "../components/restaurant/createModel";
import { useRestaurantLayout } from "./restaurant";

const RestaurantDashboard = () => {
  const { restaurant, menuItems, setRestaurant, loading, error } = useRestaurantLayout();

  if (loading) {
    return <p className="text-sm text-slate-500">Loading restaurant workspace...</p>;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {error}
      </p>
    );
  }

  if (!restaurant) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Set up your restaurant</h2>
          <p className="text-sm text-slate-500">
            Create your restaurant profile before you begin managing the menu.
          </p>
        </div>
        <CreateModel
          audience="restaurant"
          mode="create"
          triggerLabel="Create restaurant profile"
          onSaved={setRestaurant}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-medium text-slate-500">Restaurant</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">{restaurant.name}</h2>
          <p className="mt-2 text-sm text-slate-600">{restaurant.address}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-medium text-slate-500">Menu items</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">{menuItems.length}</h2>
          <p className="mt-2 text-sm text-slate-600">Keep your catalog fresh and accurate for customers.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-medium text-slate-500">Phone</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">{restaurant.phoneNumber}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {restaurant.description || "Add a profile description to tell customers what you serve best."}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Restaurant profile</h2>
            <p className="text-sm text-slate-500">Update your storefront information.</p>
          </div>
          <CreateModel
            audience="restaurant"
            mode="update"
            restaurant={restaurant}
            triggerLabel="Edit profile"
            onSaved={setRestaurant}
          />
        </div>

        <div className="mt-5 space-y-3 text-sm text-slate-600">
          <p><span className="font-medium text-slate-900">Name:</span> {restaurant.name}</p>
          <p><span className="font-medium text-slate-900">Address:</span> {restaurant.address}</p>
          <p><span className="font-medium text-slate-900">Phone:</span> {restaurant.phoneNumber}</p>
          <p>
            <span className="font-medium text-slate-900">Description:</span>{" "}
            {restaurant.description || "No description added yet."}
          </p>
        </div>
      </section>
    </div>
  );
};

export default RestaurantDashboard;
