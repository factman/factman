import { parseHref } from './href';

describe('parseHref', () => {
  it('routes paths in this app, with query and fragment', () => {
    expect(parseHref('/projects')).toEqual({
      kind: 'router',
      path: '/projects',
      queryParams: null,
      fragment: undefined,
    });
    expect(parseHref('/services/devops?ref=home#book')).toEqual({
      kind: 'router',
      path: '/services/devops',
      queryParams: { ref: 'home' },
      fragment: 'book',
    });
  });

  it('keeps a bare fragment on the current page', () => {
    expect(parseHref('#contact')).toEqual({
      kind: 'router',
      path: '.',
      queryParams: null,
      fragment: 'contact',
    });
  });

  it('opens other sites in a new tab, but not mail, phone or protocol-relative links', () => {
    expect(parseHref('https://medium.com/@factman60')).toEqual({
      kind: 'external',
      url: 'https://medium.com/@factman60',
      opensNewTab: true,
    });
    expect(parseHref('mailto:hi@example.com')).toMatchObject({
      kind: 'external',
      opensNewTab: false,
    });
    expect(parseHref('tel:+2347066780373')).toMatchObject({ kind: 'external', opensNewTab: false });
    expect(parseHref('//cdn.example.com/x')).toMatchObject({
      kind: 'external',
      opensNewTab: false,
    });
  });
});
