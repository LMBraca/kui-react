'use client';
import { Suspense, lazy, useSyncExternalStore } from 'react';
import { SkeletonCard, SkeletonTableRow } from './Skeleton';
import type { ComponentType, ReactNode } from 'react';

// Lazy-loaded wrappers for heavy components. Import from this file instead of
// the direct path when the component is below-the-fold or conditionally rendered.
// Each renders a Skeleton fallback, and loads its component on the client only:
// the server and the hydration pass render the fallback and never call the loader,
// so Leaflet and the other browser-only libraries are not loaded on the server.
// Plain React.lazy is not enough for that, because it renders on the server too.
// This works under any React framework or none; it does not depend on Next.

/* eslint-disable @typescript-eslint/no-explicit-any */

const subscribe = () => () => {};
const onClientSnapshot = () => true;
const onServerSnapshot = () => false;

/**
 * A component that renders `fallback` on the server and during hydration, then loads
 * the real one with React.lazy. Exported for its tests; the package entry re-exports
 * only the Lazy* wrappers below.
 */
export function clientOnly<P extends object>(
  load: () => Promise<ComponentType<P>>,
  fallback: ReactNode,
): ComponentType<P> {
  const Lazy = lazy(() => load().then((C) => ({ default: C })));
  function LazyClientOnly(props: P) {
    // false on the server and during hydration, true afterwards.
    const onClient = useSyncExternalStore(subscribe, onClientSnapshot, onServerSnapshot);
    return <Suspense fallback={fallback}>{onClient ? <Lazy {...props} /> : fallback}</Suspense>;
  }
  return LazyClientOnly;
}

export const LazyDataTable: ComponentType<any> = clientOnly(
  () => import('./DataTable').then((m) => m.DataTable as any),
  <SkeletonTableRow cols={4} />,
);

export const LazyAdvancedDataTable: ComponentType<any> = clientOnly(
  () => import('./AdvancedDataTable').then((m) => m.AdvancedDataTable as any),
  <SkeletonTableRow cols={4} />,
);

export const LazyServerDataTable: ComponentType<any> = clientOnly(
  () => import('./ServerDataTable').then((m) => m.ServerDataTable as any),
  <SkeletonTableRow cols={4} />,
);

export const LazyDateRangePicker: ComponentType<any> = clientOnly(
  () => import('./DateRangePicker').then((m) => m.DateRangePicker as any),
  <SkeletonCard />,
);

export const LazyMapView: ComponentType<any> = clientOnly(
  () => import('./MapView').then((m) => m.MapView as any),
  <SkeletonCard />,
);

export const LazyVideoPlayer: ComponentType<any> = clientOnly(
  () => import('./VideoPlayer').then((m) => m.VideoPlayer as any),
  <SkeletonCard />,
);

/* eslint-enable @typescript-eslint/no-explicit-any */
