-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "prime";

-- CreateEnum
CREATE TYPE "prime"."Role" AS ENUM ('product', 'developer');

-- CreateEnum
CREATE TYPE "prime"."AssessmentStatus" AS ENUM ('draft', 'assessment-complete', 'planning', 'submitted', 'changes-requested', 'agreed');

-- CreateTable
CREATE TABLE "prime"."Profile" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "prime"."Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prime"."Game" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prime"."Assessment" (
    "id" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "state" JSONB NOT NULL,
    "status" "prime"."AssessmentStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prime"."AssessmentSnapshot" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "status" "prime"."AssessmentStatus" NOT NULL,
    "state" JSONB NOT NULL,
    "createdById" UUID NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AssessmentSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "prime"."Profile"("email");

-- CreateIndex
CREATE INDEX "Game_deletedAt_idx" ON "prime"."Game"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_gameId_key" ON "prime"."Assessment"("gameId");

-- CreateIndex
CREATE INDEX "AssessmentSnapshot_assessmentId_createdAt_idx" ON "prime"."AssessmentSnapshot"("assessmentId", "createdAt");

-- AddForeignKey
ALTER TABLE "prime"."Game" ADD CONSTRAINT "Game_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "prime"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prime"."Assessment" ADD CONSTRAINT "Assessment_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "prime"."Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prime"."Assessment" ADD CONSTRAINT "Assessment_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "prime"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prime"."AssessmentSnapshot" ADD CONSTRAINT "AssessmentSnapshot_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "prime"."Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prime"."AssessmentSnapshot" ADD CONSTRAINT "AssessmentSnapshot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "prime"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

