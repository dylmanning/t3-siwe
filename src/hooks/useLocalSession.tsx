import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { type Session } from "next-auth";

export default function useLocalSession() {
  const { data, status } = useSession();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("session");
    setSession(stored ? JSON.parse(stored) : null);
  }, []);

  useEffect(() => {
    if (data) {
      setSession(data);
      localStorage.setItem("session", JSON.stringify(data));
    }
  }, [data]);

  const endSession = () => {
    localStorage.removeItem("session");
    signOut();
  };

  return { session, status, endSession };
}
