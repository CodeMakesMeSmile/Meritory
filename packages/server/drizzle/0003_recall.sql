CREATE TABLE "recall_cards" (
	"user_id" uuid NOT NULL,
	"track_id" text NOT NULL,
	"chapter_id" text NOT NULL,
	"card_id" text NOT NULL,
	"position" integer NOT NULL,
	"card_version" integer NOT NULL,
	"stability" double precision NOT NULL,
	"stability_fast" double precision NOT NULL,
	"difficulty" double precision NOT NULL,
	"state" smallint NOT NULL,
	"schedule_status" text NOT NULL,
	"reps" integer NOT NULL,
	"lapses" integer NOT NULL,
	"scheduled_days" double precision NOT NULL,
	"learning_step" integer NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"last_review_at" timestamp with time zone,
	"last_review_id" uuid,
	"scheduler_version" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recall_cards_user_id_track_id_chapter_id_card_id_pk" PRIMARY KEY("user_id","track_id","chapter_id","card_id")
);
--> statement-breakpoint
CREATE TABLE "recall_reviews" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"track_id" text NOT NULL,
	"chapter_id" text NOT NULL,
	"card_id" text NOT NULL,
	"card_version" integer NOT NULL,
	"rating" smallint,
	"state" smallint,
	"answered_at" timestamp with time zone,
	"review_time" timestamp with time zone,
	"duration_ms" integer,
	"due_at" timestamp with time zone,
	"revlog" jsonb,
	"recall_target" double precision,
	"scheduler_version" text NOT NULL,
	"undoes" uuid,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recall_reviews_undoes_unique" UNIQUE("undoes"),
	CONSTRAINT "recall_reviews_review_or_undo" CHECK (("recall_reviews"."rating" is null) = ("recall_reviews"."undoes" is not null))
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "time_zone" text;--> statement-breakpoint
ALTER TABLE "recall_cards" ADD CONSTRAINT "recall_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_reviews" ADD CONSTRAINT "recall_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_reviews" ADD CONSTRAINT "recall_reviews_undoes_recall_reviews_id_fk" FOREIGN KEY ("undoes") REFERENCES "public"."recall_reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recall_cards_user_due_idx" ON "recall_cards" USING btree ("user_id","due_at");--> statement-breakpoint
CREATE INDEX "recall_reviews_user_time_idx" ON "recall_reviews" USING btree ("user_id","review_time");