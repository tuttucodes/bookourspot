'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Calendar,
  User,
  LayoutDashboard,
  Users,
  Receipt,
  ReceiptText,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function BottomNav() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const isMerchant = profile?.role === 'merchant';

  const customerLinks = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/explore', icon: Search, label: 'Explore' },
    { href: '/bookings', icon: Calendar, label: 'Bookings' },
    { href: '/loyalty', icon: Sparkles, label: 'Rewards' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  // Merchant nav keeps POS + Receipts front-and-centre — they are daily work.
  // Services / clients / analytics stay accessible from /dashboard home grid.
  const merchantLinks = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { href: '/dashboard/bookings', icon: Calendar, label: 'Bookings' },
    { href: '/dashboard/pos', icon: Receipt, label: 'POS' },
    { href: '/dashboard/receipts', icon: ReceiptText, label: 'Receipts' },
    { href: '/dashboard/staff', icon: Users, label: 'Staff' },
    { href: '/dashboard/settings', icon: User, label: 'Settings' },
  ];

  const links = isMerchant ? merchantLinks : customerLinks;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 safe-area-bottom sm:px-4 md:inset-x-auto md:bottom-auto md:left-4 md:top-1/2 md:w-auto md:-translate-y-1/2 md:px-0 md:pb-0 lg:left-6">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-1 rounded-2xl border border-[#e5e2e1] bg-white/95 p-1.5 shadow-ambient backdrop-blur md:mx-0 md:w-24 md:max-w-none md:flex-col md:gap-2 md:rounded-[2rem] md:p-2">
        {links.map(({ href, icon: Icon, label }) => {
          const active =
            pathname === href ||
            (href !== '/' && href !== '/dashboard' && pathname.startsWith(href)) ||
            (href === '/dashboard' && pathname === '/dashboard');
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-center transition-all md:w-full md:flex-none md:rounded-2xl md:px-2 md:py-3
                ${active
                  ? 'bg-[#f4d9ff] text-[#580087] shadow-sm'
                  : 'text-[#6e797c] hover:bg-[#f6f3f2] hover:text-[#1c1b1b]'}`}
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
