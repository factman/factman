import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('toggles from its label and updates the form', async () => {
    const control = new FormControl(false);
    await render(`<fm-checkbox label="I agree to the privacy policy" [formControl]="control" />`, {
      imports: [Checkbox, ReactiveFormsModule],
      componentProperties: { control },
    });
    const box = screen.getByRole('checkbox', { name: 'I agree to the privacy policy' });
    await userEvent.click(screen.getByText('I agree to the privacy policy'));
    expect(control.value).toBe(true);
    expect(box).toHaveProperty('checked', true);
    expect(document.querySelector('.fm-check__box')?.classList).toContain('is-on');
  });

  it('links the description and an outside hint', async () => {
    await render(Checkbox, {
      inputs: {
        label: 'Analytics',
        description: 'Anonymous page views',
        ariaDescribedby: 'consent-error',
        inputId: 'analytics',
        invalid: true,
      },
    });
    const box = screen.getByRole('checkbox', { name: 'Analytics Anonymous page views' });
    expect(box.getAttribute('aria-describedby')).toBe('analytics-desc consent-error');
    expect(box.getAttribute('aria-invalid')).toBe('true');
  });

  it('cannot be changed while disabled', async () => {
    const control = new FormControl({ value: true, disabled: true });
    await render(`<fm-checkbox label="Required cookies" [formControl]="control" />`, {
      imports: [Checkbox, ReactiveFormsModule],
      componentProperties: { control },
    });
    const box = screen.getByRole('checkbox', { name: 'Required cookies' });
    expect(box).toHaveProperty('disabled', true);
    await userEvent.click(box);
    expect(control.value).toBe(true);
  });
});
