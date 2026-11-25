import {
  composeMessage,
  contactTopics,
  type ContactValues,
  MAX_MAILTO,
  validateContact,
} from './contact-message';

const valid: ContactValues = {
  name: '  Ada Lovelace ',
  email: 'ada@example.com',
  topic: 'DevOps',
  message: 'We need a CI/CD pipeline for our Angular and Node.js apps.',
  consent: true,
};

describe('contactTopics', () => {
  it('puts a general enquiry first and the résumé and project requests last', () => {
    expect(contactTopics(['DevOps', 'Mobile development'])).toEqual([
      'General enquiry',
      'DevOps',
      'Mobile development',
      'Résumé request',
      'Project access or demo',
    ]);
  });
});

describe('validateContact', () => {
  it('accepts a complete message', () => {
    expect(validateContact(valid)).toEqual({});
  });

  it('explains each problem in its own field', () => {
    const errors = validateContact({
      name: ' ',
      email: 'not-an-email',
      topic: '',
      message: 'Too short',
      consent: false,
    });
    expect(Object.keys(errors)).toEqual(['name', 'email', 'topic', 'message', 'consent']);
    expect(errors.message).toContain('20 characters');
  });
});

describe('composeMessage', () => {
  it('drafts the subject and body, and the mailto and Gmail links', () => {
    const m = composeMessage(valid, 'factman60@gmail.com');
    expect(m.subject).toBe('[Portfolio] DevOps from Ada Lovelace');
    expect(m.body).toContain('Email: ada@example.com');
    expect(m.body).toContain(valid.message);
    expect(m.mailto.startsWith('mailto:factman60@gmail.com?subject=')).toBe(true);
    expect(decodeURIComponent(m.mailto)).toContain('Name: Ada Lovelace');
    expect(m.gmail.startsWith('https://mail.google.com/mail/?view=cm&fs=1&to=')).toBe(true);
  });

  it('leaves the body out of a mailto: link that would be too long', () => {
    const m = composeMessage({ ...valid, message: 'x'.repeat(2000) }, 'a@b.co');
    expect(m.mailto.length).toBeLessThanOrEqual(MAX_MAILTO);
    expect(m.mailto).not.toContain('body=');
    expect(m.body).toContain('x'.repeat(2000));
  });
});
