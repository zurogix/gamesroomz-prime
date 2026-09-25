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
