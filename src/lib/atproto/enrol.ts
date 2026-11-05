/**
 * Wiring for enrol's AT Protocol identity, read from the environment.
 *
 * Off until every variable is set: the webhook then works exactly as
 * before. The signing key is a secret, like WEBHOOK_SIGNING_SECRET.
 */
import { logger } from '@/lib/logger';
import { PdsClient, WalletSigner, type Network } from './pds';
import { publishRegistration, registrationFrom, type FormConfig, type TallySubmission } from './registration';

const IDENTITY_VARS = ['ATPDS_URL', 'ENROL_SIGNING_KEY'] as const;
const PUBLISH_VARS = ['ENROL_REPO_DID', 'ENROL_HUB_FORM_IDS', 'ENROL_WALLET_FIELD', 'ENROL_CONSENT_FIELD'] as const;

type Env = Record<string, string | undefined>;

const missing = (env: Env, names: readonly string[]) => names.filter((n) => !env[n]?.trim());

/** enrol's client on the PDS, or null when ATPDS_URL or ENROL_SIGNING_KEY is unset. */
export function pdsFromEnv(env: Env = process.env, fetchImpl?: typeof fetch): PdsClient | null {
  if (missing(env, IDENTITY_VARS).length) return null;
  const network: Network = env.ENROL_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
  return new PdsClient(env.ATPDS_URL!.trim(), new WalletSigner(env.ENROL_SIGNING_KEY!.trim(), network), fetchImpl);
}

export type Publisher = { pds: PdsClient; enrolRepo: string; form: FormConfig };

/** Everything publishing needs, or null when any of it is unset. */
export function publisherFromEnv(env: Env = process.env, fetchImpl?: typeof fetch): Publisher | null {
  const unset = missing(env, [...IDENTITY_VARS, ...PUBLISH_VARS]);
  if (unset.length) {
    if (unset.length < IDENTITY_VARS.length + PUBLISH_VARS.length) {
      logger.warn('Registration publishing is off: some env vars are unset.', { unset });
    }
    return null;
  }
  return {
    pds: pdsFromEnv(env, fetchImpl)!,
    enrolRepo: env.ENROL_REPO_DID!.trim(),
    form: {
      hubFormIds: new Set(env.ENROL_HUB_FORM_IDS!.split(',').map((id) => id.trim()).filter(Boolean)),
      walletField: env.ENROL_WALLET_FIELD!,
      consentField: env.ENROL_CONSENT_FIELD!,
    },
  };
}

/**
 * Publishes the registration for a Tally submission when it is a hub's
 * enrolment with a wallet and consent. Never throws: the submission is
 * already saved, and Tally shouldn't retry a form for a publishing failure.
 */
export async function publishSubmission(sub: TallySubmission, publisher: Publisher | null): Promise<string> {
  if (!publisher) return 'off';
  const registration = registrationFrom(sub, publisher.form);
  if ('skip' in registration) {
    logger.info('No registration published.', { responseId: sub.data?.responseId, reason: registration.skip });
    return registration.skip;
  }
  try {
    const { cid } = await publishRegistration(publisher.pds, publisher.enrolRepo, registration);
    logger.info('Registration published.', { responseId: registration.registrationId, cid });
    return 'published';
  } catch (error) {
    logger.error('Registration publishing failed.', {
      responseId: registration.registrationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return 'failed';
  }
}
