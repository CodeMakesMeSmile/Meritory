import { Button } from "../components/button";
import { Heading } from "../components/heading";
import { Screen } from "../components/screen";
import { useSession } from "../lib/session";

export default function Home() {
  const { user, signOut } = useSession();
  return (
    <Screen>
      <Heading title={`Signed in as ${user?.name ?? ""}`} />
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </Screen>
  );
}
