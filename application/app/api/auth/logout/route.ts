import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabaseClient";

export async function POST() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ message: "Déconnexion réussie." });
}
