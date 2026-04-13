'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Calendar, User, LayoutDashboard } from 'lucide-react';
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
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  const links = isMerchant ? merchantLinks : customerLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors
                ${active ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
