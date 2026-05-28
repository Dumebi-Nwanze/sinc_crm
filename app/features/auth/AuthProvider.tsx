import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthChangeEvent, User } from "@supabase/supabase-js";
import { AuthContext, type AuthContextValue } from "@/features/auth/authContext";
import {
  fetchMe,
  signInWithPassword,
  signOut,
  mapAuthErrorMessage,
} from "@/features/auth/api";
import type { UserProfile } from "@/features/auth/types";
import { resetRealtimeManager } from "@/lib/realtime";
import { supabase } from "@/lib/supabaseClient";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

const PROFILE_LOAD_EVENTS = new Set<AuthChangeEvent>([
  "SIGNED_IN",
  "INITIAL_SESSION",
]);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const requestGen = useRef(0);
  const skipAuthEffectClear = useRef(false);
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
  });

  const clearAuthState = useCallback(() => {
    requestGen.current += 1;
    resetRealtimeManager();
    queryClient.clear();
    setState({ user: null, profile: null, isLoading: false });
  }, [queryClient]);

  const loadProfile = useCallback(async (user: User) => {
    const gen = ++requestGen.current;

    try {
      const profile = await fetchMe();
      if (gen !== requestGen.current) return;
      setState({ user, profile, isLoading: false });
    } catch {
      if (gen !== requestGen.current) return;
      setState({ user, profile: null, isLoading: false });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user) {
        await loadProfile(session.user);
      } else {
        setState({ user: null, profile: null, isLoading: false });
      }
    }

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (session?.user) {
        if (!PROFILE_LOAD_EVENTS.has(event)) return;
        loadProfile(session.user);
        return;
      }

      // Cancel in-flight profile loads. Explicit logout clears state in logout()
      // before signOut() — skip setState here to avoid redirect update loops.
      requestGen.current += 1;
      if (skipAuthEffectClear.current) {
        skipAuthEffectClear.current = false;
        return;
      }

      queryClient.clear();
      setState((prev) =>
        prev.user === null && prev.profile === null && !prev.isLoading
          ? prev
          : { user: null, profile: null, isLoading: false },
      );
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, queryClient]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(mapAuthErrorMessage(error.message));
  }, []);

  const logout = useCallback(async () => {
    skipAuthEffectClear.current = true;
    clearAuthState();
    try {
      await signOut();
    } catch (err) {
      skipAuthEffectClear.current = false;
      throw err;
    }
  }, [clearAuthState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      profile: state.profile,
      role: state.profile?.role ?? null,
      isLoading: state.isLoading,
      isAuthenticated: Boolean(state.user && state.profile),
      login,
      logout,
    }),
    [state.user, state.profile, state.isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
