CREATE TYPE "public"."app_type_enum" AS ENUM('google_drive', 'slack', 'jira', 'hubspot', 'gmail', 'github');--> statement-breakpoint
CREATE TYPE "public"."document_type_enum" AS ENUM('message', 'file', 'note', 'email', 'contact', 'lead', 'deal', 'opportunity', 'ticket', 'issue', 'pull_request');--> statement-breakpoint
CREATE TYPE "public"."org_user_role_enum" AS ENUM('admin', 'read_only');--> statement-breakpoint
CREATE TYPE "public"."profile_color_type_enum" AS ENUM('color1', 'color2', 'color3', 'color4', 'color5', 'color6', 'color7', 'color8', 'color9', 'color10');--> statement-breakpoint
CREATE TYPE "public"."sync_status_enum" AS ENUM('success', 'in_process', 'failed', 'deleting');--> statement-breakpoint
CREATE TYPE "public"."user_invitation_status_enum" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fk_account_user" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_group_access" (
	"fk_access_org" uuid NOT NULL,
	"fk_access_connector" uuid NOT NULL,
	"fk_access_user_group" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "connector_group_access_fk_access_connector_fk_access_user_group_pk" PRIMARY KEY("fk_access_connector","fk_access_user_group")
);
--> statement-breakpoint
CREATE TABLE "connector" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fk_connector_org" uuid NOT NULL,
	"name" text,
	"status" "sync_status_enum" DEFAULT 'in_process' NOT NULL,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"app_type" "app_type_enum" NOT NULL,
	"credentials_data" jsonb NOT NULL,
	"app_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_user_access" (
	"fk_access_org" uuid NOT NULL,
	"fk_access_connector" uuid NOT NULL,
	"fk_access_user" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "connector_user_access_fk_access_connector_fk_access_user_pk" PRIMARY KEY("fk_access_connector","fk_access_user")
);
--> statement-breakpoint
CREATE TABLE "document_chunk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fk_chunk_org" uuid NOT NULL,
	"fk_chunk_document" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fk_document_org" uuid NOT NULL,
	"fk_document_connector" uuid NOT NULL,
	"title" text NOT NULL,
	"link" text,
	"type" "document_type_enum" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_user_map" (
	"fk_user_org" uuid NOT NULL,
	"fk_org_user" uuid NOT NULL,
	"role" "org_user_role_enum" DEFAULT 'read_only' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_user_map_fk_user_org_fk_org_user_pk" PRIMARY KEY("fk_user_org","fk_org_user")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fk_session_user" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fk_group_org" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_group_user_map" (
	"fk_group_user" uuid NOT NULL,
	"fk_user_group" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_group_user_map_fk_group_user_fk_user_group_pk" PRIMARY KEY("fk_group_user","fk_user_group")
);
--> statement-breakpoint
CREATE TABLE "user_invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fk_invitation_org" uuid NOT NULL,
	"email" text NOT NULL,
	"status" "user_invitation_status_enum" DEFAULT 'pending' NOT NULL,
	"role" "org_user_role_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"fk_user_last_logged_in_org" uuid,
	"color" "profile_color_type_enum" DEFAULT 'color1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_fk_account_user_user_id_fk" FOREIGN KEY ("fk_account_user") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_group_access" ADD CONSTRAINT "connector_group_access_fk_access_org_org_id_fk" FOREIGN KEY ("fk_access_org") REFERENCES "public"."org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_group_access" ADD CONSTRAINT "connector_group_access_fk_access_connector_connector_id_fk" FOREIGN KEY ("fk_access_connector") REFERENCES "public"."connector"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_group_access" ADD CONSTRAINT "connector_group_access_fk_access_user_group_user_group_id_fk" FOREIGN KEY ("fk_access_user_group") REFERENCES "public"."user_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector" ADD CONSTRAINT "connector_fk_connector_org_org_id_fk" FOREIGN KEY ("fk_connector_org") REFERENCES "public"."org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_user_access" ADD CONSTRAINT "connector_user_access_fk_access_org_org_id_fk" FOREIGN KEY ("fk_access_org") REFERENCES "public"."org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_user_access" ADD CONSTRAINT "connector_user_access_fk_access_connector_connector_id_fk" FOREIGN KEY ("fk_access_connector") REFERENCES "public"."connector"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_user_access" ADD CONSTRAINT "connector_user_access_fk_access_user_user_id_fk" FOREIGN KEY ("fk_access_user") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_fk_chunk_org_org_id_fk" FOREIGN KEY ("fk_chunk_org") REFERENCES "public"."org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_fk_chunk_document_document_id_fk" FOREIGN KEY ("fk_chunk_document") REFERENCES "public"."document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_fk_document_org_org_id_fk" FOREIGN KEY ("fk_document_org") REFERENCES "public"."org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_fk_document_connector_connector_id_fk" FOREIGN KEY ("fk_document_connector") REFERENCES "public"."connector"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_user_map" ADD CONSTRAINT "org_user_map_fk_user_org_org_id_fk" FOREIGN KEY ("fk_user_org") REFERENCES "public"."org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_user_map" ADD CONSTRAINT "org_user_map_fk_org_user_user_id_fk" FOREIGN KEY ("fk_org_user") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_fk_session_user_user_id_fk" FOREIGN KEY ("fk_session_user") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_group" ADD CONSTRAINT "user_group_fk_group_org_org_id_fk" FOREIGN KEY ("fk_group_org") REFERENCES "public"."org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_group_user_map" ADD CONSTRAINT "user_group_user_map_fk_group_user_user_id_fk" FOREIGN KEY ("fk_group_user") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_group_user_map" ADD CONSTRAINT "user_group_user_map_fk_user_group_user_group_id_fk" FOREIGN KEY ("fk_user_group") REFERENCES "public"."user_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invitation" ADD CONSTRAINT "user_invitation_fk_invitation_org_org_id_fk" FOREIGN KEY ("fk_invitation_org") REFERENCES "public"."org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_fk_user_last_logged_in_org_org_id_fk" FOREIGN KEY ("fk_user_last_logged_in_org") REFERENCES "public"."org"("id") ON DELETE no action ON UPDATE no action;