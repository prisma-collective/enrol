import {
  PROFILE,
  REGISTRATION,
  profileFrom,
  publishProfile,
  publishRegistration,
  registrationFrom,
  type FormConfig,
  type TallySubmission,
} from '@/lib/atproto/registration';
import { ENROL_MANIFEST } from '@/lib/atproto/manifest';

const CARDANO_DID = 'did:cardano:stake_test1uz9jrppy446d7fwntsh23cy55nzutt4jew6yysvnx9tfxycvf2lft';

const config: FormConfig = {
  hubFormIds: new Set(['hubForm1']),
  walletField: 'wallet-question-id',
  consentField: 'wallet-consent-id',
  nameField: 'name-question-id',
  nameConsentField: 'name-consent-id',
  countryField: 'country-question-id',
  countryConsentField: 'country-consent-id',
};

function makeSubmission(overrides: {
  formId?: string;
  responseId?: string;
  eventType?: string;
  wallet?: unknown;
  walletConsent?: unknown;
  name?: unknown;
  nameConsent?: unknown;
  country?: unknown;
  countryConsent?: unknown;
} = {}): TallySubmission {
  const values: Record<string, unknown> = {
    'wallet-question-id': overrides.wallet ?? CARDANO_DID,
    'wallet-consent-id': 'walletConsent' in overrides ? overrides.walletConsent : true,
    'name-question-id': 'name' in overrides ? overrides.name : 'Prisma Hub',
    'name-consent-id': 'nameConsent' in overrides ? overrides.nameConsent : true,
    'country-question-id': 'country' in overrides ? overrides.country : 'KE',
    'country-consent-id': 'countryConsent' in overrides ? overrides.countryConsent : true,
  };
  return {
    eventType: overrides.eventType ?? 'FORM_RESPONSE',
    data: {
      formId: overrides.formId ?? 'hubForm1',
      responseId: overrides.responseId ?? 'response_123',
      createdAt: '2026-11-20T10:00:00.000Z',
      fields: Object.entries(values).map(([key, value]) => ({ key, label: key, value })),
    },
  };
}

describe('Enrol manifest', () => {
  it('pins the AppView registration and profile contracts', () => {
    expect(ENROL_MANIFEST.version).toBe(1);
    expect(ENROL_MANIFEST.atTapContracts.enrolRegistration.collection).toBe(REGISTRATION);
    expect(ENROL_MANIFEST.atTapContracts.hubProfile.collection).toBe(PROFILE);
    expect(ENROL_MANIFEST.atTapContracts.enrolRegistration.fields).toEqual([
      'registrationId', 'cardanoDid', 'role', 'createdAt',
    ]);
  });
});

describe('registrationFrom', () => {
  it('creates the exact AppView join record at the Tally response ID', () => {
    expect(registrationFrom(makeSubmission(), config)).toEqual({
      $type: REGISTRATION,
      registrationId: 'response_123',
      cardanoDid: CARDANO_DID,
      role: 'hub',
      createdAt: '2026-11-20T10:00:00.000Z',
    });
  });

  it('requires wallet-specific consent', () => {
    expect(registrationFrom(makeSubmission({ walletConsent: false }), config)).toEqual({
      skip: 'no consent to publish the wallet',
    });
  });

  it('rejects invalid wallet values and non-hub forms', () => {
    expect(registrationFrom(makeSubmission({ wallet: 'addr_test1invalid' }), config)).toEqual({
      skip: 'no stake address in the wallet field',
    });
    expect(registrationFrom(makeSubmission({ formId: 'participantForm' }), config)).toEqual({
      skip: 'not a hub enrolment form',
    });
  });

  it('requires a valid Tally response ID and form response event', () => {
    expect(registrationFrom(makeSubmission({ responseId: 'bad id' }), config)).toEqual({
      skip: 'no usable responseId',
    });
    expect(registrationFrom(makeSubmission({ eventType: 'FORM_UPDATE' }), config)).toEqual({
      skip: 'not a form response',
    });
  });
});

describe('profileFrom', () => {
  it('publishes only the fields with separate affirmative consent', () => {
    expect(profileFrom(makeSubmission(), config)).toEqual({
      $type: PROFILE,
      name: 'Prisma Hub',
      country: 'KE',
      createdAt: '2026-11-20T10:00:00.000Z',
    });
  });

  it('does not publish a name when its consent is absent or false', () => {
    expect(profileFrom(makeSubmission({ nameConsent: false }), config)).toEqual({
      skip: 'no consent to publish the hub name',
    });
    expect(profileFrom(makeSubmission(), { ...config, nameConsentField: undefined })).toEqual({
      skip: 'per-field public consent is not configured',
    });
  });

  it('does not publish a country when its consent is absent or false', () => {
    expect(profileFrom(makeSubmission({ countryConsent: false }), config)).toEqual({
      skip: 'no consent to publish the country',
    });
    expect(profileFrom(makeSubmission(), { ...config, countryConsentField: undefined })).toEqual({
      skip: 'per-field public consent is not configured',
    });
  });

  it('validates the country code', () => {
    expect(profileFrom(makeSubmission({ country: 'Kenya' }), config)).toEqual({
      skip: 'no valid country code in the country field',
    });
  });
});

describe('PDS record mapping', () => {
  it('writes registration using responseId as rkey', async () => {
    const putRecord = jest.fn().mockResolvedValue({ cid: 'bafy-registration' });
    await publishRegistration({ putRecord } as never, 'did:plc:enrol', registrationFrom(makeSubmission(), config) as never);
    expect(putRecord).toHaveBeenCalledWith('did:plc:enrol', REGISTRATION, 'response_123', {
      registrationId: 'response_123',
      cardanoDid: CARDANO_DID,
      role: 'hub',
      createdAt: '2026-11-20T10:00:00.000Z',
    });
  });

  it('writes public profile at the stable self key', async () => {
    const putRecord = jest.fn().mockResolvedValue({ cid: 'bafy-profile' });
    await publishProfile({ putRecord } as never, 'did:plc:enrol', profileFrom(makeSubmission(), config) as never);
    expect(putRecord).toHaveBeenCalledWith('did:plc:enrol', PROFILE, 'self', {
      name: 'Prisma Hub',
      country: 'KE',
      createdAt: '2026-11-20T10:00:00.000Z',
    });
  });
});
