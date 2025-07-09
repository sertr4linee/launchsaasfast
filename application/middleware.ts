import { updateSession } from "@/utils/middleware";
import { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/account", "/dashboard", "/settings", "/security"],
};
