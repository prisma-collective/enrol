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

## Environment variables

| Variable | Purpose |
|----------|---------|
| `PRIVATE_API_TOKEN` | Validates inbound infra API requests |
| `PROPAGATE_AUTH_WALLETS` | Comma-separated wallet allowlist for propagate auth |
| `NEXT_PUBLIC_DID_INDEXER_URL` | DID indexer base URL for `/api/did/check` |
| `NEXT_PUBLIC_DID_APP_URL` | DIDs dashboard URL (identity guide CTA) |
| `NEXT_PUBLIC_DOCS_API_ORIGIN` | Docs serve API origin (default `https://docs.prisma.events`) |
| `DOCS_API_TOKEN` | Optional bearer token for docs serve API (server-only) |
| `ATPDS_URL` | Prisma PDS (at-pds) where enrol has its own repo |
| `ENROL_SIGNING_KEY` | enrol's Ed25519 key, 32 bytes of hex (secret, server-only). It signs in to the PDS like a wallet |
| `ENROL_NETWORK` | `mainnet` or `testnet` (default) for enrol's stake address |
| `ENROL_REPO_DID` | enrol's repo DID, from `POST /api/atproto/init` |
| `ENROL_HUB_FORM_IDS` | Comma-separated Tally form ids of the hub enrolment form |
| `ENROL_WALLET_FIELD` | Label of the form question with the wallet's stake address (or `did:cardano:...`) |
| `ENROL_CONSENT_FIELD` | Label of the checkbox that agrees to publish the wallet |

## Hub registrations on AT Protocol (D25)

When a hub sends the enrolment form, `/api/submission` keeps it in Redis as
before and also publishes one record from enrol's own repo:

```json
{ "$type": "events.prisma.enrol.registration",
  "registrationId": "<Tally responseId>", "cardanoDid": "did:cardano:stake...",
  "role": "hub", "createdAt": "..." }
```

at rkey = the responseId. Nothing else from the form is published, and only
when the consent box is ticked. The Prisma AppView joins it with the hub's
identity link (did:cardano → repo), so potentialise can show each hub's live
state. If publishing fails, the submission is still saved and the error is
logged.

Off until every variable above is set. To turn it on:

1. Generate a key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   and set `ENROL_SIGNING_KEY` and `ATPDS_URL`.
2. Create enrol's repo, once:
   `curl -X POST -H "Authorization: Bearer $PRIVATE_API_TOKEN" https://register.prisma.events/api/atproto/init`
   It returns `{ cardanoDid, repoDid }`.
3. Set `ENROL_REPO_DID` to `repoDid`, and the three form variables.
4. Give `repoDid` to the AppView (`ENROL_DIDS`), and have Tap follow it.

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

## Deploy on Vercel

Deployed to **register.prisma.events**. Set `PRIVATE_API_TOKEN`, `NEXT_PUBLIC_DID_INDEXER_URL`, and docs env vars in Vercel.
