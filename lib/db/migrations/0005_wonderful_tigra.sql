CREATE TABLE "clinical_trials" (
	"id" serial PRIMARY KEY NOT NULL,
	"nct_id" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"brief_summary" text,
	"detailed_description" text,
	"cancer_types" text,
	"phase" varchar(20),
	"status" varchar(50) NOT NULL,
	"primary_purpose" varchar(100),
	"interventions" text,
	"eligibility_criteria" text,
	"locations" text,
	"contacts" text,
	"start_date" timestamp,
	"completion_date" timestamp,
	"last_updated" timestamp,
	"source" varchar(100) DEFAULT 'ClinicalTrials.gov',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clinical_trials_nct_id_unique" UNIQUE("nct_id")
);
--> statement-breakpoint
CREATE TABLE "drug_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"drug_a" varchar(200) NOT NULL,
	"drug_b" varchar(200) NOT NULL,
	"interaction_type" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"mechanism" text,
	"clinical_effect" text NOT NULL,
	"management" text,
	"documentation" varchar(50),
	"onset" varchar(20),
	"probability" varchar(20),
	"alternative_drugs" text,
	"references" text,
	"last_reviewed" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"category" varchar(100) NOT NULL,
	"subcategory" varchar(100),
	"cancer_types" text,
	"target_audience" varchar(50) NOT NULL,
	"reading_level" varchar(20),
	"medical_reviewed_by" varchar(200),
	"medical_review_date" timestamp,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0',
	"rating_count" integer DEFAULT 0 NOT NULL,
	"keywords" text,
	"related_articles" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nccn_guidelines" (
	"id" serial PRIMARY KEY NOT NULL,
	"guideline_id" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"cancer_type" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"version" varchar(20) NOT NULL,
	"effective_date" timestamp NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"recommendations" text,
	"evidence_level" varchar(20),
	"consensus_level" varchar(20),
	"keywords" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nccn_guidelines_guideline_id_unique" UNIQUE("guideline_id")
);
--> statement-breakpoint
CREATE TABLE "user_knowledge_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"content_id" integer NOT NULL,
	"interaction_type" varchar(50) NOT NULL,
	"rating" integer,
	"feedback" text,
	"search_query" text,
	"session_id" varchar(100),
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" text
);
--> statement-breakpoint
ALTER TABLE "user_knowledge_interactions" ADD CONSTRAINT "user_knowledge_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;