import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { RouteProvider } from '@/libs/hooks/routeContext';
import { resetRouteCloseWarningForTests, useRouteClose } from './useRouteClose';

let pathname: string | null = '/a';

// The pathname comes from a RouteProvider, as an app's router adapter would give it.
function Wrapper({ children }: { children?: ReactNode }) {
  return <RouteProvider pathname={pathname}>{children}</RouteProvider>;
}

describe('useRouteClose', () => {
  beforeEach(() => {
    pathname = '/a';
  });

  const mount = (active: boolean, closeOnRouteChange: boolean | undefined) => {
    const onClose = vi.fn();
    const hook = renderHook((p: { active: boolean }) => useRouteClose({ active: p.active, closeOnRouteChange, onClose }), {
      initialProps: { active },
      wrapper: Wrapper,
    });
    return { onClose, hook };
  };

  it('closes an open, opted-in overlay when the pathname changes', () => {
    const { onClose, hook } = mount(true, true);
    expect(onClose).not.toHaveBeenCalled();
    pathname = '/b';
    hook.rerender({ active: true });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does nothing without the opt-in, while closed, or on a re-render at the same path', () => {
    const optOut = mount(true, undefined);
    const closed = mount(false, true);
    const same = mount(true, true);
    same.hook.rerender({ active: true });
    expect(same.onClose).not.toHaveBeenCalled();
    pathname = '/b';
    optOut.hook.rerender({ active: true });
    closed.hook.rerender({ active: false });
    expect(optOut.onClose).not.toHaveBeenCalled();
    expect(closed.onClose).not.toHaveBeenCalled();
  });

  it('opening later does not close for a path change that happened while closed', () => {
    const { onClose, hook } = mount(false, true);
    pathname = '/b';
    hook.rerender({ active: false });
    hook.rerender({ active: true });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('useRouteClose without a RouteProvider', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  beforeEach(() => {
    resetRouteCloseWarningForTests();
    warn.mockClear();
  });
  afterEach(() => warn.mockClear());

  it('never closes, and warns once in development when an open overlay opted in', () => {
    const onClose = vi.fn();
    const a = renderHook(() => useRouteClose({ active: true, closeOnRouteChange: true, onClose }));
    a.rerender();
    renderHook(() => useRouteClose({ active: true, closeOnRouteChange: true, onClose }));
    expect(onClose).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('RouteProvider');
  });

  it('stays quiet when nothing opted in', () => {
    renderHook(() => useRouteClose({ active: true, closeOnRouteChange: false, onClose: vi.fn() }));
    renderHook(() => useRouteClose({ active: false, closeOnRouteChange: true, onClose: vi.fn() }));
    expect(warn).not.toHaveBeenCalled();
  });
});
