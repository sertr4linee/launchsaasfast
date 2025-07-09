import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password, access_token } = await req.json();
  if (!access_token || !password) {
    return NextResponse.json({ error: "Token ou mot de passe manquant." }, { status: 400 });
  }
  // Appel direct à l'API Supabase REST pour update le mot de passe
  const res = await fetch(
    process.env.NEXT_PUBLIC_SUPABASE_URL + "/auth/v1/user",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      },
      body: JSON.stringify({ password }),
    }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ error: data.error_description || data.error || "Erreur inconnue" }, { status: 400 });
  }
  return NextResponse.json({ message: "Mot de passe réinitialisé avec succès." });
}
