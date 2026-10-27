import otpCopy from '../i18n/locales/en/auth/otp.json';

describe('OTP UI copy security', () => {
  it('does not expose a fixed development OTP in the customer app', () => {
    expect(otpCopy).not.toHaveProperty('dev_hint');
    expect(JSON.stringify(otpCopy)).not.toMatch(/123456|123454/);
  });
});
