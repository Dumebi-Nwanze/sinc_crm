import { createContext } from "react";
import type { User } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/constants";
import type { UserProfile } from "@/features/auth/types";

export interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  role: AppRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
