import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import postgres from "postgres";
import { z } from "zod";

const schema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().max(200).optional().default(""),
  organization: z.string().max(150).optional().default(""),
});

function getSql() {
  return postgres(
    process.env.DATABASE_URL ||
      "postgres://opennow_user:opennow_secure_password@localhost:5432/opennow_db",
    { max: 1 }
  );
}

/** Public self-registration: creates a sys_user with the employee role. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid registration", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { email, password, name, organization } = parsed.data;
  const sql = getSql();
  try {
    const existing = await sql`SELECT id FROM sys_user WHERE email = ${email} LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    const base = email.split("@")[0].toLowerCase();
    let userName = base.slice(0, 100);
    for (let i = 0; i < 5; i++) {
      const clash = await sql`SELECT id FROM sys_user WHERE user_name = ${userName} LIMIT 1`;
      if (clash.length === 0) break;
      userName = `${base.slice(0, 90)}${i + 2}`;
    }
    const [first, ...rest] = (name.trim() || base).split(/\s+/);
    const hash = await bcrypt.hash(password, 10);
    const ins = await sql`
      INSERT INTO sys_user (user_name, email, first_name, last_name, password_hash, department, active)
      VALUES (${userName}, ${email}, ${first.slice(0, 100)}, ${(rest.join(" ") || "Member").slice(0, 100)}, ${hash}, ${organization.slice(0, 150) || null}, true)
      RETURNING id, user_name`;
    // Defensive: seed the employee role if this database predates it.
    await sql`INSERT INTO sys_user_role (name) VALUES ('employee') ON CONFLICT (name) DO NOTHING`;
    await sql`
      INSERT INTO sys_user_has_role (user_id, role_id)
      SELECT ${ins[0].id}::uuid, id FROM sys_user_role WHERE name = 'employee'
      ON CONFLICT DO NOTHING`;
    return NextResponse.json({ result: { id: ins[0].id, user_name: ins[0].user_name } }, { status: 201 });
  } catch (e: any) {
    console.error("[register] failed:", e?.message || e);
    return NextResponse.json(
      {
        error: "Registration failed",
        detail: process.env.NODE_ENV !== "production" ? String(e?.message || e) : undefined,
      },
      { status: 500 }
    );
  } finally {
    await sql.end();
  }
}
