import { Link } from "react-router";
import type { Route } from "../+types/root";
import type { ReactNode } from "react";

// meta function to set the page title and description
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home | Pinnacle Courier" },
    { name: "description", content: "Premium logistics for modern businesses." }
  ]
}

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="flex items-center justify-between pb-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold">P</div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Pinnacle</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors" to="/auth/signin">Sign in</Link>
            <Link className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-all" to="/auth/signup">Get Started</Link>
          </nav>
        </header>

        <section className="my-16 text-center">
          <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-6">
            Logistics Reimagined
          </span>
          <h1 className="mx-auto max-w-2xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Deliver faster, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-500">smarter, and better.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-slate-600">
            Connect customers, restaurants, and riders in one seamless platform. 
            Experience the future of local commerce.
          </p>
          
          <div className="mt-10 flex justify-center gap-4">
            <Link to="/customer" className="rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 transition-all">
              Order Now
            </Link>
            <Link to="/restaurant" className="rounded-full border border-slate-200 bg-white px-8 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all">
              Partner with us
            </Link>
          </div>
        </section>

        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <RoleCard 
            title="Customer" 
            desc="Browse menus, track orders, and get delivery updates instantly."
            to="/customer"
            icon={<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />}
          />
          <RoleCard 
            title="Restaurant" 
            desc="Manage your menu, accept orders, and grow your business."
            to="/restaurant"
            icon={<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2s-7 1-8 0z M13 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2s-7 1-8 0z" />} 
          />
          <RoleCard 
            title="Rider" 
            desc="Join the fleet, view assigned tasks, and earn on your schedule."
            to="/rider"
            icon={<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />}
          />
          <RoleCard 
            title="Admin" 
            desc="Oversee operations, manage users, and analyze performance."
            to="/admin"
            icon={<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z" />}
          />
        </div>

        <footer className="mt-24 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Pinnacle Courier Inc. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

const RoleCard = ({ title, desc, to, icon }: { title: string, desc: string, to: string, icon: ReactNode }) => (
  <Link to={to} className="group relative flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-200 hover:shadow-md">
    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors">
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
    <div className="mt-auto pt-4 text-xs font-semibold text-slate-400 group-hover:text-slate-900 transition-colors flex items-center gap-1">
      Access Portal <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
    </div>
  </Link>
)

export default Index;
