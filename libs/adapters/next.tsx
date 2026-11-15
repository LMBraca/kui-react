'use client';
import { usePathname } from 'next/navigation';
import NextLink from 'next/link';
import type { ReactNode } from 'react';
import { RouteProvider } from '@/libs/hooks/routeContext';
import type { RouteLink } from '@/libs/hooks/routeContext';

/**
 * Feeds kui-react's RouteProvider from the Next.js App Router: the pathname from
 * usePathname and next/link for client-side navigation. Mount it once near the
 * root of a Next.js app, around everything that renders kui-react overlays or
 * NotFoundPage. This is the only kui-react module that imports Next, and it is
 * published on its own entry, `@kuraykaraaslan/kui-react/next`, so the other
 * entries work without Next installed.
 */
export function NextRouteAdapter({ children }: { children?: ReactNode }) {
  return (
    <RouteProvider pathname={usePathname()} Link={NextLink as RouteLink}>
      {children}
    </RouteProvider>
  );
}
