'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function Header({ title, showBack = false, rightAction }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="app-content flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={() => router.back()} className="p-1 -ml-1 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={22} />
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>
        {rightAction}
      </div>
    </header>
  );
}
