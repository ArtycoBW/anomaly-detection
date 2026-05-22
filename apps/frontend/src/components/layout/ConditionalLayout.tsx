'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

const FULL_PAGE_ROUTES = ['/landing'];

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullPage = FULL_PAGE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));

  if (isFullPage) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 lg:p-10 relative z-10">
        {children}
      </main>
    </div>
  );
}
