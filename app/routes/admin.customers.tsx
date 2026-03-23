const AdminCustomers = () => {
  return (
    <section>
      <h1 className="text-xl font-semibold">Customers</h1>
      <p className="mt-2 text-sm text-slate-500">Basic customer management view.</p>

      <form className="mt-6 grid gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Customer name
          <input className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2" type="text" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Phone
          <input className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2" type="text" />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Notes
          <input className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2" type="text" />
        </label>
        <button className="w-fit rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white" type="submit">
          Save
        </button>
      </form>
    </section>
  );
};

export default AdminCustomers;
