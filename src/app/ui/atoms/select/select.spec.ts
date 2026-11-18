import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { Select, type SelectOption } from './select';

const options: SelectOption[] = [
  { value: 'web', label: 'Web app' },
  { value: 'mobile', label: 'Mobile app' },
  { value: 'audit', label: 'Code audit', disabled: true },
];

describe('Select', () => {
  it('shows the placeholder, then the chosen option, and updates the form', async () => {
    const control = new FormControl<string | null>(null);
    await render(
      `<fm-select ariaLabel="Service" placeholder="Choose a service" [options]="options" [formControl]="control" />`,
      { imports: [Select, ReactiveFormsModule], componentProperties: { control, options } },
    );
    const select = screen.getByRole('combobox', { name: 'Service' }) as HTMLSelectElement;
    expect(select.value).toBe('');
    expect(select.classList).toContain('is-placeholder');
    expect(screen.getByRole('option', { name: 'Code audit' })).toHaveProperty('disabled', true);
    await userEvent.selectOptions(select, 'mobile');
    expect(control.value).toBe('mobile');
    expect(select.classList).not.toContain('is-placeholder');
  });

  it('selects the value the form writes', async () => {
    const control = new FormControl('web');
    await render(`<fm-select ariaLabel="Service" [options]="options" [formControl]="control" />`, {
      imports: [Select, ReactiveFormsModule],
      componentProperties: { control, options },
    });
    const select = screen.getByRole('combobox', { name: 'Service' }) as HTMLSelectElement;
    expect(select.value).toBe('web');
  });

  it('shows the error state', async () => {
    await render(Select, { inputs: { ariaLabel: 'Service', options, invalid: true } });
    const select = screen.getByRole('combobox', { name: 'Service' });
    expect(select.getAttribute('aria-invalid')).toBe('true');
  });
});
