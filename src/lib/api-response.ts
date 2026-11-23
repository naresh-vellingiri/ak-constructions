import "server-only";
import { NextResponse } from "next/server";

/**
 * Small helpers so route handlers answer the same way every time: nothing
 * cached (this is admin data), and a bad request distinguished from a failing
 * service. `isInputError` lets each domain say which of its errors means 400.
 */

const NO_STORE = { "Cache-Control": "no-store" };

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

/** 403 (not 401) so a logged-in client is not sent into a re-login loop. */
export const forbidden = () => json({ error: "Forbidden" }, 403);
export const notFound = () => json({ error: "Not found" }, 404);
export const badRequest = (message = "Invalid request.") => json({ error: message }, 400);

export function failure(
  error: unknown,
  isInputError: (e: unknown) => boolean,
  label: string,
  message: string
) {
  if (isInputError(error)) return badRequest((error as Error).message);
  console.error(`${label}:`, error);
  return json({ error: message }, 503);
}

/** Request body as an object, or null when it is missing or not JSON. */
export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
