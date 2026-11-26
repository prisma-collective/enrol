# Enrol identity, PDS and manifest alignment

Status: implementation review against the Prisma at-tap decisions and current AppView code.

This document records the integration contract Enrol should follow. It does not introduce a new identity Lexicon or change the wallet flow to post-registration signing.

## 1. Repository identity — D18

Hub and team repositories use `did:plc` identifiers. A Cardano wallet's `did:cardano` remains the human or organisation identity and is linked to the repository DID by a wallet-signed identity-link record.

Enrol must keep these identifiers distinct:

- `ENROL_REPO_DID`: the Enrol deployment's repository DID (`did:plc`).
- `did:cardano`: the wallet identity collected in the initial enrolment form.
- The hub's repository DID: the `did:plc` named by the hub's identity-link record.

Reference: [at-tap D18](https://github.com/prisma-collective/at-tap/blob/main/docs/decisions.md).

## 2. Reuse the existing identity link — D23

The existing AppView implementation is:

- Collection: `events.prisma.hub.identityLink`
- Code: `at-tap/apps/appview/src/identity-link.ts`
- Signature verifier: `at-tap/apps/appview/src/cardano-sig.ts`
- Record key: `self`

The hub's repo publishes the identity link. It contains `cardanoDid`, `repoDid`, `role`, `createdAt`, `signature` and `key`. The signed message binds the Cardano DID, repository DID, role and creation time. The AppView checks that the record is in the named repo and verifies the CIP-30 signature against the Cardano DID.

Enrol must reuse this collection and verification path. Do not introduce `events.prisma.identity.link` or a second identity-link format.

D23 is marked Proposed in the current at-tap decision log, while the verifier and shared test-vector implementation are present in the codebase. Any change to the verification contract belongs with Tabs and the at-tap maintainers.

Reference: [identity-link.ts](https://github.com/prisma-collective/at-tap/blob/main/apps/appview/src/identity-link.ts).

## 3. Keep the Cardano DID in the first form — D24

The enrolment form should collect the wallet's `did:cardano` (or the corresponding stake address) at initial registration. This value is the join between the Tally enrolment and the hub's later repository identity link.

The flow is:

1. Tally captures the wallet DID during initial enrolment.
2. Enrol publishes the enrolment-to-wallet association from the trusted Enrol repository.
3. The hub's wallet signs an identity link in the hub's own repository.
4. The AppView joins the two records on `did:cardano`.

A wallet signature after registration (Stage B) is not the selected path in this implementation. No new Stage B decision is added here. If the team later chooses Stage B, it must be proposed as a new entry in at-tap's `docs/decisions.md` for Tabs to review.

D24 is Proposed in the current at-tap decision log. Its privacy rule is explicit: asking for a field is not consent to publish it. Each public field needs its own consent in the initial form. Fields without consent stay in Enrol and must not be written to a PDS repository.

## 4. Lexicons and publication — D28

The shared Lexicon source is the `at-tap/lexicons/` directory. Enrol should not define duplicate schemas or fetch Lexicons from GitHub at request time.

D28 is being handled in [at-tap PR #44](https://github.com/prisma-collective/at-tap/pull/44). That proposal adds the publishing instructions and a script for publishing Lexicon schema records under `prisma.events`, after the required DNS authority records are in place. The PR is a proposal; Enrol should treat the repository as the schema source and pin the schema revision it was built against.

## 5. Enrol-owned, build-pinned manifests

Tally form structure and Lexicon structure have different jobs:

- Lexicons in at-tap define the public record contract.
- A versioned manifest in Enrol maps Tally form/question identifiers to the fields in that contract.

The manifest belongs in the Enrol repository, is reviewed and versioned with the code, and is pinned at build time. Enrol must not download a mutable manifest from GitHub while handling a webhook.

A manifest entry should identify at least:

- manifest version;
- Tally form ID;
- target Lexicon collection and record key strategy;
- Tally question IDs for each mapped field;
- a separate consent question ID for every field that may be public;
- source for generated fields such as `createdAt`.

Only mapped fields are read. Unknown or unmapped Tally fields are ignored. Logs may include field labels and processing outcomes, but never submitted values, wallet addresses, names, contact details or raw form payloads.

The actual question IDs and the per-field consent questions must be confirmed against the live Tally form with Tabs before the manifest is wired into the publishing path. Do not substitute guessed IDs or silently reuse one consent checkbox for several public fields.

## 6. Current implementation gap to resolve

The current Enrol `main` implementation in `src/lib/atproto/registration.ts` builds an `events.prisma.hub.profile` record. It validates the wallet field and a consent checkbox, but the profile record itself contains only `name`, `country` and `createdAt`; the validated `cardanoDid` is not included in that record.

The current at-tap AppView enrolment join in `apps/appview/src/enrolment.ts` still consumes `events.prisma.enrol.registration` records from trusted Enrol DIDs, keyed by Tally response ID, and joins their `cardanoDid` to the hub's signed identity link.

Therefore, a profile write alone does not complete the enrolment-to-hub-repository join. The publishing contract needs to preserve the public hub profile and also publish the registration association expected by the AppView, subject to D24 consent. This should be covered by tests against the actual AppView collection contract.

The current Enrol code also uses one `ENROL_CONSENT_FIELD` for the profile publication path. That is not sufficient for D24 if multiple profile fields are public. The versioned manifest must represent consent separately for each public field, and publication must fail closed when the relevant consent is absent.

## 7. Ownership boundaries

- Enrol validates the Tally submission, applies its pinned manifest and publishes only consented, mapped records.
- The hub wallet signs the identity link in the hub's own repo.
- The AppView verifies the identity link and joins it to the trusted Enrol registration.
- The PDS repository identity authenticates the write; it does not replace the human wallet's signature.
- Console remains the deployment administration surface. It does not need a second identity-link format.

## References

- [at-tap decisions](https://github.com/prisma-collective/at-tap/blob/main/docs/decisions.md)
- [D28 Lexicon publishing proposal, PR #44](https://github.com/prisma-collective/at-tap/pull/44)
- [AppView identity-link verifier](https://github.com/prisma-collective/at-tap/blob/main/apps/appview/src/identity-link.ts)
- [AppView enrolment join](https://github.com/prisma-collective/at-tap/blob/main/apps/appview/src/enrolment.ts)
- [Enrol PDS publishing code](../src/lib/atproto/)
