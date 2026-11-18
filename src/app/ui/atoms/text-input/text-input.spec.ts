import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { TextInput } from './text-input';

describe('TextInput', () => {
  it('binds to a form control both ways', async () => {
    const control = new FormControl('Ada');
    await render(
      `<label for="email">Email</label><fm-text-input inputId="email" type="email" [formControl]="control" />`,
      { imports: [TextInput, ReactiveFormsModule], componentProperties: { control } },
    );
    const input = screen.getByRole('textbox', { name: 'Email' }) as HTMLInputElement;
    expect(input.value).toBe('Ada');
    expect(input.type).toBe('email');
    await userEvent.clear(input);
    await userEvent.type(input, 'ada@example.com');
    expect(control.value).toBe('ada@example.com');
    control.setValue('new@example.com');
    await screen.findByDisplayValue('new@example.com');
  });

  it('marks touched on blur and follows the form disabled state', async () => {
    const control = new FormControl('');
    const { fixture } = await render(`<fm-text-input ariaLabel="Name" [formControl]="control" />`, {
      imports: [TextInput, ReactiveFormsModule],
      componentProperties: { control },
    });
    const input = screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement;
    input.focus();
    input.blur();
    expect(control.touched).toBe(true);
    control.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
    expect(input.closest('.fm-field')?.classList).toContain('is-disabled');
  });

  it('shows the error state and links its hint', async () => {
    await render(TextInput, {
      inputs: { ariaLabel: 'Email', invalid: true, ariaDescribedby: 'email-error', size: 'lg' },
    });
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('email-error');
    expect([...(input.closest('.fm-field') as HTMLElement).classList].sort()).toEqual([
      'fm-field',
      'fm-field--fluid',
      'fm-field--lg',
      'is-error',
    ]);
  });

  it('gives each input its own id', async () => {
    await render(`<fm-text-input ariaLabel="A" /><fm-text-input ariaLabel="B" />`, {
      imports: [TextInput],
    });
    const [a, b] = screen.getAllByRole('textbox');
    expect(a.id).toMatch(/^fm-text-input-\d+$/);
    expect(a.id).not.toBe(b.id);
  });
});
