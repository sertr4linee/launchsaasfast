import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabaseClient";

// API route: /api/2fa/enable
export async function POST(req: NextRequest) {
  // Récupère le token d'accès de l'utilisateur (via header Authorization: Bearer ...)
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const access_token = authHeader.replace("Bearer ", "");

  // Crée un client Supabase et injecte le token utilisateur
  const supabase = createClient();
  await supabase.auth.setSession({ access_token, refresh_token: "" });

  // Nettoie les facteurs TOTP non vérifiés
  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (factors?.all) {
    const unverifiedTotpFactors = factors.all.filter(
      (f: any) => f.factor_type === "totp" && f.status === "unverified"
    );
    for (const factor of unverifiedTotpFactors) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  // Compte les TOTP vérifiés pour le friendlyName
  const totpFactors = factors?.all?.filter(
    (f: any) => f.factor_type === "totp" && f.status === "verified"
  ) || [];
  const totpIndex = totpFactors.length + 1;

  // Enroll TOTP
  const { data: factorData, error: factorError } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `Authenticator ${totpIndex}`
  });
  if (factorError) {
    return NextResponse.json({ error: factorError.message }, { status: 500 });
  }
  return NextResponse.json({
    qr_code: factorData.totp.qr_code,
    secret: factorData.totp.secret,
    factor_id: factorData.id,
  });
}
