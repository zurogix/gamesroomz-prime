-- Four-stage progress flow: replace the assessment status values.
-- Every old value maps to 'discovery' (existing rows are test data).

-- CreateEnum
CREATE TYPE "prime"."AssessmentStatus_new" AS ENUM ('discovery', 'discovery-submitted', 'findings', 'plan', 'plan-submitted', 'agreed');

-- AlterTable
ALTER TABLE "prime"."Assessment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "prime"."Assessment" ALTER COLUMN "status" TYPE "prime"."AssessmentStatus_new" USING ('discovery'::"prime"."AssessmentStatus_new");
ALTER TABLE "prime"."AssessmentSnapshot" ALTER COLUMN "status" TYPE "prime"."AssessmentStatus_new" USING ('discovery'::"prime"."AssessmentStatus_new");

-- DropEnum
DROP TYPE "prime"."AssessmentStatus";

-- RenameEnum
ALTER TYPE "prime"."AssessmentStatus_new" RENAME TO "AssessmentStatus";

-- AlterTable
ALTER TABLE "prime"."Assessment" ALTER COLUMN "status" SET DEFAULT 'discovery';
