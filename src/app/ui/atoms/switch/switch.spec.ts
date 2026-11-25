import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { Switch } from './switch';

describe('Switch', () => {
  it('is a native switch (no hand-set aria-checked) that updates the form', async () => {
    const control = new FormControl(false);
    await render(`<fm-switch label="Analytics cookies" [formControl]="control" />`, {
      imports: [Switch, ReactiveFormsModule],
      componentProperties: { control },
    });
    const sw = screen.getByRole('switch', { name: 'Analytics cookies' });
    expect((sw as HTMLInputElement).checked).toBe(false);
    // The native switch attribute, with role="switch" as the fallback; the state is the input's own (ETE-248).
    expect(sw.hasAttribute('switch')).toBe(true);
    expect(sw.hasAttribute('aria-checked')).toBe(false);
    await userEvent.click(sw);
    expect(control.value).toBe(true);
    expect((sw as HTMLInputElement).checked).toBe(true);
    expect(sw.closest('.fm-switch')?.classList).toContain('is-on');
  });

  it('toggles with the keyboard', async () => {
    await render(Switch, { inputs: { label: 'Marketing' } });
    const sw = screen.getByRole('switch', { name: 'Marketing' });
    sw.focus();
    await userEvent.keyboard(' ');
    expect((sw as HTMLInputElement).checked).toBe(true);
  });

  it('shows the size, error and disabled states', async () => {
    await render(Switch, {
      inputs: { label: 'Required', size: 'lg', invalid: true, disabled: true },
    });
    const sw = screen.getByRole('switch', { name: 'Required' });
    expect(sw).toHaveProperty('disabled', true);
    expect([...(sw.closest('.fm-switch') as HTMLElement).classList].sort()).toEqual([
      'fm-switch',
      'fm-switch--lg',
      'is-disabled',
      'is-error',
    ]);
  });
});
