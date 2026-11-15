'use client';
import { useEffect, useRef } from 'react';
import { useRoutePathname } from '@/libs/hooks/routeContext';

/**
 * Route-aware auto-close: an overlay with `closeOnRouteChange` calls `onClose`
 * when the pathname changes while it is open — the nav-drawer case, where a link
 * inside the drawer navigates client-side and the drawer would otherwise stay
 * over the new page. The pathname comes from the nearest RouteProvider, which the
 * app feeds from its router (Next.js apps mount NextRouteAdapter from the
 * `./next` entry). Query-string changes do not close it: the adapter passes the
 * pathname only, because reading search params would force every statically
 * rendered Next page that shows an overlay into a Suspense boundary. Without a
 * provider the pathname is null, so nothing ever closes, and development builds
 * warn once when an overlay asks for this.
 */

type Options = {
  active: boolean;
  closeOnRouteChange?: boolean;
  onClose: () => void;
};

let warnedNoProvider = false;

export function useRouteClose({ active, closeOnRouteChange, onClose }: Options): void {
  const pathname = useRoutePathname();
  const last = useRef(pathname);

  useEffect(() => {
    if (active && closeOnRouteChange && pathname === null && !warnedNoProvider && process.env.NODE_ENV !== 'production') {
      warnedNoProvider = true;
      console.warn(
        'kui-react: an overlay has closeOnRouteChange, but no RouteProvider gives a pathname, so it will never close on navigation. Mount RouteProvider (or NextRouteAdapter from the ./next entry) at the root.',
      );
    }
  }, [active, closeOnRouteChange, pathname]);

  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    if (active && closeOnRouteChange) onClose();
  }, [pathname, active, closeOnRouteChange, onClose]);
}

/** @internal Lets the tests check the one-time warning more than once. */
export function resetRouteCloseWarningForTests(): void {
  warnedNoProvider = false;
}
