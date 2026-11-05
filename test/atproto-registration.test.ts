import { publishSubmission, publisherFromEnv } from '@/lib/atproto/enrol';
import { PdsClient, WalletSigner } from '@/lib/atproto/pds';
import { REGISTRATION, registrationFrom, type FormConfig, type TallySubmission } from '@/lib/atproto/registration';
import { isStakeAddress } from '@/lib/cardano/stakeAddress';

// A fixed, synthetic key: 32 bytes of 0x07. Not a real wallet.
const SEED = '07'.repeat(32);

// What at-tap's TestWallet(7) returns for the same message, and what the
// AppView's verifier accepts (at-tap apps/appview, cardano-sig.ts).
const VECTOR = {
  message: 'Sign in to the Prisma PDS.\nDID: x\nNonce: 00\nExpires: 1',
  did: 'did:cardano:stake_test1uz9jrppy446d7fwntsh23cy55nzutt4jew6yysvnx9tfxycvf2lft',
  signature:
    '84582aa201276761646472657373581de08b218424ad74df25d35c2ea8e094a4c5c5aeb2cbb442419331569313a166686173686564f458365369676e20696e20746f2074686520507269736d61205044532e0a4449443a20780a4e6f6e63653a2030300a457870697265733a203158400fd0cc9bd9cf065b27a9a37ca47c89bb9a6fa00328f806a2cb6afdcf5f21d274a056d7ceaf4a1121f18bff9fbbe521d3fb0c5623d2b9a577c7b7da471aa99f04',
  key: 'a4010103272006215820ea4a6c63e29c520abef5507b132ec5f9954776aebebe7b92421eea691446d22c',
};

const STAKE = VECTOR.did.slice('did:cardano:'.length);

const FORM: FormConfig = {
  hubFormIds: new Set(['hubForm1']),
  walletField: 'Wallet stake address',
  consentField: 'Publish my wallet',
};

function submission(overrides: { formId?: string; responseId?: string; wallet?: unknown; consent?: unknown; eventType?: string } = {}): TallySubmission {
  return {
    eventType: overrides.eventType ?? 'FORM_RESPONSE',
    createdAt: '2026-11-05T10:00:00.000Z',
    data: {
      formId: overrides.formId ?? 'hubForm1',
      responseId: overrides.responseId ?? 'mRxAbc1',
      createdAt: '2026-11-05T10:00:00.000Z',
      fields: [
        { key: 'q1', label: 'Hub name', type: 'INPUT_TEXT', value: 'Synthetic hub' },
        { key: 'q2', label: 'Wallet stake address', type: 'INPUT_TEXT', value: 'wallet' in overrides ? overrides.wallet : STAKE },
        { key: 'q3', label: 'Publish my wallet', type: 'CHECKBOX', value: 'consent' in overrides ? overrides.consent : true },
      ],
    },
  };
}

