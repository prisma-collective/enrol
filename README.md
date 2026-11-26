# Enrol (register.prisma.events)

Next.js app for Prisma ID registration and enrolment.

## User flows

| Route | Purpose |
|-------|---------|
| `/` | Choose event enrolment or identity registration |
| `/event` | Select stakeholder role → Tally form |
| `/identity/guide` | DID enrolment docs + link to DIDs dashboard |
| `/identity/lookup` | Wallet connect + DID status check |
| `/register?type=…` | Tally event registration form |

## Wallet auth API (propagate CLI)

Infra-authenticated endpoint used by propagate to authorize wallet addresses:

```
GET /api/auth/{address}?access=propagate
Authorization: Bearer <PRIVATE_API_TOKEN>
```

### Response (V1 stub)

```json
{
  "data": {
    "address": "addr_test1...",
    "authorized": true,
    "hubRole": "OWNER"
  }
}
```

**V1 stub:** always returns `authorized: true` with `hubRole: OWNER`. Future versions will derive the DID from the wallet address and look up the DID in the indexer to determine `hubRole`.

## Form webhooks

Tally posts each form to its own route, signed with `WEBHOOK_SIGNING_SECRET`,
and enrol keeps it in a Redis queue:

```
POST /api/webhook/form/hubs/curation                  -> enrolment-hubs-curation
POST /api/webhook/form/participants/teams             -> enrolment-participants-teams
POST /api/webhook/form/partners/external-evaluators   -> enrolment-partners-evaluators
```

Reading a queue (`GET` on the same route) needs the infra token:
`Authorization: Bearer <PRIVATE_API_TOKEN>`. The older `/api/submission`
route is gone.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `PRIVATE_API_TOKEN` | Validates inbound infra API requests, including reading the form queues |
| `NEXT_PUBLIC_RETURN_ORIGINS` | Comma-separated console origins that `?return=` may link back to (https). localhost is always allowed |
| `WEBHOOK_SIGNING_SECRET` | Tally's signing secret. Required: without it every webhook is refused |
| `PROPAGATE_AUTH_WALLETS` | Comma-separated wallet allowlist for propagate auth |
| `NEXT_PUBLIC_DID_INDEXER_URL` | DID indexer base URL for `/api/did/check` |
| `NEXT_PUBLIC_DID_APP_URL` | DIDs dashboard URL (identity guide CTA) |
| `NEXT_PUBLIC_DOCS_API_ORIGIN` | Docs serve API origin (default `https://docs.prisma.events`) |
| `DOCS_API_TOKEN` | Optional bearer token for docs serve API (server-only) |
| `ATPDS_URL` | Prisma PDS (at-pds) where Enrol has its own repo |
| `ENROL_SIGNING_KEY` | Enrol's Ed25519 key, 32 bytes of hex (secret, server-only). It signs in to the PDS like a wallet |
| `ENROL_NETWORK` | `mainnet` or `testnet` (default) for Enrol's stake address |
| `ENROL_REPO_DID` | Enrol's repo DID, from `POST /api/atproto/init` |
| `ENROL_HUB_FORM_IDS` | Comma-separated Tally form IDs of the hub enrolment form |
| `ENROL_WALLET_FIELD` | Tally question ID (or legacy label) containing the wallet stake address or `did:cardano:…` |
| `ENROL_CONSENT_FIELD` | Tally question ID (or legacy label) consenting to publish the wallet association |
| `ENROL_NAME_FIELD` | Tally question ID (or legacy label) for the public hub name |
| `ENROL_NAME_CONSENT_FIELD` | Separate Tally question ID (or legacy label) consenting to publish the hub name |
| `ENROL_COUNTRY_FIELD` | Tally question ID (or legacy label) for the public country |
| `ENROL_COUNTRY_CONSENT_FIELD` | Separate Tally question ID (or legacy label) consenting to publish the country |

## Hub registrations on AT Protocol (D24/D25)

A verified Tally hub enrolment can publish two independent records from Enrol's
own repository. Enrol authenticates its PDS writes with its own repository
identity; the Cardano wallet DID remains the person/organisation identity and
is not used as the PDS repository DID.

1. `events.prisma.enrol.registration` at rkey = the Tally response ID contains
   only `registrationId`, `cardanoDid`, `role` and `createdAt`. This is
   the enrolment-to-wallet association consumed by AppView's trusted-Enrol
   join. It is published only when the wallet-specific consent is affirmative.
2. `events.prisma.hub.profile` at rkey `self` contains the public hub name
   and country. Each field requires its own separate affirmative consent.
   Missing consent configuration or an unticked consent prevents this write.

No other Tally answers are copied into these records. The original form
submission continues through the existing Redis queue. A PDS publishing
failure does not undo the already accepted webhook submission.

The Tally mapping is Enrol-owned in `src/lib/atproto/manifest.ts`, versioned,
and pinned in the application build. The manifest pins the at-tap contract
revision; each deployment supplies its actual Tally form and question IDs
through environment variables. Enrol does not fetch mutable Lexicons or
mapping files from GitHub while processing a webhook.

### Setup

1. Generate an Enrol PDS signing key and set `ENROL_SIGNING_KEY` and `ATPDS_URL`.
2. Create Enrol's repo once using the existing `/api/atproto/init` flow.
3. Set `ENROL_REPO_DID`, `ENROL_HUB_FORM_IDS`, `ENROL_WALLET_FIELD` and `ENROL_CONSENT_FIELD`.
4. To publish the public profile, additionally set the name, country and their two separate consent mappings.
5. Give Enrol's repo DID to the AppView trusted list (`ENROL_DIDS`), and have Tap follow it.

The PDS publisher is off until the identity and registration variables are
configured. Public profile publishing is independently skipped unless every
field and consent mapping is configured.

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

## Deploy on Vercel

Deployed to **register.prisma.events**. Set `PRIVATE_API_TOKEN`, `NEXT_PUBLIC_DID_INDEXER_URL`, and docs env vars in Vercel.
