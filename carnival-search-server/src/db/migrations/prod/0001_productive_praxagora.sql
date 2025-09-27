ALTER TABLE "connector" ADD COLUMN "additional_data" jsonb;--> statement-breakpoint
ALTER TABLE "connector" DROP COLUMN "app_data";