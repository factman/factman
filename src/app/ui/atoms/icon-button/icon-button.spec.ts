import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { iconGithub, iconMenu } from '../icon/icons';
import { IconButton } from './icon-button';

describe('IconButton', () => {
  it('is a square tertiary button named by its label, with a 44px hit area', async () => {
    const pressed = vi.fn();
    await render(`<fm-icon-button [icon]="icon" label="Open menu" (pressed)="pressed()" />`, {
      imports: [IconButton],
      componentProperties: { icon: iconMenu, pressed },
    });
    const button = screen.getByRole('button', { name: 'Open menu' });
    expect([...button.classList].sort()).toEqual([
      'fm-btn',
      'fm-btn--icon',
      'fm-btn--md',
      'fm-btn--tertiary',
      'icon-target',
    ]);
    expect(button.querySelector('.fm-btn__label')).toBeNull();
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    await userEvent.setup().click(button);
    expect(pressed).toHaveBeenCalledTimes(1);
  });

  it('passes menu state through for disclosure buttons', async () => {
    await render(IconButton, {
      inputs: { icon: iconMenu, label: 'Menu', ariaExpanded: false, ariaControls: 'nav-panel' },
    });
    const button = screen.getByRole('button', { name: 'Menu', expanded: false });
    expect(button.getAttribute('aria-controls')).toBe('nav-panel');
  });

  it('can be a link, named by its label', async () => {
    await render(IconButton, {
      inputs: { icon: iconGithub, label: 'GitHub', href: 'https://github.com/factman' },
      providers: [provideRouter([])],
    });
    const link = screen.getByRole('link', { name: 'GitHub' });
    expect(link.getAttribute('target')).toBe('_blank');
  });
});
