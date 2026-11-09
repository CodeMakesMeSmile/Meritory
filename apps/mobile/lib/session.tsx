import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { authClient } from "./auth-client";

interface Session {
  user: { name: string } | null;
  loading: boolean;
  /** The session stopped working without this phone signing out */
  endedElsewhere: boolean;
  signOut: () => void;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = authClient.useSession();
  const [endedElsewhere, setEndedElsewhere] = useState(false);
  // Later checks report pending too, and hiding the routes for those loses the screen
  const [firstCheckDone, setFirstCheckDone] = useState(false);
  const hadSession = useRef(false);
  const choseSignOut = useRef(false);
  const signedIn = data != null;

  useEffect(() => {
    if (!isPending || signedIn) setFirstCheckDone(true);
    if (signedIn) {
      hadSession.current = true;
      choseSignOut.current = false;
      setEndedElsewhere(false);
      return;
    }
    if (isPending || !hadSession.current) return;
    hadSession.current = false;
    if (choseSignOut.current) return;
    setEndedElsewhere(true);
    // Removes the stored cookie, which the server no longer accepts
    authClient.signOut().catch(() => {});
  }, [signedIn, isPending]);

  function signOut() {
    choseSignOut.current = true;
    // The stored session is gone before this request is sent, so offline is fine
    authClient.signOut().catch(() => {});
  }

  return (
    <SessionContext
      value={{
        user: data?.user ?? null,
        loading: !firstCheckDone && !signedIn,
        endedElsewhere,
        signOut,
      }}
    >
      {children}
    </SessionContext>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession needs a SessionProvider.");
  return session;
}
