import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';

import { ClientsRepository } from './clients.repository';
import { projectResolver } from './project.resolver';
import { ProjectsRepository } from './projects.repository';
import { NOT_FOUND_PATH, serviceResolver } from './service.resolver';
import { ServicesRepository } from './services.repository';
import { SkillsRepository } from './skills.repository';

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

    const projects = TestBed.inject(ProjectsRepository);
    expect(projects.all()).toHaveLength(6);
    expect(projects.slugs()[0]).toBe('neoclock');
    expect(projects.featured().length).toBeLessThanOrEqual(6);
    expect(projects.bySlug('graphui')?.title).toBe('GraphUI');

    const skills = TestBed.inject(SkillsRepository);
    expect(skills.byCategory()).toHaveLength(7);
    expect(skills.byCategory().reduce((n, g) => n + g.skills.length, 0)).toBe(skills.all().length);
  });

  describe('projectResolver', () => {
    beforeEach(() =>
      TestBed.configureTestingModule({
        providers: [
          provideRouter([
            {
              path: 'projects/:slug',
              component: ServicePage,
              resolve: { project: projectResolver },
            },
            { path: NOT_FOUND_PATH.slice(1), component: NotFound },
          ]),
        ],
      }),
    );

    it('resolves a known slug to its project', async () => {
      const router = TestBed.inject(Router);
      await router.navigateByUrl('/projects/graphui');
      expect(router.url).toBe('/projects/graphui');
    });

    it('shows the not-found page for an unknown slug without changing the address bar', async () => {
      const router = TestBed.inject(Router);
      await router.navigateByUrl('/projects/nope');
      expect(router.routerState.snapshot.root.firstChild?.routeConfig?.path).toBe('404');
      expect(TestBed.inject(Location).path()).not.toBe(NOT_FOUND_PATH);
    });
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
