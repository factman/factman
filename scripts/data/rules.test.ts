import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  assetsExist,
  dateOrder,
  noInsecureLinks,
  privateProjects,
  skillReferences,
  trackReferences,
  uniqueIds,
} from './rules';

const paths = (issues: { path: string }[]) => issues.map((i) => i.path);

describe('uniqueIds', () => {
  test('flags duplicate ids and slugs', () => {
    const issues = uniqueIds({
      services: [
        { id: 'a', slug: 'a' },
        { id: 'a', slug: 'b' },
        { id: 'c', slug: 'b' },
      ],
    });
    assert.deepEqual(paths(issues), ['/1/id', '/2/slug']);
  });
  test('allows integer ids (clients) but checks they are unique', () => {
    assert.equal(
      uniqueIds({
        clients: [
          { id: 1, slug: 'x' },
          { id: 2, slug: 'y' },
        ],
      }).length,
      0,
    );
    assert.deepEqual(paths(uniqueIds({ clients: [{ id: 1 }, { id: 1 }] })), ['/1/id']);
  });
  test('requires kebab-case string ids and slugs', () => {
    assert.deepEqual(paths(uniqueIds({ skills: [{ id: 'TypeScript' }] })), ['/0/id']);
  });
  test('checks role ids across all organizations', () => {
    const issues = uniqueIds({
      experience: [
        { id: 'o1', roles: [{ id: 'r' }] },
        { id: 'o2', roles: [{ id: 'r' }] },
      ],
    });
    assert.deepEqual(paths(issues), ['(roles)/1/id']);
  });
});

describe('noInsecureLinks', () => {
  test('flags http:// anywhere, allows https, mailto and tel', () => {
    const issues = noInsecureLinks({
      contact: {
        email: 'mailto:a@b.c',
        phone: 'tel:+1',
        links: [{ url: 'http://x.dev' }, { url: 'https://y.dev' }],
      },
    });
    assert.deepEqual(paths(issues), ['/links/0/url']);
  });
});

describe('skillReferences', () => {
  const skills = [{ id: 'angular', name: 'Angular' }];
  test('accepts skills by id or name', () => {
    assert.equal(
      skillReferences({ skills, projects: [{ stack: ['angular', 'Angular'] }] }).length,
      0,
    );
  });
  test('flags unknown project stack and role skills', () => {
    const issues = skillReferences({
      skills,
      projects: [{ stack: ['Vue'] }],
      experience: [{ roles: [{ skills: ['Rust'] }] }],
    });
    assert.deepEqual(paths(issues), ['/0/stack/0', '/0/roles/0/skills/0']);
  });
  test('is skipped until skills.json exists', () => {
    assert.equal(skillReferences({ projects: [{ stack: ['Vue'] }] }).length, 0);
  });
});

describe('trackReferences', () => {
  test('flags tracks that are not résumé ids, including highlight tracks', () => {
    const issues = trackReferences({
      resumes: [{ id: 'fullstack' }, { id: 'mobile' }],
      skills: [{ id: 'a', tracks: ['fullstack', 'devops'] }],
      experience: [{ roles: [{ highlights: ['x', { text: 'y', tracks: ['qa'] }] }] }],
    });
    assert.deepEqual(paths(issues), ['/0/tracks/1', '/0/roles/0/highlights/1/tracks/0']);
  });
});

describe('privateProjects', () => {
  test('flags live and source links on private projects only', () => {
    const issues = privateProjects({
      projects: [
        { visibility: 'private', links: { live: 'https://a', caseStudy: 'https://b' } },
        { visibility: 'public', links: { source: 'https://c' } },
      ],
    });
    assert.deepEqual(paths(issues), ['/0/links/live']);
  });
});

describe('assetsExist', () => {
  const ctx = { assetExists: (p: string) => p === 'clients/ok.png' || p === 'img/a.webp' };
  test('checks logo, cover, gallery and photo.src; ignores remote URLs', () => {
    const issues = assetsExist(
      {
        clients: [{ logo: 'clients/ok.png' }, { logo: 'clients/missing.png' }],
        projects: [{ cover: '/assets/img/a.webp', gallery: ['img/a.webp', 'img/b.webp'] }],
        profile: { photo: { src: 'https://cdn.example/p.jpg' } },
      },
      ctx,
    );
    assert.deepEqual(paths(issues), ['/1/logo', '/0/gallery/1']);
  });
});

describe('dateOrder', () => {
  test('flags roles and projects that end before they start', () => {
    const issues = dateOrder({
      experience: [{ roles: [{ start: '2020-01', end: '2019-12' }, { start: '2020-01' }] }],
      projects: [{ startedAt: '2021-05', completedAt: '2021-06' }],
    });
    assert.deepEqual(paths(issues), ['/0/roles/0']);
  });
});
