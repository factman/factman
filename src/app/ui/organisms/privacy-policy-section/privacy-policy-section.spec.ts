import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { PrivacyPolicySection } from './privacy-policy-section';

const storage = [
  {
    name: 'fm_consent',
    category: 'Necessary',
    purpose: 'Stores your cookie choice',
    lifetime: '6 months',
  },
  { name: '_ga', category: 'Analytics', purpose: 'Distinguishes visitors', lifetime: '14 months' },
];

describe('PrivacyPolicySection', () => {
  it('lists every stored key in a captioned table', async () => {
    await render(PrivacyPolicySection, { inputs: { storage, email: 'me@example.com' } });
    const table = screen.getByRole('table', { name: /Cookies and browser storage/ });
    expect(table.textContent).toContain('fm_consent');
    expect(table.textContent).toContain('14 months');
  });

  it('emits changeSettings from the consent card', async () => {
    const changeSettings = vi.fn();
    await render(PrivacyPolicySection, {
      inputs: { storage, email: 'me@example.com', analytics: 'granted' },
      on: { changeSettings },
    });
    await userEvent.click(screen.getByRole('button', { name: /cookie settings/i }));
    expect(changeSettings).toHaveBeenCalled();
  });
});
