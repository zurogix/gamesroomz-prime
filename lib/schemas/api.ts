import { z } from "zod";
import { assessmentStateSchema } from "./assessment";

export const idParamsSchema = z.object({ id: z.uuid() });

export const gameNameSchema = z.string().trim().min(1, "Enter a game name.").max(120);

export const createGameSchema = z.object({ name: gameNameSchema });

export const updateGameSchema = z.union([
  z.object({ name: gameNameSchema }).strict(),
  z.object({ deleted: z.literal(true) }).strict(),
]);

export const saveAssessmentSchema = z.object({
  state: assessmentStateSchema,
  version: z.number().int().min(1),
});

export const roleSchema = z.enum(["product", "developer"]);

export const inviteMemberSchema = z.object({
  email: z.email("Enter a valid email address.").max(254),
  name: z.string().trim().min(1, "Enter a name.").max(120),
  role: roleSchema,
});

export const updateMemberSchema = z.union([
  z.object({ role: roleSchema }).strict(),
  z.object({ removed: z.literal(true) }).strict(),
]);