// A fake at-pds: answers sign-in and createRecord, and keeps what it got.
function fakePds() {
  const calls: { method: string; body: Record<string, unknown>; auth: string | null }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    const method = url.split('/xrpc/')[1];
    const body = JSON.parse(String(init.body));
    calls.push({ method, body, auth: (init.headers as Record<string, string>).authorization ?? null });
    const reply = (status: number, value: unknown) =>
      new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
    if (method === 'com.prisma.auth.getChallenge') return reply(200, { nonce: 'n1', challenge: `Sign in.\nDID: ${body.did}`, expires_at: 0 });
    if (method === 'com.prisma.auth.login') return reply(200, { token: 'tok1', did: VECTOR.did, expires_at: Math.floor(Date.now() / 1000) + 3600 });
    if (method === 'com.prisma.repo.createRecord') return reply(200, { cid: 'bafyfake', rev: 'r1' });
    if (method === 'com.prisma.repo.initiateRepo') return reply(200, { did: 'did:plc:enrolsynthetic' });
    return reply(404, { error: 'unknown' });
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

describe('WalletSigner', () => {
  it('signs exactly like a CIP-30 wallet', () => {
    const signer = new WalletSigner(SEED, 'testnet');
    expect(signer.did).toBe(VECTOR.did);
    expect(signer.signData(VECTOR.message)).toEqual({ signature: VECTOR.signature, key: VECTOR.key });
  });

  it('uses the mainnet prefix on mainnet', () => {
    expect(new WalletSigner(SEED, 'mainnet').did).toMatch(/^did:cardano:stake1/);
  });

  it('refuses a key that is not 32 bytes of hex', () => {
    expect(() => new WalletSigner('07', 'testnet')).toThrow();
  });
});

describe('isStakeAddress', () => {
  it('accepts testnet and mainnet stake addresses', () => {
    expect(isStakeAddress(STAKE)).toBe(true);
    expect(isStakeAddress(new WalletSigner(SEED, 'mainnet').did.slice('did:cardano:'.length))).toBe(true);
  });

  it('refuses anything else', () => {
    const typo = STAKE.slice(0, -1) + (STAKE.endsWith('t') ? 'q' : 't');
    for (const bad of ['', typo, STAKE.toUpperCase(), 'addr_test1qzhp0ey7tlr3rawe9vp4un80jxa9ryaw0', 'stake_test1qqqqqq']) {
      expect(isStakeAddress(bad)).toBe(false);
    }
  });
});

describe('registrationFrom', () => {
  it("a hub's enrolment with a wallet and consent becomes a registration", () => {
    expect(registrationFrom(submission(), FORM)).toEqual({
      $type: REGISTRATION,
      registrationId: 'mRxAbc1',
      cardanoDid: VECTOR.did,
      role: 'hub',
      createdAt: '2026-11-05T10:00:00.000Z',
    });
  });

  it('takes the did:cardano itself too', () => {
    expect(registrationFrom(submission({ wallet: ` ${VECTOR.did} ` }), FORM)).toMatchObject({ cardanoDid: VECTOR.did });
  });

  it('a ticked option in a checkbox list counts as consent', () => {
    expect(registrationFrom(submission({ consent: ['optYes'] }), FORM)).toMatchObject({ registrationId: 'mRxAbc1' });
  });

  it('publishes nothing without consent, a wallet, or a hub form', () => {
    expect(registrationFrom(submission({ consent: false }), FORM)).toEqual({ skip: 'no consent to publish the wallet' });
    expect(registrationFrom(submission({ consent: [] }), FORM)).toEqual({ skip: 'no consent to publish the wallet' });
    expect(registrationFrom(submission({ wallet: 'addr_test1nope' }), FORM)).toEqual({ skip: 'no stake address in the wallet field' });
    expect(registrationFrom(submission({ wallet: undefined }), FORM)).toEqual({ skip: 'no stake address in the wallet field' });
    expect(registrationFrom(submission({ formId: 'participants' }), FORM)).toEqual({ skip: 'not a hub enrolment form' });
    expect(registrationFrom(submission({ responseId: 'a b' }), FORM)).toEqual({ skip: 'no usable responseId' });
    expect(registrationFrom(submission({ eventType: 'OTHER' }), FORM)).toEqual({ skip: 'not a form response' });
  });
});

describe('PdsClient', () => {
  it('signs in with the wallet signature, then reuses the session', async () => {
    const { calls, fetchImpl } = fakePds();
    const pds = new PdsClient('https://pds.example.org/', new WalletSigner(SEED, 'testnet'), fetchImpl);
    await pds.putRecord('did:plc:enrolsynthetic', REGISTRATION, 'r1', { a: 1 });
    await pds.putRecord('did:plc:enrolsynthetic', REGISTRATION, 'r2', { a: 2 });

    expect(calls.map((c) => c.method)).toEqual([
      'com.prisma.auth.getChallenge',
      'com.prisma.auth.login',
      'com.prisma.repo.createRecord',
      'com.prisma.repo.createRecord',
    ]);
    expect(calls[0].body).toEqual({ did: VECTOR.did });
    const signed = new WalletSigner(SEED, 'testnet').signData(`Sign in.\nDID: ${VECTOR.did}`);
    expect(calls[1].body).toEqual({ nonce: 'n1', ...signed });
    expect(calls[2]).toMatchObject({
      auth: 'Bearer tok1',
      body: { did: 'did:plc:enrolsynthetic', collection: REGISTRATION, rkey: 'r1', a: 1 },
    });
  });

  it('creates enrol\'s repo with its own wallet', async () => {
    const { calls, fetchImpl } = fakePds();
    const pds = new PdsClient('https://pds.example.org', new WalletSigner(SEED, 'testnet'), fetchImpl);
    expect(await pds.initiateRepo('Prisma enrol')).toBe('did:plc:enrolsynthetic');
    expect(calls[2].body).toMatchObject({ did: VECTOR.did, wallet_address: STAKE, name: 'Prisma enrol' });
  });
});

describe('publishSubmission', () => {
  const env = {
    ATPDS_URL: 'https://pds.example.org',
    ENROL_SIGNING_KEY: SEED,
    ENROL_REPO_DID: 'did:plc:enrolsynthetic',
    ENROL_HUB_FORM_IDS: 'hubForm1, other',
    ENROL_WALLET_FIELD: 'Wallet stake address',
    ENROL_CONSENT_FIELD: 'Publish my wallet',
  };

  it('is off until every variable is set', async () => {
    expect(publisherFromEnv({})).toBeNull();
    expect(publisherFromEnv({ ...env, ENROL_CONSENT_FIELD: '' })).toBeNull();
    expect(await publishSubmission(submission(), null)).toBe('off');
  });

  it("publishes a hub's enrolment to enrol's repo at rkey = responseId", async () => {
    const { calls, fetchImpl } = fakePds();
    const publisher = publisherFromEnv(env, fetchImpl);
    expect(await publishSubmission(submission(), publisher)).toBe('published');
    expect(calls.at(-1)?.body).toMatchObject({
      did: 'did:plc:enrolsynthetic',
      collection: REGISTRATION,
      rkey: 'mRxAbc1',
      registrationId: 'mRxAbc1',
      cardanoDid: VECTOR.did,
    });
  });

  it('never throws when the PDS fails: the submission is already saved', async () => {
    const failing = (async () => new Response('down', { status: 503 })) as unknown as typeof fetch;
    expect(await publishSubmission(submission(), publisherFromEnv(env, failing))).toBe('failed');
  });

  it('publishes nothing for a participant form', async () => {
    const { calls, fetchImpl } = fakePds();
    expect(await publishSubmission(submission({ formId: 'participants' }), publisherFromEnv(env, fetchImpl))).toBe('not a hub enrolment form');
    expect(calls).toEqual([]);
  });
});
