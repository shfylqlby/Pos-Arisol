import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/data/sync/supabase";

export function isCloudConfigured(): boolean {
  return getSupabaseClient() !== null;
}

export async function getSession(): Promise<Session | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function signInWithMagicLink(
  email: string,
  redirectPath = "/lainnya/sinkronisasi"
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi");
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}${redirectPath}`
      : undefined;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function sendPasswordReset(
  email: string,
  redirectPath = "/masuk/reset"
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi");
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}${redirectPath}`
      : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function updatePassword(password: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signInWithGoogle(
  redirectPath = "/lainnya/sinkronisasi"
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi");
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}${redirectPath}`
      : undefined;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}
