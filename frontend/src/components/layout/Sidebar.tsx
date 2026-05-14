import { NavLink } from "react-router-dom";
import { navigation } from "./navigation";

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 border-r border-surface-500 bg-surface-900 shadow-panel lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-surface-500 px-6">
        <span className="text-xl font-semibold text-text-primary">ArqFlow</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-ui border px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "border-accent-bronze/45 bg-brand-500 text-text-primary shadow-subtle"
                  : "border-transparent text-text-secondary hover:border-surface-600 hover:bg-surface-elevated hover:text-text-primary"
              ].join(" ")
            }
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
