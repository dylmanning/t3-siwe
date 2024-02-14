import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { getCsrfToken } from "next-auth/react";
import CredentialsProvider from "next-auth/providers/credentials";
import { getEnsAvatar, getEnsName } from "wagmi/actions";
import { SiwViemMessage } from "@feelsgoodman/siwviem";
import { type Address } from "viem";
import { normalize } from "viem/ens";
import Jazzicon from "@raugfer/jazzicon";

import { env } from "~/env";

import { config } from "~/app/config";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      address: string;
      // ...other properties
      // role: UserRole;
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
  callbacks: {
    async session({ session, token }) {
      // TODO: anticipate empty token... what is the token etc
      if (session.user && token.sub) {
        session.user.address = token.sub;
        session.user.name =
          (await getEnsName(config, { address: token.sub as Address })) ??
          token.sub;
        session.user.image =
          (await getEnsAvatar(config, {
            name: normalize(session.user.name),
          })) ??
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
          const siwe = new SiwViemMessage(
            JSON.parse(credentials?.message ?? "{}") as SiwViemMessage,
          );
          const nextAuthUrl = new URL(env.NEXTAUTH_URL);
          const result = await siwe.verify({
            signature: credentials?.signature ?? "",
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
export const getServerAuthSession = () => getServerSession(authOptions);
