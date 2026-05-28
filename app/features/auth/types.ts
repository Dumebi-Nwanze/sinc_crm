import type { AppRole } from "@/lib/constants";

export interface UserProfile {
  id: string;
  fullName: string;
  role: AppRole;
  email: string;
}
