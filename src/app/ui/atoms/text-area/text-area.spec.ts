import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { TextArea } from './text-area';

describe('TextArea', () => {
  it('binds to a form control and limits the length', async () => {
    const control = new FormControl('');
    await render(
      `<fm-text-area ariaLabel="Message" [rows]="6" [maxLength]="500" [formControl]="control" />`,
      { imports: [TextArea, ReactiveFormsModule], componentProperties: { control } },
    );
    const area = screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement;
    expect(area.rows).toBe(6);
    expect(area.maxLength).toBe(500);
    await userEvent.type(area, 'Hello');
    expect(control.value).toBe('Hello');
    expect(area.closest('.fm-field')?.classList).toContain('fm-textarea');
  });

  it('shows the error state', async () => {
    await render(TextArea, { inputs: { ariaLabel: 'Message', invalid: true } });
    const area = screen.getByRole('textbox', { name: 'Message' });
    expect(area.getAttribute('aria-invalid')).toBe('true');
    expect(area.closest('.fm-field')?.classList).toContain('is-error');
  });
});
