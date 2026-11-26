import { pageOf } from './page-of';

describe('pageOf', () => {
  it.each([
    ['/', 'home'],
    ['', 'home'],
    ['/#contact', 'home'],
    ['/?utm_source=x', 'home'],
    ['/services', 'services'],
    ['/services/devops', 'services'],
    ['/projects/covid-daily-update#gallery', 'projects'],
    ['/blog', 'blog'],
    ['/privacy', 'other'],
    ['/does-not-exist', 'other'],
  ])('%s is %s', (url, page) => expect(pageOf(url)).toBe(page));
});
