import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabaseClient";

// API route: /api/google/signin
export async function GET(req: NextRequest) {
  // Génère l'URL d'authentification Google via Supabase
  const supabase = createClient();
  const redirectTo = req.nextUrl.origin + "/verify-email";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  // Redirige le client vers l'URL Google
  return NextResponse.redirect(data.url);
}
