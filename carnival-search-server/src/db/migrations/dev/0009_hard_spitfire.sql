CREATE TABLE "user_conversation_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fk_message_org" uuid NOT NULL,
	"fk_message_user" uuid NOT NULL,
	"fk_message_conversation" uuid NOT NULL,
	"sent_by_bot" boolean NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fk_conversation_org" uuid NOT NULL,
	"fk_conversation_user" uuid NOT NULL,
	"title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_conversation_message" ADD CONSTRAINT "user_conversation_message_fk_message_org_org_id_fk" FOREIGN KEY ("fk_message_org") REFERENCES "public"."org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_conversation_message" ADD CONSTRAINT "user_conversation_message_fk_message_user_user_id_fk" FOREIGN KEY ("fk_message_user") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_conversation_message" ADD CONSTRAINT "user_conversation_message_fk_message_conversation_user_conversation_id_fk" FOREIGN KEY ("fk_message_conversation") REFERENCES "public"."user_conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_conversation" ADD CONSTRAINT "user_conversation_fk_conversation_org_org_id_fk" FOREIGN KEY ("fk_conversation_org") REFERENCES "public"."org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_conversation" ADD CONSTRAINT "user_conversation_fk_conversation_user_user_id_fk" FOREIGN KEY ("fk_conversation_user") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;