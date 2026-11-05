/**
 * The registration enrol publishes when a hub sends its enrolment form (D25).
 *
 * It says one thing: this Tally response belongs to the hub with this
 * wallet. The hub's repo says the other half, in an identity link its
 * wallet signs. The Prisma AppView joins the two on the did:cardano, so
 * potentialise can show what each hub is doing now (at-tap #33).
 *
 * Nothing else from the form is published: names and answers stay in Redis.
 * And the wallet is published only when the person ticked the form's
 * consent question for it (D24, D5).
 */
import { isStakeAddress } from '@/lib/cardano/stakeAddress';
import type { PdsClient } from './pds';

// The collection name is Proposed with the Lexicon groups (D21).
export const REGISTRATION = 'events.prisma.enrol.registration';

export type Registration = {
  $type: typeof REGISTRATION;
  registrationId: string;
  cardanoDid: string;
  role: 'hub';
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
  walletField: string;
  consentField: string;
};

const RESPONSE_ID = /^[A-Za-z0-9_-]{1,64}$/;

const field = (fields: TallyField[], label: string) =>
  fields.find((f) => f.label?.trim().toLowerCase() === label.trim().toLowerCase());

// A ticked checkbox is `true`; a ticked option in a checkbox list is a non-empty array.
function ticked(f: TallyField | undefined): boolean {
  return f?.value === true || (Array.isArray(f?.value) && f.value.length > 0);
}

// The form may hold the stake address, or the did:cardano itself.
function cardanoDid(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const address = value.trim().replace(/^did:cardano:/, '');
  return isStakeAddress(address) ? `did:cardano:${address}` : null;
}

/**
 * The registration for this submission, or why there is none. A reason is
 * not an error: most submissions aren't hub enrolments.
 */
export function registrationFrom(sub: TallySubmission, config: FormConfig): Registration | { skip: string } {
  const data = sub.data;
  if (sub.eventType !== 'FORM_RESPONSE' || !data) return { skip: 'not a form response' };
  if (!data.formId || !config.hubFormIds.has(data.formId)) return { skip: 'not a hub enrolment form' };
  if (!data.responseId || !RESPONSE_ID.test(data.responseId)) return { skip: 'no usable responseId' };
  const fields = data.fields ?? [];
  if (!ticked(field(fields, config.consentField))) return { skip: 'no consent to publish the wallet' };
  const did = cardanoDid(field(fields, config.walletField)?.value);
  if (!did) return { skip: 'no stake address in the wallet field' };
  const createdAt = new Date(data.createdAt ?? sub.createdAt ?? Date.now());
  return {
    $type: REGISTRATION,
    registrationId: data.responseId,
    cardanoDid: did,
    role: 'hub',
    createdAt: Number.isNaN(createdAt.getTime()) ? new Date().toISOString() : createdAt.toISOString(),
  };
}

/** Publishes the registration to enrol's repo, at rkey = responseId. */
export async function publishRegistration(pds: PdsClient, enrolRepo: string, registration: Registration) {
  return pds.putRecord(enrolRepo, REGISTRATION, registration.registrationId, registration);
}
