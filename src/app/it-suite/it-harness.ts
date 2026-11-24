import { importProvidersFrom, type Provider } from '@angular/core';
import { DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CoreModule } from '@core';

import { routes } from '../app.routes';

/**
 * The IT suite's app: the real routes, CoreModule and the seeded JSON, as `app.config.ts` wires
 * them (no hydration: TestBed renders on the client). `providers` replace a dependency for one
 * case, such as a repository with a private project in it.
 */
export async function openApp(url: string, providers: Provider[] = []) {
  TestBed.configureTestingModule({
    // Defer blocks wait for the test (no viewport triggers in jsdom); settle() renders them.
    deferBlockBehavior: DeferBlockBehavior.Manual,
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      importProvidersFrom(CoreModule.forRoot({ environment: 'production' })),
      ...providers,
    ],
  });
  const harness = await RouterTestingHarness.create();
  // Bootstrap does this in the app: Back and Forward (popstate) navigate the router.
  TestBed.inject(Router).setUpLocationChangeListener();
  const go = async (next: string) => {
    await harness.navigateByUrl(next);
    await settle();
    return harness.routeNativeElement as HTMLElement;
  };
  /** Renders the page's `@defer` sections (the home page's Stack to Contact) as the prerender does. */
  const settle = async () => {
    for (const block of await harness.fixture.getDeferBlocks()) {
      await block.render(DeferBlockState.Complete);
    }
    harness.fixture.detectChanges();
    await harness.fixture.whenStable();
  };
  const page = await go(url);
  return { harness, page, go, settle };
}

/** The text of an element, with its whitespace collapsed. */
export const text = (el: Element | null | undefined) =>
  el?.textContent?.replace(/\s+/g, ' ').trim();
