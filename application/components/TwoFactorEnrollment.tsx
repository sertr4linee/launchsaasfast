
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";

export function TwoFactorEnrollment() {
  const [step, setStep] = useState<"idle"|"enrolling"|"show_qr"|"verifying"|"done">("idle");
  const [qr, setQr] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [challengeId, setChallengeId] = useState<string>("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let ignore = false;
    const getSession = async () => {
      setLoadingSession(true);
      const { data } = await supabase.auth.getSession();
      if (!ignore) {
        setSession(data.session);
        setLoadingSession(false);
        console.log("[2FA] Session:", data.session);
      }
    };
    getSession();
    // Listen to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingSession(false);
      console.log("[2FA] Auth state changed, session:", session);
    });
    return () => {
      ignore = true;
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Lance l'enrollment TOTP
  const startEnrollment = async () => {
    setError("");
    setStep("enrolling");
    const token = session?.access_token;
    if (!token) {
      setError("Vous devez être connecté pour activer la 2FA.");
      setStep("idle");
      return;
    }
    const res = await fetch("/api/2fa/enable", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur lors de l'enrollment");
      setStep("idle");
      return;
    }
    setQr(data.qr_code);
    setSecret(data.secret);
    setFactorId(data.factor_id);
    setStep("show_qr");
  };

  // Lance le challenge MFA
  const startChallenge = async () => {
    setError("");
    setStep("verifying");
    const { data, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factorId });
    if (challengeError || !data) {
      setError(challengeError?.message || "Erreur challenge");
      setStep("show_qr");
      return;
    }
    setChallengeId(data.id);
  };

  // Vérifie le code TOTP
  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch("/api/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code, factor_id: factorId, challenge_id: challengeId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Code invalide");
      return;
    }
    setSuccess(true);
    setStep("done");
  };

  return (
    <div className="bg-gray-800 p-6 rounded">
      {loadingSession ? (
        <div>Chargement de la session...</div>
      ) : !session ? (
        <div className="text-red-400">
          Vous devez être connecté pour activer la 2FA.<br/>
          <span className='text-xs'>Debug: aucune session détectée côté client.<br/>
          Vérifiez que vous êtes bien connecté côté client.<br/>
          Si vous utilisez Next.js App Router, assurez-vous que l'authentification est propagée côté client (voir SupabaseProvider ou cookies).</span>
        </div>
      ) : (
        <>
          {step === "idle" && (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={startEnrollment}
              disabled={!session}
            >
              Activer l'authentificateur
            </button>
          )}
          {step === "enrolling" && <p>Génération du QR code...</p>}
          {step === "show_qr" && (
            <div>
              <p className="mb-2">Scanne ce QR code avec ton application d'authentification (Google Authenticator, etc.) :</p>
              <img src={qr} alt="QR code 2FA" className="mx-auto my-4" />
              <p className="text-xs text-gray-400 mb-2">Ou entre ce secret manuellement : <span className="font-mono">{secret}</span></p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded mt-2" onClick={startChallenge}>
                J'ai scanné le QR code
              </button>
            </div>
          )}
          {step === "verifying" && (
            <form onSubmit={verifyCode} className="mt-4">
              <label className="block mb-2">Entre le code à 6 chiffres de ton application :</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                maxLength={6}
                className="w-32 px-2 py-1 rounded text-black"
                required
                pattern="[0-9]{6}"
              />
              <button type="submit" className="ml-4 bg-green-600 text-white px-4 py-2 rounded">Valider</button>
            </form>
          )}
          {step === "done" && success && (
            <div className="text-green-400 font-bold">2FA activée avec succès !</div>
          )}
          {error && <div className="text-red-400 mt-4">{error}</div>}
        </>
      )}
    </div>
  );
}
