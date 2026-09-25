import { z } from "zod";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password";
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

/** Temporary and new passwords. Messages never echo the value. */
export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
  .max(MAX_PASSWORD_LENGTH, `Use at most ${MAX_PASSWORD_LENGTH} characters.`);

export const createMemberSchema = z.object({
  email: z.email("Enter a valid email address.").max(254),
  name: z.string().trim().min(1, "Enter a name.").max(120),
  role: roleSchema,
  temporaryPassword: passwordSchema,
});

/** An empty body (or no password) means "generate one". */
export const resetPasswordSchema = z.object({ temporaryPassword: passwordSchema.optional() }).strict();

/** Body of POST /api/me/password. */
export const newPasswordSchema = z.object({ password: passwordSchema }).strict();

/** The change-password form: the same rule plus a matching confirmation. */
export const changePasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "The two passwords don't match.", path: ["confirm"] });

export const updateMemberSchema = z.union([
  z.object({ role: roleSchema }).strict(),
  z.object({ removed: z.literal(true) }).strict(),
]);
