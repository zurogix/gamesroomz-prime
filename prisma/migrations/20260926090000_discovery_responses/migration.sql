-- Discovery answers move from the shared assessment state to one response per developer,
-- and the game-level "discovery-submitted" status is removed (submission is now per developer).
-- Existing answers inside Assessment.state are test data and are not migrated; they remain in
-- existing AssessmentSnapshot rows.

-- AssessmentStatus without 'discovery-submitted': rows in that status go back to 'discovery'.
CREATE TYPE "prime"."AssessmentStatus_new" AS ENUM ('discovery', 'findings', 'plan', 'plan-submitted', 'agreed');

ALTER TABLE "prime"."Assessment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "prime"."Assessment" ALTER COLUMN "status" TYPE "prime"."AssessmentStatus_new"
  USING (CASE WHEN "status"::text = 'discovery-submitted' THEN 'discovery' ELSE "status"::text END)::"prime"."AssessmentStatus_new";
ALTER TABLE "prime"."AssessmentSnapshot" ALTER COLUMN "status" TYPE "prime"."AssessmentStatus_new"
  USING (CASE WHEN "status"::text = 'discovery-submitted' THEN 'discovery' ELSE "status"::text END)::"prime"."AssessmentStatus_new";

DROP TYPE "prime"."AssessmentStatus";
ALTER TYPE "prime"."AssessmentStatus_new" RENAME TO "AssessmentStatus";
ALTER TABLE "prime"."Assessment" ALTER COLUMN "status" SET DEFAULT 'discovery';

-- CreateEnum
CREATE TYPE "prime"."DiscoveryStatus" AS ENUM ('in-progress', 'submitted');

-- CreateTable
CREATE TABLE "prime"."DiscoveryResponse" (
    "id" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "answers" JSONB NOT NULL,
    "status" "prime"."DiscoveryStatus" NOT NULL DEFAULT 'in-progress',
    "version" INTEGER NOT NULL DEFAULT 1,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DiscoveryResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscoveryResponse_gameId_profileId_idx" ON "prime"."DiscoveryResponse"("gameId", "profileId");

-- One active response per game and developer; removed (soft-deleted) rows do not count.
-- Not expressible in schema.prisma, so it lives only here.
CREATE UNIQUE INDEX "DiscoveryResponse_gameId_profileId_active_key" ON "prime"."DiscoveryResponse"("gameId", "profileId") WHERE "deletedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "prime"."DiscoveryResponse" ADD CONSTRAINT "DiscoveryResponse_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "prime"."Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prime"."DiscoveryResponse" ADD CONSTRAINT "DiscoveryResponse_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "prime"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
