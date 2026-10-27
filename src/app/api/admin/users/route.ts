import { errorResponse, requireStaff, HttpError } from "@/lib/admin/server";

interface CreateUserBody {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: "customer" | "admin" | "manager" | "support";
  status?: "active" | "inactive";
}

// Creates a customer (Users page) or a staff member (Settings → Admin Management).
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateUserBody;
    const role = body.role ?? "customer";
    // Only full admins may mint other staff accounts.
    const { db } = await requireStaff(role === "customer" ? undefined : ["admin"]);
    if (!body.name?.trim() || !body.email?.trim()) throw new HttpError("Name and email are required", 400);
    if (!body.password || body.password.length < 6) throw new HttpError("Password must be at least 6 characters", 400);

    const { data, error } = await db.auth.admin.createUser({
      email: body.email.trim(),
      password: body.password,
      email_confirm: true,
      user_metadata: { name: body.name.trim(), phone: body.phone?.trim() ?? "" },
    });
    if (error) throw new HttpError(error.message, 400);

    const { error: pErr } = await db
      .from("profiles")
      .upsert({
        id: data.user.id,
        name: body.name.trim(),
        email: body.email.trim(),
        phone: body.phone?.trim() || null,
        role,
        status: body.status ?? "active",
      });
    if (pErr) throw new Error(pErr.message);
    return Response.json({ id: data.user.id });
  } catch (err) {
    return errorResponse(err);
  }
}
