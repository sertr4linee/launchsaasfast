import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabaseClient";

// API route: /api/2fa/verify
export async function POST(req: NextRequest) {
  // Récupère le token d'accès de l'utilisateur (via header Authorization: Bearer ...)
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const access_token = authHeader.replace("Bearer ", "");

  // Récupère le code TOTP, l'id du facteur et le challengeId depuis le body
  const { code, factor_id, challenge_id } = await req.json();
  if (!code || !factor_id || !challenge_id) {
    return NextResponse.json({ error: "Code, factor_id ou challenge_id manquant" }, { status: 400 });
  }

  // Crée un client Supabase avec le token utilisateur
  const supabase = createClient(access_token);

  // Vérifie le code TOTP avec challengeId
  const { error } = await supabase.auth.mfa.verify({ factorId: factor_id, challengeId: challenge_id, code });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
