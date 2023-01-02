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
import Jazzicon from "@raugfer/jazzicon";
import { type IncomingMessage } from "http";

import { env } from "../../../env/server.mjs";

// TODO: disable pages
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  secret: env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      // TODO: anticipate empty token... what is the token etc
      if (session.user && token.sub) {
        session.user.address = token.sub;
        session.user.name =
          (await fetchEnsName({ address: token.sub } as FetchEnsNameArgs)) ||
          token.sub;
        session.user.image =
          (await fetchEnsAvatar({
            address: token.sub,
          } as FetchEnsAvatarArgs)) ||
          "data:image/svg+xml;base64," +
            Buffer.from(Jazzicon(token.sub), "utf8").toString("base64");
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
