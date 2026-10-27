import { create } from "zustand";
import { getSupabase } from "@/lib/supabase/client";

const SESSION_KEY = "zuprano_session_start";
const SESSION_MS = 24 * 60 * 60 * 1000;

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AdminAuthState {
  isAuthenticated: boolean;
  admin: AdminUser | null;
  isLoading: boolean;
  init: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const ROLE_LABEL: Record<string, string> = { admin: "admin", manager: "manager", support: "support" };

/** Loads the signed-in user's staff profile, or null if they are not active staff. */
async function loadStaff(): Promise<AdminUser | null> {
  const supabase = getSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase.from("profiles").select("id, email, name, role, status").eq("id", auth.user.id).maybeSingle();
  if (!data || data.role === "customer" || data.status !== "active") return null;
  return { id: data.id, email: data.email ?? auth.user.email ?? "", name: data.name || "Admin", role: ROLE_LABEL[data.role] ?? data.role };
}

let started = false;

export const useAdminAuth = create<AdminAuthState>((set, get) => ({
  isAuthenticated: false,
  admin: null,
  isLoading: true,

  init: () => {
    if (started) return;
    started = true;
    const supabase = getSupabase();
    const resolve = async () => {
      const staff = await loadStaff();
      if (!staff) {
        localStorage.removeItem(SESSION_KEY);
        set({ isAuthenticated: false, admin: null, isLoading: false });
        return;
      }
      const startedAt = localStorage.getItem(SESSION_KEY);
      if (startedAt && Date.now() - parseInt(startedAt) > SESSION_MS) {
        await get().logout();
        set({ isLoading: false });
        return;
      }
      if (!startedAt) localStorage.setItem(SESSION_KEY, Date.now().toString());
      set({ isAuthenticated: true, admin: staff, isLoading: false });
    };
    resolve();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") set({ isAuthenticated: false, admin: null, isLoading: false });
      else if (event === "SIGNED_IN") setTimeout(resolve, 0);
    });
  },

  login: async (email, password) => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message === "Invalid login credentials" ? "Invalid email or password" : error.message);
    const staff = await loadStaff();
    if (!staff) {
      await supabase.auth.signOut();
      throw new Error("Access denied: Only the master admin can log in.");
    }
    await supabase.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", staff.id);
    localStorage.setItem(SESSION_KEY, Date.now().toString());
    set({ isAuthenticated: true, admin: staff, isLoading: false });
  },

  logout: async () => {
    localStorage.removeItem(SESSION_KEY);
    await getSupabase().auth.signOut();
    set({ isAuthenticated: false, admin: null });
  },
}));
