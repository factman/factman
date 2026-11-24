import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { formatPhone, maskPhone } from './phone';
import { PhoneReveal } from './phone-reveal';

describe('phone helpers', () => {
  it('formats and masks an E.164 number', () => {
    expect(formatPhone('+2347066780373')).toBe('+234 706 678 0373');
    expect(maskPhone('+2347066780373')).toBe('+234 ••• ••• ••73');
  });
});

describe('PhoneReveal', () => {
  it('shows the masked number until asked, then a tel link with focus on it', async () => {
    const revealed = vi.fn();
    await render(`<fm-phone-reveal number="+2347066780373" (revealed)="revealed()" />`, {
      imports: [PhoneReveal],
      componentProperties: { revealed },
    });
    expect(screen.getByText('+234 ••• ••• ••73')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Show number' }));
    expect(revealed).toHaveBeenCalledOnce();
    const link = await screen.findByRole('link', { name: '+234 706 678 0373' });
    expect(link.getAttribute('href')).toBe('tel:+2347066780373');
    expect(screen.getByRole('button', { name: 'Copy Phone' })).toBeTruthy();
    await vi.waitFor(() => expect(document.activeElement).toBe(link));
  });
});
