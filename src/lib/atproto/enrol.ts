/**
 * Enrol's AT Protocol identity and PDS publishing configuration.
 * Registration-to-wallet and public-profile writes are separate. PDS
 * authentication uses Enrol's repository identity; cardanoDid is the
 * wallet identity used by AppView's enrolment join.
 */
import { logger } from '@/lib/logger';
import { ENROL_MANIFEST } from './manifest';
import { PdsClient, WalletSigner, type Network } from './pds';
import {
  profileFrom,
  publishProfile,
  publishRegistration,
  registrationFrom,
  type FormConfig,
  type TallySubmission,
} from './registration';

const IDENTITY_VARS = ['ATPDS_URL', 'ENROL_SIGNING_KEY'] as const;
const PUBLISH_VARS = [
  'ENROL_REPO_DID',
  ENROL_MANIFEST.tally.formIdsEnv,
  ENROL_MANIFEST.tally.fields.walletDid,
  ENROL_MANIFEST.tally.fields.walletConsent,
] as const;

type Env = Record<string, string | undefined>;
const missing = (env: Env, names: readonly string[]) => names.filter((n) => !env[n]?.trim());

/** Enrol's PDS client, or null when its endpoint or signing key is unset. */
export function pdsFromEnv(env: Env = process.env, fetchImpl?: typeof fetch): PdsClient | null {
  if (missing(env, IDENTITY_VARS).length) return null;
  const network: Network = env.ENROL_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
  return new PdsClient(env.ATPDS_URL!.trim(), new WalletSigner(env.ENROL_SIGNING_KEY!.trim(), network), fetchImpl);
}

export type Publisher = { pds: PdsClient; enrolRepo: string; form: FormConfig };

/** Everything required for the registration write, or null when unset. */
export function publisherFromEnv(env: Env = process.env, fetchImpl?: typeof fetch): Publisher | null {
  const unset = missing(env, [...IDENTITY_VARS, ...PUBLISH_VARS]);
  if (unset.length) {
    if (unset.length < IDENTITY_VARS.length + PUBLISH_VARS.length) {
      logger.warn('Enrol publishing is off: required environment is unset.', { unset });
    }
    return null;
  }
  return {
    pds: pdsFromEnv(env, fetchImpl)!,
    enrolRepo: env.ENROL_REPO_DID!.trim(),
    form: {
      hubFormIds: new Set(env.ENROL_HUB_FORM_IDS!.split(',').map((id) => id.trim()).filter(Boolean)),
      walletField: env.ENROL_WALLET_FIELD!.trim(),
      consentField: env.ENROL_CONSENT_FIELD!.trim(),
      nameField: env.ENROL_NAME_FIELD?.trim() || undefined,
      countryField: env.ENROL_COUNTRY_FIELD?.trim() || undefined,
      nameConsentField: env.ENROL_NAME_CONSENT_FIELD?.trim() || undefined,
      countryConsentField: env.ENROL_COUNTRY_CONSENT_FIELD?.trim() || undefined,
    },
  };
}

/**
 * Publishes a hub registration and, separately, a public profile when all
 * field-level consents are present. Never throws: the Tally submission is
 * already saved and should not be retried because a PDS write failed.
 */
export async function publishSubmission(sub: TallySubmission, publisher: Publisher | null): Promise<string> {
  if (!publisher) return 'off';

  const registration = registrationFrom(sub, publisher.form);
  if ('skip' in registration) {
    logger.info('No hub registration published.', { reason: registration.skip });
    return registration.skip;
  }

  try {
    const { cid: registrationCid } = await publishRegistration(
      publisher.pds,
      publisher.enrolRepo,
      registration,
    );
    logger.info('Hub registration published.', {
      collection: ENROL_MANIFEST.atTapContracts.enrolRegistration.collection,
      cid: registrationCid,
    });

    const profile = profileFrom(sub, publisher.form);
    if ('skip' in profile) {
      logger.info('Public hub profile not published.', { reason: profile.skip });
      return 'published';
    }

    const { cid: profileCid } = await publishProfile(publisher.pds, publisher.enrolRepo, profile);
    logger.info('Public hub profile published.', {
      collection: ENROL_MANIFEST.atTapContracts.hubProfile.collection,
      cid: profileCid,
    });
    return 'published';
  } catch (error) {
    logger.error('Enrol PDS publishing failed.', {
      error: error instanceof Error ? error.message : String(error),
    });
    return 'failed';
  }
}
