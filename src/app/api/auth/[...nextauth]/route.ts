import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth";

if (!authOptions) {
  throw new Error("Authentication is not configured. Ensure DATABASE_URL and auth providers are set.");
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
