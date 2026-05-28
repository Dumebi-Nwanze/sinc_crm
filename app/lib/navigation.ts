import type { IconData } from "@lineiconshq/free-icons";
import {
  BriefcaseOutlined,
  CommentsOutlined,
  Dashboard2Outlined,
  UsersOutlined,
} from "@/lib/icons";
import type { AppRole } from "@/lib/constants";

export interface NavItem {
  to: string;
  labelKey: string;
  icon: IconData;
  roles?: AppRole[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: "/dashboard",
    labelKey: "nav-dashboard",
    icon: Dashboard2Outlined,
  },
  {
    to: "/clients",
    labelKey: "nav-clients",
    icon: UsersOutlined,
    roles: ["sales", "manager"],
  },
  {
    to: "/conversations",
    labelKey: "nav-conversations",
    icon: CommentsOutlined,
  },
  {
    to: "/pipeline",
    labelKey: "nav-pipeline",
    icon: BriefcaseOutlined,
    roles: ["sales", "manager"],
  },
  {
    to: "/team",
    labelKey: "nav-team",
    icon: UsersOutlined,
    roles: ["manager"],
  },
];

export function getNavItemsForRole(role: AppRole | null | undefined): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role),
  );
}

export function getCommandPaletteItemsForRole(
  role: AppRole | null | undefined,
): Array<{ id: string; labelKey: string; href: string; groupKey: string }> {
  return getNavItemsForRole(role).map((item) => ({
    id: item.to.replace(/^\//, "").replace(/\//g, "-") || "home",
    labelKey: item.labelKey,
    href: item.to,
    groupKey: "nav-section",
  }));
}
