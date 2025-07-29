CREATE TABLE "emergency_call_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"emergency_card_id" integer NOT NULL,
	"call_type" varchar(20) NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"call_duration" integer,
	"call_status" varchar(20) DEFAULT 'initiated' NOT NULL,
	"location" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "emergency_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"card_id" varchar(16) NOT NULL,
	"qr_code" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"emergency_contacts" text NOT NULL,
	"medical_info" text NOT NULL,
	"allergies" text,
	"medications" text,
	"medical_conditions" text,
	"blood_type" varchar(10),
	"insurance_info" text,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "emergency_cards_card_id_unique" UNIQUE("card_id")
);
--> statement-breakpoint
ALTER TABLE "emergency_call_logs" ADD CONSTRAINT "emergency_call_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_call_logs" ADD CONSTRAINT "emergency_call_logs_emergency_card_id_emergency_cards_id_fk" FOREIGN KEY ("emergency_card_id") REFERENCES "public"."emergency_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_cards" ADD CONSTRAINT "emergency_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;