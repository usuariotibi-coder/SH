-- CreateEnum
CREATE TYPE "BrigadeType" AS ENUM ('FIRST_AID', 'EVACUATION', 'FIRE_FIGHTING', 'SEARCH_RESCUE');

-- CreateEnum
CREATE TYPE "BrigadeMemberRole" AS ENUM ('COORDINATOR', 'DEPUTY', 'MEMBER');

-- CreateTable Brigade
CREATE TABLE "Brigade" (
    "id" TEXT NOT NULL,
    "type" "BrigadeType" NOT NULL,
    "description" TEXT,
    "objectives" TEXT,
    "meetingPoint" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Brigade_pkey" PRIMARY KEY ("id")
);

-- CreateTable BrigadeMember
CREATE TABLE "BrigadeMember" (
    "id" TEXT NOT NULL,
    "memberRole" "BrigadeMemberRole" NOT NULL DEFAULT 'MEMBER',
    "employeeName" TEXT NOT NULL,
    "employeeArea" TEXT,
    "employeePosition" TEXT,
    "phone" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "certificationDate" TIMESTAMP(3),
    "certificationExpiry" TIMESTAMP(3),
    "notes" TEXT,
    "brigadeId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "BrigadeMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brigade_companyId_type_key" ON "Brigade"("companyId", "type");

-- AddForeignKey
ALTER TABLE "Brigade" ADD CONSTRAINT "Brigade_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrigadeMember" ADD CONSTRAINT "BrigadeMember_brigadeId_fkey" FOREIGN KEY ("brigadeId") REFERENCES "Brigade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrigadeMember" ADD CONSTRAINT "BrigadeMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
