
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import LogoutButton from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const Header: React.FC = () => {
  const { session } = useSupabase();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si clic en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-900">
      <div className="font-bold text-lg">Mazeway</div>
      {session ? (
        <div className="relative" ref={menuRef}>
          <Button
            className="rounded-full bg-gray-200 px-4 py-2 text-sm font-medium text-black"
            onClick={() => setOpen((v) => !v)}
          >
            User
          </Button>
          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50 flex flex-col">
              <Link href="/account" passHref legacyBehavior>
                <Button asChild variant="ghost" className="justify-start w-full rounded-none">
                  <a className="block px-4 py-2 text-left">Mon compte</a>
                </Button>
              </Link>
              <div className="border-t my-1" />
              <div className="px-4 py-2">
                <LogoutButton />
              </div>
            </div>
          )}
        </div>
      ) : null}
    </header>
  );
};
