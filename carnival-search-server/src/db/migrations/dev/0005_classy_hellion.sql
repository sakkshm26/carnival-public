ALTER TABLE "user_connector" ALTER COLUMN "credentials_data" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "connector" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "connector" DROP COLUMN "last_synced_at";--> statement-breakpoint
ALTER TABLE "connector" DROP COLUMN "credentials_data";--> statement-breakpoint
ALTER TABLE "connector" DROP COLUMN "additional_data";