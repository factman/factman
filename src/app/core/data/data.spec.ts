import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';

import { ClientsRepository } from './clients.repository';
import { NOT_FOUND_PATH, serviceResolver } from './service.resolver';
import { ServicesRepository } from './services.repository';

@Component({ template: '{{ title }}' })
class ServicePage {
  readonly title = inject(ActivatedRoute).snapshot.data['service']?.title;
}
@Component({ template: 'not found' })
class NotFound {}

describe('data access', () => {
  it('repositories serve ordered, typed data', () => {
    const services = TestBed.inject(ServicesRepository);
    expect(services.all()).toHaveLength(8);
    expect(services.slugs()[0]).toBe('consultancy');
    expect(services.bySlug('devops')?.title).toBe('DevOps');
    expect(services.related('consultancy')).toHaveLength(4);
    expect(TestBed.inject(ClientsRepository).all()).toHaveLength(15);
  });

  describe('serviceResolver', () => {
    beforeEach(() =>
      TestBed.configureTestingModule({
        providers: [
          provideRouter([
            {
              path: 'services/:slug',
              component: ServicePage,
              resolve: { service: serviceResolver },
            },
            { path: NOT_FOUND_PATH.slice(1), component: NotFound },
          ]),
        ],
      }),
    );

    it('resolves a known slug to its service', async () => {
      const router = TestBed.inject(Router);
      await router.navigateByUrl('/services/devops');
      expect(router.url).toBe('/services/devops');
    });

    it('shows the not-found page for an unknown slug without changing the address bar', async () => {
      const router = TestBed.inject(Router);
      await router.navigateByUrl('/services/nope');
      expect(router.routerState.snapshot.root.firstChild?.routeConfig?.path).toBe('404');
      expect(TestBed.inject(Location).path()).not.toBe(NOT_FOUND_PATH);
    });
  });
});
