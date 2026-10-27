import "server-only";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/admin";

export class HttpError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Resolves the calling staff member or throws 401/403. Returns a service-role client for privileged work. */
export async function requireStaff(roles: string[] = ["admin", "manager", "support"]) {
  const {
    data: { user },
  } = await (await getServerSupabase()).auth.getUser();
  if (!user) throw new HttpError("Not signed in", 401);
  const db = getServiceSupabase();
  const { data: profile } = await db.from("profiles").select("id, role, status").eq("id", user.id).maybeSingle();
  if (!profile || profile.status !== "active" || !roles.includes(profile.role)) throw new HttpError("Not authorised", 403);
  return { db, staff: profile };
}

export function errorResponse(err: unknown) {
  const status = err instanceof HttpError ? err.status : (err as { status?: number })?.status ?? 500;
  const message = err instanceof Error ? err.message : "Something went wrong";
  if (status >= 500) console.error(err);
  return Response.json({ error: status >= 500 && !(err instanceof HttpError) ? "Something went wrong" : message }, { status });
}
