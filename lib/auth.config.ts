import type { NextAuthConfig } from "next-auth";

// Config légère pour le middleware (Edge Runtime)
// Ne doit PAS importer Prisma ou bcrypt
export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [], // Les providers sont ajoutés dans auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith("/dashboard");
      const isAuthRoute = nextUrl.pathname === "/login";

      if (isAdminRoute && !isLoggedIn) {
        return false; // Redirige vers login
      }

      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "ORGANIZER";
      }
      return session;
    },
  },
};
