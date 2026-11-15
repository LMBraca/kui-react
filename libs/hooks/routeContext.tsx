'use client';
import { createContext, createElement, useContext, useMemo } from 'react';
import type { AnchorHTMLAttributes, ComponentType, Context, ReactNode } from 'react';

/**
 * Router-agnostic route information for kui-react components.
 *
 * Components that care about navigation (useRouteClose, NotFoundPage) read the
 * current pathname and the client-side link component from here instead of
 * importing a router. The app mounts one RouteProvider at its root and feeds it
 * from whichever router it uses. Next.js apps mount NextRouteAdapter from
 * `@kuraykaraaslan/kui-react/next`, which does exactly that. Without a provider
 * the pathname is null and links are plain anchors.
 */

/** A client-side link component, such as next/link or a React Router Link. */
export type RouteLink = ComponentType<AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>;

export type RouteValue = {
  /** The current pathname, or null when the app does not provide one. */
  pathname: string | null;
  /** The link component for client-side navigation. Plain anchors when absent. */
  Link?: RouteLink;
};

// Symbol.for, not a module-level createContext: the CJS entries have no shared
// chunks, so each entry would otherwise get its own context and a provider
// mounted from one entry would be invisible to components from another.
const key = Symbol.for('kui.route');
const store = globalThis as unknown as Record<symbol, Context<RouteValue> | undefined>;
const RouteContext: Context<RouteValue> = (store[key] ??= createContext<RouteValue>({ pathname: null }));

export type RouteProviderProps = RouteValue & { children?: ReactNode };

export function RouteProvider({ pathname, Link, children }: RouteProviderProps) {
  const value = useMemo(() => ({ pathname, Link }), [pathname, Link]);
  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}

/** The current pathname from the nearest RouteProvider, or null without one. */
export function useRoutePathname(): string | null {
  return useContext(RouteContext).pathname;
}

/** The client-side link component from the nearest RouteProvider, if it gave one. */
export function useRouteLink(): RouteLink | undefined {
  return useContext(RouteContext).Link;
}

export type RouteAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/**
 * An anchor that navigates through the provider's Link (client-side) when there is
 * one, and is a plain `<a>` otherwise. Use it instead of rendering the result of
 * useRouteLink as JSX, which the React Compiler lint reads as a component created
 * during render.
 */
export function RouteAnchor(props: RouteAnchorProps) {
  return createElement(useRouteLink() ?? 'a', props);
}
