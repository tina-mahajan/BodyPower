import { useApp } from "../context/AppContext";
import type { Screen } from "../types";

interface NavItem {
  label: string;
  screen: Screen;
  icon: string;
  badge?: number;
}

export default function BottomNav() {
  const { currentUser, screen, navigate, unreadCount } = useApp();

  if (!currentUser) return null;

  const adminItems: NavItem[] = [
    { label: "Dashboard", screen: "admin-dashboard", icon: "⊞" },
    { label: "Members", screen: "members", icon: "👥" },
    { label: "Payments", screen: "payments", icon: "₹" },
    { label: "Alerts", screen: "notifications", icon: "🔔", badge: unreadCount },
    { label: "More", screen: "settings", icon: "⋯" },
  ];

  const managerItems: NavItem[] = [
    { label: "Dashboard", screen: "manager-dashboard", icon: "⊞" },
    { label: "Members", screen: "members", icon: "👥" },
    { label: "Payments", screen: "payments", icon: "₹" },
    { label: "More", screen: "settings", icon: "⋯" },
  ];

  const items = currentUser.role === "admin" ? adminItems : managerItems;

  const activeScreens: Record<string, Screen[]> = {
    "admin-dashboard": ["admin-dashboard"],
    "manager-dashboard": ["manager-dashboard"],
    "members": ["members", "member-profile", "add-member", "edit-member"],
    "payments": ["payments"],
    "notifications": ["notifications"],
    "settings": ["settings", "reminder-settings", "plans", "user-management", "inactive-members"],
  };

  const isActive = (item: NavItem) => {
    const related = activeScreens[item.screen] || [item.screen];
    return related.includes(screen);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto">
      <div className="bg-card border-t border-border2 px-1 pb-safe">
        <div className="flex items-center justify-around">
          {items.map(item => (
            <button
              key={item.screen}
              onClick={() => navigate(item.screen)}
              className={`flex flex-col items-center gap-0.5 py-3 px-3 min-w-0 flex-1 transition-colors relative ${
                isActive(item) ? "text-primary" : "text-muted"
              }`}
            >
              <span className="text-xl leading-none relative">
                {item.icon}
                {item.badge ? (
                  <span className="absolute -top-1 -right-2 bg-red text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </span>
              <span className={`text-[10px] font-medium tracking-wide ${isActive(item) ? "text-primary" : "text-muted"}`}>
                {item.label}
              </span>
              {isActive(item) && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
