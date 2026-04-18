'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/merchants', label: 'Merchants' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/support', label: 'Support' },
];

export function AdminNav({ role, name }: { role: string; name: string | null }) {
  const pathname = usePathname() ?? '';
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/admin" className="font-bold text-gray-900 tracking-tight">
            BookOurSpot · <span className="text-violet-700">Admin</span>
          </Link>
          <div className="flex items-center gap-2 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
            <span className="font-medium text-gray-900">{name ?? 'Admin'}</span>
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-700 border border-violet-200 text-[11px] uppercase tracking-wide">
              {role}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
