'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function SsoSessionGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Skip public external routes like public registration or surveys
    if (
      pathname?.startsWith('/install') ||
      pathname?.startsWith('/surveys/') ||
      pathname?.startsWith('/events/') ||
      pathname === '/auth/callback'
    ) {
      return;
    }

    const isCricDomain = window.location.hostname.includes('cric.ac.th');

    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };

    const syncCentralSessionState = () => {
      const token = localStorage.getItem('token');
      const hasCricCookie = document.cookie.split(';').some((c) => c.trim().startsWith('cric_logged_in=true'));
      const ssoSessionToken = getCookie('cric_sso_session');

      if (isCricDomain) {
        // CASE 1: RCMS is currently logged in, but Central Session (cric_logged_in) was terminated/logged out
        if (token && !hasCricCookie) {
          console.warn('[SSO Guard] Central session has been logged out from Panel. Logging out RCMS...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = window.location.origin + '/login?expired=1';
          return;
        }

        // CASE 2: RCMS is NOT logged in, but user has an active Central SSO Session from Panel
        const isLoggedOutUrl = window.location.search.includes('logout=1') || window.location.search.includes('expired=1');
        if (!token && ssoSessionToken && !isLoggedOutUrl) {
          console.log('[SSO Guard] Central SSO session found, performing instant auto-login...');
          fetch('/api/v1/auth/sso/sync-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionToken: ssoSessionToken }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.data?.token) {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                // Notify Navbar and other components in the app
                window.dispatchEvent(new CustomEvent('user-updated', { detail: data.data.user }));
                if (pathname === '/login') {
                  window.location.href = '/dashboard';
                }
              }
            })
            .catch(() => {});
        }
      }
    };

    // Run check immediately
    syncCentralSessionState();

    // Listen on tab focus and visibility change
    const onFocus = () => syncCentralSessionState();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncCentralSessionState();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Periodic heartbeat check every 2.5 seconds
    const interval = setInterval(syncCentralSessionState, 2500);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(interval);
    };
  }, [pathname]);

  return null;
}
