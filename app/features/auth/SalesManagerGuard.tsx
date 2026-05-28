import { Outlet } from "react-router";
import { RoleGuard } from "@/features/auth/RoleGuard";

export function SalesManagerGuard() {
  return (
    <RoleGuard allowedRoles={["sales", "manager"]}>
      <Outlet />
    </RoleGuard>
  );
}

export default SalesManagerGuard;
