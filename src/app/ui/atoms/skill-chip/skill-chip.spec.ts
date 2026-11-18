import { render, screen } from '@testing-library/angular';

import { SkillChip, yearsText } from './skill-chip';

describe('yearsText', () => {
  it('uses the singular for one year', () => {
    expect(yearsText(1)).toBe('1 yr');
    expect(yearsText(8)).toBe('8 yrs');
  });
});

describe('SkillChip', () => {
  it('shows the skill and its years', async () => {
    const { container } = await render(SkillChip, { inputs: { label: 'Angular', years: 8 } });
    expect(container.querySelector('.fm-skill')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Angular · 8 yrs',
    );
  });

  it('shows only the skill without years', async () => {
    const { container } = await render(SkillChip, { inputs: { label: 'Docker' } });
    expect(screen.getByText('Docker')).toBeTruthy();
    expect(container.querySelector('.fm-skill-years')).toBeNull();
  });
});
