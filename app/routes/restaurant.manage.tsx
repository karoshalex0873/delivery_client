import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Save } from "lucide-react";
import { updateMyRestaurant, upsertMyRestaurantLocation } from "../services/restaurant";
import { useRestaurantLayout } from "./restaurant";

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

export default function RestaurantManage() {
  const { restaurant, setRestaurant, menuItems } = useRestaurantLayout();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [address, setAddress] = useState(restaurant?.address ?? "");
  const [restaurantName, setRestaurantName] = useState(restaurant?.name ?? "");
  const [restaurantPhone, setRestaurantPhone] = useState(restaurant?.phoneNumber ?? "");
  const [restaurantDescription, setRestaurantDescription] = useState(restaurant?.description ?? "");
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [categoryInput, setCategoryInput] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRestaurantEdit, setShowRestaurantEdit] = useState(false);
  const [showMenuEdit, setShowMenuEdit] = useState(false);

  const offeredCategories = useMemo(
    () =>
      [...new Set([...(restaurant?.categories ?? []), ...menuItems.map((item) => item.category?.trim() || "").filter(Boolean)])].sort(
        (a, b) => a.localeCompare(b),
      ),
    [restaurant?.categories, menuItems],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        // Ignore recommendation failure.
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    if (!restaurant) {
      return;
    }
    setAddress(restaurant.address ?? "");
    setRestaurantName(restaurant.name ?? "");
    setRestaurantPhone(restaurant.phoneNumber ?? "");
    setRestaurantDescription(restaurant.description ?? "");
  }, [restaurant]);

  const searchLocation = async (searchText?: string) => {
    const text = (searchText ?? query).trim();
    if (!text) {
      setResults([]);
      return;
    }
    setError(null);
    try {
      const params = new URLSearchParams({
        format: "jsonv2",
        q: text,
        addressdetails: "1",
        limit: "8",
      });
      if (currentCoords) {
        params.set("lat", currentCoords.latitude.toString());
        params.set("lon", currentCoords.longitude.toString());
        const lngLeft = (currentCoords.longitude - 0.45).toFixed(6);
        const latTop = (currentCoords.latitude + 0.35).toFixed(6);
        const lngRight = (currentCoords.longitude + 0.45).toFixed(6);
        const latBottom = (currentCoords.latitude - 0.35).toFixed(6);
        params.set("viewbox", `${lngLeft},${latTop},${lngRight},${latBottom}`);
      }
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error("Failed to search location");
      }
      const data = (await response.json()) as SearchResult[];
      setResults(data.slice(0, 6));
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Failed to search location");
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void searchLocation(query);
    }, 350);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query, currentCoords]);

  const pickLocation = (result: SearchResult) => {
    setAddress(result.display_name);
    setQuery(result.display_name);
    setResults([result]);
  };

  const saveLocation = async () => {
    if (!restaurant) return;
    if (!address.trim()) {
      setError("Location is required");
      return;
    }
    setSavingLocation(true);
    setStatus(null);
    setError(null);
    try {
      const selected = results[0];
      if (selected?.lat && selected?.lon) {
        await upsertMyRestaurantLocation(Number(selected.lat), Number(selected.lon));
      }
      const updated = await updateMyRestaurant({ address: address.trim() });
      setRestaurant(updated);
      setStatus("Restaurant location updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update restaurant location");
    } finally {
      setSavingLocation(false);
    }
  };

  const saveRestaurantDetails = async () => {
    if (!restaurant) return;
    if (!restaurantName.trim()) {
      setError("Restaurant name is required");
      return;
    }
    if (!restaurantPhone.trim()) {
      setError("Phone number is required");
      return;
    }
    setSavingDetails(true);
    setStatus(null);
    setError(null);
    try {
      const updated = await updateMyRestaurant({
        name: restaurantName.trim(),
        phoneNumber: restaurantPhone.trim(),
        description: restaurantDescription.trim() || undefined,
      });
      setRestaurant(updated);
      setStatus("Restaurant details updated.");
      setShowRestaurantEdit(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update restaurant details");
    } finally {
      setSavingDetails(false);
    }
  };

  const addCategory = async () => {
    if (!restaurant) return;
    const value = categoryInput.trim();
    if (!value) return;
    const next = [...new Set([...(restaurant.categories ?? []), value])].sort((a, b) => a.localeCompare(b));
    setSavingCategories(true);
    setStatus(null);
    setError(null);
    try {
      const updated = await updateMyRestaurant({ categories: next });
      setRestaurant(updated);
      setCategoryInput("");
      setStatus("Categories updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save categories");
    } finally {
      setSavingCategories(false);
    }
  };

  const removeCategory = async (value: string) => {
    if (!restaurant) return;
    const next = (restaurant.categories ?? []).filter((item) => item !== value);
    setSavingCategories(true);
    setStatus(null);
    setError(null);
    try {
      const updated = await updateMyRestaurant({ categories: next });
      setRestaurant(updated);
      setStatus("Category removed.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to remove category");
    } finally {
      setSavingCategories(false);
    }
  };

  if (!restaurant) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-muted-foreground">Create your restaurant profile first.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <h1 className="text-xl font-bold text-foreground">Set Restaurant Location</h1>
        <div className="mt-5 space-y-3">
          <label className="text-sm font-semibold text-foreground">Search location</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="input-field"
                placeholder="Type location (auto search)..."
              />
            </div>
          </div>

          <div className="min-h-[72px]">
            {results.length > 0 ? (
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-border bg-background p-3">
                {results.map((result) => (
                  <button
                    key={`${result.lat}-${result.lon}`}
                    type="button"
                    onClick={() => pickLocation(result)}
                    className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm text-foreground hover:bg-surface-hover"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 text-brand-red" />
                    <span>{result.display_name}</span>
                  </button>
                ))}
              </div>
            ) : query.trim().length > 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background p-3 text-sm text-muted-foreground">
                No suggested areas found yet.
              </div>
            ) : null}
          </div>

          <div className=" flex items-center gap-3">
            <button
              type="button"
              onClick={() => void saveLocation()}
              disabled={savingLocation}
              className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {/* icons */}
              <Save className="h-4 w-4" />
              {savingLocation ? "Saving..." : "Save"}
            </button>

            <div className="rounded-xl border border-border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Restaurant address</p>
              <p className="mt-1 text-sm text-foreground">{address || "No address selected yet."}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Manage Restaurant & Menus</h2>

        <div className="mt-4 space-y-4">
          <article className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">Manage Restaurant</p>
              <button
                type="button"
                onClick={() => setShowRestaurantEdit((current) => !current)}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-surface-hover"
              >
                {showRestaurantEdit ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" /> Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" /> Edit
                  </>
                )}
              </button>
            </div>

            {showRestaurantEdit ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-foreground">Restaurant name</label>
                  <input
                    value={restaurantName}
                    onChange={(event) => setRestaurantName(event.target.value)}
                    className="input-field mt-1"
                    placeholder="Restaurant name"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Phone number</label>
                  <input
                    value={restaurantPhone}
                    onChange={(event) => setRestaurantPhone(event.target.value)}
                    className="input-field mt-1"
                    placeholder="+2547..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-foreground">Description</label>
                  <textarea
                    value={restaurantDescription}
                    onChange={(event) => setRestaurantDescription(event.target.value)}
                    className="input-field mt-1 min-h-24"
                    placeholder="Short description..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => void saveRestaurantDetails()}
                    disabled={savingDetails}
                    className="rounded-xl bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {savingDetails ? "Updating..." : "Update restaurant details"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-1 text-sm text-foreground">
                <p><span className="font-semibold text-muted-foreground">Name:</span> {restaurant.name}</p>
                <p><span className="font-semibold text-muted-foreground">Phone:</span> {restaurant.phoneNumber}</p>
                <p><span className="font-semibold text-muted-foreground">Description:</span> {restaurant.description || "No description yet"}</p>
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">Manage Menus (Categories)</p>
              <button
                type="button"
                onClick={() => setShowMenuEdit((current) => !current)}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-surface-hover"
              >
                {showMenuEdit ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" /> Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" /> Edit
                  </>
                )}
              </button>
            </div>

            {showMenuEdit ? (
              <>
                <div className="mt-4 flex gap-2">
                  <input
                    value={categoryInput}
                    onChange={(event) => setCategoryInput(event.target.value)}
                    className="input-field"
                    placeholder="Add category e.g. Grills, Breakfast"
                  />
                  <button
                    type="button"
                    onClick={() => void addCategory()}
                    disabled={savingCategories}
                    className="rounded-xl bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {offeredCategories.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No categories yet.</span>
                  ) : (
                    offeredCategories.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground"
                      >
                        {category}
                        {(restaurant.categories ?? []).includes(category) ? (
                          <button
                            type="button"
                            onClick={() => void removeCategory(category)}
                            className="text-muted-foreground hover:text-red-600"
                            title="Remove category"
                          >
                            x
                          </button>
                        ) : null}
                      </span>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {offeredCategories.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No categories yet.</span>
                ) : (
                  offeredCategories.map((category) => (
                    <span key={category} className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground">
                      {category}
                    </span>
                  ))
                )}
              </div>
            )}
          </article>
        </div>

        {status ? <p className="mt-4 text-sm text-emerald-700">{status}</p> : null}
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </section>
    </div>
  );
}
