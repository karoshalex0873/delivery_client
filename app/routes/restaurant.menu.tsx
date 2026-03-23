import { useState, type ChangeEvent, type FormEvent } from "react";
import { X } from "lucide-react";
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
};

const emptyMenuForm: MenuFormState = {
  name: "",
  price: "",
};

const RestaurantMenu = () => {
  const { restaurant, menuItems, setMenuItems, loading, error, menuError, setMenuError } = useRestaurantLayout();
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [menuForm, setMenuForm] = useState<MenuFormState>(emptyMenuForm);
  const [editingMenuItemId, setEditingMenuItemId] = useState<string | null>(null);
  const [menuStatus, setMenuStatus] = useState<string | null>(null);
  const [isSubmittingMenu, setIsSubmittingMenu] = useState(false);
  const [deletingMenuItemId, setDeletingMenuItemId] = useState<string | null>(null);

  const openCreateMenuModal = () => {
    setEditingMenuItemId(null);
    setMenuForm(emptyMenuForm);
    setMenuStatus(null);
    setMenuError(null);
    setIsMenuModalOpen(true);
  };

  const openEditMenuModal = (menuItem: MenuItemRecord) => {
    setEditingMenuItemId(menuItem.id);
    setMenuForm({
      name: menuItem.name,
      price: String(menuItem.price),
    });
    setMenuStatus(null);
    setMenuError(null);
    setIsMenuModalOpen(true);
  };

  const handleMenuChange = (event: ChangeEvent<HTMLInputElement>) => {
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

    try {
      const savedItem = editingMenuItemId
        ? await updateMyMenuItem(editingMenuItemId, { name: trimmedName, price: parsedPrice })
        : await createMyMenuItem({ name: trimmedName, price: parsedPrice });

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

  const handleDeleteMenuItem = async (menuItem: MenuItemRecord) => {
    const confirmed = window.confirm(`Delete ${menuItem.name}?`);
    if (!confirmed) {
      return;
    }

    setDeletingMenuItemId(menuItem.id);
    setMenuStatus(null);
    setMenuError(null);

    try {
      await deleteMyMenuItem(menuItem.id);
      setMenuItems((current) => current.filter((item) => item.id !== menuItem.id));
      setMenuStatus("Menu item deleted successfully.");
    } catch (deleteError) {
      setMenuError(deleteError instanceof Error ? deleteError.message : "Failed to delete menu item");
    } finally {
      setDeletingMenuItemId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading menu workspace...</p>;
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
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <h2 className="text-base font-semibold text-slate-900">Create your restaurant first</h2>
        <p className="mt-2 text-sm text-slate-500">
          Your menu will be available here after the restaurant profile is set up.
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Menu management</h2>
            <p className="text-sm text-slate-500">Create, update, and remove menu items.</p>
          </div>
          <button
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            type="button"
            onClick={openCreateMenuModal}
          >
            Add menu item
          </button>
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

        {menuItems.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h3 className="text-base font-semibold text-slate-900">No menu items yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              Start by adding your first dish so customers can begin ordering.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {menuItems.map((menuItem) => (
              <div
                key={menuItem.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{menuItem.name}</h3>
                  <p className="text-sm text-slate-500">KES {menuItem.price.toLocaleString()}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    type="button"
                    onClick={() => openEditMenuModal(menuItem)}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    disabled={deletingMenuItemId === menuItem.id}
                    onClick={() => void handleDeleteMenuItem(menuItem)}
                  >
                    {deletingMenuItemId === menuItem.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isMenuModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingMenuItemId ? "Update menu item" : "Create menu item"}
                </h2>
                <p className="text-sm text-slate-500">
                  {editingMenuItemId
                    ? "Adjust the item name or price to keep your menu current."
                    : "Add a new item to your restaurant menu."}
                </p>
              </div>
              <button
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
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

            <form className="grid gap-4" onSubmit={handleMenuSubmit}>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Item name
                <input
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                  type="text"
                  name="name"
                  value={menuForm.name}
                  onChange={handleMenuChange}
                  placeholder="Pilau special"
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Price
                <input
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
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

              <div className="flex gap-3">
                <button
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
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
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
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
    </>
  );
};

export default RestaurantMenu;
