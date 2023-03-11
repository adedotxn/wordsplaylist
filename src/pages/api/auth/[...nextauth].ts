import NextAuth, { Account } from "next-auth";
import { JWT } from "next-auth/jwt";
import SpotifyProvider, { SpotifyProfile } from "next-auth/providers/spotify";

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    SpotifyProvider<SpotifyProfile>({
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "user-read-private playlist-modify-private",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }: any) {
      // Persist the OAuth access_token to the token right after signin

      if (account) {
        token.accessToken = account.access_token;
      }

      return token;
    },
    async session({ session, token }: any) {
      // Send properties to the client, like an access_token from a provider.
      session.accessToken = token.accessToken;

      return session;
    },
  },
};

export default NextAuth(authOptions);
