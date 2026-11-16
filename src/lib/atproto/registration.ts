/**
 * The registration enrol publishes when a hub sends its enrolment form (D25).
 *
 * Shaped by the events.prisma.hub.profile lexicon: the hub's name and country
 * are published at rkey "self" (one profile per hub). This is how a hub joins
 * the network — Tap uses events.prisma.hub.profile as its signal.
 *
 * The hub's wallet separately signs an identity link (did:cardano -> repo DID),
 * so the AppView can join the profile to the hub's repo.
 */
import { isStakeAddress } from '@/lib/cardano/stakeAddress';
import type { PdsClient } from './pds';

// Use the functioning lexicon the AppView indexes
export const PROFILE = 'events.prisma.hub.profile';

export type HubProfile = {
  $type: typeof PROFILE;
  name: string;
  country: string;
  createdAt: string;
};

type TallyField = { key?: string; label?: string; type?: string; value?: unknown; options?: { id: string; text: string }[] };

export type TallySubmission = {
  eventType?: string;
  createdAt?: string;
  data?: { formId?: string; responseId?: string; createdAt?: string; fields?: TallyField[] };
};

/** Which form is the hub enrolment, and which of its questions to read. */
export type FormConfig = {
  hubFormIds: Set<string>;
  nameField: string;
  countryField: string;
  walletField: string;
  consentField: string;
};

const RESPONSE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const COUNTRY_CODE = /^[A-Z]{2}$/;

const field = (fields: TallyField[], label: string) =>
  fields.find((f) => f.label?.trim().toLowerCase() === label.trim().toLowerCase());

function ticked(f: TallyField | undefined): boolean {
  return f?.value === true || (Array.isArray(f?.value) && f.value.length > 0);
}

function cardanoDid(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const address = value.trim().replace(/^did:cardano:/, '');
  return isStakeAddress(address) ? `did:cardano:${address}` : null;
}

/**
 * The hub profile for this submission, or why there is none.
 * The profile is shaped by events.prisma.hub.profile: name + country.
 */
export function profileFrom(sub: TallySubmission, config: FormConfig): HubProfile | { skip: string } {
  const data = sub.data;
  if (sub.eventType !== 'FORM_RESPONSE' || !data) return { skip: 'not a form response' };
  if (!data.formId || !config.hubFormIds.has(data.formId)) return { skip: 'not a hub enrolment form' };
  if (!data.responseId || !RESPONSE_ID.test(data.responseId)) return { skip: 'no usable responseId' };
  const fields = data.fields ?? [];
  if (!ticked(field(fields, config.consentField))) return { skip: 'no consent to publish' };
  const name = String(field(fields, config.nameField)?.value ?? '').trim();
  if (!name) return { skip: 'no name in the name field' };
  const country = String(field(fields, config.countryField)?.value ?? '').trim().toUpperCase();
  if (!COUNTRY_CODE.test(country)) return { skip: 'no valid country code in the country field' };
  const did = cardanoDid(field(fields, config.walletField)?.value);
  if (!did) return { skip: 'no stake address in the wallet field' };
  const createdAt = new Date(data.createdAt ?? sub.createdAt ?? Date.now());
  return {
    $type: PROFILE,
    name,
    country,
    createdAt: Number.isNaN(createdAt.getTime()) ? new Date().toISOString() : createdAt.toISOString(),
  };
}

/** Publishes the hub profile to the hub's repo, at rkey "self" (one per hub). */
export async function publishProfile(pds: PdsClient, repoDid: string, profile: HubProfile) {
  return pds.putRecord(repoDid, PROFILE, 'self', {
    name: profile.name,
    country: profile.country,
    createdAt: profile.createdAt,
  });
}