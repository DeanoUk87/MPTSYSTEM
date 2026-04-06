// Edge-safe auth config — no Node.js imports, no Prisma, no bcrypt.
// Used only by middleware for JWT session verification.
import NextAuth from "next-auth";

export const { auth } = NextAuth({
  providers: [],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
});
