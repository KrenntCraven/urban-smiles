import { NextResponse } from "next/server";
import { AdminServiceError } from "./service";
import { FastApiError } from "./fastapi";

export function jsonError(error: unknown) {
  if (error instanceof AdminServiceError || error instanceof FastApiError) {
    return NextResponse.json(
      { detail: error.message },
      { status: error.status },
    );
  }
  console.error(error);
  return NextResponse.json(
    { detail: "Something went wrong." },
    { status: 500 },
  );
}
