import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { type Session } from "next-auth";
import { useAccount, type ConnectorData } from "wagmi";

export default function useLocalSession() {
  const { data, status } = useSession();
  const { connector: activeConnector } = useAccount();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const handleConnectorUpdate = ({ account }: ConnectorData) => {
      if (account) {
        void endSession();
      }
    };

    if (activeConnector) {
      activeConnector.on("change", handleConnectorUpdate);
    }

    return () => {
      if (activeConnector) {
        activeConnector.off("change", handleConnectorUpdate);
      }
    };
  }, [activeConnector]);

  useEffect(() => {
    const stored = localStorage.getItem("session");
    setSession(stored ? (JSON.parse(stored) as Session) : null);
  }, []);

  useEffect(() => {
    if (data) {
      setSession(data);
      localStorage.setItem("session", JSON.stringify(data));
    }
  }, [data]);

  const endSession = async () => {
    localStorage.removeItem("session");
    await signOut();
  };

  return { session, status, endSession };
}
