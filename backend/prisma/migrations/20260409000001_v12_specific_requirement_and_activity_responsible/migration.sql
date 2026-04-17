-- Rename description -> specificRequirement in Requirement table
ALTER TABLE "Requirement" RENAME COLUMN "description" TO "specificRequirement";

-- Add responsible column to Activity table (with default for existing rows)
ALTER TABLE "Activity" ADD COLUMN "responsible" TEXT NOT NULL DEFAULT '';
