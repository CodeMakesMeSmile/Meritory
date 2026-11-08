import Type, { type Static } from "typebox";

export const PROVIDER_IDS = ["github", "google"] as const;

export const SignInMethods = Type.Object(
  {
    password: Type.Boolean(),
    providers: Type.Array(
      Type.Union([
        Type.Literal(PROVIDER_IDS[0]),
        Type.Literal(PROVIDER_IDS[1]),
      ]),
    ),
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

/** The signed-in user, before their sign-in methods are looked up */
export type SignedInUser = Omit<MeResponse, "signInMethods">;
