CREATE TABLE "unlinked_providers" (
	"user_id" uuid NOT NULL,
	"provider_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unlinked_providers_user_id_provider_id_pk" PRIMARY KEY("user_id","provider_id")
);
--> statement-breakpoint
ALTER TABLE "unlinked_providers" ADD CONSTRAINT "unlinked_providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;