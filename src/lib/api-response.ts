import { connection, NextResponse } from "next/server";
import mongoose from "mongoose";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errors: Array<{ field?: string; message: string }> = [],
    readonly headers?: HeadersInit,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiSuccess<T>(data: T, message = "Request completed successfully", status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function apiFailure(
  message: string,
  status = 500,
  errors: Array<{ field?: string; message: string }> = [],
  headers?: HeadersInit,
) {
  return NextResponse.json({ success: false, message, errors }, { status, headers });
}

export async function handleApiError(error: unknown): Promise<NextResponse> {
  if (error instanceof ApiError) {
    return apiFailure(error.message, error.status, error.errors, error.headers);
  }
  if (error instanceof ZodError) {
    return apiFailure("Please check the submitted information.", 400, error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })));
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return apiFailure("Submitted data did not pass database validation.", 400, Object.entries(error.errors).map(([field, issue]) => ({
      field,
      message: issue.message,
    })));
  }
  if (error instanceof mongoose.Error.CastError || (error instanceof Error && error.name === "StrictModeError")) {
    return apiFailure("Submitted data contains an invalid value.", 400);
  }

  if (isDuplicateKeyError(error)) {
    return apiFailure("A record with the provided details already exists.", 409);
  }

  if (error instanceof Error && (error.message.includes("MONGODB_URI") || error.name.startsWith("Mongo") || error.name.startsWith("Mongoose"))) {
    console.error("Database API error", error);
    return apiFailure("Database service is temporarily unavailable.", 503);
  }

  console.error("Unhandled API error", error);
  return apiFailure("An unexpected error occurred. Please try again later.", 500);
}

export function withApiErrors<Args extends unknown[]>(
  handler: (request: Request, ...args: Args) => Promise<Response>,
): (request: Request, ...args: Args) => Promise<Response> {
  return async (request, ...args) => {
    await connection();
    try {
      return await handler(request, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}
