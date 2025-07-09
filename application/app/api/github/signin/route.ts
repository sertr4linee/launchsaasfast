import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

// API route: /api/github/signin
export async function GET(req: NextRequest) {
  // Génère l'URL d'authentification GitHub via Supabase
  const redirectTo = req.nextUrl.origin + "/verify-email";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo,
    },
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  // Redirige le client vers l'URL GitHub
  return NextResponse.redirect(data.url);
}
