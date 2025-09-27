ALTER TABLE "user_conversation_message" ALTER COLUMN "thinking_steps" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_conversation_message" ALTER COLUMN "thinking_steps" DROP NOT NULL;