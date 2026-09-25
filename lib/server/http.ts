import { NextResponse } from "next/server";
import { z } from "zod";

const MAX_BODY_BYTES = 2 * 1024 * 1024;
export const GENERIC_ERROR = "Something went wrong. Please try again.";

export type Result<T> = { ok: true; value: T } | { ok: false; response: NextResponse };

export function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/** Runs a route body, logging unexpected failures without exposing their details. */
export async function handle(label: string, run: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await run();
  } catch (err) {
    console.error(`[api] ${label} failed`, err);
    return jsonError(500, GENERIC_ERROR);
  }
}

function firstIssue(error: z.ZodError) {
  const issue = error.issues[0];
  const path = issue?.path.join(".");
  return path ? `Invalid ${path}: ${issue.message}` : issue?.message ?? "Invalid request.";
}

export function parseWith<T>(schema: z.ZodType<T>, input: unknown): Result<T> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, response: jsonError(400, firstIssue(parsed.error)) };
}

/** Reads and validates a JSON body, rejecting oversized or malformed requests. */
export async function parseBody<T>(request: Request, schema: z.ZodType<T>): Promise<Result<T>> {
  const size = Number(request.headers.get("content-length") ?? 0);
  if (size > MAX_BODY_BYTES) return { ok: false, response: jsonError(413, "The request is too large.") };
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return { ok: false, response: jsonError(413, "The request is too large.") };
  try {
    return parseWith(schema, JSON.parse(raw));
  } catch {
    return { ok: false, response: jsonError(400, "The request body must be valid JSON.") };
  }
}

/** Turns a refusal from the pure permission rules into an { error } response. */
export function refuse(refusal: { status: number; error: string }) {
  return jsonError(refusal.status, refusal.error);
}
