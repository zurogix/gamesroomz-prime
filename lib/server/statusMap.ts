import { AssessmentStatus as DbStatus } from "@prisma/client";
import type { AssessmentStatus } from "@/lib/types";

const TO_DB: Record<AssessmentStatus, DbStatus> = {
  discovery: DbStatus.discovery,
  "discovery-submitted": DbStatus.discovery_submitted,
  findings: DbStatus.findings,
  plan: DbStatus.plan,
  "plan-submitted": DbStatus.plan_submitted,
  agreed: DbStatus.agreed,
};

const FROM_DB = Object.fromEntries(Object.entries(TO_DB).map(([app, db]) => [db, app])) as Record<DbStatus, AssessmentStatus>;

export const toDbStatus = (status: AssessmentStatus): DbStatus => TO_DB[status];
export const fromDbStatus = (status: DbStatus): AssessmentStatus => FROM_DB[status];
