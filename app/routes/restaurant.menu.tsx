import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Image as ImageIcon, Plus, PlusCircle, X } from "lucide-react";
import { Link } from "react-router";
import {
  createMyMenuItem,
  deleteMyMenuItem,
  updateMyMenuItem,
  type MenuItemRecord,
} from "../services/restaurant";
import { useRestaurantLayout } from "./restaurant";

type MenuFormState = {
  name: string;
  price: string;
  category: string;
  imageUrl: string;
  availableCount: string;
};

const fallbackFoodImages = [
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1601050690117-8b38f0f8f1f8?auto=format&fit=crop&w=900&q=80",
];

const emptyMenuForm: MenuFormState = {
  name: "",
  price: "",
  category: "",
  imageUrl: "",
  availableCount: "20",
};

const RestaurantMenu = () => {
  const { restaurant, menuItems, setMenuItems, loading, error, menuError, setMenuError } = useRestaurantLayout();
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [menuForm, setMenuForm] = useState<MenuFormState>(emptyMenuForm);
  const [editingMenuItemId, setEditingMenuItemId] = useState<string | null>(null);
  const [menuStatus, setMenuStatus] = useState<string | null>(null);
  const [isSubmittingMenu, setIsSubmittingMenu] = useState(false);
  const [deletingMenuItemId, setDeletingMenuItemId] = useState<string | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<MenuItemRecord | null>(null);

  const menuByCategory = useMemo(() => {
    const grouped = new Map<string, MenuItemRecord[]>();
    for (const item of menuItems) {
      const category = item.category?.trim() || "Other";
      const existing = grouped.get(category) ?? [];
      grouped.set(category, [...existing, item]);
    }
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [menuItems]);

  const categoryOptions = useMemo(
    () =>
      [...new Set((restaurant?.categories ?? []).map((category) => category.trim()).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [restaurant?.categories],
  );

  const formCategoryOptions = useMemo(() => {
    if (!menuForm.category) {
      return categoryOptions;
    }
    if (categoryOptions.includes(menuForm.category)) {
      return categoryOptions;
    }
    return [menuForm.category, ...categoryOptions];
  }, [categoryOptions, menuForm.category]);

  const openCreateMenuModal = () => {
    setEditingMenuItemId(null);
   

    setMenuForm({
      ...emptyMenuForm,
      category: "",
    })

    setMenuStatus(null);
    setMenuError(null);
    setIsMenuModalOpen(true);
  };

  const openEditMenuModal = (menuItem: MenuItemRecord) => {
    setEditingMenuItemId(menuItem.id);
    setMenuForm({
      name: menuItem.name,
      price: String(menuItem.price),
      category: menuItem.category || "Other",
      imageUrl: menuItem.imageUrl ?? "",
      availableCount: String(menuItem.availableCount ?? 0),
    });
    setMenuStatus(null);
    setMenuError(null);
    setIsMenuModalOpen(true);
  };

  const handleMenuChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setMenuForm((current) => ({ ...current, [name]: value }));
  };

  const handleMenuSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingMenu(true);
    setMenuStatus(null);
    setMenuError(null);

    const trimmedName = menuForm.name.trim();
    const parsedPrice = Number(menuForm.price);
    const parsedCount = Number(menuForm.availableCount);

    if (!trimmedName) {
      setMenuError("Menu item name is required");
      setIsSubmittingMenu(false);
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setMenuError("Price must be greater than 0");
      setIsSubmittingMenu(false);
      return;
    }

    if (!Number.isFinite(parsedCount) || parsedCount < 0) {
      setMenuError("Dish count must be 0 or more");
      setIsSubmittingMenu(false);
      return;
    }

    try {
      const selectedCategory = menuForm.category.trim();
      if (!selectedCategory) {
        setMenuError("Please select a category from Manage Restaurant.");
        setIsSubmittingMenu(false);
        return;
      }

      const payload = {
        name: trimmedName,
        price: parsedPrice,
        category: selectedCategory,
        imageUrl: menuForm.imageUrl.trim() || undefined,
        availableCount: parsedCount,
      };

      const savedItem = editingMenuItemId
        ? await updateMyMenuItem(editingMenuItemId, payload)
        : await createMyMenuItem(payload);

      setMenuItems((current) => {
        const existingIndex = current.findIndex((item) => item.id === savedItem.id);
        if (existingIndex === -1) {
          return [...current, savedItem].sort((a, b) => a.name.localeCompare(b.name));
        }
        const next = [...current];
        next[existingIndex] = savedItem;
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });

      setMenuStatus(editingMenuItemId ? "Menu item updated successfully." : "Menu item created successfully.");
      setIsMenuModalOpen(false);
      setEditingMenuItemId(null);
      setMenuForm(emptyMenuForm);
    } catch (submitError) {
      setMenuError(submitError instanceof Error ? submitError.message : "Failed to save menu item");
    } finally {
      setIsSubmittingMenu(false);
    }
  };

  const runDeleteMenuItem = async (menuItem: MenuItemRecord) => {
    setDeletingMenuItemId(menuItem.id);
    setMenuStatus(null);
    setMenuError(null);

    try {
      await deleteMyMenuItem(menuItem.id);
      setMenuItems((current) => current.filter((item) => item.id !== menuItem.id));
      setMenuStatus("Menu item deleted successfully.");
      setConfirmDeleteItem(null);
    } catch (deleteError) {
      setMenuError(deleteError instanceof Error ? deleteError.message : "Failed to delete menu item");
    } finally {
      setDeletingMenuItemId(null);
    }
  };

  const stockSummary = useMemo(
    () => ({
      total: menuItems.length,
      outOfStock: menuItems.filter((item) => item.availableCount <= 0).length,
    }),
    [menuItems],
  );

  if (loading) return <p className="text-sm text-muted-foreground">Loading menu workspace...</p>;
  if (error) {
    return (
      <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {error}
      </p>
    );
  }
  if (!restaurant) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
        <h2 className="text-base font-semibold text-foreground">Create your restaurant first</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your menu will be available here after the restaurant profile is set up.
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-border bg-surface px-6 py-4 shadow-sm">
        <div className="flex flex-row items-center gap-2">
          {/* Total Card */}
          <article className="flex flex-1 flex-col rounded-lg border border-border bg-background px-2 py-1">
            <p className="text-[10px] leading-tight text-muted-foreground">Total dishes</p>
            <p className="text-sm font-bold text-foreground leading-tight">
              {stockSummary.total}
            </p>
          </article>

          {/* Out of Stock Card */}
          <article className="flex flex-1 flex-col rounded-lg border border-border bg-background px-2 py-1">
            <p className="text-[10px] leading-tight text-muted-foreground whitespace-nowrap">Out of stock</p>
            <p className="text-sm font-bold text-brand-red leading-tight">
              {stockSummary.outOfStock}
            </p>
          </article>


          {/* Compact Action Button */}
          <button
            className="flex shrink-0 items-center justify-center gap-1 rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs font-bold text-brand-red transition hover:bg-brand-red/20 active:scale-95"
            type="button"
            onClick={openCreateMenuModal}
            disabled={categoryOptions.length === 0}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* horizontal separator */}
        <div className="relative mt-3">
          <div className="absolute inset-0 h-px w-full bg-green-500/20 blur-[1px]" />
          <div className="relative h-px w-full bg-green-900/50" />
        </div>

        {menuStatus ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {menuStatus}
          </p>
        ) : null}
        {menuError ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {menuError}
          </p>
        ) : null}
        {categoryOptions.length === 0 ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Add restaurant categories first in{" "}
            <Link to="/restaurant/manage" className="font-semibold underline">
              Manage restaurant
            </Link>{" "}
            before creating menu items.
          </p>
        ) : null}

        {menuItems.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-background p-8 text-center">
            <h3 className="text-base font-semibold text-foreground">No menu items yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Start by adding your first dish.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {menuByCategory.map(([category, items], categoryIndex) => (
              <section key={category} className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{category}</h3>
                <div className="overflow-x-auto pb-1">
                  <div className="flex min-w-max gap-3">
                    {items.map((menuItem, itemIndex) => (
                      <article key={menuItem.id} className="w-[280px] overflow-hidden rounded-2xl border border-border bg-background">
                        <div className="relative h-36 w-full">
                          <img
                            src={menuItem.imageUrl ?? fallbackFoodImages[(categoryIndex + itemIndex) % fallbackFoodImages.length]}
                            alt={menuItem.name}
                            className="h-full w-full object-cover"
                          />
                          <span className={`absolute left-3 top-3 rounded-full px-2 py-1 text-xs font-bold ${menuItem.availableCount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                            {menuItem.availableCount > 0 ? `${menuItem.availableCount} available` : "Out of stock"}
                          </span>
                        </div>
                        <div className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">{menuItem.name}</h4>
                              <p className="text-xs text-muted-foreground">KES {menuItem.price.toLocaleString()}</p>
                            </div>
                            <span className="rounded-md bg-surface px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                              {menuItem.category}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-hover"
                              type="button"
                              onClick={() => openEditMenuModal(menuItem)}
                            >
                              Edit
                            </button>
                            <button
                              className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                              type="button"
                              disabled={deletingMenuItemId === menuItem.id}
                              onClick={() => setConfirmDeleteItem(menuItem)}
                            >
                              {deletingMenuItemId === menuItem.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      {isMenuModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {editingMenuItemId ? "Update menu item" : "Create menu item"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {editingMenuItemId
                    ? "Update dish details, category, image, and available count."
                    : "Add a new dish to your menu."}
                </p>
              </div>
              <button
                className="rounded-lg border border-border bg-background p-2 text-muted-foreground transition hover:bg-surface-hover hover:text-foreground"
                type="button"
                onClick={() => setIsMenuModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {menuError ? (
              <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {menuError}
              </p>
            ) : null}

            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleMenuSubmit}>
              <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                Item name
                <input
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand-red"
                  type="text"
                  name="name"
                  value={menuForm.name}
                  onChange={handleMenuChange}
                  placeholder="Pilau special"
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                Category
                <select
                  className="select-field"
                  name="category"
                  value={menuForm.category}
                  onChange={handleMenuChange}
                  required
                >
                  {!menuForm.category && (
                    <option value="" disabled>
                      Select a category
                    </option>
                  )}
                  {formCategoryOptions.map((option) => (
                    <option key={option} value={option} >
                      {option}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Categories are fetched from <span className="font-semibold text-foreground">Manage restaurant</span>.
                </p>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                Price
                <input
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand-red"
                  type="number"
                  min="0.01"
                  step="0.01"
                  name="price"
                  value={menuForm.price}
                  onChange={handleMenuChange}
                  placeholder="450"
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                Dish count
                <input
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand-red"
                  type="number"
                  min="0"
                  step="1"
                  name="availableCount"
                  value={menuForm.availableCount}
                  onChange={handleMenuChange}
                  placeholder="20"
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-foreground md:col-span-2">
                Image URL
                <div className="relative">
                  <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground outline-none transition focus:border-brand-red"
                    type="url"
                    name="imageUrl"
                    value={menuForm.imageUrl}
                    onChange={handleMenuChange}
                    placeholder="https://example.com/dish.jpg"
                  />
                </div>
              </label>

              <div className="md:col-span-2 flex gap-3">
                <button
                  className="rounded-xl bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-70"
                  type="submit"
                  disabled={isSubmittingMenu}
                >
                  {isSubmittingMenu
                    ? editingMenuItemId
                      ? "Saving..."
                      : "Creating..."
                    : editingMenuItemId
                      ? "Save changes"
                      : "Create item"}
                </button>
                <button
                  className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-surface-hover hover:text-foreground"
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {confirmDeleteItem ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Plus className="h-5 w-5 rotate-45" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Confirm deletion</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You are about to remove <span className="font-semibold text-foreground">{confirmDeleteItem.name}</span> from your menu.
              This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteItem(null)}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingMenuItemId === confirmDeleteItem.id}
                onClick={() => void runDeleteMenuItem(confirmDeleteItem)}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deletingMenuItemId === confirmDeleteItem.id ? "Deleting..." : "Confirm delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default RestaurantMenu;
