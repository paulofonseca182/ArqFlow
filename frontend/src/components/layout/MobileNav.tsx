import { NavLink } from "react-router-dom";
import { navigation } from "./navigation";

export function MobileNav() {
  return (
    <nav className="border-b border-surface-500 bg-surface-900 px-4 py-2 lg:hidden" aria-label="Navegação principal">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              [
                "flex shrink-0 items-center gap-2 rounded-ui border px-3 py-2 text-sm font-medium transition",
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
      </div>
    </nav>
  );
}
