"use client";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  return (
    <button
      className="mt-8 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
      onClick={handleLogout}
    >
      Se déconnecter
    </button>
  );
}
