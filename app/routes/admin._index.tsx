const AdminIndex = () => {
  return (
    <section>
      <h1 className="text-xl font-semibold">Welcome to the admin page</h1>
      <p className="mt-2 text-sm text-slate-500">Quick overview of today's activity.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Orders today</div>
          <div className="mt-2 text-2xl font-semibold">124</div>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Active riders</div>
          <div className="mt-2 text-2xl font-semibold">18</div>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Restaurants</div>
          <div className="mt-2 text-2xl font-semibold">42</div>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Customers</div>
          <div className="mt-2 text-2xl font-semibold">1,204</div>
        </div>
      </div>
    </section>
  );
};

export default AdminIndex;
