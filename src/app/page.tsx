"use client";

import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { SiwViemMessage } from "@feelsgoodman/siwviem";

import { CreatePost } from "~/app/_components/create-post";
import { api } from "~/trpc/react";
import { getChainId, signMessage } from "wagmi/actions";
import { config } from "./config";
import { getCsrfToken, useSession, signIn, signOut } from "next-auth/react";
import { useAccount, useConnect } from "wagmi";
import { useEffect } from "react";
import { injected } from "wagmi/connectors";

export default function Home() {
  noStore();
  const { data: hello } = api.post.hello.useQuery({ text: "world" });
  const { data: session, status } = useSession();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const chainId = getChainId(config);

  useEffect(() => {
    if (status !== "loading") {
      if (!isConnected) {
        connect({ chainId, connector: injected() });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, status]);

  const handleLogin = async () => {
    try {
      const callbackUrl = "/protected";
      const message = new SiwViemMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to the app.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce: await getCsrfToken(),
      });
      const signature = await signMessage(config, {
        message: message.prepareMessage(),
      });
      await signIn("credentials", {
        message: JSON.stringify(message),
        redirect: false,
        signature,
        callbackUrl,
      });
    } catch (error) {
      console.log(error);
      window.alert((error as Error).message);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Create <span className="text-[hsl(280,100%,70%)]">T3</span> App
        </h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
            href="https://create.t3.gg/en/usage/first-steps"
            target="_blank"
          >
            <h3 className="text-2xl font-bold">First Steps →</h3>
            <div className="text-lg">
              Just the basics - Everything you need to know to set up your
              database and authentication.
            </div>
          </Link>
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
            href="https://create.t3.gg/en/introduction"
            target="_blank"
          >
            <h3 className="text-2xl font-bold">Documentation →</h3>
            <div className="text-lg">
              Learn more about Create T3 App, the libraries it uses, and how to
              deploy it.
            </div>
          </Link>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-2xl text-white">
            {hello ? hello.greeting : "Loading tRPC query..."}
          </p>

          <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-center text-2xl text-white">
              {session && <span>Logged in as {session.user?.name}</span>}
            </p>
            <button
              onClick={session ? () => signOut() : () => handleLogin()}
              className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
            >
              {session ? "Sign out" : "Sign in"}
            </button>
          </div>
        </div>

        <CrudShowcase />
      </div>
    </main>
  );
}

function CrudShowcase() {
  const { data: session } = useSession();
  const { data: latestPost } = api.post.getLatest.useQuery();

  if (!session?.user) return null;

  return (
    <div className="w-full max-w-xs">
      {latestPost ? (
        <p className="truncate">Your most recent post: {latestPost.name}</p>
      ) : (
        <p>You have no posts yet.</p>
      )}

      <CreatePost />
    </div>
  );
}
