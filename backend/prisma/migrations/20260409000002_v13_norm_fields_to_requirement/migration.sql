-- Add normative info fields to Requirement table
ALTER TABLE "Requirement" ADD COLUMN "normName" TEXT;
ALTER TABLE "Requirement" ADD COLUMN "normObjective" TEXT;
ALTER TABLE "Requirement" ADD COLUMN "applicabilityJustification" TEXT;
ALTER TABLE "Requirement" ADD COLUMN "applicabilityScope" TEXT;
