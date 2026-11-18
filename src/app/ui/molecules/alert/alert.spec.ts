import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { Alert } from './alert';

describe('Alert', () => {
  it('is a status with its title, body and tone icon', async () => {
    const { container } = await render(
      `<fm-alert tone="success" title="Message sent">I'll reply within a day.</fm-alert>`,
      { imports: [Alert] },
    );
    const alert = screen.getByRole('status');
    expect(alert.classList).toContain('fm-tone--success');
    expect(screen.getByText('Message sent')).toBeTruthy();
    expect(screen.getByText("I'll reply within a day.")).toBeTruthy();
    expect(container.querySelector('.fm-alert__icon svg')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is an alert for danger and can be dismissed', async () => {
    const dismissed = vi.fn();
    await render(
      `<fm-alert tone="danger" title="Not sent" [dismissible]="true" (dismissed)="dismissed()">Try again.</fm-alert>`,
      { imports: [Alert], componentProperties: { dismissed } },
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(dismissed).toHaveBeenCalledOnce();
  });
});
