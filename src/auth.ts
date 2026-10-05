import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { pgClient } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
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
        try {
          const users = await pgClient`SELECT * FROM sys_user WHERE user_name = ${username} AND active = true LIMIT 1`;
          if (users.length === 0) return null;
          const u = users[0] as any;
          const ok = await bcrypt.compare(password, u.password_hash);
          if (!ok) return null;
          const roles = await pgClient`SELECT r.name FROM sys_user_role r JOIN sys_user_has_role hr ON hr.role_id = r.id WHERE hr.user_id = ${u.id}::uuid`;
          return {
            id: u.id,
            name: `${u.first_name} ${u.last_name}`,
            email: u.email,
            roles: roles.map((r: any) => r.name),
          } as any;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.roles = (user as any).roles || [];
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
