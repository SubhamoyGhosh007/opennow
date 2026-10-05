import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "@auth/core/providers/microsoft-entra-id";
import bcrypt from "bcryptjs";
import postgres from "postgres";

function getSql() {
  return postgres(
    process.env.DATABASE_URL ||
      "postgres://opennow_user:opennow_secure_password@localhost:5432/opennow_db",
    { max: 1 }
  );
}

async function rolesFor(sql: postgres.Sql, userId: string): Promise<string[]> {
  const rows =
    await sql`SELECT r.name FROM sys_user_role r JOIN sys_user_has_role hr ON hr.role_id = r.id WHERE hr.user_id = ${userId}::uuid`;
  return rows.map((r: any) => r.name);
}

/** First-time OAuth sign-in: match by email, else provision as employee. */
async function provisionOAuthUser(email: string, name?: string | null): Promise<boolean> {
  const sql = getSql();
  try {
    const existing = await sql`SELECT id FROM sys_user WHERE email = ${email} LIMIT 1`;
    if (existing.length > 0) return true;
    const base = (email.split("@")[0] || "oauth").slice(0, 100).toLowerCase();
    const userName = `${base}.${Date.now().toString(36)}`.slice(0, 100);
    const [first, ...rest] = (name || base).split(" ");
    const hash = await bcrypt.hash(`oauth-${Date.now()}-${Math.random()}`, 10);
    const ins = await sql`
      INSERT INTO sys_user (user_name, email, first_name, last_name, password_hash, active)
      VALUES (${userName}, ${email}, ${first.slice(0, 100) || base}, ${(rest.join(" ") || "User").slice(0, 100)}, ${hash}, true)
      RETURNING id`;
    await sql`
      INSERT INTO sys_user_has_role (user_id, role_id)
      SELECT ${ins[0].id}::uuid, id FROM sys_user_role WHERE name = 'employee'
      ON CONFLICT DO NOTHING`;
    return true;
  } catch {
    return false;
  } finally {
    await sql.end();
  }
}

const providers: any[] = [];
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google);
}
if (process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET) {
  providers.push(MicrosoftEntraID);
}
providers.push(
  Credentials({
    name: "Credentials",
    credentials: {
      username: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(creds) {
      const username = (creds?.username as string) || "";
      const password = (creds?.password as string) || "";
      if (!username || !password) return null;
      const sql = getSql();
      try {
        const users = await sql`SELECT * FROM sys_user WHERE user_name = ${username} AND active = true LIMIT 1`;
        if (users.length === 0) return null;
        const u = users[0] as any;
        const ok = await bcrypt.compare(password, u.password_hash);
        if (!ok) return null;
        return {
          id: u.id,
          name: `${u.first_name} ${u.last_name}`,
          email: u.email,
          roles: await rolesFor(sql, u.id),
        } as any;
      } catch {
        return null;
      } finally {
        await sql.end();
      }
    },
  })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    async signIn({ user, account }: any) {
      if (account?.provider === "credentials" || !account) return true;
      if (!user?.email) return false;
      return provisionOAuthUser(user.email, user.name);
    },
    async jwt({ token, user, account }: any) {
      // Credentials path already carries id+roles.
      if (user && (user as any).roles) {
        token.id = user.id;
        token.roles = (user as any).roles;
        return token;
      }
      // OAuth / refresh path: resolve by email.
      const email = token.email || (user as any)?.email;
      if (email && (!token.roles || account)) {
        const sql = getSql();
        try {
          const rows = await sql`SELECT id FROM sys_user WHERE email = ${email} LIMIT 1`;
          if (rows.length > 0) {
            token.id = rows[0].id;
            token.roles = await rolesFor(sql, rows[0].id);
          }
        } catch {
          /* keep existing token */
        } finally {
          await sql.end();
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      (session.user as any).id = token.id;
      (session.user as any).roles = token.roles || [];
      return session;
    },
  },
  pages: { signIn: "/login" },
});
