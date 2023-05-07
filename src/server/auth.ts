import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import { getCsrfToken } from "next-auth/react";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  fetchEnsName,
  fetchEnsAvatar,
  type FetchEnsNameArgs,
  type FetchEnsAvatarArgs,
} from "@wagmi/core";
import { SiweMessage } from "siwe";
import Jazzicon from "@raugfer/jazzicon";

import { env } from "y/env.mjs";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user?: {
      address?: string;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
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
            JSON.parse(credentials?.message || "{}") as SiweMessage
          );
          const nextAuthUrl = new URL(env.NEXTAUTH_URL);
          const result = await siwe.verify({
            signature: credentials?.signature || "",
            domain: nextAuthUrl.host,
            nonce: await getCsrfToken({ req: { headers: req.headers } }),
          });

          return result.success
            ? {
                id: siwe.address,
              }
            : null;
        } catch (e) {
          return null;
        }
      },
    }),
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
