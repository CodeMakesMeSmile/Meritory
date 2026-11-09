import Type, { type Static } from "typebox";
import { PROVIDER_IDS } from "./sign-in-messages.ts";

export { PROVIDER_IDS };

const ProviderId = Type.Union([
  Type.Literal(PROVIDER_IDS[0]),
  Type.Literal(PROVIDER_IDS[1]),
]);

export const SignInMethods = Type.Object(
  {
    /** Null when the account has no password */
    passwordSetAt: Type.Union([
      Type.String({ format: "date-time" }),
      Type.Null(),
    ]),
    providers: Type.Array(
      Type.Object({
        id: ProviderId,
        linkedAt: Type.String({ format: "date-time" }),
      }),
    ),
    /** Providers this server can link */
    available: Type.Array(ProviderId),
  },
  // biome-ignore lint/security/noSecrets: a schema name, not a secret
  { $id: "SignInMethods" },
);
export type SignInMethods = Static<typeof SignInMethods>;

export const MeResponse = Type.Object(
  {
    id: Type.String({ format: "uuid" }),
    name: Type.String(),
    email: Type.String({ format: "email" }),
    signInMethods: SignInMethods,
  },
  { $id: "MeResponse" },
);
export type MeResponse = Static<typeof MeResponse>;

export const ProviderParams = Type.Object({ provider: ProviderId });
export type ProviderParams = Static<typeof ProviderParams>;

/** The signed-in user, before their sign-in methods are looked up */
export type SignedInUser = Omit<MeResponse, "signInMethods">;
