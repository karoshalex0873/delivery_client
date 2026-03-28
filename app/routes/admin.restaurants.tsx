import { useEffect, useState } from "react";
import { 
  ChevronDown,
  ChevronUp,
  Trash2, 
  Store, 
  MapPin, 
  Phone, 
  User, 
  AlertCircle,
  Pencil,
  X,
  ChevronRight,
  Building2,
  Package
} from "lucide-react";
import CreateModel from "~/components/restaurant/createModel";
import {
  deleteRestaurantById,
  getAllRestaurants,
  type RestaurantRecord,
} from "~/services/restaurant";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

const formatOwnerName = (restaurant: RestaurantRecord) => {
  if (!restaurant.user) return "Owner not available";
  return `${restaurant.user.firstName} ${restaurant.user.lastName}`.trim();
};

const getStatusColor = (isActive: boolean) => {
  return isActive
    ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
    : "bg-gray-100 text-gray-700 border-gray-200";
};

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState<RestaurantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedRestaurantId, setExpandedRestaurantId] = useState<string | null>(null);
  const [confirmDeleteRestaurant, setConfirmDeleteRestaurant] = useState<RestaurantRecord | null>(null);
  const [confirmEditRestaurant, setConfirmEditRestaurant] = useState<RestaurantRecord | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<RestaurantRecord | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadRestaurants = async () => {
      setLoading(true);
      try {
        const data = await getAllRestaurants();
        if (!isMounted) return;
        setRestaurants(data);
        setError(null);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load restaurants");
      } finally {
        if (isMounted) setLoading(false);
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

  const activeRestaurants = restaurants.filter((restaurant) => (restaurant.menuItems?.length ?? 0) > 0).length;

  const isRestaurantActive = (restaurant: RestaurantRecord) => (restaurant.menuItems?.length ?? 0) > 0;

  const handleConfirmDelete = async () => {
    if (!confirmDeleteRestaurant) return;
    await handleDelete(confirmDeleteRestaurant);
    setConfirmDeleteRestaurant(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-brand-red/20 border-t-brand-red animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading restaurants...</p>
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
      {/* Header with Add Button */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 -mt-2 -mx-4 px-4 py-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand-red" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Restaurants</h1>
              <p className="text-xs text-muted-foreground">Manage all restaurant profiles</p>
            </div>
          </div>
          <CreateModel
            audience="admin"
            mode="create"
            triggerLabel="+ Add"
            triggerClassName="bg-brand-red hover:bg-brand-red-hover text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-md transition-all active:scale-[0.98]"
            onSaved={upsertRestaurant}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <Store className="h-5 w-5 text-brand-red mx-auto mb-1" />
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="mt-1 text-xl font-bold text-foreground">{restaurants.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Active</p>
          <p className="mt-1 text-xl font-bold text-success">{activeRestaurants}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <Package className="h-5 w-5 text-brand-red mx-auto mb-1" />
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Menu</p>
          <p className="mt-1 text-xl font-bold text-foreground">{totalMenuItems}</p>
        </div>
      </div>

      {/* Error Message */}
      {actionError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-error/10 p-3 text-sm text-error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Empty State */}
      {restaurants.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
          <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
            <Store className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No restaurants yet</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Create your first restaurant profile to start managing storefronts.
          </p>
        </div>
      )}

      {/* Restaurants List */}
      {restaurants.length > 0 && (
        <div className="space-y-3">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm transition-all hover:shadow-md"
            >
              {/* Restaurant Card */}
              <div className="p-4">
                <div className="flex gap-3">
                  {/* Restaurant Image */}
                  <img
                    src={restaurant.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=120&q=80"}
                    alt={restaurant.name}
                    className="h-16 w-16 rounded-xl border border-border object-cover shrink-0"
                  />
                  
                  {/* Restaurant Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-base font-semibold text-foreground truncate">
                          {restaurant.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate">
                            {formatOwnerName(restaurant)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="h-3 w-3 text-emerald-600" />
                          <span className="text-xs text-emerald-700">
                            {restaurant.user?.phoneNumber || restaurant.phoneNumber || "No number"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge className={cn("text-[10px]", getStatusColor(isRestaurantActive(restaurant)))}>
                          {isRestaurantActive(restaurant) ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Moved to bottom of card */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRestaurantId((current) => (current === restaurant.id ? null : restaurant.id))
                    }
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {expandedRestaurantId === restaurant.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {expandedRestaurantId === restaurant.id ? "Less" : "More"}
                  </button>
                  
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setConfirmEditRestaurant(restaurant)}
                      className="p-1.5 rounded-lg text-brand-red hover:bg-brand-red/10 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors disabled:opacity-40"
                      type="button"
                      disabled={deletingId === restaurant.id}
                      onClick={() => setConfirmDeleteRestaurant(restaurant)}
                      title="Delete"
                    >
                      {deletingId === restaurant.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-error border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRestaurantId === restaurant.id && (
                <div className="px-4 pb-4 pt-0 space-y-4 border-t border-border/50">
                  {/* Full Image */}
                  {restaurant.imageUrl && (
                    <div className="overflow-hidden rounded-xl border border-border">
                      <img
                        src={restaurant.imageUrl}
                        alt={restaurant.name}
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Location */}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-brand-red shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm text-foreground">{restaurant.address}</p>
                      {restaurant.phoneNumber && restaurant.phoneNumber !== restaurant.user?.phoneNumber && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="font-medium">Restaurant phone:</span> {restaurant.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {restaurant.description && (
                    <div className="flex items-start gap-2">
                      <Store className="h-4 w-4 text-brand-red shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">About</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {restaurant.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Menu Stats */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {restaurant.menuItems?.length ?? 0} menu items
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <CreateModel
        audience="admin"
        mode="update"
        restaurant={editingRestaurant}
        hideTrigger
        open={Boolean(editingRestaurant)}
        onOpenChange={(open) => {
          if (!open) setEditingRestaurant(null);
        }}
        onSaved={upsertRestaurant}
      />

      {/* Confirm Edit Modal */}
      {confirmEditRestaurant && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setConfirmEditRestaurant(null)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-foreground">Edit Restaurant</h3>
              <button
                type="button"
                onClick={() => setConfirmEditRestaurant(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-surface-hover"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Edit <span className="font-semibold text-foreground">{confirmEditRestaurant.name}</span>?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmEditRestaurant(null)}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingRestaurant(confirmEditRestaurant);
                  setConfirmEditRestaurant(null);
                }}
                className="flex-1 rounded-xl bg-brand-red px-3 py-2 text-sm font-medium text-white hover:bg-brand-red-hover"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteRestaurant && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setConfirmDeleteRestaurant(null)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-foreground">Delete Restaurant</h3>
              <button
                type="button"
                onClick={() => setConfirmDeleteRestaurant(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-surface-hover"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Delete <span className="font-semibold text-foreground">{confirmDeleteRestaurant.name}</span>? This cannot be undone.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteRestaurant(null)}
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

export default AdminRestaurants;