import { errorResponse, requireStaff, HttpError } from "@/lib/admin/server";

interface PatchBody {
  name?: string;
  phone?: string;
  status?: "active" | "inactive";
  role?: "customer" | "admin" | "manager" | "support";
  password?: string;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await req.json()) as PatchBody;
    const { db, staff } = await requireStaff(body.role !== undefined ? ["admin"] : undefined);
    const { data: target } = await db.from("profiles").select("role").eq("id", id).maybeSingle();
    if (!target) throw new HttpError("User not found", 404);
    if (target.role !== "customer" && staff.role !== "admin") throw new HttpError("Only admins can edit staff accounts", 403);
    if (id === staff.id && (body.status === "inactive" || (body.role && body.role !== "admin"))) {
      throw new HttpError("You cannot deactivate or demote your own account", 400);
    }

    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = body.name.trim();
    if (body.phone !== undefined) patch.phone = body.phone.trim() || null;
    if (body.status) patch.status = body.status;
    if (body.role) patch.role = body.role;
    if (Object.keys(patch).length) {
      const { error } = await db.from("profiles").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    }
    if (body.password) {
      if (body.password.length < 6) throw new HttpError("Password must be at least 6 characters", 400);
      const { error } = await db.auth.admin.updateUserById(id, { password: body.password });
      if (error) throw new HttpError(error.message, 400);
    }
    if (body.status) {
      // Inactive users cannot sign in.
      await db.auth.admin.updateUserById(id, { ban_duration: body.status === "inactive" ? "876000h" : "none" });
    }
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { db, staff } = await requireStaff();
    if (id === staff.id) throw new HttpError("You cannot delete your own account", 400);
    const { data: target } = await db.from("profiles").select("role").eq("id", id).maybeSingle();
    if (target && target.role !== "customer" && staff.role !== "admin") throw new HttpError("Only admins can delete staff accounts", 403);
    const { error } = await db.auth.admin.deleteUser(id);
    if (error) throw new HttpError(error.message, 400);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
