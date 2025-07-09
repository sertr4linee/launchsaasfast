// Utilitaire pour récupérer l'ID de session device depuis le cookie ou la requête
import { NextRequest } from "next/server";

export function getCurrentDeviceSessionId(request: NextRequest): string | null {
  // Exemple : récupérer un cookie spécifique (à adapter selon ton projet)
  const cookie = request.cookies.get('sb-device-session');
  return cookie ? cookie.value : null;
}
