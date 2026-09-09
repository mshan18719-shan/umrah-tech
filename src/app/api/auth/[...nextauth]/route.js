import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const authOptions = {
  secret: process.env.AUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 h — session lifetime; OTP gate (1 h) is checked separately
  },

  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "OTP Verification",
      credentials: {
        email: { label: "Email", type: "email" },
        otp:   { label: "OTP",   type: "text"  },
      },

      /**
       * Runs on the SERVER inside the NextAuth API route.
       * Calls the backend verify-otp endpoint; only issues a session if it succeeds.
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) return null;

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/verify-otp`,
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: credentials.email,
                otp:   credentials.otp,
              }),
            }
          );

          const data = await res.json();

          if (res.ok && data?.success !== false) {
            const resolvedEmail = data.data?.email || credentials.email || null;
            return {
              id: resolvedEmail,
              ...(data.data ?? {}),
              // Keep credentials last so API payload cannot wipe auth fields
              email: String(resolvedEmail || "").trim().toLowerCase(),
              otp: String(credentials.otp),
              verified_at: data.data?.verified_at,
              otpVerifiedAt: Date.now(),
            };
          }

          // Throw so NextAuth forwards the message to result.error on the client.
          throw new Error(data?.message);
        } catch (err) {
          // Re-throw our own errors; wrap unexpected ones with a generic message.
          if (err instanceof Error && err.message !== "fetch failed") throw err;
          throw new Error("Network error. Please try again.");
        }
      },
    }),
  ],

  callbacks: {
    /**
     * jwt — runs every time a token is read or written.
     * On initial sign-in `user` is populated from authorize().
     * On session.update() `trigger === "update"` and `session` holds the payload.
     */
    async jwt({ token, user, trigger, session: updatePayload }) {
      // Initial sign-in
      if (user) {
        token.email          = user.email;
        token.otp            = user.otp;
        token.otpVerifiedAt  = user.otpVerifiedAt;
        token.verified_at    = user.verified_at;
      }

      // Triggered via useSession().update({ otpVerifiedAt }) — used for re-verification
      if (trigger === "update" && updatePayload?.otpVerifiedAt) {
        token.otpVerifiedAt = updatePayload.otpVerifiedAt;
      }

      return token;
    },

    /**
     * session — shapes what useSession() returns to the client.
     */
    async session({ session, token }) {
      session.user.email         = token.email;
      session.user.otp           = token.otp;
      session.user.otpVerifiedAt = token.otpVerifiedAt;
      session.user.verified_at   = token.verified_at;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error:  "/login",   // on auth errors, redirect to login
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
