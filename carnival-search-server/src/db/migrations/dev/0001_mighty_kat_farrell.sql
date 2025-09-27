CREATE TABLE "user_connector" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fk_user_connector_org" uuid NOT NULL,
	"fk_connector_user" uuid NOT NULL,
	"fk_user_connector" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_connector" ADD CONSTRAINT "user_connector_fk_user_connector_org_org_id_fk" FOREIGN KEY ("fk_user_connector_org") REFERENCES "public"."org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_connector" ADD CONSTRAINT "user_connector_fk_connector_user_user_id_fk" FOREIGN KEY ("fk_connector_user") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_connector" ADD CONSTRAINT "user_connector_fk_user_connector_connector_id_fk" FOREIGN KEY ("fk_user_connector") REFERENCES "public"."connector"("id") ON DELETE no action ON UPDATE no action;