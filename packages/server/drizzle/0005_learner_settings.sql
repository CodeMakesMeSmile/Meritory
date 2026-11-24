CREATE TABLE "learner_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"new_cards_per_day" smallint,
	"track_new_limits" jsonb,
	"reviews_per_day" smallint,
	"recall_target" smallint,
	"interview_target" smallint,
	"interview_weeks" smallint,
	"day_starts_at" smallint,
	"follow_device_time_zone" boolean,
	"design_review_minutes" smallint,
	"class_design_minutes" smallint,
	"story_answer_minutes" smallint,
	"code_language" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learner_settings_new_cards" CHECK ("learner_settings"."new_cards_per_day" between 0 and 50),
	CONSTRAINT "learner_settings_reviews" CHECK ("learner_settings"."reviews_per_day" between 50 and 500),
	CONSTRAINT "learner_settings_recall_target" CHECK ("learner_settings"."recall_target" between 70 and 97),
	CONSTRAINT "learner_settings_interview_target" CHECK ("learner_settings"."interview_target" between 70 and 97),
	CONSTRAINT "learner_settings_interview_weeks" CHECK ("learner_settings"."interview_weeks" between 1 and 8),
	CONSTRAINT "learner_settings_day_start" CHECK ("learner_settings"."day_starts_at" between 0 and 23),
	CONSTRAINT "learner_settings_design_review" CHECK ("learner_settings"."design_review_minutes" between 15 and 90),
	CONSTRAINT "learner_settings_class_design" CHECK ("learner_settings"."class_design_minutes" between 15 and 90),
	CONSTRAINT "learner_settings_story_answer" CHECK ("learner_settings"."story_answer_minutes" between 1 and 10),
	CONSTRAINT "learner_settings_code_language" CHECK ("learner_settings"."code_language" in ('typescript', 'python'))
);
--> statement-breakpoint
ALTER TABLE "recall_reviews" ADD COLUMN "last_review_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "learner_settings" ADD CONSTRAINT "learner_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;