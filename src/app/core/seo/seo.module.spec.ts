import { Component, importProvidersFrom } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';

import { CoreModule } from '../core.module';

@Component({ template: '' })
class Blank {}

describe('SeoModule', () => {
  const setup = (environment: 'production' | 'preview') => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Blank },
          { path: 'services', title: 'Services', component: Blank },
        ]),
        importProvidersFrom(CoreModule.forRoot({ environment })),
      ],
    });
    return TestBed.inject(Router);
  };

  it('titles pages with the site template, and the home page with the site name', async () => {
    const router = setup('production');
    await router.navigateByUrl('/services');
    expect(TestBed.inject(Title).getTitle()).toBe('Services · Odunayo Mohammed');
    await router.navigateByUrl('/');
    expect(TestBed.inject(Title).getTitle()).toBe('Odunayo Mohammed');
  });

  it('writes the description and robots meta for the build environment', async () => {
    await setup('preview').navigateByUrl('/');
    const meta = TestBed.inject(Meta);
    expect(meta.getTag('name="robots"')?.content).toBe('noindex');
    expect(meta.getTag('name="description"')?.content).toMatch(/^Fullstack Software Engineer/);
  });
});
