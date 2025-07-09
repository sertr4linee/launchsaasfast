"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebarLinks = [
  { href: "/account", label: "Account" },
  { href: "/account/security", label: "Security" },
  // Data tab to be added later
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-black text-white">
      <aside className="w-56 border-r border-gray-800 flex flex-col py-8 px-4">
        <nav className="flex flex-col gap-2">
          {sidebarLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded text-left transition-colors ${pathname === link.href ? "bg-gray-800 font-bold" : "hover:bg-gray-900"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
