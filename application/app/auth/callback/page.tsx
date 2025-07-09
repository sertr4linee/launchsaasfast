"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Handles the OAuth callback
    const handleCallback = async () => {
      // Supabase automatically handles the session from the URL fragment
      // Optionally, you can fetch the session to ensure it's set
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        // Optionally handle error
        router.replace("/login?error=oauth_callback");
        return;
      }
      // Redirect to dashboard or home
      router.replace("/account");
    };
    handleCallback();
  }, [router, supabase]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-white text-lg">Connexion en cours...</div>
    </div>
  );
}
