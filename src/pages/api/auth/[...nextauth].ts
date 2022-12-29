import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getCsrfToken } from "next-auth/react";
import { SiweMessage } from "siwe";
import {
  fetchEnsName,
  fetchEnsAvatar,
  type FetchEnsNameArgs,
  type FetchEnsAvatarArgs,
} from "@wagmi/core";
import { type IncomingMessage } from "http";

import { env } from "../../../env/server.mjs";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  secret: env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      // TODO: anticipate empty token... what is the token etc
      if (session.user && token.sub) {
        const address = {
          address: token.sub,
        };
        session.user.address = token.sub;
        session.user.name =
          (await fetchEnsName(address as FetchEnsNameArgs)) || token.sub;
        session.user.image =
          (await fetchEnsAvatar(address as FetchEnsAvatarArgs)) ||
          "https://via.placeholder.com/60";
      }
      return session;
    },
  },
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
      },
      async authorize(credentials, req) {
        try {
          const siwe = new SiweMessage(
            JSON.parse(credentials?.message || "{}")
          );
          const nextAuthUrl = new URL(env.NEXTAUTH_URL);

          const result = await siwe.verify({
            signature: credentials?.signature || "",
            domain: nextAuthUrl.host,
            nonce: await getCsrfToken({ req: req as IncomingMessage }),
          });

          if (result.success) {
            return {
              id: siwe.address,
            };
          }
          return null;
        } catch (e) {
          return null;
        }
      },
    }),
  ],
};

export default NextAuth(authOptions);
