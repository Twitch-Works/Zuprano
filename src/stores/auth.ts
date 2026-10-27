import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import { toProfile } from "@/lib/mappers";
import type { Profile } from "@/lib/types";

interface SignupInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthState {
  user: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  initialized: boolean;
  init: () => void;
  refreshProfile: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  /** Returns true when a session was created; false when Supabase requires email confirmation first. */
  signup: (input: SignupInput) => Promise<boolean>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  signInWithProvider: (provider: "google" | "apple") => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (patch: Partial<Pick<Profile, "name" | "phone" | "addresses" | "preferences">>) => Promise<void>;
  logout: () => Promise<void>;
}

const toE164 = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
};

let initStarted = false;

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  initialized: false,

  init: () => {
    if (initStarted) return;
    initStarted = true;
    const supabase = getSupabase();
    supabase.auth.getSession().then(async ({ data }) => {
      set({ session: data.session, isAuthenticated: !!data.session });
      if (data.session) await get().refreshProfile();
      set({ initialized: true });
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, isAuthenticated: !!session });
      if (session) {
        // Defer: calling Supabase inside this callback can deadlock the auth client.
        setTimeout(() => get().refreshProfile(), 0);
      } else {
        set({ user: null });
      }
    });
  },

  refreshProfile: async () => {
    const supabase = getSupabase();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
    if (data) set({ user: toProfile(data), isAuthenticated: true });
  },

  login: async (email, password) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message === "Invalid login credentials" ? "Invalid email or password" : error.message);
    await get().refreshProfile();
  },

  signup: async ({ name, email, phone, password }) => {
    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/account` : undefined,
      },
    });
    if (error) throw new Error(error.message === "User already registered" ? "Email already registered" : error.message);
    if (data.session) {
      await get().refreshProfile();
      return true;
    }
    return false;
  },

  sendOtp: async (phone) => {
    const { error } = await getSupabase().auth.signInWithOtp({ phone: toE164(phone) });
    if (error) throw new Error(error.message);
  },

  verifyOtp: async (phone, token) => {
    const { error } = await getSupabase().auth.verifyOtp({ phone: toE164(phone), token, type: "sms" });
    if (error) throw new Error(error.message.includes("expired") || error.message.includes("invalid") ? "Invalid OTP" : error.message);
    await get().refreshProfile();
  },

  signInWithProvider: async (provider) => {
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
    });
    if (error) throw new Error(error.message);
  },

  resetPassword: async (email) => {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account?reset=1`,
    });
    if (error) throw new Error(error.message);
  },

  updateProfile: async (patch) => {
    const user = get().user;
    if (!user) throw new Error("Not signed in");
    const { data, error } = await getSupabase()
      .from("profiles")
      .update(patch)
      .eq("id", user.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    set({ user: toProfile(data) });
  },

  logout: async () => {
    await getSupabase().auth.signOut();
    set({ user: null, session: null, isAuthenticated: false });
  },
}));
