import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { projects } from '@data/projects';
import { within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { openApp } from './it-harness';

// IT-03 (US-10): the ProjectsPage filter lives in the URL query; Back restores it.
describe('IT-03 ProjectsPage filters sync to the URL; Back restores them', () => {
  const status = projects[0].status;
  const matching = projects.filter((p) => p.status === status).length;

  it('writes the filter to the query, and Back from a project returns to the filtered list', async () => {
    const { harness, go, settle } = await openApp('/projects');
    const page = () => harness.routeNativeElement as HTMLElement;
    const cards = () => page().querySelectorAll('.project-gallery-list > li').length;
    const location = TestBed.inject(Location);
    expect(cards()).toBe(projects.length);

    const chip = within(page())
      .getAllByRole('button')
      .find((b) => new RegExp(`^${status.replace('-', ' ')}`, 'i').test(b.textContent!.trim()))!;
    await userEvent.click(chip);
    await settle();
    expect(location.path()).toContain(`status=${status}`);
    expect(cards()).toBe(matching);

    // Filtering replaces the history entry (projects.ts), so Back from a project returns to the
    // filtered list rather than stepping through each chip.
    const filtered = location.path();
    await go(`/projects/${projects.find((p) => p.status === status)!.slug}`);
    location.back();
    // Back is a popstate navigation: wait for the list to come back.
    await vi.waitFor(async () => {
      await settle();
      expect(location.path()).toBe(filtered);
      expect(cards()).toBe(matching);
    });
  });

  it('opens with the filter from the address', async () => {
    const { page } = await openApp(`/projects?status=${status}`);
    expect(page.querySelectorAll('.project-gallery-list > li')).toHaveLength(matching);
  });
});
