import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { faqId, FaqSection } from './faq-section';

const items = [
  { question: 'How much does it cost?', answer: 'Every engagement is quoted.' },
  { question: 'Who owns the code?', answer: 'You do.' },
];

describe('faqId', () => {
  it('makes an id from the question', () => {
    expect(faqId('Who owns the code?')).toBe('faq-who-owns-the-code');
  });
});

describe('FaqSection', () => {
  it('is a named section with the questions as disclosure buttons, the first open', async () => {
    await render(FaqSection, { inputs: { items } });
    expect(screen.getByRole('region', { name: 'Questions clients ask first' })).toBeTruthy();
    const [first, second] = screen.getAllByRole('button');
    expect(first.getAttribute('aria-expanded')).toBe('true');
    expect(second.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('Every engagement is quoted.')).toBeTruthy();

    await userEvent.click(second);
    expect(second.getAttribute('aria-expanded')).toBe('true');
    expect(first.getAttribute('aria-expanded')).toBe('false');
  });

  it('puts every answer in the HTML, for FAQPage structured data', async () => {
    const { container } = await render(FaqSection, { inputs: { items } });
    for (const item of items) expect(container.textContent).toContain(item.answer);
  });

  it('renders nothing with no questions', async () => {
    const { container } = await render(FaqSection, { inputs: { items: [] } });
    expect(container.querySelector('section')).toBeNull();
  });
});
