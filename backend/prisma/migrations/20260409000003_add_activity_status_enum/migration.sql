-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- AlterTable: add new column
ALTER TABLE "Activity" ADD COLUMN "activityStatus" "ActivityStatus" NOT NULL DEFAULT 'PENDING';

-- Migrate data from isCompleted to activityStatus
UPDATE "Activity" SET "activityStatus" = 'COMPLETED' WHERE "isCompleted" = true;
UPDATE "Activity" SET "activityStatus" = 'PENDING' WHERE "isCompleted" = false;

-- Drop old column
ALTER TABLE "Activity" DROP COLUMN "isCompleted";
