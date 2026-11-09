import { useEffect } from "react";
import { Alert } from "../components/alert";
import { Button } from "../components/button";
import { Heading } from "../components/heading";
import { Screen } from "../components/screen";
import { useProviderSignIn } from "../lib/provider-sign-in";
import { useSession } from "../lib/session";

export default function Home() {
  const { user, signOut } = useSession();
  const { linked, clear } = useProviderSignIn();

  useEffect(() => clear, [clear]);

  return (
    <Screen>
      <Heading title={`Signed in as ${user?.name ?? ""}`} />
      {linked && <Alert tone="success" text={linked} />}
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </Screen>
  );
}
