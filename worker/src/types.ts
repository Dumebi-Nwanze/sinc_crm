export type AppRole = "client" | "sales" | "manager";

export type Profile = {
  id: string;
  full_name: string;
  role: AppRole;
  created_at: string;
};

export type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_JWT_SECRET: string;
  ALLOWED_ORIGIN: string;
  RESEND_API_KEY: string;
  RESEND_FROM: string;
  APP_URL: string;
  SYSTEM_ACCOUNT_ID: string;
};

export type AppVariables = {
  userId: string;
  profile: Profile;
  userEmail: string;
};

export type AppContext = {
  Bindings: Env;
  Variables: AppVariables;
};
