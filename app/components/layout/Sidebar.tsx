import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ExitOutlined } from "@/lib/icons";
import { ROLE_LABEL_KEYS, type AppRole } from "@/lib/constants";
import { getNavItemsForRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role?: AppRole;
  userName?: string;
  onLogout?: () => void | Promise<void>;
}

export function Sidebar({ role, userName = "", onLogout }: SidebarProps) {
  const { t } = useTranslation();
  const visibleItems = getNavItemsForRole(role);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex flex-col border-r border-[var(--color-gray-200)] bg-white",
        "w-[var(--sidebar-collapsed)] lg:w-[var(--sidebar-width)]",
      )}
    >
      <div className="flex h-[var(--topbar-height)] items-center justify-center border-b border-[var(--color-gray-100)] px-2 lg:justify-start lg:px-4">
        <span className="hidden text-[15px] font-semibold text-[var(--color-primary-800)] lg:inline">
          SINC CRM
        </span>
        <span
          className="text-[13px] font-semibold text-[var(--color-primary-800)] lg:hidden"
          aria-hidden
        >
          S
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-2 lg:p-3">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={t(item.labelKey)}
            className={({ isActive }) =>
              cn(
                "flex h-10 items-center justify-center gap-2.5 rounded px-2 text-[13px] font-medium transition-colors lg:h-9 lg:justify-start lg:px-3",
                isActive
                  ? "bg-[var(--color-primary-50)] text-[var(--color-primary-800)]"
                  : "text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  icon={item.icon}
                  size={16}
                  className={
                    isActive
                      ? "text-[var(--color-primary-800)]"
                      : "text-[var(--color-gray-500)]"
                  }
                />
                <span className="hidden truncate lg:inline">{t(item.labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[var(--color-gray-100)] p-2 lg:p-4">
        <div className="flex flex-col items-center gap-2 lg:flex-row lg:items-center lg:gap-3">
          <Avatar name={userName} size="sm" />
          <div className="hidden min-w-0 flex-1 lg:block">
            <p className="truncate text-[13px] font-medium text-[var(--color-gray-900)]">
              {userName}
            </p>
            {role && (
              <Badge labelKey={ROLE_LABEL_KEYS[role]} className="mt-1" />
            )}
          </div>
        </div>
        {onLogout && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-center gap-2 px-2 lg:justify-start"
            onClick={() => void onLogout()}
            aria-label={t("nav-logout")}
            title={t("nav-logout")}
          >
            <Icon icon={ExitOutlined} size={16} />
            <span className="hidden lg:inline">{t("nav-logout")}</span>
          </Button>
        )}
      </div>
    </aside>
  );
}
