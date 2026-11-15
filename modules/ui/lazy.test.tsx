import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { clientOnly, LazyDataTable, LazyMapView } from './lazy';

function Loaded({ label }: { label: string }) {
  return <p>loaded {label}</p>;
}

describe('lazy wrappers', () => {
  it('show the fallback, then the component with its props, on the client', async () => {
    const load = vi.fn(() => Promise.resolve(Loaded));
    const Lazy = clientOnly(load, <p>waiting</p>);
    render(<Lazy label="table" />);
    expect(screen.getByText('waiting')).toBeInTheDocument();
    expect(await screen.findByText('loaded table')).toBeInTheDocument();
    expect(screen.queryByText('waiting')).not.toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('render the fallback on the server and never call the loader there', () => {
    const load = vi.fn(() => Promise.resolve(Loaded));
    const Lazy = clientOnly(load, <p>waiting</p>);
    const html = renderToString(<Lazy label="map" />);
    expect(html).toContain('waiting');
    expect(html).not.toContain('loaded');
    expect(load).not.toHaveBeenCalled();
  });

  it('keep the exported wrappers server-safe', () => {
    // MapView pulls in Leaflet, which touches window at import time; the server render must not load it.
    expect(() => renderToString(<LazyMapView />)).not.toThrow();
    expect(() => renderToString(<LazyDataTable columns={[]} data={[]} />)).not.toThrow();
  });
});
