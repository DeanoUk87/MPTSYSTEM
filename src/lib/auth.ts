import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        login: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) return null;
        const login = credentials.login as string;
        const password = credentials.password as string;

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: login }, { username: login }],
            userStatus: 1,
          },
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: { permission: true },
                    },
                  },
                },
              },
            },
          },
        });

        if (!user || !user.password) return null;
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        const roles = user.roles.map(
          (ur: { role: { name: string; permissions: { permission: { name: string } }[] } }) => ur.role.name
        );
        const permissions = user.roles.flatMap(
          (ur: { role: { permissions: { permission: { name: string } }[] } }) =>
            ur.role.permissions.map((rp: { permission: { name: string } }) => rp.permission.name)
        );

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username ?? undefined,
          avatar: user.avatar ?? undefined,
          roles,
          permissions,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existing = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (!existing) {
          const userRole = await prisma.role.findUnique({
            where: { name: "user" },
          });
          const newUser = await prisma.user.create({
            data: {
              name: user.name!,
              email: user.email!,
              provider: "google",
              providerId: account.providerAccountId,
              avatar: user.image ?? null,
            },
          });
          if (userRole) {
            await prisma.userRole.create({
              data: { userId: newUser.id, roleId: userRole.id },
            });
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = (user as any).roles ?? [];
        token.permissions = (user as any).permissions ?? [];
        token.username = (user as any).username ?? null;
        token.avatar = (user as any).avatar ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as any).roles = token.roles ?? [];
      (session.user as any).permissions = token.permissions ?? [];
      (session.user as any).username = token.username ?? null;
      (session.user as any).avatar = token.avatar ?? null;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
});
