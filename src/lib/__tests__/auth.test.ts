import { getConfiguredAuthProviders, hasConfiguredAuthProviders } from '../auth';

describe('auth sandbox configuration', () => {
  it('does not register OAuth providers when credentials are missing', () => {
    const env = {
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
      MICROSOFT_CLIENT_ID: '',
      MICROSOFT_CLIENT_SECRET: '',
      APPLE_ID: '',
      APPLE_TEAM_ID: '',
      APPLE_KEY_ID: '',
      APPLE_PRIVATE_KEY: '',
    };

    expect(hasConfiguredAuthProviders(env)).toBe(false);
    expect(getConfiguredAuthProviders(env)).toHaveLength(0);
  });

  it('registers providers when credentials are present', () => {
    const env = {
      GOOGLE_CLIENT_ID: 'google-id',
      GOOGLE_CLIENT_SECRET: 'google-secret',
      MICROSOFT_CLIENT_ID: '',
      MICROSOFT_CLIENT_SECRET: '',
      APPLE_ID: '',
      APPLE_TEAM_ID: '',
      APPLE_KEY_ID: '',
      APPLE_PRIVATE_KEY: '',
    };

    expect(hasConfiguredAuthProviders(env)).toBe(true);
    expect(getConfiguredAuthProviders(env)).toHaveLength(1);
  });
});
