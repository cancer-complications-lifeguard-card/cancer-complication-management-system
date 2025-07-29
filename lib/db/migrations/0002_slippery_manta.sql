CREATE TABLE "complication_risk_trees" (
	"id" serial PRIMARY KEY NOT NULL,
	"cancer_type" varchar(100) NOT NULL,
	"complication_name" varchar(200) NOT NULL,
	"description" text,
	"risk_level" varchar(50) NOT NULL,
	"probability" varchar(50),
	"timeframe" varchar(100),
	"symptoms" json,
	"risk_factors" json,
	"prevention_measures" json,
	"treatment_options" json,
	"parent_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"interaction_type" varchar(50) NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" integer NOT NULL,
	"query" text,
	"metadata" json,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_terms" (
	"id" serial PRIMARY KEY NOT NULL,
	"term" varchar(200) NOT NULL,
	"definition" text NOT NULL,
	"category" varchar(100) NOT NULL,
	"aliases" json,
	"related_terms" json,
	"severity" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "complication_risk_trees" ADD CONSTRAINT "complication_risk_trees_parent_id_complication_risk_trees_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."complication_risk_trees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_interactions" ADD CONSTRAINT "knowledge_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;