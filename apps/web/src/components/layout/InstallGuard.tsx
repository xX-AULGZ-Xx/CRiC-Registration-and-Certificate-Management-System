'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';

export default function InstallGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Skip checking on install page or survey pages
    if (pathname === '/install' || pathname?.startsWith('/surveys')) {
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetchApi('/api/v1/install/status');
        if (res.success && res.data && res.data.is_installed === false) {
          router.replace('/install');
        }
      } catch (err) {
        // Silently ignore network error
      }
    };

    checkStatus();
  }, [pathname, router]);

  return <>{children}</>;
}
