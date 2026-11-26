import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';

import { Checkbox } from '@ui/atoms/checkbox/checkbox';
import { TextInput } from '@ui/atoms/text-input/text-input';

import { FormField } from './form-field';

describe('FormField', () => {
  it('labels the control inside it and links the hint', async () => {
    await render(
      `<fm-form-field label="Email" hint="I'll only use it to reply" [required]="true">
         <fm-text-input type="email" />
       </fm-form-field>`,
      { imports: [FormField, TextInput] },
    );
    const input = screen.getByRole('textbox', { name: /Email/ });
    expect(input).toHaveProperty('required', true);
    const hint = screen.getByText("I'll only use it to reply");
    expect(input.getAttribute('aria-describedby')).toBe(hint.id);
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('shows the error instead of the hint, announced and linked', async () => {
    const { rerender } = await render(
      `<fm-form-field label="Email" hint="Your work email" [error]="error"><fm-text-input /></fm-form-field>`,
      { imports: [FormField, TextInput], componentProperties: { error: '' } },
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    await rerender({
      componentProperties: { error: 'Enter an email address like name@example.com' },
    });
    const error = screen.getByText('Enter an email address like name@example.com');
    const region = error.closest('[aria-live="polite"]') as HTMLElement;
    expect(region).toBeTruthy();
    expect(input.getAttribute('aria-describedby')).toBe(region.id);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.queryByText('Your work email')).toBeNull();
    expect(input.closest('.fm-field')?.classList).toContain('is-error');
  });

  it('works with a reactive form and other controls', async () => {
    const control = new FormControl(false, Validators.requiredTrue);
    await render(
      `<fm-form-field label="Consent" [error]="control.invalid ? 'Please agree' : ''">
         <fm-checkbox label="I agree" [formControl]="control" />
       </fm-form-field>`,
      { imports: [FormField, Checkbox, ReactiveFormsModule], componentProperties: { control } },
    );
    const box = screen.getByRole('checkbox', { name: /I agree/ });
    expect(box.getAttribute('aria-describedby')).toMatch(/-error$/);
  });
});
