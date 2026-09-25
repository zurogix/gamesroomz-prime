import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STATUSES } from "@/lib/stages";
import { fromDbStatus, toDbStatus } from "./statusMap";

const MIGRATIONS = join(process.cwd(), "prisma", "migrations");
const folder = readdirSync(MIGRATIONS).find((name) => name.endsWith("_four_stage_status"))!;
const sql = readFileSync(join(MIGRATIONS, folder, "migration.sql"), "utf8");

describe("four-stage status migration", () => {
  it("creates the new enum with every current status", () => {
    const values = STATUSES.map((s) => `'${s.value}'`).join(", ");

    expect(sql).toContain(`CREATE TYPE "prime"."AssessmentStatus_new" AS ENUM (${values});`);
    expect(sql).toContain(`ALTER TYPE "prime"."AssessmentStatus_new" RENAME TO "AssessmentStatus";`);
    expect(sql).toContain(`ALTER COLUMN "status" SET DEFAULT 'discovery';`);
  });

  it("maps every old value in both tables to discovery", () => {
    ["Assessment", "AssessmentSnapshot"].forEach((table) => {
      expect(sql).toContain(
        `ALTER TABLE "prime"."${table}" ALTER COLUMN "status" TYPE "prime"."AssessmentStatus_new" USING ('discovery'::"prime"."AssessmentStatus_new");`,
      );
    });
  });

  it("maps every status to the database and back", () => {
    STATUSES.forEach(({ value }) => expect(fromDbStatus(toDbStatus(value))).toBe(value));
  });
});
