import { Outlet } from "react-router";
import { RoleGuard } from "@/features/auth/RoleGuard";

export function ManagerGuard() {
  return (
    <RoleGuard allowedRoles={["manager"]}>
      <Outlet />
    </RoleGuard>
  );
}

export default ManagerGuard;
