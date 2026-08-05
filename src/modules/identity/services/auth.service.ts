/**
 * Authentication service — the only place that talks to the auth provider.
 * Every failure is normalised through the platform error handler.
 */

import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { AppError, handleError } from "@/shared/platform";
import type { SignInInput } from "@/modules/identity/types";

const authError = (message: string, cause?: unknown): AppError =>
  new AppError(message, { kind: "permission", cause, context: { scope: "identity.auth" } });

export async function signIn({ email, password }: SignInInput): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error || !data.session) {
    throw handleError(authError(error?.message ?? "Gagal masuk. Periksa email dan kata sandi."), {
      scope: "identity.signIn",
    });
  }
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw handleError(authError(error.message), { scope: "identity.signOut" });
  }
}

/** Restores the persisted session on boot. Never throws. */
export async function restoreSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    handleError(authError(error.message), { scope: "identity.restoreSession" });
    return null;
  }
  return data.session ?? null;
}

/** Re-validates the user against the auth server (not just the local token). */
export async function getVerifiedUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function refreshSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    handleError(authError(error.message), { scope: "identity.refreshSession" });
    return null;
  }
  return data.session ?? null;
}

export type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;

/** Subscribes to auth changes. Returns the unsubscribe function. */
export function onAuthStateChange(listener: AuthListener): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, session) => listener(event, session));
  return () => data.subscription.unsubscribe();
}
