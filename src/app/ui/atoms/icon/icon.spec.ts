import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';

import { Icon } from './icon';
import { IconRegistry, provideIcons } from './icon-registry';
import { iconArrowRight, iconCloud, iconGithub } from './icons';

describe('Icon', () => {
  it('draws an imported outline icon, decorative by default', async () => {
    const { container } = await render(Icon, { inputs: { icon: iconArrowRight } });
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.classList).toContain('fm-icon');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('role')).toBeNull();
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.getAttribute('width')).toBe('24');
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.getAttribute('stroke-width')).toBe(String(iconArrowRight.stroke));
    expect(svg.getAttribute('data-icon')).toBe('arrow-right');
    expect(container.querySelector('path')?.getAttribute('d')).toBe(iconArrowRight.d);
  });

  it('is an image with a name when it has a label', async () => {
    await render(Icon, { inputs: { icon: iconGithub, label: 'GitHub', size: 20 } });
    const svg = screen.getByRole('img', { name: 'GitHub' });
    expect(svg.getAttribute('aria-hidden')).toBeNull();
    expect(svg.getAttribute('width')).toBe('20');
  });

  it('fills brand marks instead of stroking them', async () => {
    const { container } = await render(Icon, { inputs: { icon: iconGithub } });
    expect(iconGithub.fill).toBe(true);
    expect(container.querySelector('svg')?.getAttribute('stroke')).toBe('none');
    expect(container.querySelector('svg')?.getAttribute('stroke-width')).toBeNull();
    expect(container.querySelector('path')?.getAttribute('fill')).toBe('currentColor');
  });

  it('draws a registered icon by name', async () => {
    const { container } = await render(Icon, {
      inputs: { icon: 'cloud' },
      providers: [provideIcons([iconCloud])],
    });
    expect(container.querySelector('svg')?.getAttribute('data-icon')).toBe('cloud');
  });

  it('draws nothing and warns for a name nobody registered', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container } = await render(Icon, { inputs: { icon: 'not-an-icon' } });
    expect(container.querySelector('svg')).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"not-an-icon" is not registered'));
    warn.mockRestore();
  });
});

describe('IconRegistry', () => {
  it('keeps the last definition registered under a name', () => {
    const registry = TestBed.inject(IconRegistry);
    registry.register([iconCloud]);
    registry.register([{ ...iconCloud, d: 'M0 0' }]);
    expect(registry.get('cloud')?.d).toBe('M0 0');
    expect(registry.get('missing')).toBeUndefined();
  });
});
