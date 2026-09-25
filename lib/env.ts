/** Reads a required environment variable, failing loudly (server-side) when it is missing. */
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

// NEXT_PUBLIC_* values must be referenced literally so Next.js can inline them in the browser bundle.
export const publicEnv = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
};

/** Server only. Never import from client components. */
export const serverEnv = {
  serviceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
  bootstrapProductEmail: () => process.env.PRIME_BOOTSTRAP_PRODUCT_EMAIL?.trim().toLowerCase() ?? "",
};
