import { TestBed } from '@angular/core/testing';

import { ResumeLauncher } from './resume-launcher';

describe('ResumeLauncher', () => {
  it('holds one request until it is taken', () => {
    const launcher = TestBed.inject(ResumeLauncher);
    expect(launcher.take()).toBeNull();
    launcher.open('mobile', 'footer');
    expect(launcher.request()).toEqual({ slug: 'mobile', source: 'footer' });
    expect(launcher.take()).toEqual({ slug: 'mobile', source: 'footer' });
    expect(launcher.take()).toBeNull();
  });
});
