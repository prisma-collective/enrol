/**
 * Tally enrolment records published by Enrol (D24/D25).
 * The registration record is the join input consumed by AppView:
 * responseId → did:cardano. The public hub profile is separate and is
 * emitted only when each public field has its own consent.
 */
import { isStakeAddress } from '@/lib/cardano/stakeAddress';
import type { PdsClient } from './pds';

export const PROFILE = 'events.prisma.hub.profile';
export const REGISTRATION = 'events.prisma.enrol.registration';

export type HubProfile = {
  $type: typeof PROFILE;
  name: string;
  country: string;
  createdAt: string;
};

export type HubRegistration = {
  $type: typeof REGISTRATION;
  registrationId: string;
  cardanoDid: string;
  role: 'hub';
  createdAt: string;
};

type TallyField = {
  key?: string;
  label?: string;
  type?: string;
  value?: unknown;
  options?: { id: string; text: string }[];
};

export type TallySubmission = {
  eventType?: string;
  createdAt?: string;
  data?: {
    formId?: string;
    responseId?: string;
    createdAt?: string;
    fields?: TallyField[];
  };
};

/** Tally question IDs are preferred; labels remain supported for migration. */
export type FormConfig = {
  hubFormIds: Set<string>;
  walletField: string;
  consentField: string;
  nameField?: string;
  countryField?: string;
  nameConsentField?: string;
  countryConsentField?: string;
};

const RESPONSE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const COUNTRY_CODE = /^[A-Z]{2}$/;

function field(fields: TallyField[], reference: string | undefined): TallyField | undefined {
  if (!reference) return undefined;
  // Tally's key is the stable question identifier. Label matching remains
  // available for existing deployments until their manifest IDs are set.
  return fields.find((f) => f.key === reference) ??
    fields.find((f) => f.label?.trim().toLowerCase() === reference.trim().toLowerCase());
}

function ticked(f: TallyField | undefined): boolean {
  return f?.value === true || (Array.isArray(f?.value) && f.value.length > 0);
}

function cardanoDid(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const address = value.trim().replace(/^did:cardano:/, '');
  return isStakeAddress(address) ? `did:cardano:${address}` : null;
}

function responseContext(sub: TallySubmission, config: FormConfig):
  | { fields: TallyField[]; responseId: string; createdAt: string }
  | { skip: string } {
  const data = sub.data;
  if (sub.eventType !== 'FORM_RESPONSE' || !data) return { skip: 'not a form response' };
  if (!data.formId || !config.hubFormIds.has(data.formId)) return { skip: 'not a hub enrolment form' };
  if (!data.responseId || !RESPONSE_ID.test(data.responseId)) return { skip: 'no usable responseId' };
  const date = new Date(data.createdAt ?? sub.createdAt ?? Date.now());
  return {
    fields: data.fields ?? [],
    responseId: data.responseId,
    createdAt: Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
  };
}

/** Registration used by AppView's enrolment join. */
export function registrationFrom(
  sub: TallySubmission,
  config: FormConfig,
): HubRegistration | { skip: string } {
  const context = responseContext(sub, config);
  if ('skip' in context) return context;
  if (!ticked(field(context.fields, config.consentField))) {
    return { skip: 'no consent to publish the wallet' };
  }
  const did = cardanoDid(field(context.fields, config.walletField)?.value);
  if (!did) return { skip: 'no stake address in the wallet field' };
  return {
    $type: REGISTRATION,
    registrationId: context.responseId,
    cardanoDid: did,
    role: 'hub',
    createdAt: context.createdAt,
  };
}

/**
 * Public hub profile. Both public fields require independent consent;
 * a missing consent mapping or an unticked consent fails closed.
 */
export function profileFrom(
  sub: TallySubmission,
  config: FormConfig,
): HubProfile | { skip: string } {
  const context = responseContext(sub, config);
  if ('skip' in context) return context;
  if (!config.nameField || !config.countryField ||
      !config.nameConsentField || !config.countryConsentField) {
    return { skip: 'per-field public consent is not configured' };
  }
  if (!ticked(field(context.fields, config.nameConsentField))) {
    return { skip: 'no consent to publish the hub name' };
  }
  if (!ticked(field(context.fields, config.countryConsentField))) {
    return { skip: 'no consent to publish the country' };
  }
  const name = String(field(context.fields, config.nameField)?.value ?? '').trim();
  if (!name) return { skip: 'no name in the name field' };
  const country = String(field(context.fields, config.countryField)?.value ?? '').trim().toUpperCase();
  if (!COUNTRY_CODE.test(country)) return { skip: 'no valid country code in the country field' };
  return { $type: PROFILE, name, country, createdAt: context.createdAt };
}

/** Publish the enrolment-to-wallet association at rkey = Tally responseId. */
export async function publishRegistration(
  pds: PdsClient,
  repoDid: string,
  registration: HubRegistration,
) {
  return pds.putRecord(repoDid, REGISTRATION, registration.registrationId, {
    registrationId: registration.registrationId,
    cardanoDid: registration.cardanoDid,
    role: registration.role,
    createdAt: registration.createdAt,
  });
}

/** Publish the public hub profile at rkey self (one profile per hub). */
export async function publishProfile(pds: PdsClient, repoDid: string, profile: HubProfile) {
  return pds.putRecord(repoDid, PROFILE, 'self', {
    name: profile.name,
    country: profile.country,
    createdAt: profile.createdAt,
  });
}
