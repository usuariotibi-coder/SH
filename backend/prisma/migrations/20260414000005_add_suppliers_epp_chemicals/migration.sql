-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SupplierDocType" AS ENUM ('SUA', 'REPSE', 'DC3', 'IMSS_ALTA', 'ACTA_CONSTITUTIVA', 'POLIZA_SEGURO', 'CONTRATO_SERVICIOS', 'OPINION_SAT', 'OTHER');

-- CreateEnum
CREATE TYPE "SupplierDocStatus" AS ENUM ('PENDING', 'UPLOADED', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EppMovementType" AS ENUM ('ENTRY', 'EXIT', 'ADJUSTMENT', 'RETURN');

-- CreateEnum
CREATE TYPE "ChemicalFileType" AS ENUM ('SDS', 'LABEL');

-- CreateEnum
CREATE TYPE "WasteState" AS ENUM ('SOLID', 'LIQUID', 'SLUDGE', 'GAS');

-- CreateTable Supplier
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rfc" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "productsServices" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable SupplierAccessToken
CREATE TABLE "SupplierAccessToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "supplierId" TEXT NOT NULL,

    CONSTRAINT "SupplierAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable SupplierDocument
CREATE TABLE "SupplierDocument" (
    "id" TEXT NOT NULL,
    "docType" "SupplierDocType" NOT NULL,
    "status" "SupplierDocStatus" NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT,
    "publicId" TEXT,
    "fileName" TEXT,
    "uploadedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "period" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supplierId" TEXT NOT NULL,
    "reviewedById" TEXT,

    CONSTRAINT "SupplierDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable EppItem
CREATE TABLE "EppItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'pieza',
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "partNumber" TEXT,
    "brand" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "EppItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable EppMovement
CREATE TABLE "EppMovement" (
    "id" TEXT NOT NULL,
    "type" "EppMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "employeeName" TEXT,
    "employeeArea" TEXT,
    "reason" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eppItemId" TEXT NOT NULL,
    "registeredById" TEXT NOT NULL,

    CONSTRAINT "EppMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable EppAreaRequirement
CREATE TABLE "EppAreaRequirement" (
    "id" TEXT NOT NULL,
    "areaName" TEXT NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eppItemId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "EppAreaRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable ChemicalProduct
CREATE TABLE "ChemicalProduct" (
    "id" TEXT NOT NULL,
    "tradeName" TEXT NOT NULL,
    "chemicalName" TEXT,
    "casNumber" TEXT,
    "manufacturer" TEXT,
    "supplierId" TEXT,
    "ghsHazardClasses" TEXT[],
    "physicalState" TEXT,
    "storageLocation" TEXT,
    "maxStockKg" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "sdsUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "ChemicalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable ChemicalFile
CREATE TABLE "ChemicalFile" (
    "id" TEXT NOT NULL,
    "fileType" "ChemicalFileType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "productId" TEXT NOT NULL,

    CONSTRAINT "ChemicalFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable HazmatDisposal
CREATE TABLE "HazmatDisposal" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "disposalDate" TIMESTAMP(3) NOT NULL,
    "wasteType" TEXT NOT NULL,
    "wasteState" "WasteState" NOT NULL,
    "quantityKg" DOUBLE PRECISION NOT NULL,
    "manifestNumber" TEXT,
    "transportCompany" TEXT,
    "disposalMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supplierId" TEXT,
    "productId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "HazmatDisposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable HazmatEvidence
CREATE TABLE "HazmatEvidence" (
    "id" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disposalId" TEXT NOT NULL,

    CONSTRAINT "HazmatEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplierAccessToken_token_key" ON "SupplierAccessToken"("token");
CREATE UNIQUE INDEX "SupplierAccessToken_supplierId_key" ON "SupplierAccessToken"("supplierId");
CREATE UNIQUE INDEX "EppAreaRequirement_eppItemId_areaName_companyId_key" ON "EppAreaRequirement"("eppItemId", "areaName", "companyId");
CREATE UNIQUE INDEX "ChemicalFile_productId_fileType_key" ON "ChemicalFile"("productId", "fileType");
CREATE UNIQUE INDEX "HazmatDisposal_folio_key" ON "HazmatDisposal"("folio");

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupplierAccessToken" ADD CONSTRAINT "SupplierAccessToken_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupplierDocument" ADD CONSTRAINT "SupplierDocument_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplierDocument" ADD CONSTRAINT "SupplierDocument_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EppItem" ADD CONSTRAINT "EppItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EppMovement" ADD CONSTRAINT "EppMovement_eppItemId_fkey" FOREIGN KEY ("eppItemId") REFERENCES "EppItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EppMovement" ADD CONSTRAINT "EppMovement_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EppAreaRequirement" ADD CONSTRAINT "EppAreaRequirement_eppItemId_fkey" FOREIGN KEY ("eppItemId") REFERENCES "EppItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EppAreaRequirement" ADD CONSTRAINT "EppAreaRequirement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChemicalProduct" ADD CONSTRAINT "ChemicalProduct_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChemicalProduct" ADD CONSTRAINT "ChemicalProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChemicalFile" ADD CONSTRAINT "ChemicalFile_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ChemicalProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HazmatDisposal" ADD CONSTRAINT "HazmatDisposal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HazmatDisposal" ADD CONSTRAINT "HazmatDisposal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HazmatDisposal" ADD CONSTRAINT "HazmatDisposal_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HazmatDisposal" ADD CONSTRAINT "HazmatDisposal_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ChemicalProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HazmatEvidence" ADD CONSTRAINT "HazmatEvidence_disposalId_fkey" FOREIGN KEY ("disposalId") REFERENCES "HazmatDisposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
