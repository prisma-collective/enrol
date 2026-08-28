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

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

## Deploy on Vercel

Deployed to **register.prisma.events**. Set `PRIVATE_API_TOKEN`, `NEXT_PUBLIC_DID_INDEXER_URL`, and docs env vars in Vercel.
