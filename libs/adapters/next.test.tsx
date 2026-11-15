import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouteAnchor, useRouteLink, useRoutePathname } from '@/libs/hooks/routeContext';

vi.mock('next/navigation', () => ({ usePathname: () => '/from-next' }));
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children?: React.ReactNode }) => (
    <a data-next-link href={href} {...rest}>
      {children}
    </a>
  ),
}));

const { NextRouteAdapter } = await import('./next');

function Probe() {
  const pathname = useRoutePathname();
  const hasLink = useRouteLink() !== undefined;
  return (
    <>
      <p>path {String(pathname)}</p>
      <p>{hasLink ? 'has link' : 'no link'}</p>
      <RouteAnchor href="/home">home</RouteAnchor>
    </>
  );
}

describe('NextRouteAdapter', () => {
  it('provides the Next pathname and next/link', () => {
    render(
      <NextRouteAdapter>
        <Probe />
      </NextRouteAdapter>,
    );
    expect(screen.getByText('path /from-next')).toBeInTheDocument();
    expect(screen.getByText('has link')).toBeInTheDocument();
    expect(screen.getByText('home')).toHaveAttribute('data-next-link');
    expect(screen.getByText('home')).toHaveAttribute('href', '/home');
  });

  it('leaves components outside it with no pathname and a plain anchor', () => {
    render(<Probe />);
    expect(screen.getByText('path null')).toBeInTheDocument();
    expect(screen.getByText('no link')).toBeInTheDocument();
    expect(screen.getByText('home')).not.toHaveAttribute('data-next-link');
    expect(screen.getByText('home')).toHaveAttribute('href', '/home');
  });
});
