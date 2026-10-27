// Creates (or promotes) the master admin account.
// Usage: npm run seed:admin   (reads .env.local / .env or the process environment)
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL || "admin@zuprano.com";
const password = process.env.ADMIN_PASSWORD;

if (!url || !serviceKey || !password) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and ADMIN_PASSWORD first.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function findUser(target) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === target.toLowerCase());
    if (hit || data.users.length < 200) return hit;
  }
}

let user = await findUser(email);
if (!user) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "Admin" },
  });
  if (error) throw error;
  user = data.user;
  console.log(`Created ${email}`);
} else {
  await supabase.auth.admin.updateUserById(user.id, { password });
  console.log(`${email} already exists; password reset to ADMIN_PASSWORD`);
}

const { error } = await supabase
  .from("profiles")
  .upsert({ id: user.id, email, name: "Admin", role: "admin", status: "active" });
if (error) throw error;
console.log("Admin role granted.");
