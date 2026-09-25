import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STATUSES } from "@/lib/stages";
import { fromDbStatus, toDbStatus } from "./statusMap";

const MIGRATIONS = join(process.cwd(), "prisma", "migrations");
const migration = (suffix: string) => {
  const folder = readdirSync(MIGRATIONS).find((name) => name.endsWith(suffix))!;
  return readFileSync(join(MIGRATIONS, folder, "migration.sql"), "utf8");
};

const castTo = (table: string) => `ALTER TABLE "prime"."${table}" ALTER COLUMN "status" TYPE "prime"."AssessmentStatus_new"`;

describe("four-stage status migration", () => {
  const sql = migration("_four_stage_status");

  it("mapped every earlier value in both tables to discovery", () => {
    ["Assessment", "AssessmentSnapshot"].forEach((table) => {
      expect(sql).toContain(`${castTo(table)} USING ('discovery'::"prime"."AssessmentStatus_new");`);
    });
  });
});

describe("discovery responses migration", () => {
  const sql = migration("_discovery_responses");

  it("recreates the status enum with exactly the current statuses", () => {
    const values = STATUSES.map((s) => `'${s.value}'`).join(", ");

    expect(sql).toContain(`CREATE TYPE "prime"."AssessmentStatus_new" AS ENUM (${values});`);
    expect(sql).not.toMatch(/ENUM \([^)]*'discovery-submitted'/);
    expect(sql).toContain(`ALTER TYPE "prime"."AssessmentStatus_new" RENAME TO "AssessmentStatus";`);
    expect(sql).toContain(`ALTER COLUMN "status" SET DEFAULT 'discovery';`);
  });

  it("maps old 'discovery-submitted' rows to 'discovery' in both tables and keeps the rest", () => {
    ["Assessment", "AssessmentSnapshot"].forEach((table) => {
      expect(sql).toContain(`${castTo(table)}\n  USING (CASE WHEN "status"::text = 'discovery-submitted' THEN 'discovery' ELSE "status"::text END)`);
    });
  });

  it("allows one active response per game and developer (partial unique index)", () => {
    expect(sql).toContain(
      `CREATE UNIQUE INDEX "DiscoveryResponse_gameId_profileId_active_key" ON "prime"."DiscoveryResponse"("gameId", "profileId") WHERE "deletedAt" IS NULL;`,
    );
    expect(sql).toContain(`CREATE TYPE "prime"."DiscoveryStatus" AS ENUM ('in-progress', 'submitted');`);
  });

  it("maps every status to the database and back", () => {
    STATUSES.forEach(({ value }) => expect(fromDbStatus(toDbStatus(value))).toBe(value));
  });
});
