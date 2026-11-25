import {
  ctaEvent,
  ctaId,
  ANALYTICS_EVENT_NAMES,
  type AnalyticsEvent,
  type AnalyticsEventName,
  checkParams,
  KEY_EVENTS,
  messageLengthBucket,
} from './analytics-events';
import type { AnalyticsTracker } from './tracker';

describe('analytics event catalogue', () => {
  it('lists every event, once, as snake_case of at most 40 characters', () => {
    expect(new Set(ANALYTICS_EVENT_NAMES).size).toBe(ANALYTICS_EVENT_NAMES.length);
    for (const name of ANALYTICS_EVENT_NAMES) {
      expect(name).toMatch(/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/);
      expect(name.length).toBeLessThanOrEqual(40);
    }
  });

  it('covers the PRD events, résumé events included', () => {
    for (const name of [
      'resume_preview_open',
      'resume_variant_switch',
      'resume_download',
      'resume_open_pdf',
      'service_enquiry',
      'contact_form_submit',
      'project_open',
      'project_link_click',
      'blog_click',
      'contact_click',
      'consent_update',
    ]) {
      expect(ANALYTICS_EVENT_NAMES).toContain(name);
    }
    for (const name of KEY_EVENTS) expect(ANALYTICS_EVENT_NAMES).toContain(name);
  });

  it('types names and parameters: unknown events and wrong parameters do not compile', () => {
    const sent: unknown[] = [];
    const tracker: AnalyticsTracker = { track: (name, params) => sent.push({ name, params }) };
    tracker.track('resume_download', { resume_id: 'fullstack', source: 'card' });
    // @ts-expect-error an event that isn't in the catalogue
    tracker.track('resume_print', { resume_id: 'fullstack' });
    // @ts-expect-error a parameter the event doesn't have
    tracker.track('blog_click', { post_id: 'a1', location: 'home', email: 'x' });
    // @ts-expect-error a value outside the event's enum
    tracker.track('service_enquiry', { service_id: 'devops', channel: 'carrier-pigeon' });
    // @ts-expect-error a missing parameter
    const event: AnalyticsEvent = { name: 'project_open', params: { project_id: 'pay' } };
    expect(event.name satisfies AnalyticsEventName).toBe('project_open');
    expect(sent).toHaveLength(4);
  });

  it('buckets message lengths instead of sending text', () => {
    expect(messageLengthBucket(0)).toBe('0-49');
    expect(messageLengthBucket(49)).toBe('0-49');
    expect(messageLengthBucket(50)).toBe('50-199');
    expect(messageLengthBucket(200)).toBe('200-499');
    expect(messageLengthBucket(5000)).toBe('500+');
  });

  describe('checkParams', () => {
    it('accepts ids, enums, booleans and numbers', () => {
      expect(checkParams({ resume_id: 'fullstack', source: 'card' })).toBeNull();
      expect(checkParams({ analytics: true, n: 3 })).toBeNull();
      expect(checkParams({})).toBeNull();
    });

    it.each([
      [{ channel: 'odunayo@example.com' }, 'channel'],
      [{ value: '+234 706 678 0373' }, 'value'],
      [{ value: '07066780373' }, 'value'],
      [{ cta_id: 'x'.repeat(101) }, 'cta_id'],
      [{ topic: { nested: true } }, 'topic'],
    ])('rejects personal data or free text: %j', (params, key) => {
      expect(checkParams(params)).toBe(key);
    });
  });
});

describe('ctaId / ctaEvent', () => {
  it('makes a snake_case id from a label', () => {
    expect(ctaId('Book a service')).toBe('book_a_service');
    expect(ctaId('  Get the résumé → ')).toBe('get_the_resume');
    expect(ctaId('GitHub profile')).toBe('github_profile');
  });

  it('builds a cta_click event', () => {
    expect(ctaEvent('View projects', 'hero')).toEqual({
      name: 'cta_click',
      params: { cta_id: 'view_projects', location: 'hero' },
    });
  });
});
