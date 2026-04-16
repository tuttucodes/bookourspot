'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Calendar, User, LayoutDashboard, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function BottomNav() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const isMerchant = profile?.role === 'merchant';

  const customerLinks = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/explore', icon: Search, label: 'Explore' },
    { href: '/bookings', icon: Calendar, label: 'Bookings' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  const merchantLinks = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/bookings', icon: Calendar, label: 'Bookings' },
    { href: '/dashboard/services', icon: Search, label: 'Services' },
    { href: '/dashboard/staff', icon: Users, label: 'Staff' },
    { href: '/dashboard/settings', icon: User, label: 'Settings' },
  ];

  const links = isMerchant ? merchantLinks : customerLinks;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 safe-area-bottom sm:px-4 md:bottom-4 md:px-6">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-1 rounded-2xl border border-gray-200 bg-white/95 p-1.5 shadow-lg shadow-black/5 backdrop-blur md:max-w-3xl md:gap-2 md:rounded-3xl md:p-2">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-center transition-all md:rounded-2xl md:px-3 md:py-2.5
                ${active
                  ? 'bg-violet-50 text-violet-600 shadow-sm'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className="truncate text-[10px] font-medium md:text-[11px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
