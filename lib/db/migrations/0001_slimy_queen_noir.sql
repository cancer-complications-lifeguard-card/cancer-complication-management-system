CREATE TABLE "medical_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"cancer_type" varchar(100),
	"cancer_stage" varchar(50),
	"diagnosis_date" date,
	"treatment_plan" text,
	"allergies" text,
	"medications" json,
	"medical_history" text,
	"doctor_name" varchar(100),
	"doctor_contact" varchar(100),
	"hospital_name" varchar(200),
	"hospital_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(50) DEFAULT 'patient' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "current_stage" varchar(50) DEFAULT 'daily' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emergency_contact" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emergency_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "medical_profiles" ADD CONSTRAINT "medical_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;