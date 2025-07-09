"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { User, Shield, Database, Bell, CreditCard, Users } from "lucide-react"
import { Header } from "@/components/Header"

const sidebarLinks = [
  {
    href: "/account",
    label: "Profile",
    icon: User,
    description: "Manage your personal information",
  },
  {
    href: "/account/security",
    label: "Security",
    icon: Shield,
    description: "Two-factor authentication and security settings",
  }
]

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <>
      <Header />
      <SidebarProvider>
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
          <Sidebar className="border-r border-slate-200 dark:border-slate-800">
            <SidebarHeader className="border-b border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Account Settings</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account preferences</p>
            </SidebarHeader>
            <SidebarContent className="p-4">
              <SidebarMenu>
                {sidebarLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href
                  return (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton asChild isActive={isActive} className="h-auto p-3">
                        <Link href={link.href} className="flex items-start space-x-3">
                          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{link.label}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {link.description}
                            </div>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <SidebarInset className="flex-1">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <SidebarTrigger />
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
              <nav className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                <span>Account</span>
                <span>/</span>
                <span className="text-slate-900 dark:text-white">
                  {sidebarLinks.find((link) => link.href === pathname)?.label || "Settings"}
                </span>
              </nav>
            </div>
            <div className="flex-1 p-6">
              <div className="max-w-4xl mx-auto">{children}</div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </>
  )
}
