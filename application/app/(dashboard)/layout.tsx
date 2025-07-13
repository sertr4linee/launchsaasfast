'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Home, 
  Shield, 
  Settings, 
  User, 
  Lock, 
  Activity,
  Menu,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth.tsx';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Appareils',
    href: '/dashboard/devices',
    icon: Shield,
  },
  {
    title: 'Paramètres',
    href: '/dashboard/settings',
    icon: Settings,
    children: [
      {
        title: 'Profil',
        href: '/dashboard/settings',
        icon: User,
      },
      {
        title: 'Sécurité',
        href: '/dashboard/settings/security',
        icon: Lock,
      },
      {
        title: 'Sessions',
        href: '/dashboard/settings/sessions',
        icon: Activity,
      },
    ],
  },
];

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

function Sidebar({ className, isMobile, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, signout } = useAuth();

  const handleSignOut = async () => {
    await signout();
    if (onClose) onClose();
  };

  return (
    <div className={cn('pb-12', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              LaunchSaasFast
            </h2>
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <div key={item.href}>
                  <Link href={item.href} onClick={onClose}>
                    <Button
                      variant={pathname === item.href ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                  {item.children && pathname.startsWith(item.href) && (
                    <div className="ml-4 space-y-1 mt-1">
                      {item.children.map((child) => (
                        <Link key={child.href} href={child.href} onClick={onClose}>
                          <Button
                            variant={pathname === child.href ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start"
                          >
                            <child.icon className="mr-2 h-3 w-3" />
                            {child.title}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* User info and logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium truncate">
              {user?.email || 'Utilisateur'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="flex items-center justify-between p-4 border-b lg:hidden">
          <h1 className="text-lg font-semibold">LaunchSaasFast</h1>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
        </div>
        <SheetContent side="left" className="p-0 w-72">
          <Sidebar isMobile onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 z-50 border-r">
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="flex-1 lg:pl-72">
          <main className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
