import { importProvidersFrom } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CoreModule } from '@core';

import { routes } from './app.routes';

describe('routes (PRD §4 site map)', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        importProvidersFrom(CoreModule.forRoot({ environment: 'production' })),
      ],
    }),
  );

  const visit = async (url: string) => {
    const harness = await RouterTestingHarness.create(url);
    const el = harness.routeNativeElement as HTMLElement;
    return {
      h1: el.querySelector('h1')?.textContent?.trim(),
      title: TestBed.inject(Title).getTitle(),
    };
  };

  it.each([
    ['/', 'Odunayo Mohammed', 'Odunayo Mohammed'],
    ['/services', 'Services', 'Services · Odunayo Mohammed'],
    ['/services/devops', 'DevOps', 'DevOps · Odunayo Mohammed'],
    ['/projects', 'Projects', 'Projects · Odunayo Mohammed'],
    ['/projects/graphui', 'GraphUI', 'GraphUI · Odunayo Mohammed'],
    ['/blog', 'Blog', 'Blog · Odunayo Mohammed'],
    ['/privacy', 'Privacy', 'Privacy · Odunayo Mohammed'],
    ['/404', 'Page not found', 'Page not found · Odunayo Mohammed'],
    ['/no/such/page', 'Page not found', 'Page not found · Odunayo Mohammed'],
    ['/services/no-such-service', 'Page not found', 'Page not found · Odunayo Mohammed'],
    ['/projects/no-such-project', 'Page not found', 'Page not found · Odunayo Mohammed'],
  ])('%s renders "%s"', async (url, h1, title) => {
    expect(await visit(url)).toEqual({ h1, title });
  });
});
