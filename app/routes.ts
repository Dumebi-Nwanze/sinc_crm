import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("pages/inquiry/index.tsx"),
  route("inquiry-sent", "pages/inquiry-sent/index.tsx"),
  route("accept-invite", "pages/accept-invite/index.tsx"),
  route("login", "pages/login/index.tsx"),
  route("dev", "pages/dev/index.tsx"),
  layout("components/layout/AuthenticatedLayout.tsx", [
    route("forbidden", "pages/forbidden/index.tsx"),
    route("dashboard", "pages/dashboard/index.tsx"),
    route("conversations", "pages/conversations/index.tsx"),
    route("conversations/:threadId", "pages/conversations/detail/index.tsx"),
    layout("features/auth/SalesManagerGuard.tsx", [
      route("clients", "pages/clients/index.tsx"),
      route("clients/:clientId", "pages/clients/detail/index.tsx"),
      route("pipeline", "pages/pipeline/index.tsx"),
      route("deals/:dealId", "pages/deals/detail/index.tsx"),
      layout("features/auth/ManagerGuard.tsx", [
        route("team", "pages/team/index.tsx"),
      ]),
    ]),
  ]),
  route("*", "pages/not-found/index.tsx"),
] satisfies RouteConfig;
