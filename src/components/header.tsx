import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useDisconnect } from "wagmi";

// The approach used in this component shows how to build a sign in and sign out
// component that works on pages which support both client and server side
// rendering, and avoids any flash incorrect content on initial page load.
export default function Header() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const { disconnect } = useDisconnect();
  return (
    <header className="absolute w-full text-white">
      <noscript>
        <style>{`.nojs-show { opacity: 1; top: 0; }`}</style>
      </noscript>
      <div>
        <div>
          {!session && (
            <div className="pt-5 pl-5">
              <span>You are not signed in</span>
            </div>
          )}
          {session?.user && (
            <div className="flex flex-wrap justify-between">
              <span className="flex items-center">
                {session.user.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ? session.user.name : "username"}
                    className="inline-block"
                  />
                )}
                <span className="flex flex-col px-5">
                  <small>Signed in as</small>
                  <strong>{session.user.email ?? session.user.name}</strong>
                </span>
              </span>
              <button
                className="items-center bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
                // href={`/api/auth/signout`}
                onClick={(e) => {
                  e.preventDefault();
                  disconnect();
                  signOut();
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
